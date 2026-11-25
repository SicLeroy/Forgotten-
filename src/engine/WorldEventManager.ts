import { CARD_MAP } from '../data/cards';
import { LOCATION_MAP } from '../data/locations';
import { MAJOR_WORLD_EVENTS, MAJOR_WORLD_EVENT_MAP } from '../data/worldEvents';
import {
  ActiveMajorWorldEvent,
  GameState,
  HERO_INVENTORY_LIMITS,
  HERO_STAT_LIMITS,
  LocalizedText,
  LocationDefinition,
  MajorWorldEventDefinition,
  MajorWorldEventId,
  MajorWorldEventStageSpec,
  PlayerState,
  WorldReactionTrigger,
} from '../types/game';
import { appendChronicleEntry } from './ChronicleHelper';
import { DayNightManager } from './DayNightManager';
import { getActivePlayerFromState } from './GameState';
import { RandomManager } from './RandomManager';
import { WeatherManager } from './WeatherManager';

export const MAX_ACTIVE_MAJOR_EVENTS = 2;

const WORLD_CURSE_POOL = ['card_286', 'card_287', 'card_288', 'card_289', 'card_290'];

function drawHeroCardsForReward(state: GameState, player: PlayerState, count: number): number {
  let drawn = 0;
  for (let i = 0; i < count; i++) {
    if (player.hand.length >= HERO_INVENTORY_LIMITS.maxHandSize) break;
    if (state.deck.length === 0) {
      if (state.discardPile.length === 0) break;
      const reshuffled = RandomManager.shuffle(state.discardPile, state.rngState);
      state.deck = reshuffled.shuffled;
      state.rngState = reshuffled.nextState;
      state.discardPile = [];
    }
    const nextId = state.deck.shift();
    if (!nextId) break;
    player.hand.push(nextId);
    drawn += 1;
  }
  return drawn;
}

function getStageSpec(def: MajorWorldEventDefinition, stage: 1 | 2 | 3): MajorWorldEventStageSpec {
  return def.stages[stage - 1] ?? def.stages[0];
}

