import { CARD_MAP } from '../data/cards';
import { ENEMY_MAP } from '../data/enemies';
import { HERO_MAP } from '../data/heroes';
import { LOCATION_MAP, LOCATIONS } from '../data/locations';
import { MAJOR_WORLD_EVENT_MAP } from '../data/worldEvents';
import {
  AiBehaviorStyle,
  AiDecisionCategory,
  AiDecisionLogEntry,
  AiDifficulty,
  CombatType,
  EngineResult,
  EquipSlot,
  GameState,
  HERO_INVENTORY_LIMITS,
  HERO_STAT_LIMITS,
  LocalizedText,
  MajorWorldEventId,
  PlayerState,
} from '../types/game';
import { DayNightManager } from './DayNightManager';
import { computeEquipmentCombatAttack, getActivePlayerFromState } from './GameState';
import { NavigationGraph } from './NavigationGraph';
import { NpcManager } from './NpcManager';
import { RandomManager } from './RandomManager';
import { WeatherManager } from './WeatherManager';
import { WorldEventManager } from './WorldEventManager';

export interface AiRulesApi {
  rollMovement: (state: GameState) => EngineResult;
  rerollMovementDice: (state: GameState) => EngineResult;
  stepMove: (state: GameState, locationId: string) => EngineResult;
  stopMovementEarly: (state: GameState) => EngineResult;
  moveToLocation: (state: GameState, locationId: string) => EngineResult;
  exploreLocation: (state: GameState) => EngineResult;
  rollEncounterCheck: (state: GameState) => EngineResult;
  rerollEncounterCheck: (state: GameState) => EngineResult;
  resolveEncounter: (state: GameState) => EngineResult;
  restAtLocation: (state: GameState) => EngineResult;
  drawCardAction: (state: GameState) => EngineResult;
  buySupplyCard: (state: GameState) => EngineResult;
  buyMarketCard: (state: GameState, cardId: string) => EngineResult;
  sellCard: (state: GameState, source: 'hand' | 'inventory', cardId: string) => EngineResult;
  healAtSanctuary: (state: GameState) => EngineResult;
  cleanseCurseAtShrine: (state: GameState, curseCardId?: string) => EngineResult;
  useHeroAbility: (state: GameState) => EngineResult;
  upgradeStat: (state: GameState, stat: 'strength' | 'intellect') => EngineResult;
  playCard: (state: GameState, cardId: string) => EngineResult;
  equipFromInventory: (state: GameState, cardId: string) => EngineResult;
  useInventoryItem: (state: GameState, cardId: string) => EngineResult;
  challengeGateGuardian: (state: GameState) => EngineResult;
  challengeSealGuardian: (state: GameState) => EngineResult;
  attemptFinalTrial: (state: GameState) => EngineResult;
  challengeCitadelGuardian: (state: GameState) => EngineResult;
  challengeVoidLord: (state: GameState) => EngineResult;
  challengePlayer: (state: GameState, targetPlayerId: string) => EngineResult;
  combatAttack: (state: GameState, combatType?: CombatType) => EngineResult;
  combatDefend: (state: GameState) => EngineResult;
  combatFlee: (state: GameState) => EngineResult;
  interveneWorldEvent: (state: GameState, eventId: MajorWorldEventId) => EngineResult;
  talkToNpc: (state: GameState, npcId: string) => EngineResult;
  chooseNpcDialogOption: (state: GameState, optionId: string) => EngineResult;
  closeNpcDialog: (state: GameState) => EngineResult;
  endTurn: (state: GameState) => EngineResult;
}

interface DifficultyTuning {
  equivalenceBand: number;
  noiseAmplitude: number;
  looksAheadWeather: boolean;
  usesNightPassages: boolean;
  usesFateRerolls: boolean;
  shopsSmartly: boolean;
  evaluatesRivals: boolean;
  intervenesWorldEvents: boolean;
  restHpRatio: number;
  safeChallengeMargin: number;
}

const DIFFICULTY_TUNING: Record<AiDifficulty, DifficultyTuning> = {
  easy: {
    equivalenceBand: 4.5,
    noiseAmplitude: 3.5,
    looksAheadWeather: false,
    usesNightPassages: false,
    usesFateRerolls: false,
    shopsSmartly: false,
    evaluatesRivals: false,
    intervenesWorldEvents: false,
    restHpRatio: 0.3,
    safeChallengeMargin: -4,
  },
  normal: {
    equivalenceBand: 1.4,
    noiseAmplitude: 0.8,
    looksAheadWeather: true,
    usesNightPassages: true,
    usesFateRerolls: true,
    shopsSmartly: true,
    evaluatesRivals: true,
    intervenesWorldEvents: true,
    restHpRatio: 0.45,
    safeChallengeMargin: -1,
  },
  hard: {
    equivalenceBand: 0.9,
    noiseAmplitude: 0.25,
    looksAheadWeather: true,
    usesNightPassages: true,
    usesFateRerolls: true,
    shopsSmartly: true,
    evaluatesRivals: true,
    intervenesWorldEvents: true,
    restHpRatio: 0.55,
    safeChallengeMargin: 0.5,
  },
};

const ALL_AI_STYLES: AiBehaviorStyle[] = [
  'conqueror',
  'scholar',
  'merchant_tactician',
  'warden',
];

const MAX_AI_LOG_ENTRIES = 160;
let aiLogSeq = 0;

function computeEffectiveHeroPower(player: PlayerState): {
  strength: number;
  intellect: number;
  fate: number;
  armor: number;
  gearAttack: number;
} {
  let strength = player.strength;
  let intellect = player.intellect;
  let fate = player.fate;
  let armor = player.armor;

  const equippedIds = [player.equipment.weapon, player.equipment.armor, player.equipment.talisman];
  for (const cardId of equippedIds) {
    if (!cardId) continue;
    const card = CARD_MAP.get(cardId);
    if (!card) continue;
    strength += card.effect.bonusStrength ?? 0;
    intellect += card.effect.bonusIntellect ?? card.effect.bonusWisdom ?? 0;
    fate += card.effect.bonusFate ?? 0;
    armor += card.effect.bonusDefense ?? 0;
  }

  for (const compId of player.companions ?? []) {
    const comp = CARD_MAP.get(compId);
    const cb = comp?.effect.companionBonus;
    if (!cb) continue;
    strength += cb.strength ?? 0;
    intellect += cb.intellect ?? 0;
    fate += cb.fate ?? 0;
    armor += cb.armor ?? 0;
  }

  if (player.seals.includes('seal_power')) strength += 1;
  if (player.seals.includes('seal_wisdom')) intellect += 1;
  if (player.seals.includes('seal_fate')) fate += 1;

  for (const curseId of player.curses ?? []) {
    const curse = CARD_MAP.get(curseId);
    const cp = curse?.effect.cursePenalty;
    if (!cp) continue;
    strength += cp.strengthDelta ?? 0;
    intellect += cp.intellectDelta ?? 0;
    fate += cp.fateDelta ?? 0;
    armor += cp.armorDelta ?? 0;
  }

  return {
    strength: Math.max(0, Math.min(HERO_STAT_LIMITS.maxStrength, strength)),
    intellect: Math.max(0, Math.min(HERO_STAT_LIMITS.maxIntellect, intellect)),
    fate: Math.max(0, Math.min(HERO_STAT_LIMITS.maxFate, fate)),
    armor: Math.max(0, armor),
    gearAttack: computeEquipmentCombatAttack(player),
  };
}

