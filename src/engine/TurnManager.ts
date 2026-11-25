import { CARD_MAP } from '../data/cards';
import { HERO_MAP } from '../data/heroes';
import { LOCATION_MAP } from '../data/locations';
import { WORLD_EVENTS } from '../data/world';
import {
  GameState,
  HERO_INVENTORY_LIMITS,
  HERO_STAT_LIMITS,
} from '../types/game';
import { appendChronicleEntry } from './ChronicleHelper';
import { DayNightManager } from './DayNightManager';
import { getActivePlayerFromState } from './GameState';
import { RandomManager } from './RandomManager';
import { WeatherManager } from './WeatherManager';
import { MAX_ACTIVE_MAJOR_EVENTS, WorldEventManager } from './WorldEventManager';

export { appendChronicleEntry };

export function drawCardsIntoHand(state: GameState, playerIndex: number, count: number): string[] {
  const player = state.players[playerIndex];
  const drawn: string[] = [];
  for (let i = 0; i < count; i++) {
    if (player.hand.length >= HERO_INVENTORY_LIMITS.maxHandSize) break;
    if (state.deck.length === 0) {
      if (state.discardPile.length === 0) break;
      const reshuffled = RandomManager.shuffle(state.discardPile, state.rngState);
      state.deck = reshuffled.shuffled;
      state.rngState = reshuffled.nextState;
      state.discardPile = [];
    }
    const cardId = state.deck.shift();
    if (!cardId) break;
    player.hand.push(cardId);
    drawn.push(cardId);
  }
  return drawn;
}

export function refillMarketStock(state: GameState, targetSize = 4): string[] {
  const current = [...(state.marketCardIds ?? [])];
  while (current.length < targetSize) {
    if (state.deck.length === 0) {
      if (state.discardPile.length === 0) break;
      const reshuffled = RandomManager.shuffle(state.discardPile, state.rngState);
      state.deck = reshuffled.shuffled;
      state.rngState = reshuffled.nextState;
      state.discardPile = [];
    }
    const nextCard = state.deck.shift();
    if (!nextCard) break;
    current.push(nextCard);
  }
  state.marketCardIds = current;
  return current;
}