export const WorldEventManager = {
  MAX_ACTIVE_MAJOR_EVENTS,

  getActiveEvents(state: GameState): ActiveMajorWorldEvent[] {
    return (state.activeMajorEvents ?? []).slice(0, MAX_ACTIVE_MAJOR_EVENTS);
  },

  getDefinition(id: MajorWorldEventId): MajorWorldEventDefinition {
    return MAJOR_WORLD_EVENT_MAP.get(id)!;
  },

  getCurrentStageSpec(active: ActiveMajorWorldEvent): MajorWorldEventStageSpec {
    const def = MAJOR_WORLD_EVENT_MAP.get(active.id)!;
    return getStageSpec(def, active.stage);
  },

  spawnMajorEvent(
    state: GameState,
    forcedEventId?: MajorWorldEventId
  ): { spawned: boolean; event: ActiveMajorWorldEvent | null } {
    const activeList = [...(state.activeMajorEvents ?? [])].slice(0, MAX_ACTIVE_MAJOR_EVENTS);
    if (activeList.length >= MAX_ACTIVE_MAJOR_EVENTS) {
      state.activeMajorEvents = activeList;
      return { spawned: false, event: null };
    }

    const activeIds = new Set(activeList.map((e) => e.id));
    const completedIds = new Set(state.completedMajorEventIds ?? []);

    let chosenDef: MajorWorldEventDefinition | undefined;
    if (forcedEventId) {
      if (activeIds.has(forcedEventId)) {
        return { spawned: false, event: null };
      }
      chosenDef = MAJOR_WORLD_EVENT_MAP.get(forcedEventId);
    } else {
      const freshPool = MAJOR_WORLD_EVENTS.filter(
        (e) => !activeIds.has(e.id) && !completedIds.has(e.id)
      );
      const fallbackPool = MAJOR_WORLD_EVENTS.filter((e) => !activeIds.has(e.id));
      const pool = freshPool.length > 0 ? freshPool : fallbackPool;
      if (pool.length === 0) return { spawned: false, event: null };
      const pickRoll = RandomManager.randomInt(state.rngState, 0, pool.length - 1);
      state.rngState = pickRoll.nextState;
      chosenDef = pool[pickRoll.value];
    }

    if (!chosenDef) return { spawned: false, event: null };

    const durRoll = RandomManager.randomInt(
      state.rngState,
      chosenDef.minDuration,
      chosenDef.maxDuration
    );
    state.rngState = durRoll.nextState;

    const targetLocId = chosenDef.interventionLocationIds[0] ?? 'loc_01';
    const newEvent: ActiveMajorWorldEvent = {
      id: chosenDef.id,
      stage: 1,
      startedRound: state.round,
      roundsRemaining: durRoll.value,
      totalDuration: durRoll.value,
      interventionProgress: 0,
      requiredProgress: chosenDef.requiredProgress,
      intervenedThisRound: false,
      ignoredRoundsCount: 0,
      targetLocationId: targetLocId,
    };

    state.activeMajorEvents = [...activeList, newEvent];

    // Cross-system start impact: shift weather toward event signature
    WeatherManager.shiftWeather(state, chosenDef.weatherShift);

    appendChronicleEntry(
      state,
      'world',
      null,
      {
        uk: `${chosenDef.startText.uk} (Тривалість: ${durRoll.value} раунд. · ${chosenDef.questTitle.uk})`,
        en: `${chosenDef.startText.en} (Duration: ${durRoll.value} rounds · ${chosenDef.questTitle.en})`,
      },
      'global'
    );

    return { spawned: true, event: newEvent };
  },

  advanceRoundEvents(state: GameState): void {
    const current = [...(state.activeMajorEvents ?? [])].slice(0, MAX_ACTIVE_MAJOR_EVENTS);
    if (current.length === 0) return;

    const remainingEvents: ActiveMajorWorldEvent[] = [];

    for (const evt of current) {
      const def = MAJOR_WORLD_EVENT_MAP.get(evt.id);
      if (!def) continue;

      evt.roundsRemaining -= 1;

      if (evt.roundsRemaining <= 0) {
        appendChronicleEntry(
          state,
          'world',
          null,
          {
            uk: `Завершення події «${def.name.uk}»: ${def.ignoredOutcomeText.uk}`,
            en: `Event Ended "${def.name.en}": ${def.ignoredOutcomeText.en}`,
          },
          'global'
        );
        continue;
      }

      if (!evt.intervenedThisRound) {
        evt.ignoredRoundsCount += 1;
        if (evt.stage < 3) {
          evt.stage = (evt.stage + 1) as 1 | 2 | 3;
        }
        const stageSpec = getStageSpec(def, evt.stage);

        // Apply non-blocking escalation consequences when ignored
        if (stageSpec.hpDrainOnEscalation > 0) {
          for (const p of state.players) {
            if (p.isDefeated) continue;
            if (p.hp > 1) {
              p.hp = Math.max(1, p.hp - stageSpec.hpDrainOnEscalation);
            }
          }
        }

        if (stageSpec.cursePressure) {
          for (const p of state.players) {
            if (p.isDefeated) continue;
            const currentCurses = p.curses ?? [];
            if (currentCurses.length === 0) {
              const curseRoll = RandomManager.randomInt(state.rngState, 0, WORLD_CURSE_POOL.length - 1);
              state.rngState = curseRoll.nextState;
              const curseId = WORLD_CURSE_POOL[curseRoll.value];
              if (CARD_MAP.has(curseId)) {
                p.curses = [curseId];
              }
              break;
            }
          }
        }

        if (evt.stage >= 2 && def.weatherBias.length > 0 && state.weather !== def.weatherShift) {
          WeatherManager.shiftWeather(state, def.weatherShift, 2);
        }

        appendChronicleEntry(
          state,
          'world',
          null,
          {
            uk: `Ескалація «${def.name.uk}» — ${stageSpec.title.uk}: ${stageSpec.consequenceSummary.uk} (залишилось ${evt.roundsRemaining} раунд.).`,
            en: `Escalation "${def.name.en}" — ${stageSpec.title.en}: ${stageSpec.consequenceSummary.en} (${evt.roundsRemaining} round(s) left).`,
          },
          'global'
        );
      }

      evt.intervenedThisRound = false;
      remainingEvents.push(evt);
    }

    state.activeMajorEvents = remainingEvents;
  },

  canHeroIntervene(
    state: GameState,
    player: PlayerState,
    eventId: MajorWorldEventId
  ): { allowed: boolean; reason?: LocalizedText } {
    if (state.phase !== 'PLAYING' || state.turnPhase !== 'ACTION') {
      return {
        allowed: false,
        reason: { uk: 'Втручання доступне лише у фазі дій.', en: 'Intervention requires ACTION phase.' },
      };
    }
    const active = (state.activeMajorEvents ?? []).find((e) => e.id === eventId);
    if (!active) {
      return {
        allowed: false,
        reason: { uk: 'Ця світова подія вже неактивна.', en: 'This world event is no longer active.' },
      };
    }
    const def = MAJOR_WORLD_EVENT_MAP.get(eventId)!;
    if (player.actionsRemaining < def.interventionActionCost) {
      return {
        allowed: false,
        reason: { uk: 'Недостатньо дій у цьому ході.', en: 'Not enough actions remaining this turn.' },
      };
    }
    if (player.gold < def.interventionGoldCost) {
      return {
        allowed: false,
        reason: {
          uk: `Потрібно ${def.interventionGoldCost} золота для втручання.`,
          en: `Requires ${def.interventionGoldCost} Gold to intervene.`,
        },
      };
    }

    const loc = LOCATION_MAP.get(player.locationId);
    const atTargetLoc =
      loc &&
      (loc.id === active.targetLocationId ||
        def.interventionLocationIds.includes(loc.id) ||
        def.interventionTerrains.includes(loc.terrain));

    if (!atTargetLoc) {
      const targetLoc = LOCATION_MAP.get(active.targetLocationId);
      return {
        allowed: false,
        reason: {
          uk: `Перейдіть до "${targetLoc ? targetLoc.name.uk : active.targetLocationId}" або суміжної за типом локації (${def.interventionTerrains.join('/')}).`,
          en: `Travel to "${targetLoc ? targetLoc.name.en : active.targetLocationId}" or a matching site (${def.interventionTerrains.join('/')}).`,
        },
      };
    }

    return { allowed: true };
  },

  completeMajorEvent(
    state: GameState,
    evt: ActiveMajorWorldEvent,
    hero: PlayerState
  ): void {
    const def = MAJOR_WORLD_EVENT_MAP.get(evt.id);
    if (!def) return;

    state.activeMajorEvents = (state.activeMajorEvents ?? []).filter((e) => e.id !== evt.id);
    const completed = new Set(state.completedMajorEventIds ?? []);
    completed.add(evt.id);
    state.completedMajorEventIds = Array.from(completed);

    hero.gold += def.rewards.gold;
    hero.experience += def.rewards.xp;
    hero.hp = Math.min(HERO_STAT_LIMITS.maxHp, hero.maxHp, hero.hp + def.rewards.hp);
    hero.fate = Math.min(HERO_STAT_LIMITS.maxFate, hero.fate + def.rewards.fate);
    const drawn = drawHeroCardsForReward(state, hero, def.rewards.drawCards);

    if ((state.activeMajorEvents ?? []).length === 0 && state.weather === def.weatherShift) {
      WeatherManager.shiftWeather(state, 'clear', 2);
    }

    appendChronicleEntry(
      state,
      'world',
      null,
      {
        uk: `Подію «${def.name.uk}» завершено героєм ${hero.name}! ${def.completionText.uk} Нагорода: +${def.rewards.gold} з., +${def.rewards.xp} XP, +${def.rewards.hp} HP, +${def.rewards.fate} Долі${drawn > 0 ? `, +${drawn} карт` : ''}.`,
        en: `Event "${def.name.en}" resolved by ${hero.name}! ${def.completionText.en} Rewards: +${def.rewards.gold}g, +${def.rewards.xp} XP, +${def.rewards.hp} HP, +${def.rewards.fate} Fate${drawn > 0 ? `, +${drawn} card(s)` : ''}.`,
      },
      'global'
    );
  },

  interveneInEvent(
    state: GameState,
    eventId: MajorWorldEventId
  ): { ok: boolean; error?: LocalizedText; completed?: boolean } {
    const player = getActivePlayerFromState(state);
    const check = WorldEventManager.canHeroIntervene(state, player, eventId);
    if (!check.allowed) {
      return { ok: false, error: check.reason };
    }

    const active = (state.activeMajorEvents ?? []).find((e) => e.id === eventId)!;
    const def = MAJOR_WORLD_EVENT_MAP.get(eventId)!;

    player.actionsRemaining -= def.interventionActionCost;
    player.gold -= def.interventionGoldCost;

    const isExactSite =
      player.locationId === active.targetLocationId ||
      def.interventionLocationIds.includes(player.locationId);
    const gain = isExactSite ? 2 : 1;

    active.interventionProgress = Math.min(
      active.requiredProgress,
      active.interventionProgress + gain
    );
    active.intervenedThisRound = true;

    const loc = LOCATION_MAP.get(player.locationId);
    appendChronicleEntry(
      state,
      'world',
      player.id,
      {
        uk: `${player.name} втручається у подію «${def.name.uk}» у "${loc ? loc.name.uk : player.locationId}" (${active.interventionProgress}/${active.requiredProgress}).`,
        en: `${player.name} intervenes in "${def.name.en}" at "${loc ? loc.name.en : player.locationId}" (${active.interventionProgress}/${active.requiredProgress}).`,
      },
      'local'
    );

    if (active.interventionProgress >= active.requiredProgress) {
      WorldEventManager.completeMajorEvent(state, active, player);
      return { ok: true, completed: true };
    }

    return { ok: true, completed: false };
  },

  /**
   * World reaction hook: hero actions organically push back or trigger reactions
   * on active major world events.
   */
  recordWorldReaction(
    state: GameState,
    trigger: WorldReactionTrigger,
    player: PlayerState,
    locationId?: string
  ): void {
    const current = [...(state.activeMajorEvents ?? [])];
    if (current.length === 0) return;

    const loc = LOCATION_MAP.get(locationId ?? player.locationId);
    const matchesTrigger = (id: MajorWorldEventId): boolean => {
      switch (trigger) {
        case 'combat_victory':
          return (
            id === 'major_monster_uprising' ||
            id === 'major_undead_invasion' ||
            id === 'major_dragon_awakening' ||
            id === 'major_demon_rift' ||
            id === 'major_blood_eclipse'
          );
        case 'cleanse_curse':
          return id === 'major_spreading_curse' || id === 'major_black_plague';
        case 'spell_cast':
          return (
            id === 'major_arcane_storm' ||
            id === 'major_demon_rift' ||
            id === 'major_blood_eclipse'
          );
        case 'explore':
          return (
            (loc?.terrain === 'shrine' || loc?.terrain === 'ruins') &&
            (id === 'major_ancient_temple' ||
              id === 'major_arcane_storm' ||
              id === 'major_undead_invasion')
          );
        case 'heal_or_rest':
          return (
            (loc?.terrain === 'sanctuary' || loc?.terrain === 'village') &&
            id === 'major_black_plague'
          );
        case 'trade':
          return id === 'major_vanishing_caravans';
        case 'npc_aid':
          return true;
      }
    };

    for (const evt of current) {
      if (!matchesTrigger(evt.id)) continue;
      evt.interventionProgress = Math.min(evt.requiredProgress, evt.interventionProgress + 1);
      evt.intervenedThisRound = true;
      const def = MAJOR_WORLD_EVENT_MAP.get(evt.id);
      if (def) {
        appendChronicleEntry(
          state,
          'world',
          null,
          {
            uk: `Світ реагує на дії ${player.name}: «${def.name.uk}» стримано (${evt.interventionProgress}/${evt.requiredProgress}).`,
            en: `World reacts to ${player.name}: "${def.name.en}" pushed back (${evt.interventionProgress}/${evt.requiredProgress}).`,
          },
          'global'
        );
      }
      if (evt.interventionProgress >= evt.requiredProgress) {
        WorldEventManager.completeMajorEvent(state, evt, player);
      }
      break;
    }
  },

  getEnemyAttackModifier(state: GameState): number {
    let mod = 0;
    const isNight = DayNightManager.isNight(state);
    for (const evt of WorldEventManager.getActiveEvents(state)) {
      const stageSpec = WorldEventManager.getCurrentStageSpec(evt);
      mod += stageSpec.enemyAttackMod;
      if (isNight && evt.id === 'major_blood_eclipse') {
        mod += 1;
      }
    }
    return mod;
  },

  getMarketPriceModifier(state: GameState): number {
    let mod = 0;
    for (const evt of WorldEventManager.getActiveEvents(state)) {
      mod += WorldEventManager.getCurrentStageSpec(evt).marketPriceDelta;
    }
    return mod;
  },

  getHealingModifier(state: GameState): number {
    let mod = 0;
    for (const evt of WorldEventManager.getActiveEvents(state)) {
      mod += WorldEventManager.getCurrentStageSpec(evt).healingDelta;
    }
    return mod;
  },

  getSpellBonusModifier(state: GameState): number {
    let bonus = 0;
    for (const evt of WorldEventManager.getActiveEvents(state)) {
      bonus += WorldEventManager.getCurrentStageSpec(evt).spellAttackBonus;
    }
    return bonus;
  },

  getNightDangerModifier(state: GameState): number {
    if (!DayNightManager.isNight(state)) return 0;
    let mod = 0;
    for (const evt of WorldEventManager.getActiveEvents(state)) {
      mod += WorldEventManager.getCurrentStageSpec(evt).nightDangerMod;
    }
    return mod;
  },

  getLocationEventModifier(
    state: GameState,
    loc: LocationDefinition
  ): {
    affectingEvents: MajorWorldEventDefinition[];
    dangerMod: number;
    marketDelta: number;
    healingDelta: number;
    summary: LocalizedText | null;
  } {
    const active = WorldEventManager.getActiveEvents(state);
    const affectingEvents: MajorWorldEventDefinition[] = [];
    let dangerMod = 0;
    let marketDelta = 0;
    let healingDelta = 0;

    for (const evt of active) {
      const def = MAJOR_WORLD_EVENT_MAP.get(evt.id);
      if (!def) continue;
      const stageSpec = getStageSpec(def, evt.stage);
      const isDirectSite =
        evt.targetLocationId === loc.id ||
        def.interventionLocationIds.includes(loc.id) ||
        def.interventionTerrains.includes(loc.terrain);
      if (isDirectSite || stageSpec.marketPriceDelta > 0 || stageSpec.healingDelta < 0) {
        affectingEvents.push(def);
        if (isDirectSite) dangerMod += 1;
        if (loc.terrain === 'village' || loc.terrain === 'sanctuary') {
          marketDelta += stageSpec.marketPriceDelta;
          healingDelta += stageSpec.healingDelta;
        }
      }
    }

    const summary =
      affectingEvents.length > 0
        ? {
            uk: affectingEvents.map((e) => e.name.uk).join(', '),
            en: affectingEvents.map((e) => e.name.en).join(', '),
          }
        : null;

    return { affectingEvents, dangerMod, marketDelta, healingDelta, summary };
  },
};