function getCardEquipScore(cardId: string, style: AiBehaviorStyle): number {
  const card = CARD_MAP.get(cardId);
  if (!card) return 0;
  let score =
    (card.effect.bonusAttack ?? 0) * 1.4 +
    (card.effect.bonusStrength ?? 0) * 1.2 +
    (card.effect.bonusIntellect ?? card.effect.bonusWisdom ?? 0) * 1.2 +
    (card.effect.bonusDefense ?? 0) * 1.1 +
    (card.effect.bonusFate ?? 0) * 1.0;

  if (style === 'conqueror') {
    score += (card.effect.bonusAttack ?? 0) * 0.6 + (card.effect.bonusStrength ?? 0) * 0.5;
  } else if (style === 'scholar') {
    score += (card.effect.bonusIntellect ?? card.effect.bonusWisdom ?? 0) * 0.7;
  } else if (style === 'merchant_tactician') {
    score += (card.effect.bonusFate ?? 0) * 0.4 + card.goldCost * 0.08;
  }
  return score;
}

function computeBfsDistance(
  player: PlayerState,
  fromId: string,
  targetId: string,
  state?: GameState,
  allowNightPassages = false
): number {
  if (fromId === targetId) return 0;
  const visited = new Set<string>([fromId]);
  const queue: Array<{ id: string; dist: number }> = [{ id: fromId, dist: 0 }];
  const isNight = state ? DayNightManager.isNight(state) : false;

  while (queue.length > 0) {
    const curr = queue.shift()!;
    const loc = LOCATION_MAP.get(curr.id);
    if (!loc) continue;

    const neighborIds = [...loc.neighbors];
    if (allowNightPassages && isNight && state) {
      for (const np of DayNightManager.getHiddenPassagesForLocation(curr.id, state)) {
        if (!neighborIds.includes(np.targetId)) neighborIds.push(np.targetId);
      }
    }

    for (const nId of neighborIds) {
      if (visited.has(nId)) continue;
      if (!NavigationGraph.canAccessLocation(player, nId, state, curr.id).allowed) continue;
      if (nId === targetId) return curr.dist + 1;
      visited.add(nId);
      queue.push({ id: nId, dist: curr.dist + 1 });
    }
  }
  return 999;
}

function appendAiDecisionLog(
  state: GameState,
  player: PlayerState,
  difficulty: AiDifficulty,
  style: AiBehaviorStyle,
  category: AiDecisionCategory,
  chosenAction: string,
  evaluatedOptions: Array<{ option: string; score: number }>,
  reasoning: LocalizedText
): void {
  const existing = state.aiDecisionLog ?? [];
  const entry: AiDecisionLogEntry = {
    id: `ai_${state.round}_${state.rngState}_${++aiLogSeq}`,
    round: state.round,
    playerId: player.id,
    playerName: player.name,
    difficulty,
    style,
    category,
    chosenAction,
    evaluatedOptions: evaluatedOptions.slice(0, 4),
    reasoning,
  };
  state.aiDecisionLog = [entry, ...existing].slice(0, MAX_AI_LOG_ENTRIES);
}

interface ScoredOption<T> {
  key: string;
  item: T;
  score: number;
  reason?: LocalizedText;
}

function pickFromEquivalentCandidates<T>(
  state: GameState,
  candidates: Array<ScoredOption<T>>,
  equivalenceBand: number,
  noiseAmplitude: number,
  avoidRecentKey?: string
): ScoredOption<T> {
  if (candidates.length === 1) return candidates[0];

  // Apply small seeded jitter only within difficulty's noise range without affecting RNG fairness of d6
  const noisy = candidates.map((c) => {
    if (noiseAmplitude <= 0) return c;
    const roll = RandomManager.randomInt(state.rngState, -100, 100);
    state.rngState = roll.nextState;
    const delta = (roll.value / 100) * noiseAmplitude;
    return { ...c, score: Number((c.score + delta).toFixed(2)) };
  });

  noisy.sort((a, b) => b.score - a.score);
  const topScore = noisy[0].score;
  let equivalent = noisy.filter((c) => topScore - c.score <= equivalenceBand);

  if (equivalent.length > 1 && avoidRecentKey) {
    const varied = equivalent.filter((c) => c.key !== avoidRecentKey);
    if (varied.length > 0) equivalent = varied;
  }

  if (equivalent.length === 1) return equivalent[0];

  const pickRoll = RandomManager.randomInt(state.rngState, 0, equivalent.length - 1);
  state.rngState = pickRoll.nextState;
  return equivalent[pickRoll.value];
}