export const TurnManager = {
  /**
   * Executes Step 1 (Turn Start) and Step 2 (Apply Effects) for the active hero,
   * applying DayNightManager, WeatherManager, WorldEventManager, companion bonuses, and curses.
   */
  applyTurnStartAndEffects(state: GameState, isInitialTurn = false): void {
    const player = getActivePlayerFromState(state);
    if (player.isDefeated || state.phase !== 'PLAYING') return;

    DayNightManager.syncState(state);

    state.turnCycleStep = 'turn_start';
    appendChronicleEntry(
      state,
      'system',
      player.id,
      {
        uk: `1. Початок ходу: ${player.name} (Раунд ${state.round}, дій: ${player.actionsRemaining}).`,
        en: `1. Turn Start: ${player.name} (Round ${state.round}, actions: ${player.actionsRemaining}).`,
      },
      'local'
    );

    state.turnCycleStep = 'apply_effects';
    const loc = LOCATION_MAP.get(player.locationId);
    let healed = 0;
    let companionGold = 0;
    let curseHpDrain = 0;
    let curseGoldDrain = 0;
    let timeSummaryUk = '';
    let timeSummaryEn = '';
    let weatherSummaryUk = '';
    let weatherSummaryEn = '';

    if (loc) {
      const timeBonuses = DayNightManager.getHeroTimeBonuses(player, loc, state);
      const regWeather = WeatherManager.getRegionWeatherEffect(state.weather, loc.regionId);
      const wProfile = WeatherManager.getProfile(state.weather);
      timeSummaryUk = timeBonuses.description.uk;
      timeSummaryEn = timeBonuses.description.en;
      weatherSummaryUk = `${wProfile.name.uk} (${regWeather.description.uk})`;
      weatherSummaryEn = `${wProfile.name.en} (${regWeather.description.en})`;

      if (
        !isInitialTurn &&
        (loc.terrain === 'sanctuary' || loc.terrain === 'village') &&
        !DayNightManager.isNight(state)
      ) {
        const worldHealMod = WorldEventManager.getHealingModifier(state);
        const healGain = Math.max(0, 1 + worldHealMod);
        if (healGain > 0) {
          const cap = Math.min(HERO_STAT_LIMITS.maxHp, player.maxHp);
          const before = player.hp;
          player.hp = Math.min(cap, player.hp + healGain);
          healed += player.hp - before;
        }
      }
    }

    const turnTimeBonusNote = DayNightManager.applyTurnStartTimeBonus(state, player, isInitialTurn);

    if (!isInitialTurn) {
      for (const compId of player.companions ?? []) {
        const comp = CARD_MAP.get(compId);
        const cb = comp?.effect.companionBonus;
        if (!cb) continue;
        if (cb.healPerTurn) {
          const cap = Math.min(HERO_STAT_LIMITS.maxHp, player.maxHp);
          const before = player.hp;
          player.hp = Math.min(cap, player.hp + cb.healPerTurn);
          healed += player.hp - before;
        }
        if (cb.goldPerTurn) {
          player.gold += cb.goldPerTurn;
          companionGold += cb.goldPerTurn;
        }
      }

      for (const curseId of player.curses ?? []) {
        const curse = CARD_MAP.get(curseId);
        const cp = curse?.effect.cursePenalty;
        if (!cp) continue;
        if (cp.hpDrainPerTurn && player.hp > 1) {
          const drop = Math.min(player.hp - 1, cp.hpDrainPerTurn);
          player.hp -= drop;
          curseHpDrain += drop;
        }
        if (cp.goldDrainPerTurn && player.gold > 0) {
          const loss = Math.min(player.gold, cp.goldDrainPerTurn);
          player.gold -= loss;
          curseGoldDrain += loss;
        }
      }
    }

    const extraNotesUk: string[] = [];
    const extraNotesEn: string[] = [];
    if (turnTimeBonusNote) {
      extraNotesUk.push(turnTimeBonusNote.uk);
      extraNotesEn.push(turnTimeBonusNote.en);
    }
    if (healed > 0) {
      extraNotesUk.push(`відновлено +${healed} HP`);
      extraNotesEn.push(`restored +${healed} HP`);
    }
    if (companionGold > 0) {
      extraNotesUk.push(`супутники принесли +${companionGold} з.`);
      extraNotesEn.push(`companions earned +${companionGold}g`);
    }
    if (curseHpDrain > 0) {
      extraNotesUk.push(`прокляття забрало -${curseHpDrain} HP`);
      extraNotesEn.push(`curse drained -${curseHpDrain} HP`);
    }
    if (curseGoldDrain > 0) {
      extraNotesUk.push(`прокляття знищило -${curseGoldDrain} з.`);
      extraNotesEn.push(`curse eroded -${curseGoldDrain}g`);
    }

    appendChronicleEntry(
      state,
      'world',
      player.id,
      {
        uk: `2. Застосування ефектів${loc ? ` у "${loc.name.uk}"` : ''}: ${timeSummaryUk || 'звичайні умови'}; погода — ${weatherSummaryUk || 'без змін'}${extraNotesUk.length ? `; ${extraNotesUk.join(', ')}` : ''}.`,
        en: `2. Apply Effects${loc ? ` at "${loc.name.en}"` : ''}: ${timeSummaryEn || 'standard conditions'}; weather — ${weatherSummaryEn || 'steady'}${extraNotesEn.length ? `; ${extraNotesEn.join(', ')}` : ''}.`,
      },
      'local'
    );

    state.turnCycleStep = 'dice_roll';
    state.turnGuidance = {
      uk: `Крок 3: Киньте d6 для руху (${loc ? loc.name.uk : ''}) або оберіть дію на локації.`,
      en: `Step 3: Roll d6 to move${loc ? ` from ${loc.name.en}` : ''} or choose a location action.`,
    };
  },

  /**
   * Executes Step 8 (Turn Handoff) to the next living hero.
   * Completes a full round only after all living active players finish their turns,
   * then updates DayNightManager, WeatherManager, and WorldEventManager (max 2 active major events).
   */
  advanceTurn(state: GameState): void {
    const prevPlayer = getActivePlayerFromState(state);
    prevPlayer.tempAttackBonus = 0;
    prevPlayer.tempDefenseBonus = 0;
    state.activeNpcDialog = null;

    let nextIndex = state.activePlayerIndex;
    let wrappedRound = false;
    for (let step = 0; step < state.players.length; step++) {
      nextIndex = (nextIndex + 1) % state.players.length;
      if (nextIndex === 0) wrappedRound = true;
      if (!state.players[nextIndex].isDefeated) break;
    }

    state.activePlayerIndex = nextIndex;
    const nextPlayer = getActivePlayerFromState(state);
    const nextHero = HERO_MAP.get(nextPlayer.heroId)!;
    nextPlayer.actionsRemaining = nextHero.baseStats.actionsPerTurn;
    nextPlayer.abilityUsedThisTurn = false;
    nextPlayer.tempAttackBonus = 0;
    nextPlayer.tempDefenseBonus = 0;
    drawCardsIntoHand(state, nextIndex, 1);

    if (wrappedRound) {
      state.round += 1;
      const dayNightSync = DayNightManager.syncState(state);
      if (dayNightSync.phaseChangedTo === 'night') {
        appendChronicleEntry(
          state,
          'world',
          null,
          {
            uk: `Настала Ніч (${dayNightSync.info.label.uk}): відкрилися приховані нічні проходи, сили темряви посилилися.`,
            en: `Nightfall (${dayNightSync.info.label.en}): hidden night passages unlocked and nocturnal perils stir.`,
          },
          'global'
        );
      } else if (dayNightSync.phaseChangedTo === 'day') {
        appendChronicleEntry(
          state,
          'world',
          null,
          {
            uk: `Настав День (${dayNightSync.info.label.uk}): світло розганяє темряву й відкриває безпечний відпочинок у поселеннях.`,
            en: `Daybreak (${dayNightSync.info.label.en}): sunlight clears the dark and restores safe shelter in settlements.`,
          },
          'global'
        );
      }

      const weatherUpdate = WeatherManager.advanceRoundWeather(state);
      if (weatherUpdate.changed) {
        const wp = WeatherManager.getProfile(weatherUpdate.weather);
        appendChronicleEntry(
          state,
          'world',
          null,
          {
            uk: `Зміна погоди (тривалість ${weatherUpdate.durationRemaining} раунд.): "${wp.name.uk}" — ${wp.description.uk}`,
            en: `Weather Shift (${weatherUpdate.durationRemaining} round(s)): "${wp.name.en}" — ${wp.description.en}`,
          },
          'global'
        );
        if (weatherUpdate.eventSummary) {
          appendChronicleEntry(state, 'world', null, weatherUpdate.eventSummary, 'global');
        }
      }

      // Advance active major world events and spawn new ones (max 2 simultaneously)
      WorldEventManager.advanceRoundEvents(state);
      const currentMajorCount = (state.activeMajorEvents ?? []).length;
      if (state.round % 2 === 0 && currentMajorCount < MAX_ACTIVE_MAJOR_EVENTS) {
        WorldEventManager.spawnMajorEvent(state);
      }

      if (state.round % 2 === 0) {
        const evtRoll = RandomManager.randomInt(state.rngState, 0, WORLD_EVENTS.length - 1);
        state.rngState = evtRoll.nextState;
        const evt = WORLD_EVENTS[evtRoll.value];
        state.activeWorldEventId = evt.id;

        for (const p of state.players) {
          if (p.isDefeated) continue;
          if (evt.hpDelta !== 0) {
            p.hp = Math.max(1, Math.min(p.maxHp, p.hp + evt.hpDelta));
          }
          if (evt.goldDelta !== 0) {
            p.gold = Math.max(0, p.gold + evt.goldDelta);
          }
        }

        appendChronicleEntry(
          state,
          'world',
          null,
          {
            uk: `Знамення раунду (Раунд ${state.round}): "${evt.name.uk}" — ${evt.effectSummary.uk}.`,
            en: `Round Omen (Round ${state.round}): "${evt.name.en}" — ${evt.effectSummary.en}.`,
          },
          'global'
        );
      } else {
        state.activeWorldEventId = null;
      }
    }

    state.turnCycleStep = 'turn_handoff';
    appendChronicleEntry(
      state,
      'system',
      nextPlayer.id,
      {
        uk: `8. Передача ходу: ${prevPlayer.name} передає хід герою ${nextPlayer.name}.`,
        en: `8. Turn Handoff: ${prevPlayer.name} hands turn over to ${nextPlayer.name}.`,
      },
      'local'
    );

    if (state.phase === 'PLAYING') {
      TurnManager.applyTurnStartAndEffects(state);
    }

    state.updatedAt = Date.now();
  },
};