export const AiManager = {
  assignDefaultStyle(heroId: string, slotIndex: number): AiBehaviorStyle {
    const hero = HERO_MAP.get(heroId);
    if (hero) {
      if (hero.baseStats.intellect >= hero.baseStats.strength + 1) {
        return slotIndex % 2 === 0 ? 'scholar' : 'warden';
      }
      if (hero.baseStats.strength >= hero.baseStats.intellect + 1) {
        return slotIndex % 2 === 0 ? 'conqueror' : 'warden';
      }
      if (hero.baseStats.gold >= 15 || hero.baseStats.fate >= 3) {
        return 'merchant_tactician';
      }
    }
    return ALL_AI_STYLES[slotIndex % ALL_AI_STYLES.length];
  },

  getDifficulty(state: GameState, player: PlayerState): AiDifficulty {
    return player.aiDifficulty ?? state.aiDifficulty ?? 'normal';
  },

  getStyle(player: PlayerState, fallbackIndex = 0): AiBehaviorStyle {
    return player.aiStyle ?? AiManager.assignDefaultStyle(player.heroId, fallbackIndex);
  },

  getDecisionLog(state: GameState, playerId?: string): AiDecisionLogEntry[] {
    const all = state.aiDecisionLog ?? [];
    return playerId ? all.filter((e) => e.playerId === playerId) : all;
  },

  evaluateChallengeRisk(
    state: GameState,
    player: PlayerState,
    enemyId: string
  ): { expectedMargin: number; preferredType: CombatType } {
    const enemy = ENEMY_MAP.get(enemyId);
    if (!enemy) return { expectedMargin: 0, preferredType: 'physical' };

    const eff = computeEffectiveHeroPower(player);
    const loc = LOCATION_MAP.get(player.locationId)!;
    const weatherMods = WeatherManager.getCombatModifiers(state.weather, loc);
    const timeBonuses = DayNightManager.getHeroTimeBonuses(player, loc, state);
    const spellBonus = WorldEventManager.getSpellBonusModifier(state);
    const eventEnemyMod = WorldEventManager.getEnemyAttackModifier(state);

    const physExpected =
      eff.strength +
      eff.gearAttack +
      player.tempAttackBonus +
      weatherMods.physicalMod +
      timeBonuses.physicalMod +
      3.5;
    const magExpected =
      eff.intellect +
      spellBonus +
      player.tempAttackBonus +
      weatherMods.magicMod +
      timeBonuses.magicMod +
      3.5;

    const enemyPhysStat = enemy.attack;
    const enemyMagStat = enemy.intellect ?? Math.max(1, enemy.attack - 1);
    const physMargin = physExpected - (enemyPhysStat + eventEnemyMod + 3.5);
    const magMargin = magExpected - (enemyMagStat + eventEnemyMod + 3.5);

    const preferredType: CombatType = magMargin > physMargin ? 'magic' : 'physical';
    const expectedMargin = Math.max(physMargin, magMargin);

    return {
      expectedMargin: Number(expectedMargin.toFixed(2)),
      preferredType,
    };
  },

  runTurn(state: GameState, api: AiRulesApi): GameState {
    let current = JSON.parse(JSON.stringify(state)) as GameState;
    const initialActive = getActivePlayerFromState(current);
    if (!initialActive.isAI || current.phase !== 'PLAYING') return current;

    const activeIdx = current.activePlayerIndex;
    const difficulty = AiManager.getDifficulty(current, initialActive);
    const style = AiManager.getStyle(initialActive, activeIdx);
    const tuning = DIFFICULTY_TUNING[difficulty];

    // 1. Stat upgrade with XP (3 XP -> +1 Strength or +1 Intellect)
    {
      const p = getActivePlayerFromState(current);
      if (p.experience >= HERO_STAT_LIMITS.xpPerStatUpgrade) {
        const wantIntellect =
          style === 'scholar'
            ? p.intellect < HERO_STAT_LIMITS.maxIntellect
            : p.intellect > p.strength && p.intellect < HERO_STAT_LIMITS.maxIntellect;
        const stat = wantIntellect ? 'intellect' : 'strength';
        const res = api.upgradeStat(current, stat);
        if (!res.error) {
          current = res.state;
          appendAiDecisionLog(
            current,
            getActivePlayerFromState(current),
            difficulty,
            style,
            'item',
            `upgrade:${stat}`,
            [{ option: stat, score: 10 }],
            {
              uk: `Бот (${style}/${difficulty}) підвищує ${stat === 'intellect' ? 'Інтелект' : 'Силу'} за 3 XP.`,
              en: `Bot (${style}/${difficulty}) upgrades ${stat} for 3 XP.`,
            }
          );
        }
      }
    }

    // 2. Equip better gear, recruit companions, use healing items
    {
      const p = getActivePlayerFromState(current);
      for (const cardId of [...p.hand, ...p.inventory]) {
        const card = CARD_MAP.get(cardId);
        if (!card) continue;
        const freshP = getActivePlayerFromState(current);
        const inHand = freshP.hand.includes(cardId);
        const inInv = freshP.inventory.includes(cardId);
        if (!inHand && !inInv) continue;

        if (card.equipSlot) {
          const currentSlotId = freshP.equipment[card.equipSlot as EquipSlot];
          const currScore = currentSlotId ? getCardEquipScore(currentSlotId, style) : -1;
          const nextScore = getCardEquipScore(card.id, style);
          const shouldEquip =
            !currentSlotId || (difficulty !== 'easy' && nextScore > currScore + 0.5);

          if (shouldEquip) {
            const res = inHand
              ? api.playCard(current, cardId)
              : api.equipFromInventory(current, cardId);
            if (!res.error) {
              current = res.state;
              appendAiDecisionLog(
                current,
                getActivePlayerFromState(current),
                difficulty,
                style,
                'item',
                `equip:${cardId}`,
                [{ option: card.name.en, score: Number(nextScore.toFixed(1)) }],
                {
                  uk: `Екіпірує сильніше спорядження «${card.name.uk}».`,
                  en: `Equips stronger gear "${card.name.en}".`,
                }
              );
            }
          }
        } else if (
          card.category === 'companion' &&
          inHand &&
          (freshP.companions ?? []).length < HERO_INVENTORY_LIMITS.maxCompanions
        ) {
          const res = api.playCard(current, cardId);
          if (!res.error) current = res.state;
        } else if (
          !card.combatOnly &&
          card.effect.healHp &&
          freshP.hp <= freshP.maxHp - (difficulty === 'hard' ? 2 : 3)
        ) {
          const res = inHand
            ? api.playCard(current, cardId)
            : api.useInventoryItem(current, cardId);
          if (!res.error) {
            current = res.state;
            appendAiDecisionLog(
              current,
              getActivePlayerFromState(current),
              difficulty,
              style,
              'item',
              `heal_item:${cardId}`,
              [{ option: card.name.en, score: card.effect.healHp }],
              {
                uk: `Використовує «${card.name.uk}» для відновлення здоров’я.`,
                en: `Uses "${card.name.en}" to restore HP.`,
              }
            );
          }
        } else if (
          !card.combatOnly &&
          (card.effect.removeCurse || card.effect.removeAllCurses) &&
          (freshP.curses ?? []).length > 0
        ) {
          const res = inHand
            ? api.playCard(current, cardId)
            : api.useInventoryItem(current, cardId);
          if (!res.error) current = res.state;
        }
      }
    }

    // 3. Settlement Services: Healing, Curse Purification & Smart Shopping
    {
      const p = getActivePlayerFromState(current);
      const loc = LOCATION_MAP.get(p.locationId)!;
      const isSettlement = loc.terrain === 'village' || loc.terrain === 'sanctuary';
      const isCleanseSite = isSettlement || loc.terrain === 'shrine';

      if (isCleanseSite && (p.curses ?? []).length > 0 && p.gold >= 12 && difficulty !== 'easy') {
        const res = api.cleanseCurseAtShrine(current, p.curses![0]);
        if (!res.error) {
          current = res.state;
          appendAiDecisionLog(
            current,
            getActivePlayerFromState(current),
            difficulty,
            style,
            'shop',
            'cleanse_curse',
            [{ option: 'cleanse_curse', score: 9 }],
            {
              uk: 'Знімає прокляття в святилищі або поселенні.',
              en: 'Cleanses active curse at shrine/settlement.',
            }
          );
        }
      }

      if (
        isSettlement &&
        getActivePlayerFromState(current).hp <= Math.floor(p.maxHp * tuning.restHpRatio + 1) &&
        getActivePlayerFromState(current).gold >= 8
      ) {
        const res = api.healAtSanctuary(current);
        if (!res.error) {
          current = res.state;
          appendAiDecisionLog(
            current,
            getActivePlayerFromState(current),
            difficulty,
            style,
            'shop',
            'heal_at_sanctuary',
            [{ option: 'heal_at_sanctuary', score: 8 }],
            {
              uk: 'Лікується у знахаря перед подальшим походом.',
              en: 'Buys healer recovery before venturing onward.',
            }
          );
        }
      }

      if (isSettlement) {
        const freshP = getActivePlayerFromState(current);
        const priceMod = WorldEventManager.getMarketPriceModifier(current);
        if (tuning.shopsSmartly && (current.marketCardIds ?? []).length > 0) {
          const candidates: Array<ScoredOption<{ cardId: string; cost: number }>> = [];
          for (const cardId of current.marketCardIds ?? []) {
            const card = CARD_MAP.get(cardId);
            if (!card) continue;
            const cost = Math.max(4, card.goldCost + priceMod);
            if (freshP.gold < cost) continue;

            let value = 0;
            if (card.equipSlot) {
              const curId = freshP.equipment[card.equipSlot];
              const curScore = curId ? getCardEquipScore(curId, style) : 0;
              value = (getCardEquipScore(cardId, style) - curScore) * 3;
            } else if (
              card.category === 'companion' &&
              (freshP.companions ?? []).length < HERO_INVENTORY_LIMITS.maxCompanions
            ) {
              value = 6.5;
            } else if (
              card.effect.healHp ||
              card.effect.bonusAttack ||
              card.effect.removeCurse ||
              card.effect.removeAllCurses
            ) {
              value = 4.2;
            }

            if (style === 'merchant_tactician') value += 1.2;
            if (value > 1.5) {
              candidates.push({
                key: `buy_${cardId}`,
                item: { cardId, cost },
                score: value - cost * 0.08,
              });
            }
          }

          if (candidates.length > 0) {
            const chosen = pickFromEquivalentCandidates(
              current,
              candidates,
              tuning.equivalenceBand,
              tuning.noiseAmplitude
            );
            const res = api.buyMarketCard(current, chosen.item.cardId);
            if (!res.error) {
              current = res.state;
              const boughtCard = CARD_MAP.get(chosen.item.cardId);
              appendAiDecisionLog(
                current,
                getActivePlayerFromState(current),
                difficulty,
                style,
                'shop',
                `buy_market:${chosen.item.cardId}`,
                candidates.map((c) => ({ option: c.key, score: c.score })),
                {
                  uk: `Купує спорядження «${boughtCard?.name.uk ?? chosen.item.cardId}» на ринку за ${chosen.item.cost} з.`,
                  en: `Buys "${boughtCard?.name.en ?? chosen.item.cardId}" on market for ${chosen.item.cost}g.`,
                }
              );
            }
          }
        } else if (
          difficulty === 'easy' &&
          freshP.gold >= 24 &&
          freshP.hand.length < HERO_INVENTORY_LIMITS.maxHandSize
        ) {
          const res = api.buySupplyCard(current);
          if (!res.error) current = res.state;
        }
      }
    }

    // 4. Interact with NPCs (Quests, Bargains, Cleanse, World Event Aid)
    {
      const p = getActivePlayerFromState(current);
      if (current.turnPhase === 'ACTION') {
        const npcsHere = NpcManager.getNpcsAtLocation(p.locationId);
        for (const npc of npcsHere) {
          const dyn = current.npcStates?.[npc.id];
          const questReady =
            npc.quest && dyn?.questStatus === 'active' && dyn.questProgress >= npc.quest.targetCount;
          const questAvailable = npc.quest && (!dyn || dyn.questStatus === 'available');
          const needAid =
            tuning.intervenesWorldEvents &&
            WorldEventManager.getActiveEvents(current).length > 0 &&
            npc.role === 'special';

          if (!questReady && !questAvailable && !needAid && style !== 'merchant_tactician') {
            continue;
          }

          const talkRes = api.talkToNpc(current, npc.id);
          if (talkRes.error || !talkRes.state.activeNpcDialog) continue;
          current = talkRes.state;

          for (let step = 0; step < 3 && current.activeNpcDialog; step++) {
            const opts = NpcManager.getAvailableOptions(
              current,
              getActivePlayerFromState(current),
              npc,
              current.activeNpcDialog.nodeId
            );
            const activeP = getActivePlayerFromState(current);
            const preferred =
              opts.find((o) => o.action === 'complete_quest') ??
              opts.find((o) => o.action === 'accept_quest') ??
              opts.find((o) => o.action === 'special_cleanse' && (!o.goldCost || activeP.gold >= o.goldCost)) ??
              opts.find((o) => o.action === 'assist_major_event' && (!o.goldCost || activeP.gold >= o.goldCost)) ??
              opts.find((o) => o.action === 'traveler_rumor') ??
              opts.find((o) => o.action === 'special_blessing') ??
              opts.find((o) => o.action === 'goto') ??
              opts.find((o) => o.action === 'close');

            if (!preferred) break;
            const optRes = api.chooseNpcDialogOption(current, preferred.id);
            if (optRes.error) break;
            current = optRes.state;

            if (
              preferred.action === 'complete_quest' ||
              preferred.action === 'accept_quest' ||
              preferred.action === 'assist_major_event'
            ) {
              appendAiDecisionLog(
                current,
                getActivePlayerFromState(current),
                difficulty,
                style,
                'quest',
                `npc_${preferred.action}:${npc.id}`,
                [{ option: preferred.id, score: 10 }],
                {
                  uk: `Взаємодіє з NPC «${npc.name.uk}» (${preferred.label.uk}).`,
                  en: `Interacts with NPC "${npc.name.en}" (${preferred.label.en}).`,
                }
              );
            }
            if (preferred.action === 'close') break;
          }

          if (current.activeNpcDialog) {
            current = api.closeNpcDialog(current).state;
          }
          break;
        }
      }
    }

    // 5. Main Action / Movement / Encounter / Combat Loop
    let recentGoalKey: string | undefined;
    let recentStepKey: string | undefined;
    let safety = 0;

    while (
      current.phase === 'PLAYING' &&
      getActivePlayerFromState(current).id === initialActive.id &&
      safety < 48
    ) {
      safety += 1;
      const p = getActivePlayerFromState(current);

      // 5A. Encounter resolution (+ Fate reroll on Normal/Hard)
      if (current.turnPhase === 'ENCOUNTER' && current.encounter) {
        const encRoll = current.encounter.rollResult;
        if (typeof encRoll !== 'number') {
          current = api.rollEncounterCheck(current).state;
          continue;
        }
        const enc = current.encounter;
        const eff = computeEffectiveHeroPower(p);
        const total = encRoll + eff[enc.statCheck];
        if (
          tuning.usesFateRerolls &&
          total < enc.difficulty &&
          !enc.fateRerollUsed &&
          p.fate >= 1
        ) {
          const rerollRes = api.rerollEncounterCheck(current);
          if (!rerollRes.error) {
            current = rerollRes.state;
            appendAiDecisionLog(
              current,
              getActivePlayerFromState(current),
              difficulty,
              style,
              'fate',
              'reroll_encounter_d6',
              [{ option: 'reroll_encounter', score: 8 }],
              {
                uk: `Витрачає 1 Долю на перекидання перевірки (${total} < ${enc.difficulty}).`,
                en: `Spends 1 Fate to reroll failed encounter check (${total} < ${enc.difficulty}).`,
              }
            );
          }
        }
        current = api.resolveEncounter(current).state;
        continue;
      }

      // 5B. Combat resolution (Physical vs Magic stance, abilities, cards, defend/flee)
      if (current.turnPhase === 'COMBAT' && current.combat) {
        const combat = current.combat;
        if (!p.abilityUsedThisTurn && (difficulty !== 'easy' || combat.enemyCurrentHp > 1)) {
          const abilRes = api.useHeroAbility(current);
          if (!abilRes.error) {
            current = abilRes.state;
            continue;
          }
        }

        const combatCard = p.hand.find((cid) => CARD_MAP.get(cid)?.combatOnly);
        if (combatCard && (difficulty !== 'easy' || combat.roundCount === 1)) {
          const cardRes = api.playCard(current, combatCard);
          if (!cardRes.error) {
            current = cardRes.state;
            continue;
          }
        }

        const risk = AiManager.evaluateChallengeRisk(current, p, combat.enemyId);
        const combatType: CombatType = difficulty === 'easy' ? 'physical' : risk.preferredType;

        if (
          difficulty === 'hard' &&
          p.hp <= 1 &&
          (combat.fleeAllowedByCard || combat.fleeAllowedByAbility || WeatherManager.shouldConcealEncounter(current.weather)) &&
          risk.expectedMargin < -1.5
        ) {
          const fleeRes = api.combatFlee(current);
          if (!fleeRes.error) {
            current = fleeRes.state;
            appendAiDecisionLog(
              current,
              getActivePlayerFromState(current),
              difficulty,
              style,
              'combat',
              'combat_flee',
              [{ option: 'flee', score: 9 }],
              {
                uk: `Відступає при 1 HP через невигідний бій (${risk.expectedMargin}).`,
                en: `Flees at 1 HP due to unfavorable combat margin (${risk.expectedMargin}).`,
              }
            );
            continue;
          }
        }

        if (difficulty === 'hard' && p.hp === 1 && !combat.isDefending && risk.expectedMargin < 0) {
          const defRes = api.combatDefend(current);
          if (!defRes.error) {
            current = defRes.state;
            continue;
          }
        }

        const atkRes = api.combatAttack(current, combatType);
        current = atkRes.state;
        appendAiDecisionLog(
          current,
          getActivePlayerFromState(current),
          difficulty,
          style,
          'combat',
          `attack:${combatType}`,
          [
            { option: combatType, score: risk.expectedMargin },
            { option: combatType === 'magic' ? 'physical' : 'magic', score: risk.expectedMargin - 1.5 },
          ],
          {
            uk: `Обирає ${combatType === 'magic' ? 'магічну' : 'фізичну'} атаку (очік. перевага ${risk.expectedMargin}).`,
            en: `Chooses ${combatType} attack (expected margin ${risk.expectedMargin}).`,
          }
        );
        continue;
      }

      // 5C. Step-by-step MOVING phase
      if (current.turnPhase === 'MOVING' && current.movement) {
        const mov = current.movement;
        const hereLoc = LOCATION_MAP.get(p.locationId)!;
        const hero = HERO_MAP.get(p.heroId);
        const isObjectiveHere = Boolean(
          (hereLoc.sealReward && !p.seals.includes(hereLoc.sealReward)) ||
            (hereLoc.isGateGuardianLair && !p.gateGuardianDefeated) ||
            (hereLoc.isFinalBossLair && p.citadelGuardiansDefeated >= 2) ||
            ((hereLoc.id === 'loc_80' || hereLoc.id === 'loc_81') &&
              p.finalTrialsPassed >= 3 &&
              !(p.defeatedCitadelGuardianIds ?? []).includes(
                hereLoc.id === 'loc_80' ? 'enemy_citadel_sentinel' : 'enemy_citadel_inquisitor'
              ))
        );

        if (
          mov.pathTaken.length > 1 &&
          isObjectiveHere &&
          (hero?.canTriggerMidwayEvents ||
            hereLoc.isGateGuardianLair ||
            hereLoc.sealGuardianId ||
            hereLoc.isFinalBossLair ||
            hereLoc.id === 'loc_80' ||
            hereLoc.id === 'loc_81')
        ) {
          const stopRes = api.stopMovementEarly(current);
          if (!stopRes.error) {
            current = stopRes.state;
            continue;
          }
        }

        // Choose best strategic destination to step toward
        const goalLocId = selectAiGoalLocation(
          current,
          p,
          difficulty,
          style,
          tuning,
          recentGoalKey
        );
        recentGoalKey = goalLocId;

        const distNow = computeBfsDistance(
          p,
          p.locationId,
          goalLocId,
          current,
          tuning.usesNightPassages
        );

        if (
          tuning.usesFateRerolls &&
          mov.pathTaken.length === 1 &&
          !mov.fateRerollUsed &&
          mov.stepsRemaining === 1 &&
          p.fate >= 2 &&
          distNow >= 4
        ) {
          const rerollRes = api.rerollMovementDice(current);
          if (!rerollRes.error) {
            current = rerollRes.state;
            appendAiDecisionLog(
              current,
              getActivePlayerFromState(current),
              difficulty,
              style,
              'fate',
              'reroll_movement_d6',
              [{ option: 'reroll_move', score: distNow }],
              {
                uk: `Витрачає 1 Долю на перекидання руху (випало 1, дистанція ${distNow}).`,
                en: `Spends 1 Fate to reroll low movement roll of 1 (distance ${distNow}).`,
              }
            );
          }
        }

        const stepChoice = selectBestNeighborStep(
          current,
          p,
          goalLocId,
          difficulty,
          style,
          tuning,
          recentStepKey
        );

        if (!stepChoice) {
          const stopRes = api.stopMovementEarly(current);
          if (!stopRes.error) {
            current = stopRes.state;
          } else {
            break;
          }
          continue;
        }

        recentStepKey = stepChoice.item;
        const stepRes = api.stepMove(current, stepChoice.item);
        if (stepRes.error) {
          break;
        }
        current = stepRes.state;
        continue;
      }

      if (p.actionsRemaining <= 0) break;

      // 5D. ACTION phase strategic decisions
      const loc = LOCATION_MAP.get(p.locationId)!;
      const isNight = DayNightManager.isNight(current);
      const activeEvents = WorldEventManager.getActiveEvents(current);
      const nightRiskBonus = isNight ? 1 + WorldEventManager.getNightDangerModifier(current) : 0;
      const restThreshold = Math.floor(p.maxHp * tuning.restHpRatio) + (nightRiskBonus >= 2 ? 1 : 0);

      // Risk Check: Rest if HP is low
      if (p.hp <= restThreshold) {
        const restRes = api.restAtLocation(current);
        if (!restRes.error) {
          current = restRes.state;
          appendAiDecisionLog(
            current,
            getActivePlayerFromState(current),
            difficulty,
            style,
            'risk',
            'rest_action',
            [{ option: 'rest', score: p.maxHp - p.hp }],
            {
              uk: `Відпочиває через низьке HP (${p.hp}/${p.maxHp}${isNight ? ', ніч' : ''}).`,
              en: `Rests due to low HP (${p.hp}/${p.maxHp}${isNight ? ', night danger' : ''}).`,
            }
          );
          continue;
        }
      }

      // Challenge Seal Guardian if standing on it & risk acceptable
      if (loc.sealGuardianId && loc.sealReward && !p.seals.includes(loc.sealReward)) {
        const risk = AiManager.evaluateChallengeRisk(current, p, loc.sealGuardianId);
        if (risk.expectedMargin >= tuning.safeChallengeMargin || p.hp >= 6) {
          const res = api.challengeSealGuardian(current);
          if (!res.error) {
            current = res.state;
            appendAiDecisionLog(
              current,
              getActivePlayerFromState(current),
              difficulty,
              style,
              'seal',
              `challenge_seal:${loc.sealReward}`,
              [{ option: loc.sealReward, score: risk.expectedMargin + 5 }],
              {
                uk: `Викликає охоронця ${loc.sealReward} (перевага ${risk.expectedMargin}).`,
                en: `Challenges ${loc.sealReward} guardian (margin ${risk.expectedMargin}).`,
              }
            );
            continue;
          }
        }
      }

      // Challenge Gate Guardian if standing on loc_42
      if (loc.isGateGuardianLair && !p.gateGuardianDefeated) {
        const risk = AiManager.evaluateChallengeRisk(current, p, 'enemy_gate_guardian');
        if (risk.expectedMargin >= tuning.safeChallengeMargin || p.hp >= 6) {
          const res = api.challengeGateGuardian(current);
          if (!res.error) {
            current = res.state;
            continue;
          }
        }
      }

      // Final Trials if at Shrine/Citadel with 3 Seals
      if (
        p.seals.length === 3 &&
        p.finalTrialsPassed < 3 &&
        (loc.regionId === 'reg_abyssal_citadel' || loc.terrain === 'shrine')
      ) {
        const res = api.attemptFinalTrial(current);
        if (!res.error) {
          current = res.state;
          continue;
        }
      }

      // Citadel Guardians
      const citadelEnemyId =
        loc.id === 'loc_80'
          ? 'enemy_citadel_sentinel'
          : loc.id === 'loc_81'
            ? 'enemy_citadel_inquisitor'
            : null;
      if (
        citadelEnemyId &&
        p.seals.length === 3 &&
        p.finalTrialsPassed >= 3 &&
        p.citadelGuardiansDefeated < 2 &&
        !(p.defeatedCitadelGuardianIds ?? []).includes(citadelEnemyId)
      ) {
        const res = api.challengeCitadelGuardian(current);
        if (!res.error) {
          current = res.state;
          continue;
        }
      }

      // Void Lord Boss
      if (
        loc.isFinalBossLair &&
        p.seals.length === 3 &&
        p.finalTrialsPassed >= 3 &&
        p.citadelGuardiansDefeated >= 2
      ) {
        const res = api.challengeVoidLord(current);
        if (!res.error) {
          current = res.state;
          continue;
        }
      }

      // Intervene in active Major World Event if standing at valid location
      if (tuning.intervenesWorldEvents && activeEvents.length > 0) {
        const intervenable = activeEvents.find(
          (evt) => WorldEventManager.canHeroIntervene(current, p, evt.id).allowed
        );
        if (
          intervenable &&
          (style === 'warden' || intervenable.stage >= 2 || style === 'scholar')
        ) {
          const res = api.interveneWorldEvent(current, intervenable.id);
          if (!res.error) {
            current = res.state;
            const def = MAJOR_WORLD_EVENT_MAP.get(intervenable.id);
            appendAiDecisionLog(
              current,
              getActivePlayerFromState(current),
              difficulty,
              style,
              'world_event',
              `intervene:${intervenable.id}`,
              [{ option: intervenable.id, score: 8 + intervenable.stage * 2 }],
              {
                uk: `Втручається у світову подію «${def?.name.uk ?? intervenable.id}» (стадія ${intervenable.stage}).`,
                en: `Intervenes in Major World Event "${def?.name.en ?? intervenable.id}" (Stage ${intervenable.stage}).`,
              }
            );
            continue;
          }
        }
      }

      // Rival Consideration: PvP Duel when Conqueror or clearly ahead on same tile
      if (tuning.evaluatesRivals) {
        const rivalsHere = current.players.filter(
          (other) => !other.isDefeated && other.id !== p.id && other.locationId === p.locationId
        );
        if (rivalsHere.length > 0) {
          const myPow = computeEffectiveHeroPower(p);
          const myScore = Math.max(myPow.strength + myPow.gearAttack, myPow.intellect) + p.hp * 0.5;
          const target = rivalsHere.find((r) => {
            const rPow = computeEffectiveHeroPower(r);
            const rScore = Math.max(rPow.strength + rPow.gearAttack, rPow.intellect) + r.hp * 0.5;
            const threshold = style === 'conqueror' ? 0.5 : 2.5;
            return myScore - rScore >= threshold && p.hp >= 4;
          });
          if (target) {
            const pvpRes = api.challengePlayer(current, target.id);
            if (!pvpRes.error) {
              current = pvpRes.state;
              appendAiDecisionLog(
                current,
                getActivePlayerFromState(current),
                difficulty,
                style,
                'rival',
                `pvp:${target.id}`,
                [{ option: target.name, score: myScore }],
                {
                  uk: `Викликає суперника ${target.name} на PvP-дуель завдяки перевазі характеристик.`,
                  en: `Challenges rival ${target.name} to a PvP duel with stat advantage.`,
                }
              );
              continue;
            }
          }
        }
      }

      // Decide between Rolling d6 Movement toward goal vs Exploring current location (e.g. Thunderstorm Shrine!)
      const weatherShrineBonus =
        tuning.looksAheadWeather &&
        ((current.weather === 'thunderstorm' && (loc.terrain === 'shrine' || loc.terrain === 'ruins')) ||
          (current.weather === 'magic_fog' && loc.terrain === 'shrine'));

      const goalLocId = selectAiGoalLocation(
        current,
        p,
        difficulty,
        style,
        tuning,
        recentGoalKey
      );
      recentGoalKey = goalLocId;

      if (weatherShrineBonus && p.actionsRemaining === 1) {
        const expRes = api.exploreLocation(current);
        if (!expRes.error) {
          current = expRes.state;
          appendAiDecisionLog(
            current,
            getActivePlayerFromState(current),
            difficulty,
            style,
            'weather',
            'explore_weather_bonus',
            [{ option: loc.id, score: 9 }],
            {
              uk: `Досліджує локацію за сприятливої погоди (${current.weather}).`,
              en: `Explores location to capitalize on favorable weather (${current.weather}).`,
            }
          );
          continue;
        }
      }

      if (p.locationId !== goalLocId) {
        const rollMoveRes = api.rollMovement(current);
        if (!rollMoveRes.error) {
          current = rollMoveRes.state;
          continue;
        }
        // Direct fallback step if rollMovement wasn't applicable
        const fallbackStep = selectBestNeighborStep(
          current,
          p,
          goalLocId,
          difficulty,
          style,
          tuning,
          recentStepKey
        );
        if (fallbackStep) {
          current = api.moveToLocation(current, fallbackStep.item).state;
          continue;
        }
      }

      const expRes = api.exploreLocation(current);
      if (!expRes.error) {
        current = expRes.state;
        continue;
      }
      break;
    }

    if (
      current.phase === 'PLAYING' &&
      getActivePlayerFromState(current).id === initialActive.id
    ) {
      if (current.turnPhase === 'MOVING') {
        const stopRes = api.stopMovementEarly(current);
        if (!stopRes.error) current = stopRes.state;
      }
      if (current.turnPhase === 'ENCOUNTER' && current.encounter) {
        if (typeof current.encounter.rollResult !== 'number') {
          current = api.rollEncounterCheck(current).state;
        }
        current = api.resolveEncounter(current).state;
      }
      if (
        current.phase === 'PLAYING' &&
        current.turnPhase === 'ACTION' &&
        getActivePlayerFromState(current).id === initialActive.id
      ) {
        current = api.endTurn(current).state;
      }
    }

    return current;
  },
};

function selectAiGoalLocation(
  state: GameState,
  player: PlayerState,
  difficulty: AiDifficulty,
  style: AiBehaviorStyle,
  tuning: DifficultyTuning,
  recentGoalKey?: string
): string {
  const candidates: Array<ScoredOption<string>> = [];
  const isNight = DayNightManager.isNight(state);
  const rivals = state.players.filter((o) => !o.isDefeated && o.id !== player.id);

  const distTo = (locId: string) =>
    computeBfsDistance(player, player.locationId, locId, state, tuning.usesNightPassages);

  // 1. Seals & Main Victory Progression
  if (!player.seals.includes('seal_power')) {
    const d = distTo('loc_28');
    let score = 20 - d * 1.1;
    if (style === 'conqueror') score += 1.5;
    candidates.push({ key: 'loc_28', item: 'loc_28', score });
  }

  if (!player.gateGuardianDefeated) {
    const d = distTo('loc_42');
    const readinessBonus = player.seals.includes('seal_power') ? 6 : -3;
    candidates.push({ key: 'loc_42', item: 'loc_42', score: 17 + readinessBonus - d * 1.0 });
  } else {
    if (!player.seals.includes('seal_fate')) {
      const d = distTo('loc_66');
      let score = 22 - d * 1.1;
      if (style === 'merchant_tactician') score += 1.2;
      if (tuning.evaluatesRivals && rivals.some((r) => r.seals.includes('seal_fate'))) score += 0.8;
      candidates.push({ key: 'loc_66', item: 'loc_66', score });
    }
    if (!player.seals.includes('seal_wisdom')) {
      const d = distTo('loc_71');
      let score = 22 - d * 1.1;
      if (style === 'scholar') score += 1.2;
      if (tuning.evaluatesRivals && rivals.some((r) => r.seals.includes('seal_wisdom'))) score += 0.8;
      candidates.push({ key: 'loc_71', item: 'loc_71', score });
    }
  }

  if (player.seals.length === 3) {
    if (player.finalTrialsPassed < 3) {
      const d = distTo('loc_73');
      candidates.push({ key: 'loc_73', item: 'loc_73', score: 28 - d });
    } else if (player.citadelGuardiansDefeated < 2) {
      const defeated = player.defeatedCitadelGuardianIds ?? [];
      if (!defeated.includes('enemy_citadel_sentinel')) {
        candidates.push({ key: 'loc_80', item: 'loc_80', score: 32 - distTo('loc_80') });
      }
      if (!defeated.includes('enemy_citadel_inquisitor')) {
        candidates.push({ key: 'loc_81', item: 'loc_81', score: 32 - distTo('loc_81') });
      }
    } else {
      candidates.push({ key: 'loc_84', item: 'loc_84', score: 40 - distTo('loc_84') });
    }
  }

  // 2. Active Major World Events Intervention Target (if accessible & relevant)
  if (tuning.intervenesWorldEvents) {
    for (const evt of WorldEventManager.getActiveEvents(state)) {
      if (!NavigationGraph.canAccessLocation(player, evt.targetLocationId).allowed) continue;
      const d = distTo(evt.targetLocationId);
      let score = 14 + evt.stage * 2.5 - d * 1.2;
      if (style === 'warden') score += 4.5;
      if (evt.id === 'major_arcane_storm' && style === 'scholar') score += 3;
      if (evt.id === 'major_vanishing_caravans' && style === 'merchant_tactician') score += 3;
      candidates.push({ key: `evt_${evt.targetLocationId}`, item: evt.targetLocationId, score });
    }
  }

  // 3. Weather / DayNight tactical Shrine or Sanctuary detour
  if (tuning.looksAheadWeather && (state.weather === 'thunderstorm' || state.weather === 'magic_fog')) {
    const nearbyShrine = LOCATIONS.find(
      (l) =>
        l.terrain === 'shrine' &&
        NavigationGraph.canAccessLocation(player, l.id).allowed &&
        distTo(l.id) <= 2
    );
    if (nearbyShrine) {
      candidates.push({
        key: `shrine_${nearbyShrine.id}`,
        item: nearbyShrine.id,
        score: (style === 'scholar' ? 21 : 17) - distTo(nearbyShrine.id),
      });
    }
  }

  // 4. Healing / Shopping Village detour when low HP or flush with gold
  if (player.hp <= Math.floor(player.maxHp * tuning.restHpRatio + 1) || (player.gold >= 26 && difficulty !== 'easy')) {
    const nearbySettlement = LOCATIONS.find(
      (l) =>
        (l.terrain === 'village' || l.terrain === 'sanctuary') &&
        NavigationGraph.canAccessLocation(player, l.id).allowed &&
        distTo(l.id) <= 3
    );
    if (nearbySettlement) {
      let score = player.hp <= 4 ? 25 : 15;
      if (style === 'merchant_tactician') score += 2.5;
      if (isNight && player.hp <= 5) score += 2;
      candidates.push({
        key: `town_${nearbySettlement.id}`,
        item: nearbySettlement.id,
        score: score - distTo(nearbySettlement.id),
      });
    }
  }

  if (candidates.length === 0) return 'loc_28';

  const chosen = pickFromEquivalentCandidates(
    state,
    candidates,
    tuning.equivalenceBand,
    tuning.noiseAmplitude,
    recentGoalKey
  );

  appendAiDecisionLog(
    state,
    player,
    difficulty,
    style,
    'seal',
    `goal:${chosen.item}`,
    candidates.sort((a, b) => b.score - a.score).map((c) => ({ option: c.item, score: c.score })),
    {
      uk: `Обрано стратегічну ціль ${chosen.item} з урахуванням дистанції, стилю (${style}) та конкуренції.`,
      en: `Selected strategic goal ${chosen.item} factoring distance, style (${style}), and rival progress.`,
    }
  );

  return chosen.item;
}

function selectBestNeighborStep(
  state: GameState,
  player: PlayerState,
  goalLocId: string,
  difficulty: AiDifficulty,
  style: AiBehaviorStyle,
  tuning: DifficultyTuning,
  recentStepKey?: string
): ScoredOption<string> | null {
  const neighborStatuses = NavigationGraph.getNeighborStatuses(player, player.locationId, state).filter(
    (n) => n.allowed && (tuning.usesNightPassages || !n.isNightPassage)
  );
  if (neighborStatuses.length === 0) return null;

  const isNight = DayNightManager.isNight(state);
  const rivals = state.players.filter((o) => !o.isDefeated && o.id !== player.id);

  const scored: Array<ScoredOption<string>> = neighborStatuses.map((n) => {
    const nLoc = n.location;
    const distAfter = computeBfsDistance(
      player,
      nLoc.id,
      goalLocId,
      state,
      tuning.usesNightPassages
    );
    let score = 30 - distAfter * 3.0;

    if (nLoc.id === goalLocId) score += 8;

    // Night passage bonus on Normal/Hard
    if (n.isNightPassage && tuning.usesNightPassages) {
      score += style === 'scholar' ? 2.5 : 1.5;
    }

    // Risk & Weather assessment
    if (tuning.looksAheadWeather) {
      const weatherMod = WeatherManager.getCombatModifiers(state.weather, nLoc);
      const evtMod = WorldEventManager.getLocationEventModifier(state, nLoc);
      const effectiveDanger = nLoc.dangerLevel + weatherMod.dangerMod + evtMod.dangerMod + (isNight ? 1 : 0);
      if (player.hp <= 4) {
        score -= effectiveDanger * 1.1;
      } else if (style === 'conqueror') {
        score += effectiveDanger * 0.25;
      } else {
        score -= effectiveDanger * 0.35;
      }
      if (nLoc.terrain === 'village' || nLoc.terrain === 'sanctuary') {
        score += player.hp <= 5 ? 4 : 0.8;
      }
    }

    // Rival awareness
    if (tuning.evaluatesRivals) {
      const rivalOnTile = rivals.find((r) => r.locationId === nLoc.id);
      if (rivalOnTile) {
        const myStr = computeEffectiveHeroPower(player).strength;
        const rStr = computeEffectiveHeroPower(rivalOnTile).strength;
        if (style === 'conqueror' && myStr > rStr) score += 2.2;
        else if (player.hp <= 4) score -= 2.5;
      }
    }

    // Small encouragement for unvisited tiles when wandering/exploring
    if (!player.visitedLocationIds.includes(nLoc.id)) {
      score += 0.4;
    }

    return {
      key: nLoc.id,
      item: nLoc.id,
      score: Number(score.toFixed(2)),
    };
  });

  const chosen = pickFromEquivalentCandidates(
    state,
    scored,
    tuning.equivalenceBand,
    tuning.noiseAmplitude,
    recentStepKey
  );

  appendAiDecisionLog(
    state,
    player,
    difficulty,
    style,
    isNight ? 'day_night' : 'route',
    `step:${chosen.item}`,
    scored.sort((a, b) => b.score - a.score).map((s) => ({ option: s.key, score: s.score })),
    {
      uk: `Маршрут → ${chosen.item} (ціль ${goalLocId}, погода: ${state.weather}, ${isNight ? 'ніч' : 'день'}).`,
      en: `Route → ${chosen.item} (goal ${goalLocId}, weather: ${state.weather}, ${isNight ? 'night' : 'day'}).`,
    }
  );

  return chosen;
}
