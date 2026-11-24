import {
  ADVENTURE_DECK_CARD_IDS,
  CARD_MAP,
  HERO_DECK_CARD_IDS,
} from '../data/cards';
import { ENEMIES, ENEMY_MAP } from '../data/enemies';
import { HERO_MAP, HEROES } from '../data/heroes';
import { LOCATION_MAP, LOCATIONS } from '../data/locations';
import { WEATHER_MODIFIERS, WORLD_EVENT_MAP } from '../data/world';
import {
  ActiveCombat,
  ActiveEncounter,
  CardDefinition,
  ChronicleEntry,
  DiceRollPurpose,
  DiceRollRecord,
  EngineResult,
  EquipSlot,
  GameState,
  HERO_INVENTORY_LIMITS,
  HERO_STAT_LIMITS,
  LocalizedText,
  NewGameConfig,
  PlayerState,
  RegionId,
  SealType,
} from '../types/game';
import {
  cloneGameState,
  computeEffectiveStats,
  computeEquipmentCombatAttack,
  getActivePlayerFromState,
} from './GameState';
import { NavigationGraph } from './NavigationGraph';
import { normalizeSeed, randomInt, rollD6, shuffleWithState } from './rng';
import { appendChronicleEntry, refillMarketStock, TurnManager } from './TurnManager';

const MAX_HAND_SIZE = HERO_INVENTORY_LIMITS.maxHandSize;

function cloneState(state: GameState): GameState {
  return cloneGameState(state);
}

let diceSeq = 0;

function addChronicle(
  state: GameState,
  type: ChronicleEntry['type'],
  playerId: string | null,
  text: LocalizedText
): void {
  appendChronicleEntry(state, type, playerId, text);
}

function recordDiceRoll(
  state: GameState,
  player: PlayerState,
  purpose: DiceRollPurpose,
  roll: number,
  modifier: number,
  total: number,
  rngBefore: number,
  rngAfter: number,
  summary: LocalizedText
): DiceRollRecord {
  const existing = new Set((state.diceHistory ?? []).map((r) => r.id));
  let id = `roll_${state.round}_${rngAfter}_${++diceSeq}`;
  while (existing.has(id)) {
    id = `roll_${state.round}_${rngAfter}_${++diceSeq}`;
  }
  const record: DiceRollRecord = {
    id,
    round: state.round,
    timeOfDay: state.timeOfDay,
    playerId: player.id,
    playerName: player.name,
    purpose,
    roll,
    modifier,
    total,
    rerolled: false,
    previousRoll: null,
    fateSpent: 0,
    rngBefore,
    rngAfter,
    summary,
  };
  state.diceHistory = [record, ...(state.diceHistory ?? [])].slice(0, 80);
  state.lastDiceRoll = roll;
  return record;
}

function syncTurnCycleActionGuidance(state: GameState): void {
  if (state.phase !== 'PLAYING' || state.turnPhase !== 'ACTION') return;
  const player = getActivePlayerFromState(state);
  if (player.actionsRemaining > 0) {
    state.turnCycleStep = 'dice_roll';
    state.turnGuidance = {
      uk: `Залишилось дій: ${player.actionsRemaining}. Киньте d6 для руху або виконайте дію на локації.`,
      en: `Actions remaining: ${player.actionsRemaining}. Roll d6 to move or act at this location.`,
    };
  } else {
    state.turnCycleStep = 'turn_end';
    state.turnGuidance = {
      uk: 'Дії вичерпано. Крок 7: Натисніть «Завершити хід», щоб передати хід.',
      en: 'Out of actions. Step 7: Press "End Turn" to pass the turn.',
    };
  }
}

export function getActivePlayer(state: GameState): PlayerState {
  return getActivePlayerFromState(state);
}

export function getPlayerEffectiveStats(player: PlayerState): {
  strength: number;
  intellect: number;
  fate: number;
  armor: number;
} {
  return computeEffectiveStats(player);
}

function drawCardsFromDeck(
  state: GameState,
  player: PlayerState,
  count: number
): string[] {
  const drawn: string[] = [];
  for (let i = 0; i < count; i++) {
    if (player.hand.length >= MAX_HAND_SIZE) break;
    if (state.deck.length === 0) {
      if (state.discardPile.length === 0) break;
      const reshuffled = shuffleWithState(state.discardPile, state.rngState);
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

function drawAdventureCardFromDeck(state: GameState): CardDefinition | null {
  if (!state.adventureDeck) {
    state.adventureDeck = [...ADVENTURE_DECK_CARD_IDS];
  }
  if (!state.adventureDiscardPile) {
    state.adventureDiscardPile = [];
  }
  if (state.adventureDeck.length === 0) {
    if (state.adventureDiscardPile.length === 0) return null;
    const reshuffled = shuffleWithState(state.adventureDiscardPile, state.rngState);
    state.adventureDeck = reshuffled.shuffled;
    state.rngState = reshuffled.nextState;
    state.adventureDiscardPile = [];
  }
  const cardId = state.adventureDeck.shift();
  if (!cardId) return null;
  return CARD_MAP.get(cardId) ?? null;
}

function attachCurseToPlayer(state: GameState, player: PlayerState, curseCardId: string): boolean {
  const curses = player.curses ?? [];
  if (curses.includes(curseCardId)) return false;
  player.curses = [...curses, curseCardId];
  const card = CARD_MAP.get(curseCardId);
  if (card) {
    addChronicle(state, 'world', player.id, card.logText);
  }
  return true;
}

function removeCurseFromPlayer(
  state: GameState,
  player: PlayerState,
  curseCardId?: string
): CardDefinition | null {
  const curses = player.curses ?? [];
  if (curses.length === 0) return null;
  const targetId = curseCardId && curses.includes(curseCardId) ? curseCardId : curses[0];
  player.curses = curses.filter((id) => id !== targetId);
  state.adventureDiscardPile = [...(state.adventureDiscardPile ?? []), targetId];
  return CARD_MAP.get(targetId) ?? null;
}

function applyDirectCardEffect(
  state: GameState,
  player: PlayerState,
  card: CardDefinition
): void {
  const eff = card.effect;
  if (eff.healHp) {
    player.hp = Math.min(HERO_STAT_LIMITS.maxHp, player.maxHp, player.hp + eff.healHp);
  }
  if (eff.bonusAttack) {
    player.tempAttackBonus += eff.bonusAttack;
  }
  if (eff.bonusDefense) {
    player.tempDefenseBonus += eff.bonusDefense;
  }
  if (eff.bonusGold) {
    player.gold += eff.bonusGold;
  }
  if (eff.bonusXp) {
    player.experience += eff.bonusXp;
  }
  if (eff.bonusFate) {
    player.fate = Math.min(HERO_STAT_LIMITS.maxFate, player.fate + eff.bonusFate);
  }
  if (eff.extraActions) {
    player.actionsRemaining += eff.extraActions;
  }
  if (eff.drawCards) {
    drawCardsFromDeck(state, player, eff.drawCards);
  }
  if (eff.removeAllCurses) {
    const existing = [...(player.curses ?? [])];
    player.curses = [];
    if (existing.length > 0) {
      state.adventureDiscardPile = [...(state.adventureDiscardPile ?? []), ...existing];
    }
  } else if (eff.removeCurse) {
    removeCurseFromPlayer(state, player);
  }
  if (eff.weatherShift) {
    state.weather = eff.weatherShift;
  }
  if (eff.damageEnemy && state.combat) {
    state.combat.enemyCurrentHp = Math.max(0, state.combat.enemyCurrentHp - eff.damageEnemy);
  }
}

function resolveCombatEnemyStats(combat: ActiveCombat): {
  name: LocalizedText;
  attack: number;
  defense: number;
  goldReward: number;
  xpReward: number;
  sealReward?: SealType;
} {
  const baseEnemy = ENEMY_MAP.get(combat.enemyId)!;
  return {
    name: combat.enemyNameOverride ?? baseEnemy.name,
    attack: combat.enemyAttackOverride ?? baseEnemy.attack,
    defense: combat.enemyDefenseOverride ?? baseEnemy.defense,
    goldReward: combat.enemyGoldOverride ?? baseEnemy.goldReward,
    xpReward:
      combat.enemyXpOverride ??
      (baseEnemy.tier === 'minion' ? 1 : baseEnemy.tier === 'elite' ? 2 : 3),
    sealReward: combat.combatPurpose === 'card_enemy' ? undefined : baseEnemy.sealReward,
  };
}

function pickRegionalEnemyId(state: GameState, regionId: RegionId): string {
  const pool = ENEMIES.filter(
    (e) => e.regionId === regionId && (e.tier === 'minion' || e.tier === 'elite')
  );
  const idx = randomInt(state.rngState, 0, pool.length - 1);
  state.rngState = idx.nextState;
  return pool[idx.value].id;
}

function getWorldEnemyAttackMod(state: GameState): number {
  let mod = WEATHER_MODIFIERS[state.weather].attackMod;
  if (state.timeOfDay === 'night') mod += 1;
  if (state.activeWorldEventId) {
    const evt = WORLD_EVENT_MAP.get(state.activeWorldEventId);
    if (evt) mod += evt.enemyAttackMod;
  }
  return mod;
}

function handlePlayerDefeatIfNeeded(state: GameState, player: PlayerState): void {
  if (player.hp > 0) return;
  player.hp = 0;
  player.isDefeated = true;
  if (state.combat?.enemyCardId) {
    state.adventureDiscardPile = [...(state.adventureDiscardPile ?? []), state.combat.enemyCardId];
  }
  addChronicle(state, 'combat', player.id, {
    uk: `${player.name} втрачає всі сили і вибуває з хроніки.`,
    en: `${player.name} falls in battle and is removed from the chronicle.`,
  });

  const anyAlive = state.players.some((p) => !p.isDefeated);
  if (!anyAlive) {
    state.phase = 'DEFEAT';
    state.combat = null;
    state.encounter = null;
    state.movement = null;
    state.turnPhase = 'ACTION';
    addChronicle(state, 'system', null, {
      uk: 'Усі герої впали. Порожнеча поглинула Забуті Землі.',
      en: 'All heroes have fallen. The Void claims the Forgotten Realms.',
    });
    return;
  }

  if (getActivePlayer(state).id === player.id) {
    state.combat = null;
    state.encounter = null;
    state.movement = null;
    state.turnPhase = 'ACTION';
    TurnManager.advanceTurn(state);
  }
}

function resolveCombatVictory(state: GameState, player: PlayerState, combat: ActiveCombat): void {
  const resolved = resolveCombatEnemyStats(combat);
  player.enemiesSlain += 1;
  player.gold += resolved.goldReward;
  player.experience += resolved.xpReward;

  if (combat.enemyCardId) {
    state.adventureDiscardPile = [...(state.adventureDiscardPile ?? []), combat.enemyCardId];
  }

  addChronicle(state, 'combat', player.id, {
    uk: `${player.name} перемагає ворога "${resolved.name.uk}" (+${resolved.goldReward} золота, +${resolved.xpReward} досвіду).`,
    en: `${player.name} defeats "${resolved.name.en}" (+${resolved.goldReward} Gold, +${resolved.xpReward} XP).`,
  });

  if (resolved.sealReward && !player.seals.includes(resolved.sealReward)) {
    player.seals.push(resolved.sealReward);
    const sealNames: Record<SealType, LocalizedText> = {
      seal_power: { uk: 'Печатку Сили', en: 'the Seal of Power' },
      seal_wisdom: { uk: 'Печатку Мудрості', en: 'the Seal of Wisdom' },
      seal_fate: { uk: 'Печатку Долі', en: 'the Seal of Fate' },
    };
    addChronicle(state, 'seal', player.id, {
      uk: `${player.name} здобуває ${sealNames[resolved.sealReward].uk}! (${player.seals.length}/3)`,
      en: `${player.name} claims ${sealNames[resolved.sealReward].en}! (${player.seals.length}/3)`,
    });
  }

  if (combat.combatPurpose === 'gate_guardian') {
    player.gateGuardianDefeated = true;
    addChronicle(state, 'trial', player.id, {
      uk: `${player.name} перемагає Охоронця Брами! Шлях у Середній регіон відкрито.`,
      en: `${player.name} defeats the Gate Guardian! Passage to the Middle Region is open.`,
    });
  }

  if (combat.combatPurpose === 'citadel_guardian') {
    const defeatedIds = player.defeatedCitadelGuardianIds ?? [];
    if (!defeatedIds.includes(combat.enemyId)) {
      defeatedIds.push(combat.enemyId);
    }
    player.defeatedCitadelGuardianIds = defeatedIds;
    player.citadelGuardiansDefeated = Math.min(2, Math.max(player.citadelGuardiansDefeated + 1, defeatedIds.length));
    addChronicle(state, 'trial', player.id, {
      uk: `Вартовий Цитаделі подоланий (${player.citadelGuardiansDefeated}/2).`,
      en: `Citadel Guardian defeated (${player.citadelGuardiansDefeated}/2).`,
    });
  }

  if (combat.combatPurpose === 'void_lord') {
    player.voidLordDefeated = true;
    state.phase = 'VICTORY';
    state.winnerPlayerId = player.id;
    addChronicle(state, 'seal', player.id, {
      uk: `${player.name} перемагає Володаря Порожнечі! Світ врятовано!`,
      en: `${player.name} vanquishes the Lord of the Void! The Realms are saved!`,
    });
  }

  drawCardsFromDeck(state, player, 1);
  state.combat = null;
  state.turnPhase = 'ACTION';
  if (state.phase === 'PLAYING') {
    syncTurnCycleActionGuidance(state);
  }
}

function triggerArrivalOutcome(state: GameState, player: PlayerState): void {
  const targetLoc = LOCATION_MAP.get(player.locationId)!;
  const timeEffect =
    state.timeOfDay === 'night' || state.timeOfDay === 'dusk'
      ? targetLoc.nightEffect
      : targetLoc.dayEffect;

  const weatherDanger = WEATHER_MODIFIERS[state.weather].dangerMod;
  const totalDanger = targetLoc.dangerLevel + timeEffect.dangerMod + weatherDanger;

  state.turnCycleStep = 'destination_activation';

  // Arrival event activates on final destination of movement
  const rngBefore = state.rngState;
  const roll = rollD6(state.rngState);
  state.rngState = roll.nextState;

  if (targetLoc.terrain === 'sanctuary' || targetLoc.terrain === 'village') {
    const heal = roll.roll >= 4 ? 2 : 1;
    const before = player.hp;
    player.hp = Math.min(HERO_STAT_LIMITS.maxHp, player.maxHp, player.hp + heal);
    const gained = player.hp - before;
    const arrivalText: LocalizedText =
      gained > 0
        ? {
            uk: `5. Активація локації "${targetLoc.name.uk}" (d6=${roll.roll}): відновлено +${gained} HP.`,
            en: `5. Destination "${targetLoc.name.en}" activated (d6=${roll.roll}): restored +${gained} HP.`,
          }
        : {
            uk: `5. Активація локації "${targetLoc.name.uk}" (d6=${roll.roll}): мирний притулок (HP повне).`,
            en: `5. Destination "${targetLoc.name.en}" activated (d6=${roll.roll}): safe haven (HP full).`,
          };
    recordDiceRoll(state, player, 'arrival_event', roll.roll, 0, roll.roll, rngBefore, roll.nextState, arrivalText);
    addChronicle(state, 'move', player.id, arrivalText);
    syncTurnCycleActionGuidance(state);
    return;
  }

  if (roll.roll <= 2 && totalDanger >= 4) {
    const enemyId = pickRegionalEnemyId(state, targetLoc.regionId);
    const enemy = ENEMY_MAP.get(enemyId)!;
    state.combat = {
      enemyId,
      enemyCurrentHp: enemy.maxHp,
      enemyMaxHp: enemy.maxHp,
      isDefending: false,
      roundCount: 1,
      lastPlayerRoll: null,
      lastEnemyRoll: null,
      combatPurpose: 'roaming',
    };
    state.turnPhase = 'COMBAT';
    state.turnCycleStep = 'encounter';
    const combatText: LocalizedText = {
      uk: `5–6. Активація "${targetLoc.name.uk}" (d6=${roll.roll}): засідка ворога "${enemy.name.uk}"!`,
      en: `5–6. Destination "${targetLoc.name.en}" (d6=${roll.roll}): "${enemy.name.en}" ambushes you!`,
    };
    recordDiceRoll(state, player, 'arrival_event', roll.roll, 0, roll.roll, rngBefore, roll.nextState, combatText);
    addChronicle(state, 'combat', player.id, combatText);
    state.turnGuidance = {
      uk: `Крок 6: Бій із "${enemy.name.uk}"! Оберіть атаку, захист або відступ.`,
      en: `Step 6: Combat with "${enemy.name.en}"! Attack, defend, or attempt to flee.`,
    };
  } else if (roll.roll === 6) {
    const goldFound = 4 + targetLoc.dangerLevel * 2;
    player.gold += goldFound;
    const goldText: LocalizedText = {
      uk: `5. Активація локації "${targetLoc.name.uk}" (d6=6): знайдено +${goldFound} золота.`,
      en: `5. Destination "${targetLoc.name.en}" (d6=6): found +${goldFound} Gold.`,
    };
    recordDiceRoll(state, player, 'arrival_event', roll.roll, 0, roll.roll, rngBefore, roll.nextState, goldText);
    addChronicle(state, 'world', player.id, goldText);
    syncTurnCycleActionGuidance(state);
  } else {
    const calmText: LocalizedText = {
      uk: `5. Активація локації "${targetLoc.name.uk}" (d6=${roll.roll}): прибуття завершено (${timeEffect.description.uk}).`,
      en: `5. Destination "${targetLoc.name.en}" (d6=${roll.roll}): arrival complete (${timeEffect.description.en}).`,
    };
    recordDiceRoll(state, player, 'arrival_event', roll.roll, 0, roll.roll, rngBefore, roll.nextState, calmText);
    addChronicle(state, 'move', player.id, calmText);
    syncTurnCycleActionGuidance(state);
  }
}

export const RulesEngine = {
  createNewGame(config: NewGameConfig): GameState {
    const seed = normalizeSeed(config.seed);
    let rngState = seed;

    const selectedConfigs = config.playerConfigs.slice(0, 6);
    const reservedCardIds = new Set<string>();
    for (let i = 0; i < selectedConfigs.length; i++) {
      const hero = HERO_MAP.get(selectedConfigs[i].heroId) ?? HEROES[i % HEROES.length];
      if (hero.startingEquipment.weapon) reservedCardIds.add(hero.startingEquipment.weapon);
      if (hero.startingEquipment.armor) reservedCardIds.add(hero.startingEquipment.armor);
      if (hero.startingEquipment.talisman) reservedCardIds.add(hero.startingEquipment.talisman);
      for (const cid of hero.startingResources.cards) reservedCardIds.add(cid);
    }

    const heroDeckPool = HERO_DECK_CARD_IDS.filter((id) => !reservedCardIds.has(id));
    const shuffledHeroDeck = shuffleWithState(heroDeckPool, rngState);
    rngState = shuffledHeroDeck.nextState;
    const deck = shuffledHeroDeck.shuffled;
    const marketCardIds = deck.splice(0, 4);

    const shuffledAdventureDeck = shuffleWithState(ADVENTURE_DECK_CARD_IDS, rngState);
    rngState = shuffledAdventureDeck.nextState;
    const adventureDeck = shuffledAdventureDeck.shuffled;

    const players: PlayerState[] = selectedConfigs.map((pc, idx) => {
      const hero = HERO_MAP.get(pc.heroId) ?? HEROES[idx % HEROES.length];
      const starterCards = [...hero.startingResources.cards];
      const extraCount = Math.max(0, 4 - starterCards.length);
      const hand = [...starterCards, ...deck.splice(0, extraCount)];
      return {
        id: `player_${idx + 1}`,
        name: pc.name.trim() || hero.name.en,
        isAI: pc.isAI,
        heroId: hero.id,
        locationId: hero.startingLocationId,
        hp: Math.min(HERO_STAT_LIMITS.maxHp, hero.baseStats.hp),
        maxHp: HERO_STAT_LIMITS.maxHp,
        strength: Math.min(HERO_STAT_LIMITS.maxStrength, hero.baseStats.strength),
        intellect: Math.min(HERO_STAT_LIMITS.maxIntellect, hero.baseStats.intellect),
        fate: Math.min(HERO_STAT_LIMITS.maxFate, hero.baseStats.fate),
        armor: hero.baseStats.armor,
        gold: hero.startingResources.gold,
        experience: hero.startingResources.experience,
        hand,
        inventory: [],
        companions: [],
        curses: [],
        equipment: { ...hero.startingEquipment },
        seals: [],
        gateGuardianDefeated: false,
        finalTrialsPassed: 0,
        citadelGuardiansDefeated: 0,
        defeatedCitadelGuardianIds: [],
        voidLordDefeated: false,
        actionsRemaining: hero.baseStats.actionsPerTurn,
        tempAttackBonus: 0,
        tempDefenseBonus: 0,
        abilityUsedThisTurn: false,
        isDefeated: false,
        visitedLocationIds: [hero.startingLocationId],
        enemiesSlain: 0,
      };
    });

    const state: GameState = {
      saveId: `save_${seed}_${Date.now()}`,
      version: 2,
      seed,
      rngState,
      mode: config.mode,
      phase: 'PLAYING',
      turnPhase: 'ACTION',
      turnCycleStep: 'turn_start',
      turnGuidance: null,
      round: 1,
      activePlayerIndex: 0,
      timeOfDay: 'dawn',
      weather: 'clear',
      activeWorldEventId: null,
      players,
      deck,
      discardPile: [],
      adventureDeck,
      adventureDiscardPile: [],
      marketCardIds,
      movement: null,
      combat: null,
      encounter: null,
      lastDiceRoll: null,
      diceHistory: [],
      winnerPlayerId: null,
      chronicle: [],
      updatedAt: Date.now(),
    };

    addChronicle(state, 'system', null, {
      uk: `Хроніка розпочалася (зерно #${seed}). Мета: зібрати 3 Печатки, пройти випробування та здолати Володаря Порожнечі.`,
      en: `Chronicle begun (Seed #${seed}). Goal: gather 3 Seals, pass trials, and defeat the Lord of the Void.`,
    });

    TurnManager.applyTurnStartAndEffects(state, true);

    return state;
  },

  rollMovement(state: GameState): EngineResult {
    if (state.phase !== 'PLAYING' || state.turnPhase !== 'ACTION') {
      return {
        state,
        error: { uk: 'Зараз неможливо розпочати рух.', en: 'Cannot start movement right now.' },
      };
    }

    const next = cloneState(state);
    const player = getActivePlayer(next);
    if (player.actionsRemaining <= 0) {
      return {
        state,
        error: { uk: 'Не залишилося дій у цьому ході.', en: 'No actions remaining this turn.' },
      };
    }

    const currentLoc = LOCATION_MAP.get(player.locationId)!;
    const weatherMoveMod = currentLoc.weatherModifiers[next.weather]?.moveMod ?? 0;

    const rngBefore = next.rngState;
    const roll = rollD6(next.rngState);
    next.rngState = roll.nextState;

    const totalSteps = Math.max(1, roll.roll + weatherMoveMod);
    const rollSummary: LocalizedText = {
      uk: `3. Кидок d6 для руху: ${roll.roll}${weatherMoveMod !== 0 ? ` (${weatherMoveMod > 0 ? `+${weatherMoveMod}` : weatherMoveMod} погода)` : ''} → ${totalSteps} крок(ів).`,
      en: `3. Movement d6 roll: ${roll.roll}${weatherMoveMod !== 0 ? ` (${weatherMoveMod > 0 ? `+${weatherMoveMod}` : weatherMoveMod} weather)` : ''} → ${totalSteps} step(s).`,
    };
    const rec = recordDiceRoll(
      next,
      player,
      'movement',
      roll.roll,
      weatherMoveMod,
      totalSteps,
      rngBefore,
      roll.nextState,
      rollSummary
    );

    player.actionsRemaining -= 1;
    next.movement = {
      totalRoll: totalSteps,
      stepsRemaining: totalSteps,
      pathTaken: [player.locationId],
      rawRoll: roll.roll,
      weatherMod: weatherMoveMod,
      fateRerollUsed: false,
      rollRecordId: rec.id,
    };
    next.turnPhase = 'MOVING';
    next.turnCycleStep = 'movement';
    next.turnGuidance =
      player.fate > 0
        ? {
            uk: `Кинуто ${roll.roll} (${totalSteps} кр.). Оберіть сусідню локацію або витратьте 1 Долю на єдине перекидання.`,
            en: `Rolled ${roll.roll} (${totalSteps} steps). Pick an adjacent route or spend 1 Fate for a single reroll.`,
          }
        : {
            uk: `Кинуто ${roll.roll} (${totalSteps} кр.). Оберіть сусідню локацію для переміщення.`,
            en: `Rolled ${roll.roll} (${totalSteps} steps). Choose an adjacent location to travel.`,
          };

    addChronicle(next, 'move', player.id, {
      uk: `${player.name}: ${rollSummary.uk} Оберіть маршрут.`,
      en: `${player.name}: ${rollSummary.en} Choose a route.`,
    });

    next.updatedAt = Date.now();
    return { state: next };
  },

  rerollMovementDice(state: GameState): EngineResult {
    if (state.phase !== 'PLAYING' || state.turnPhase !== 'MOVING' || !state.movement) {
      return {
        state,
        error: { uk: 'Зараз немає кидка руху для перекидання.', en: 'No active movement roll to reroll.' },
      };
    }

    const next = cloneState(state);
    const player = getActivePlayer(next);
    const movement = next.movement!;

    if (movement.fateRerollUsed) {
      return {
        state,
        error: {
          uk: 'Долю вже використано для цього кидка — другий результат обов’язковий.',
          en: 'Fate has already been spent on this roll — the second result is mandatory.',
        },
      };
    }

    if (movement.pathTaken.length > 1 || movement.stepsRemaining !== movement.totalRoll) {
      return {
        state,
        error: {
          uk: 'Перекидання неможливе після початку руху маршрутом.',
          en: 'Cannot reroll after already stepping along a route.',
        },
      };
    }

    if (player.fate < 1) {
      return {
        state,
        error: { uk: 'Недостатньо очок Долі (0).', en: 'Not enough Fate points (0).' },
      };
    }

    const previousRoll = movement.rawRoll ?? movement.totalRoll;
    const weatherMod = movement.weatherMod ?? 0;

    player.fate -= 1;
    const roll = rollD6(next.rngState);
    next.rngState = roll.nextState;
    next.lastDiceRoll = roll.roll;

    const totalSteps = Math.max(1, roll.roll + weatherMod);
    movement.rawRoll = roll.roll;
    movement.totalRoll = totalSteps;
    movement.stepsRemaining = totalSteps;
    movement.fateRerollUsed = true;

    const summary: LocalizedText = {
      uk: `Доля (1 очко): перекидання руху ${previousRoll} → ${roll.roll}${weatherMod !== 0 ? ` (${weatherMod > 0 ? `+${weatherMod}` : weatherMod} погода)` : ''} → ${totalSteps} крок(ів). Другий результат обов’язковий.`,
      en: `Fate (1 pt): movement reroll ${previousRoll} → ${roll.roll}${weatherMod !== 0 ? ` (${weatherMod > 0 ? `+${weatherMod}` : weatherMod} weather)` : ''} → ${totalSteps} step(s). Second result is mandatory.`,
    };

    if (next.diceHistory && movement.rollRecordId) {
      const idx = next.diceHistory.findIndex((r) => r.id === movement.rollRecordId);
      if (idx !== -1) {
        next.diceHistory[idx] = {
          ...next.diceHistory[idx],
          roll: roll.roll,
          total: totalSteps,
          rerolled: true,
          previousRoll,
          fateSpent: 1,
          rngAfter: roll.nextState,
          summary,
        };
      }
    }

    next.turnCycleStep = 'movement';
    next.turnGuidance = {
      uk: `Використано 1 Долю: новий результат ${roll.roll} (${totalSteps} кр.) є обов’язковим. Оберіть маршрут.`,
      en: `1 Fate spent: new result ${roll.roll} (${totalSteps} steps) is mandatory. Choose a route.`,
    };

    addChronicle(next, 'move', player.id, {
      uk: `${player.name} витрачає 1 Долю: перекидання руху ${previousRoll} → ${roll.roll} (${totalSteps} крок(ів), другий результат обов’язковий).`,
      en: `${player.name} spends 1 Fate: movement reroll ${previousRoll} → ${roll.roll} (${totalSteps} step(s), second result mandatory).`,
    });

    next.updatedAt = Date.now();
    return { state: next };
  },

  stepMove(state: GameState, targetLocationId: string): EngineResult {
    if (state.phase !== 'PLAYING' || state.turnPhase !== 'MOVING' || !state.movement) {
      return {
        state,
        error: { uk: 'Немає активного кидка руху.', en: 'No active movement roll.' },
      };
    }

    const next = cloneState(state);
    const player = getActivePlayer(next);
    const currentLoc = LOCATION_MAP.get(player.locationId);
    const targetLoc = LOCATION_MAP.get(targetLocationId);

    if (!currentLoc || !targetLoc || !currentLoc.neighbors.includes(targetLocationId)) {
      return {
        state,
        error: { uk: 'Локація недосяжна з поточної позиції.', en: 'Location is not adjacent.' },
      };
    }

    const access = NavigationGraph.canAccessLocation(player, targetLocationId);
    if (!access.allowed) {
      return {
        state,
        error: access.reason ?? { uk: 'Маршрут закритий.', en: 'Route is locked.' },
      };
    }

    player.locationId = targetLoc.id;
    if (!player.visitedLocationIds.includes(targetLoc.id)) {
      player.visitedLocationIds.push(targetLoc.id);
    }
    next.movement!.pathTaken.push(targetLoc.id);
    next.movement!.stepsRemaining -= 1;

    if (next.movement!.stepsRemaining <= 0) {
      next.movement = null;
      next.turnPhase = 'ACTION';
      triggerArrivalOutcome(next, player);
    } else {
      next.turnCycleStep = 'movement';
      next.turnGuidance = {
        uk: `Крок 4: Переміщення через "${targetLoc.name.uk}". Залишилось кроків: ${next.movement!.stepsRemaining}.`,
        en: `Step 4: Passing through "${targetLoc.name.en}". Steps remaining: ${next.movement!.stepsRemaining}.`,
      };
      addChronicle(next, 'move', player.id, {
        uk: `4. ${player.name} проходить через "${targetLoc.name.uk}" (залишилось кроків: ${next.movement!.stepsRemaining}).`,
        en: `4. ${player.name} passes through "${targetLoc.name.en}" (steps left: ${next.movement!.stepsRemaining}).`,
      });
    }

    next.updatedAt = Date.now();
    return { state: next };
  },

  stopMovementEarly(state: GameState): EngineResult {
    if (state.phase !== 'PLAYING' || state.turnPhase !== 'MOVING' || !state.movement) {
      return { state, error: { uk: 'Немає активного руху.', en: 'Not currently moving.' } };
    }
    const next = cloneState(state);
    const player = getActivePlayer(next);
    const hero = HERO_MAP.get(player.heroId)!;
    const loc = LOCATION_MAP.get(player.locationId)!;
    const isObjectiveNode = Boolean(
      loc.isGateGuardianLair || loc.sealGuardianId || loc.isFinalBossLair || loc.id === 'loc_80' || loc.id === 'loc_81'
    );

    if (!hero.canTriggerMidwayEvents && !isObjectiveNode) {
      return {
        state,
        error: {
          uk: 'Події активуються лише на кінцевій локації маршруту (якщо інше не дозволено здібністю героя).',
          en: 'Events only trigger on the final destination unless allowed by a hero ability.',
        },
      };
    }

    next.movement = null;
    next.turnPhase = 'ACTION';
    triggerArrivalOutcome(next, player);
    next.updatedAt = Date.now();
    return { state: next };
  },

  moveToLocation(state: GameState, targetLocationId: string): EngineResult {
    if (state.phase !== 'PLAYING' || state.turnPhase !== 'ACTION') {
      return {
        state,
        error: { uk: 'Зараз неможливо рухатися.', en: 'Cannot move right now.' },
      };
    }

    const next = cloneState(state);
    const player = getActivePlayer(next);
    if (player.actionsRemaining <= 0) {
      return {
        state,
        error: { uk: 'Не залишилося дій у цьому ході.', en: 'No actions remaining this turn.' },
      };
    }

    const currentLoc = LOCATION_MAP.get(player.locationId);
    const targetLoc = LOCATION_MAP.get(targetLocationId);
    if (!currentLoc || !targetLoc || !currentLoc.neighbors.includes(targetLocationId)) {
      return {
        state,
        error: { uk: 'Локація недосяжна з поточної позиції.', en: 'Location is not adjacent to your position.' },
      };
    }

    const access = NavigationGraph.canAccessLocation(player, targetLocationId);
    if (!access.allowed) {
      return {
        state,
        error: access.reason ?? { uk: 'Маршрут закритий.', en: 'Route is locked.' },
      };
    }

    player.locationId = targetLoc.id;
    player.actionsRemaining -= 1;
    if (!player.visitedLocationIds.includes(targetLoc.id)) {
      player.visitedLocationIds.push(targetLoc.id);
    }

    addChronicle(next, 'move', player.id, {
      uk: `4. ${player.name} переходить до "${targetLoc.name.uk}".`,
      en: `4. ${player.name} travels to "${targetLoc.name.en}".`,
    });

    triggerArrivalOutcome(next, player);
    next.updatedAt = Date.now();
    return { state: next };
  },

  exploreLocation(state: GameState): EngineResult {
    if (state.phase !== 'PLAYING' || state.turnPhase !== 'ACTION') {
      return {
        state,
        error: { uk: 'Зараз неможливо досліджувати.', en: 'Cannot explore right now.' },
      };
    }

    const next = cloneState(state);
    const player = getActivePlayer(next);
    if (player.actionsRemaining <= 0) {
      return {
        state,
        error: { uk: 'Не залишилося дій у цьому ході.', en: 'No actions remaining.' },
      };
    }

    const loc = LOCATION_MAP.get(player.locationId)!;
    player.actionsRemaining -= 1;

    const drawnAdvCard = drawAdventureCardFromDeck(next);
    if (!drawnAdvCard) {
      const rngBefore = next.rngState;
      const roll = rollD6(next.rngState);
      next.rngState = roll.nextState;
      const bonusGold = 8 + loc.dangerLevel * 2;
      player.gold += bonusGold;
      const fallbackText: LocalizedText = {
        uk: `6. ${player.name} знаходить +${bonusGold} золота у "${loc.name.uk}" (d6=${roll.roll}).`,
        en: `6. ${player.name} uncovers +${bonusGold} Gold at "${loc.name.en}" (d6=${roll.roll}).`,
      };
      recordDiceRoll(next, player, 'encounter', roll.roll, 0, roll.roll, rngBefore, roll.nextState, fallbackText);
      addChronicle(next, 'card', player.id, fallbackText);
      syncTurnCycleActionGuidance(next);
      next.updatedAt = Date.now();
      return { state: next };
    }

    if (drawnAdvCard.category === 'enemy' && drawnAdvCard.effect.enemyProfile) {
      const ep = drawnAdvCard.effect.enemyProfile;
      next.combat = {
        enemyId: 'enemy_r1_wolf',
        enemyCardId: drawnAdvCard.id,
        enemyNameOverride: ep.name,
        enemyAttackOverride: ep.attack,
        enemyDefenseOverride: ep.defense,
        enemyGoldOverride: ep.goldReward,
        enemyXpOverride: ep.xpReward,
        enemyTraitOverride: ep.trait,
        enemyCurrentHp: ep.maxHp,
        enemyMaxHp: ep.maxHp,
        isDefending: false,
        roundCount: 1,
        lastPlayerRoll: null,
        lastEnemyRoll: null,
        combatPurpose: 'card_enemy',
      };
      next.turnPhase = 'COMBAT';
      next.turnCycleStep = 'encounter';
      next.turnGuidance = {
        uk: `Крок 6: Карта ворога «${drawnAdvCard.name.uk}»! Оберіть атаку, захист або відступ.`,
        en: `Step 6: Enemy card "${drawnAdvCard.name.en}"! Attack, defend, or flee.`,
      };
      addChronicle(next, 'combat', player.id, drawnAdvCard.logText);
    } else if (drawnAdvCard.category === 'adventure' && drawnAdvCard.effect.statCheck) {
      const sc = drawnAdvCard.effect.statCheck;
      const enc: ActiveEncounter = {
        id: `enc_${next.round}_${next.rngState}`,
        cardId: drawnAdvCard.id,
        title: drawnAdvCard.name,
        description: drawnAdvCard.description,
        statCheck: sc.stat,
        difficulty: sc.difficulty,
        rewardGold: sc.rewardGold ?? 0,
        rewardXp: sc.rewardXp ?? 1,
        rewardHeal: sc.healHp ?? 0,
        rewardCard: Boolean(sc.rewardCard),
        penaltyHp: sc.penaltyHp ?? 1,
        penaltyGold: sc.penaltyGold ?? 0,
        curseCardId: sc.curseCardId,
        resolved: false,
        fateRerollUsed: false,
      };
      next.encounter = enc;
      next.turnPhase = 'ENCOUNTER';
      next.turnCycleStep = 'encounter';
      next.turnGuidance = {
        uk: `Крок 6: Пригода «${drawnAdvCard.name.uk}»! Киньте d6 на перевірку (${sc.stat}).`,
        en: `Step 6: Adventure "${drawnAdvCard.name.en}"! Roll d6 for a ${sc.stat} check.`,
      };
      addChronicle(next, 'world', player.id, drawnAdvCard.logText);
    } else if (drawnAdvCard.category === 'curse') {
      attachCurseToPlayer(next, player, drawnAdvCard.id);
      syncTurnCycleActionGuidance(next);
    } else {
      // Event card: resolve immediately and move to adventureDiscardPile
      applyDirectCardEffect(next, player, drawnAdvCard);
      if (drawnAdvCard.id === 'card_126' || drawnAdvCard.id === 'card_135') {
        next.discardPile = [...next.discardPile, ...(next.marketCardIds ?? [])];
        next.marketCardIds = [];
        refillMarketStock(next, 4);
      }
      next.adventureDiscardPile = [...(next.adventureDiscardPile ?? []), drawnAdvCard.id];
      addChronicle(next, 'world', player.id, drawnAdvCard.logText);
      syncTurnCycleActionGuidance(next);
    }

    next.updatedAt = Date.now();
    return { state: next };
  },

  rollEncounterCheck(state: GameState): EngineResult {
    if (state.phase !== 'PLAYING' || state.turnPhase !== 'ENCOUNTER' || !state.encounter) {
      return { state, error: { uk: 'Немає активної події.', en: 'No active encounter.' } };
    }
    if (state.encounter.rollResult !== undefined) {
      return {
        state,
        error: {
          uk: 'Кубик для цієї перевірки вже кинуто. Підтвердіть результат або витратьте 1 Долю.',
          en: 'Dice already rolled for this check. Confirm result or spend 1 Fate.',
        },
      };
    }

    const next = cloneState(state);
    const player = getActivePlayer(next);
    const enc = next.encounter!;
    const eff = getPlayerEffectiveStats(player);
    const statBonus = eff[enc.statCheck];

    const rngBefore = next.rngState;
    const roll = rollD6(next.rngState);
    next.rngState = roll.nextState;

    const total = roll.roll + statBonus;
    enc.rollResult = roll.roll;
    enc.fateRerollUsed = false;

    const summary: LocalizedText = {
      uk: `Перевірка події (${enc.statCheck}): d6=${roll.roll} + ${statBonus} = ${total} проти ${enc.difficulty}.`,
      en: `Encounter check (${enc.statCheck}): d6=${roll.roll} + ${statBonus} = ${total} vs ${enc.difficulty}.`,
    };
    const rec = recordDiceRoll(
      next,
      player,
      'encounter',
      roll.roll,
      statBonus,
      total,
      rngBefore,
      roll.nextState,
      summary
    );
    enc.rollRecordId = rec.id;

    next.turnCycleStep = 'encounter';
    next.turnGuidance =
      player.fate > 0
        ? {
            uk: `Результат перевірки d6=${roll.roll} (разом ${total} проти ${enc.difficulty}). Підтвердіть результат або витратьте 1 Долю на одне перекидання.`,
            en: `Check d6=${roll.roll} (total ${total} vs ${enc.difficulty}). Confirm result or spend 1 Fate to reroll once.`,
          }
        : {
            uk: `Результат перевірки d6=${roll.roll} (разом ${total} проти ${enc.difficulty}). Натисніть «Підтвердити результат».`,
            en: `Check d6=${roll.roll} (total ${total} vs ${enc.difficulty}). Press "Confirm Result".`,
          };

    addChronicle(next, 'world', player.id, {
      uk: `${player.name}: ${summary.uk}`,
      en: `${player.name}: ${summary.en}`,
    });

    next.updatedAt = Date.now();
    return { state: next };
  },

  rerollEncounterCheck(state: GameState): EngineResult {
    if (state.phase !== 'PLAYING' || state.turnPhase !== 'ENCOUNTER' || !state.encounter) {
      return { state, error: { uk: 'Немає активної події.', en: 'No active encounter.' } };
    }
    if (state.encounter.rollResult === undefined) {
      return {
        state,
        error: { uk: 'Спочатку виконайте початковий кидок d6.', en: 'Roll d6 first before using Fate.' },
      };
    }

    const next = cloneState(state);
    const player = getActivePlayer(next);
    const enc = next.encounter!;

    if (enc.fateRerollUsed) {
      return {
        state,
        error: {
          uk: 'Долю вже використано для цього кидка — другий результат обов’язковий.',
          en: 'Fate has already been spent on this roll — the second result is mandatory.',
        },
      };
    }

    if (player.fate < 1) {
      return {
        state,
        error: { uk: 'Недостатньо очок Долі (0).', en: 'Not enough Fate points (0).' },
      };
    }

    const previousRoll = enc.rollResult ?? next.lastDiceRoll ?? 1;
    const eff = getPlayerEffectiveStats(player);
    const statBonus = eff[enc.statCheck];

    player.fate -= 1;
    const roll = rollD6(next.rngState);
    next.rngState = roll.nextState;
    next.lastDiceRoll = roll.roll;

    const total = roll.roll + statBonus;
    enc.rollResult = roll.roll;
    enc.fateRerollUsed = true;

    const summary: LocalizedText = {
      uk: `Доля (1 очко): перекидання перевірки ${previousRoll} → ${roll.roll} (+${statBonus} = ${total} проти ${enc.difficulty}). Другий результат обов’язковий.`,
      en: `Fate (1 pt): check reroll ${previousRoll} → ${roll.roll} (+${statBonus} = ${total} vs ${enc.difficulty}). Second result is mandatory.`,
    };

    if (next.diceHistory && enc.rollRecordId) {
      const idx = next.diceHistory.findIndex((r) => r.id === enc.rollRecordId);
      if (idx !== -1) {
        next.diceHistory[idx] = {
          ...next.diceHistory[idx],
          roll: roll.roll,
          total,
          rerolled: true,
          previousRoll,
          fateSpent: 1,
          rngAfter: roll.nextState,
          summary,
        };
      }
    }

    next.turnGuidance = {
      uk: `Використано 1 Долю: новий результат ${roll.roll} (разом ${total}) обов’язковий. Підтвердіть перевірку.`,
      en: `1 Fate spent: new result ${roll.roll} (total ${total}) is mandatory. Confirm result.`,
    };

    addChronicle(next, 'world', player.id, {
      uk: `${player.name}: ${summary.uk}`,
      en: `${player.name}: ${summary.en}`,
    });

    next.updatedAt = Date.now();
    return { state: next };
  },

  resolveEncounter(state: GameState): EngineResult {
    if (state.phase !== 'PLAYING' || state.turnPhase !== 'ENCOUNTER' || !state.encounter) {
      return { state, error: { uk: 'Немає активної події.', en: 'No active encounter.' } };
    }

    const next = cloneState(state);
    const player = getActivePlayer(next);
    const enc = next.encounter!;
    const eff = getPlayerEffectiveStats(player);
    const statBonus = eff[enc.statCheck];

    let rollValue: number;
    if (typeof enc.rollResult === 'number') {
      rollValue = enc.rollResult;
    } else {
      const rngBefore = next.rngState;
      const roll = rollD6(next.rngState);
      next.rngState = roll.nextState;
      rollValue = roll.roll;
      recordDiceRoll(
        next,
        player,
        'encounter',
        rollValue,
        statBonus,
        rollValue + statBonus,
        rngBefore,
        roll.nextState,
        {
          uk: `Перевірка події (${enc.statCheck}): d6=${rollValue} + ${statBonus} = ${rollValue + statBonus}.`,
          en: `Encounter check (${enc.statCheck}): d6=${rollValue} + ${statBonus} = ${rollValue + statBonus}.`,
        }
      );
    }

    const total = rollValue + statBonus;
    const succeeded = total >= enc.difficulty;

    if (succeeded) {
      player.gold += enc.rewardGold;
      const xpGain = enc.rewardXp ?? 1;
      player.experience += xpGain;
      if (enc.rewardHeal && enc.rewardHeal > 0) {
        player.hp = Math.min(HERO_STAT_LIMITS.maxHp, player.maxHp, player.hp + enc.rewardHeal);
      }
      const drawn = enc.rewardCard ? drawCardsFromDeck(next, player, 1) : [];
      addChronicle(next, 'card', player.id, {
        uk: `6. ${player.name} долає випробування (${rollValue}+${statBonus}=${total} проти ${enc.difficulty}): +${enc.rewardGold} з., +${xpGain} досвіду${enc.rewardHeal ? `, +${enc.rewardHeal} HP` : ''}${drawn.length ? ', +1 карта' : ''}.`,
        en: `6. ${player.name} passes check (${rollValue}+${statBonus}=${total} vs ${enc.difficulty}): +${enc.rewardGold}g, +${xpGain} XP${enc.rewardHeal ? `, +${enc.rewardHeal} HP` : ''}${drawn.length ? ', +1 card' : ''}.`,
      });
    } else {
      if (enc.penaltyHp > 0) {
        player.hp = Math.max(0, player.hp - enc.penaltyHp);
      }
      if (enc.penaltyGold && enc.penaltyGold > 0) {
        player.gold = Math.max(0, player.gold - enc.penaltyGold);
      }
      if (enc.curseCardId) {
        attachCurseToPlayer(next, player, enc.curseCardId);
      }
      addChronicle(next, 'world', player.id, {
        uk: `6. ${player.name} провалює перевірку (${rollValue}+${statBonus}=${total} проти ${enc.difficulty})${enc.penaltyHp > 0 ? `: -${enc.penaltyHp} HP` : ''}${enc.penaltyGold ? `, -${enc.penaltyGold} з.` : ''}.`,
        en: `6. ${player.name} fails check (${rollValue}+${statBonus}=${total} vs ${enc.difficulty})${enc.penaltyHp > 0 ? `: -${enc.penaltyHp} HP` : ''}${enc.penaltyGold ? `, -${enc.penaltyGold}g` : ''}.`,
      });
      handlePlayerDefeatIfNeeded(next, player);
    }

    if (enc.cardId) {
      next.adventureDiscardPile = [...(next.adventureDiscardPile ?? []), enc.cardId];
    }

    if (next.phase === 'PLAYING' && !player.isDefeated) {
      next.encounter = null;
      next.turnPhase = 'ACTION';
      syncTurnCycleActionGuidance(next);
    }
    next.updatedAt = Date.now();
    return { state: next };
  },

  restAtLocation(state: GameState): EngineResult {
    if (state.phase !== 'PLAYING' || state.turnPhase !== 'ACTION') {
      return { state, error: { uk: 'Зараз неможливо відпочивати.', en: 'Cannot rest right now.' } };
    }

    const next = cloneState(state);
    const player = getActivePlayer(next);
    if (player.actionsRemaining <= 0) {
      return { state, error: { uk: 'Немає дій у цьому ході.', en: 'No actions remaining.' } };
    }

    const loc = LOCATION_MAP.get(player.locationId)!;
    const healAmount = loc.terrain === 'sanctuary' || loc.terrain === 'village' ? 4 : 2;
    const beforeHp = player.hp;
    player.hp = Math.min(HERO_STAT_LIMITS.maxHp, player.maxHp, player.hp + healAmount);
    player.actionsRemaining -= 1;

    addChronicle(next, 'move', player.id, {
      uk: `${player.name} відпочиває в "${loc.name.uk}" і відновлює ${player.hp - beforeHp} HP.`,
      en: `${player.name} rests at "${loc.name.en}" and restores ${player.hp - beforeHp} HP.`,
    });

    syncTurnCycleActionGuidance(next);
    next.updatedAt = Date.now();
    return { state: next };
  },

  drawCardAction(state: GameState): EngineResult {
    if (state.phase !== 'PLAYING' || state.turnPhase !== 'ACTION') {
      return { state, error: { uk: 'Зараз не можна добрати карту.', en: 'Cannot draw card right now.' } };
    }

    const next = cloneState(state);
    const player = getActivePlayer(next);
    if (player.actionsRemaining <= 0) {
      return { state, error: { uk: 'Немає дій у цьому ході.', en: 'No actions remaining.' } };
    }
    if (player.hand.length >= MAX_HAND_SIZE) {
      return { state, error: { uk: 'Рука заповнена (макс. 7 карт).', en: 'Hand is full (max 7 cards).' } };
    }

    player.actionsRemaining -= 1;
    const drawn = drawCardsFromDeck(next, player, 1);
    if (drawn.length > 0) {
      const card = CARD_MAP.get(drawn[0])!;
      addChronicle(next, 'card', player.id, {
        uk: `${player.name} добирає карту "${card.name.uk}".`,
        en: `${player.name} draws "${card.name.en}".`,
      });
    }

    syncTurnCycleActionGuidance(next);
    next.updatedAt = Date.now();
    return { state: next };
  },

  buySupplyCard(state: GameState): EngineResult {
    if (state.phase !== 'PLAYING' || state.turnPhase !== 'ACTION') {
      return { state, error: { uk: 'Недоступно під час бою.', en: 'Unavailable during combat.' } };
    }
    const next = cloneState(state);
    const player = getActivePlayer(next);
    const loc = LOCATION_MAP.get(player.locationId)!;
    if (loc.terrain !== 'village' && loc.terrain !== 'sanctuary') {
      return {
        state,
        error: { uk: 'Купівля можлива лише в поселеннях та святилищах.', en: 'Supplies can only be bought in villages or sanctuaries.' },
      };
    }
    if (player.gold < 15) {
      return { state, error: { uk: 'Потрібно 15 золота.', en: 'Requires 15 Gold.' } };
    }
    if (player.hand.length >= MAX_HAND_SIZE) {
      return { state, error: { uk: 'Рука заповнена (макс. 7 карт).', en: 'Hand is full (max 7 cards).' } };
    }

    player.gold -= 15;
    const drawn = drawCardsFromDeck(next, player, 1);
    if (drawn.length > 0) {
      const card = CARD_MAP.get(drawn[0])!;
      addChronicle(next, 'card', player.id, {
        uk: `${player.name} купує спорядження "${card.name.uk}" за 15 золота.`,
        en: `${player.name} buys "${card.name.en}" for 15 Gold.`,
      });
    }
    next.updatedAt = Date.now();
    return { state: next };
  },

  buyMarketCard(state: GameState, cardId: string): EngineResult {
    if (state.phase !== 'PLAYING' || state.turnPhase !== 'ACTION') {
      return { state, error: { uk: 'Торгівля доступна лише в мирній фазі ходу.', en: 'Trading is only available during ACTION phase.' } };
    }
    const next = cloneState(state);
    const player = getActivePlayer(next);
    const loc = LOCATION_MAP.get(player.locationId)!;
    if (loc.terrain !== 'village' && loc.terrain !== 'sanctuary') {
      return {
        state,
        error: { uk: 'Торгувати можна лише в поселеннях або святилищах.', en: 'You can trade only at villages or sanctuaries.' },
      };
    }

    const stock = next.marketCardIds ?? [];
    const idx = stock.indexOf(cardId);
    if (idx === -1) {
      return { state, error: { uk: 'Цього товару немає на ринку.', en: 'Card is not on the market.' } };
    }

    const card = CARD_MAP.get(cardId);
    if (!card) {
      return { state, error: { uk: 'Невідома карта.', en: 'Unknown card.' } };
    }

    const cost = Math.max(4, card.goldCost);
    if (player.gold < cost) {
      return {
        state,
        error: { uk: `Недостатньо золота (потрібно ${cost} з.).`, en: `Not enough Gold (requires ${cost}g).` },
      };
    }

    if (card.category === 'companion') {
      const companions = player.companions ?? [];
      if (companions.length >= HERO_INVENTORY_LIMITS.maxCompanions) {
        return {
          state,
          error: {
            uk: 'Досягнуто ліміту супутників (макс. 3). Спершу відпустіть когось.',
            en: 'Companion limit reached (max 3). Dismiss a companion first.',
          },
        };
      }
      player.gold -= cost;
      player.companions = [...companions, card.id];
    } else if (player.hand.length < MAX_HAND_SIZE) {
      player.gold -= cost;
      player.hand.push(card.id);
    } else if (
      card.category !== 'spell' &&
      player.inventory.length < HERO_INVENTORY_LIMITS.maxOtherItems
    ) {
      player.gold -= cost;
      player.inventory.push(card.id);
    } else {
      return {
        state,
        error: {
          uk: 'Рука (7) та інвентар (6) заповнені.',
          en: 'Hand (7) and inventory (6) are full.',
        },
      };
    }

    stock.splice(idx, 1);
    next.marketCardIds = stock;
    refillMarketStock(next, 4);

    addChronicle(next, 'card', player.id, {
      uk: `${player.name} купує «${card.name.uk}» за ${cost} золота.`,
      en: `${player.name} buys "${card.name.en}" for ${cost} Gold.`,
    });
    next.updatedAt = Date.now();
    return { state: next };
  },

  sellCard(state: GameState, source: 'hand' | 'inventory', cardId: string): EngineResult {
    if (state.phase !== 'PLAYING' || state.turnPhase !== 'ACTION') {
      return { state, error: { uk: 'Продаж доступний лише поза боєм.', en: 'Selling is unavailable during combat.' } };
    }
    const next = cloneState(state);
    const player = getActivePlayer(next);
    const loc = LOCATION_MAP.get(player.locationId)!;
    if (loc.terrain !== 'village' && loc.terrain !== 'sanctuary') {
      return {
        state,
        error: { uk: 'Продавати карти можна лише в поселеннях або святилищах.', en: 'Items may be sold only in villages or sanctuaries.' },
      };
    }

    const list = source === 'hand' ? player.hand : player.inventory;
    const idx = list.indexOf(cardId);
    if (idx === -1) {
      return { state, error: { uk: 'Карту не знайдено.', en: 'Card not found.' } };
    }

    const card = CARD_MAP.get(cardId);
    if (!card) {
      return { state, error: { uk: 'Невідома карта.', en: 'Unknown card.' } };
    }

    list.splice(idx, 1);
    const sellPrice = Math.max(2, Math.floor(card.goldCost * 0.5));
    player.gold += sellPrice;
    next.discardPile.push(card.id);

    addChronicle(next, 'card', player.id, {
      uk: `${player.name} продає «${card.name.uk}» за ${sellPrice} золота.`,
      en: `${player.name} sells "${card.name.en}" for ${sellPrice} Gold.`,
    });
    next.updatedAt = Date.now();
    return { state: next };
  },

  refreshMarket(state: GameState): EngineResult {
    if (state.phase !== 'PLAYING' || state.turnPhase !== 'ACTION') {
      return { state, error: { uk: 'Недоступно під час бою.', en: 'Unavailable during combat.' } };
    }
    const next = cloneState(state);
    const player = getActivePlayer(next);
    const loc = LOCATION_MAP.get(player.locationId)!;
    if (loc.terrain !== 'village' && loc.terrain !== 'sanctuary') {
      return {
        state,
        error: { uk: 'Оновити товари можна лише в поселеннях і святилищах.', en: 'Market can only be refreshed in villages or sanctuaries.' },
      };
    }
    if (player.gold < 5) {
      return { state, error: { uk: 'Потрібно 5 золота.', en: 'Requires 5 Gold.' } };
    }

    player.gold -= 5;
    next.discardPile.push(...(next.marketCardIds ?? []));
    next.marketCardIds = [];
    refillMarketStock(next, 4);

    addChronicle(next, 'card', player.id, {
      uk: `${player.name} оновлює прилавок торговця за 5 золота.`,
      en: `${player.name} refreshes merchant wares for 5 Gold.`,
    });
    next.updatedAt = Date.now();
    return { state: next };
  },

  healAtSanctuary(state: GameState): EngineResult {
    if (state.phase !== 'PLAYING' || state.turnPhase !== 'ACTION') {
      return { state, error: { uk: 'Лікування доступне лише поза боєм.', en: 'Healer is unavailable during combat.' } };
    }
    const next = cloneState(state);
    const player = getActivePlayer(next);
    const loc = LOCATION_MAP.get(player.locationId)!;
    if (loc.terrain !== 'village' && loc.terrain !== 'sanctuary') {
      return {
        state,
        error: { uk: 'Знахар приймає лише в поселеннях і святилищах.', en: 'Healers operate only in villages and sanctuaries.' },
      };
    }
    if (player.hp >= HERO_STAT_LIMITS.maxHp) {
      return { state, error: { uk: 'Здоров’я уже повне.', en: 'HP is already full.' } };
    }
    if (player.gold < 8) {
      return { state, error: { uk: 'Лікування коштує 8 золота.', en: 'Healing costs 8 Gold.' } };
    }

    player.gold -= 8;
    const before = player.hp;
    player.hp = Math.min(HERO_STAT_LIMITS.maxHp, player.maxHp, player.hp + 4);
    const gained = player.hp - before;

    addChronicle(next, 'world', player.id, {
      uk: `${player.name} отримує лікування в "${loc.name.uk}" за 8 золота (+${gained} HP).`,
      en: `${player.name} receives healing at "${loc.name.en}" for 8 Gold (+${gained} HP).`,
    });
    next.updatedAt = Date.now();
    return { state: next };
  },

  cleanseCurseAtShrine(state: GameState, curseCardId?: string): EngineResult {
    if (state.phase !== 'PLAYING' || state.turnPhase !== 'ACTION') {
      return { state, error: { uk: 'Очищення недоступне під час бою.', en: 'Purification unavailable during combat.' } };
    }
    const next = cloneState(state);
    const player = getActivePlayer(next);
    const loc = LOCATION_MAP.get(player.locationId)!;
    if (loc.terrain !== 'sanctuary' && loc.terrain !== 'shrine' && loc.terrain !== 'village') {
      return {
        state,
        error: {
          uk: 'Зняти прокляття за золото можна у Святилищі, Храмі або Поселенні.',
          en: 'Paid purification is available at Sanctuaries, Shrines, or Villages.',
        },
      };
    }
    const curses = player.curses ?? [];
    if (curses.length === 0) {
      return { state, error: { uk: 'На героєві немає активних проклять.', en: 'No active curses to remove.' } };
    }
    if (player.gold < 12) {
      return { state, error: { uk: 'Обряд очищення коштує 12 золота.', en: 'Purification rite costs 12 Gold.' } };
    }

    player.gold -= 12;
    const removed = removeCurseFromPlayer(next, player, curseCardId);
    addChronicle(next, 'seal', player.id, {
      uk: `${player.name} знімає прокляття ${removed ? `«${removed.name.uk}»` : ''} у "${loc.name.uk}" за 12 золота.`,
      en: `${player.name} cleanses ${removed ? `"${removed.name.en}"` : 'a curse'} at "${loc.name.en}" for 12 Gold.`,
    });
    next.updatedAt = Date.now();
    return { state: next };
  },

  useHeroAbility(state: GameState): EngineResult {
    if (state.phase !== 'PLAYING') {
      return { state, error: { uk: 'Гра не активна.', en: 'Game is not active.' } };
    }

    const next = cloneState(state);
    const player = getActivePlayer(next);
    if (player.abilityUsedThisTurn) {
      return { state, error: { uk: 'Здібність уже використано в цьому ході.', en: 'Hero ability already used this turn.' } };
    }

    const hero = HERO_MAP.get(player.heroId)!;
    player.abilityUsedThisTurn = true;

    const dealCombatDamage = (dmg: number) => {
      if (next.combat) {
        next.combat.enemyCurrentHp = Math.max(0, next.combat.enemyCurrentHp - dmg);
        if (next.combat.enemyCurrentHp === 0) {
          resolveCombatVictory(next, player, next.combat);
        }
        return true;
      }
      return false;
    };

    switch (hero.abilityType) {
      case 'warrior_surge':
        player.tempAttackBonus += 2;
        player.tempDefenseBonus += 1;
        break;
      case 'mage_focus':
        drawCardsFromDeck(next, player, 2);
        dealCombatDamage(2);
        break;
      case 'archer_precision':
        if (!dealCombatDamage(2)) {
          player.tempAttackBonus += 2;
        }
        break;
      case 'paladin_bulwark':
        player.hp = Math.min(HERO_STAT_LIMITS.maxHp, player.maxHp, player.hp + 2);
        player.tempDefenseBonus += 2;
        break;
      case 'rogue_shadow':
        player.actionsRemaining += 1;
        player.gold += 5;
        break;
      case 'barbarian_rage':
        player.hp = Math.max(1, player.hp - 1);
        player.tempAttackBonus += 3;
        break;
      case 'druid_renewal':
        player.hp = Math.min(HERO_STAT_LIMITS.maxHp, player.maxHp, player.hp + 2);
        player.tempDefenseBonus += 1;
        drawCardsFromDeck(next, player, 1);
        break;
      case 'necromancer_harvest':
        player.hp = Math.max(1, player.hp - 1);
        player.tempAttackBonus += 2;
        drawCardsFromDeck(next, player, 2);
        break;
      case 'demon_hunter_brand':
        if (!dealCombatDamage(3)) {
          player.tempAttackBonus += 2;
        }
        break;
      case 'elven_blade_dance':
        player.tempAttackBonus += 2;
        player.tempDefenseBonus += 1;
        drawCardsFromDeck(next, player, 1);
        break;
      case 'sorceress_starfire':
        if (next.combat) {
          player.tempAttackBonus += 2;
          dealCombatDamage(2);
        } else {
          player.actionsRemaining += 1;
          player.tempDefenseBonus += 1;
        }
        break;
      case 'alchemist_brew':
        player.hp = Math.min(HERO_STAT_LIMITS.maxHp, player.maxHp, player.hp + 2);
        player.gold += 4;
        drawCardsFromDeck(next, player, 1);
        break;
    }

    addChronicle(next, 'card', player.id, {
      uk: `${player.name} активує здібність "${hero.abilityName.uk}".`,
      en: `${player.name} activates "${hero.abilityName.en}".`,
    });

    next.updatedAt = Date.now();
    return { state: next };
  },

  upgradeStat(state: GameState, stat: 'strength' | 'intellect'): EngineResult {
    if (state.phase !== 'PLAYING') {
      return { state, error: { uk: 'Гра не активна.', en: 'Game is not active.' } };
    }

    const next = cloneState(state);
    const player = getActivePlayer(next);
    if (player.experience < HERO_STAT_LIMITS.xpPerStatUpgrade) {
      return {
        state,
        error: {
          uk: `Потрібно щонайменше ${HERO_STAT_LIMITS.xpPerStatUpgrade} очки досвіду для підвищення характеристики.`,
          en: `Requires at least ${HERO_STAT_LIMITS.xpPerStatUpgrade} XP to upgrade a stat.`,
        },
      };
    }

    const cap = stat === 'strength' ? HERO_STAT_LIMITS.maxStrength : HERO_STAT_LIMITS.maxIntellect;
    if (player[stat] >= cap) {
      return {
        state,
        error: {
          uk: `Характеристика вже досягла максимуму (${cap}).`,
          en: `Stat is already at maximum (${cap}).`,
        },
      };
    }

    player.experience -= HERO_STAT_LIMITS.xpPerStatUpgrade;
    player[stat] = Math.min(cap, player[stat] + 1);

    addChronicle(next, 'system', player.id, {
      uk: `${player.name} витрачає 3 очки досвіду і підвищує ${stat === 'strength' ? 'Силу' : 'Інтелект'} до ${player[stat]}.`,
      en: `${player.name} spends 3 XP to raise ${stat === 'strength' ? 'Strength' : 'Intellect'} to ${player[stat]}.`,
    });

    next.updatedAt = Date.now();
    return { state: next };
  },

  playCard(state: GameState, cardId: string): EngineResult {
    if (state.phase !== 'PLAYING') {
      return { state, error: { uk: 'Гра не активна.', en: 'Game is not active.' } };
    }

    const next = cloneState(state);
    const player = getActivePlayer(next);
    const handIdx = player.hand.indexOf(cardId);
    if (handIdx === -1) {
      return { state, error: { uk: 'Карта відсутня у руці.', en: 'Card not found in hand.' } };
    }

    const card = CARD_MAP.get(cardId);
    if (!card) {
      return { state, error: { uk: 'Невідома карта.', en: 'Unknown card.' } };
    }

    if (card.combatOnly && next.turnPhase !== 'COMBAT') {
      return {
        state,
        error: { uk: 'Цю карту можна застосувати лише в бою.', en: 'This card can only be played in combat.' },
      };
    }

    // Companion recruitment (max 3)
    if (card.category === 'companion') {
      const companions = player.companions ?? [];
      if (companions.length >= HERO_INVENTORY_LIMITS.maxCompanions) {
        return {
          state,
          error: {
            uk: 'У загоні вже максимум супутників (3/3). Спершу відпустіть когось.',
            en: 'Companion limit reached (3/3). Dismiss one before recruiting.',
          },
        };
      }
      player.hand.splice(handIdx, 1);
      player.companions = [...companions, card.id];
      addChronicle(next, 'card', player.id, card.logText);
      next.updatedAt = Date.now();
      return { state: next };
    }

    // Equipment cards (max 1 primary weapon, 1 armor)
    if (card.equipSlot) {
      const prevEquipped = player.equipment[card.equipSlot];
      if (prevEquipped && player.inventory.length >= HERO_INVENTORY_LIMITS.maxOtherItems) {
        return {
          state,
          error: {
            uk: 'Інвентар заповнений (6/6 предметів). Звільніть місце перед заміною спорядження.',
            en: 'Inventory is full (6/6 items). Free a slot before swapping gear.',
          },
        };
      }
      player.hand.splice(handIdx, 1);
      if (prevEquipped) {
        player.inventory.push(prevEquipped);
      }
      player.equipment[card.equipSlot] = card.id;
      addChronicle(next, 'card', player.id, card.logText);
      next.updatedAt = Date.now();
      return { state: next };
    }

    // Consumable item, spell, or instant artifact
    player.hand.splice(handIdx, 1);
    applyDirectCardEffect(next, player, card);
    next.discardPile.push(card.id);
    addChronicle(next, 'card', player.id, card.logText);

    if (next.combat && next.combat.enemyCurrentHp <= 0) {
      resolveCombatVictory(next, player, next.combat);
    }

    next.updatedAt = Date.now();
    return { state: next };
  },

  storeCardInInventory(state: GameState, cardId: string): EngineResult {
    if (state.phase !== 'PLAYING') {
      return { state, error: { uk: 'Гра не активна.', en: 'Game is not active.' } };
    }
    const next = cloneState(state);
    const player = getActivePlayer(next);
    const handIdx = player.hand.indexOf(cardId);
    if (handIdx === -1) {
      return { state, error: { uk: 'Карту не знайдено в руці.', en: 'Card not found in hand.' } };
    }
    const card = CARD_MAP.get(cardId);
    if (!card || card.category === 'spell' || card.category === 'companion') {
      return {
        state,
        error: {
          uk: 'У сумку предметів можна покласти лише предмети, зброю, обладунки або артефакти.',
          en: 'Only items, weapons, armor, or artifacts can be stored in inventory.',
        },
      };
    }
    if (player.inventory.length >= HERO_INVENTORY_LIMITS.maxOtherItems) {
      return {
        state,
        error: {
          uk: 'Сумка предметів заповнена (макс. 6 предметів).',
          en: 'Inventory bag is full (max 6 items).',
        },
      };
    }

    player.hand.splice(handIdx, 1);
    player.inventory.push(card.id);
    addChronicle(next, 'card', player.id, {
      uk: `${player.name} прибирає в інвентар «${card.name.uk}» (${player.inventory.length}/6).`,
      en: `${player.name} stores "${card.name.en}" in inventory (${player.inventory.length}/6).`,
    });
    next.updatedAt = Date.now();
    return { state: next };
  },

  useInventoryItem(state: GameState, cardId: string): EngineResult {
    if (state.phase !== 'PLAYING') {
      return { state, error: { uk: 'Гра не активна.', en: 'Game is not active.' } };
    }
    const next = cloneState(state);
    const player = getActivePlayer(next);
    const invIdx = player.inventory.indexOf(cardId);
    if (invIdx === -1) {
      return { state, error: { uk: 'Предмет не знайдено в інвентарі.', en: 'Item not found in inventory.' } };
    }
    const card = CARD_MAP.get(cardId);
    if (!card || card.equipSlot) {
      return { state, error: { uk: 'Цей предмет спершу потрібно екіпірувати.', en: 'Equip this gear instead of consuming it.' } };
    }
    if (card.combatOnly && next.turnPhase !== 'COMBAT') {
      return {
        state,
        error: { uk: 'Цей предмет застосовується лише в бою.', en: 'This item can only be used in combat.' },
      };
    }

    player.inventory.splice(invIdx, 1);
    applyDirectCardEffect(next, player, card);
    next.discardPile.push(card.id);
    addChronicle(next, 'card', player.id, card.logText);

    if (next.combat && next.combat.enemyCurrentHp <= 0) {
      resolveCombatVictory(next, player, next.combat);
    }

    next.updatedAt = Date.now();
    return { state: next };
  },

  discardHandCard(state: GameState, cardId: string): EngineResult {
    if (state.phase !== 'PLAYING') {
      return { state, error: { uk: 'Гра не активна.', en: 'Game is not active.' } };
    }
    const next = cloneState(state);
    const player = getActivePlayer(next);
    const idx = player.hand.indexOf(cardId);
    if (idx === -1) {
      return { state, error: { uk: 'Карти немає в руці.', en: 'Card not in hand.' } };
    }
    const card = CARD_MAP.get(cardId);
    player.hand.splice(idx, 1);
    next.discardPile.push(cardId);
    addChronicle(next, 'card', player.id, {
      uk: `${player.name} скидає карту ${card ? `«${card.name.uk}»` : cardId}.`,
      en: `${player.name} discards ${card ? `"${card.name.en}"` : cardId}.`,
    });
    next.updatedAt = Date.now();
    return { state: next };
  },

  discardInventoryItem(state: GameState, cardId: string): EngineResult {
    if (state.phase !== 'PLAYING') {
      return { state, error: { uk: 'Гра не активна.', en: 'Game is not active.' } };
    }
    const next = cloneState(state);
    const player = getActivePlayer(next);
    const idx = player.inventory.indexOf(cardId);
    if (idx === -1) {
      return { state, error: { uk: 'Предмета немає в інвентарі.', en: 'Item not in inventory.' } };
    }
    const card = CARD_MAP.get(cardId);
    player.inventory.splice(idx, 1);
    next.discardPile.push(cardId);
    addChronicle(next, 'card', player.id, {
      uk: `${player.name} викидає з інвентарю ${card ? `«${card.name.uk}»` : cardId}.`,
      en: `${player.name} drops ${card ? `"${card.name.en}"` : cardId} from inventory.`,
    });
    next.updatedAt = Date.now();
    return { state: next };
  },

  dismissCompanion(state: GameState, cardId: string): EngineResult {
    if (state.phase !== 'PLAYING') {
      return { state, error: { uk: 'Гра не активна.', en: 'Game is not active.' } };
    }
    const next = cloneState(state);
    const player = getActivePlayer(next);
    const companions = player.companions ?? [];
    const idx = companions.indexOf(cardId);
    if (idx === -1) {
      return { state, error: { uk: 'Супутника не знайдено.', en: 'Companion not found.' } };
    }
    const card = CARD_MAP.get(cardId);
    companions.splice(idx, 1);
    player.companions = companions;
    next.discardPile.push(cardId);
    addChronicle(next, 'card', player.id, {
      uk: `${player.name} відпускає супутника ${card ? `«${card.name.uk}»` : cardId}.`,
      en: `${player.name} dismisses companion ${card ? `"${card.name.en}"` : cardId}.`,
    });
    next.updatedAt = Date.now();
    return { state: next };
  },

  equipFromInventory(state: GameState, cardId: string): EngineResult {
    if (state.phase !== 'PLAYING') {
      return { state, error: { uk: 'Гра не активна.', en: 'Game is not active.' } };
    }
    const next = cloneState(state);
    const player = getActivePlayer(next);
    const invIdx = player.inventory.indexOf(cardId);
    if (invIdx === -1) {
      return { state, error: { uk: 'Предмет не знайдено в інвентарі.', en: 'Item not in inventory.' } };
    }
    const card = CARD_MAP.get(cardId);
    if (!card || !card.equipSlot) {
      return { state, error: { uk: 'Цей предмет неможливо екіпірувати.', en: 'Item cannot be equipped.' } };
    }

    player.inventory.splice(invIdx, 1);
    const prev = player.equipment[card.equipSlot];
    if (prev) player.inventory.push(prev);
    player.equipment[card.equipSlot] = card.id;

    addChronicle(next, 'card', player.id, {
      uk: `${player.name} одягає з інвентарю "${card.name.uk}".`,
      en: `${player.name} equips "${card.name.en}" from inventory.`,
    });
    next.updatedAt = Date.now();
    return { state: next };
  },

  unequipSlot(state: GameState, slot: EquipSlot): EngineResult {
    if (state.phase !== 'PLAYING') {
      return { state, error: { uk: 'Гра не активна.', en: 'Game is not active.' } };
    }
    const next = cloneState(state);
    const player = getActivePlayer(next);
    const current = player.equipment[slot];
    if (!current) {
      return { state, error: { uk: 'Слот уже порожній.', en: 'Slot is already empty.' } };
    }
    if (player.inventory.length >= HERO_INVENTORY_LIMITS.maxOtherItems) {
      return {
        state,
        error: {
          uk: 'Інвентар заповнений (6/6). Немає місця для знятого спорядження.',
          en: 'Inventory full (6/6). No room for unequipped gear.',
        },
      };
    }
    player.equipment[slot] = null;
    player.inventory.push(current);
    next.updatedAt = Date.now();
    return { state: next };
  },

  challengeSealGuardian(state: GameState): EngineResult {
    if (state.phase !== 'PLAYING' || state.turnPhase !== 'ACTION') {
      return { state, error: { uk: 'Неможливо зараз.', en: 'Unavailable right now.' } };
    }
    const next = cloneState(state);
    const player = getActivePlayer(next);
    const loc = LOCATION_MAP.get(player.locationId)!;
    if (!loc.sealGuardianId || !loc.sealReward) {
      return { state, error: { uk: 'Тут немає Вартового Печатки.', en: 'No Seal Guardian here.' } };
    }
    if (player.seals.includes(loc.sealReward)) {
      return { state, error: { uk: 'Цю Печатку вже здобуто.', en: 'This Seal is already claimed.' } };
    }

    const enemy = ENEMY_MAP.get(loc.sealGuardianId)!;
    next.combat = {
      enemyId: enemy.id,
      enemyCurrentHp: enemy.maxHp,
      enemyMaxHp: enemy.maxHp,
      isDefending: false,
      roundCount: 1,
      lastPlayerRoll: null,
      lastEnemyRoll: null,
      combatPurpose: 'seal_guardian',
    };
    next.turnPhase = 'COMBAT';
    next.turnCycleStep = 'encounter';
    next.turnGuidance = {
      uk: `Крок 6: Бій із Вартовим Печатки "${enemy.name.uk}"!`,
      en: `Step 6: Combat with Seal Guardian "${enemy.name.en}"!`,
    };
    addChronicle(next, 'seal', player.id, {
      uk: `${player.name} кидає виклик Вартовому Печатки: "${enemy.name.uk}"!`,
      en: `${player.name} challenges "${enemy.name.en}"!`,
    });
    next.updatedAt = Date.now();
    return { state: next };
  },

  attemptFinalTrial(state: GameState): EngineResult {
    if (state.phase !== 'PLAYING' || state.turnPhase !== 'ACTION') {
      return { state, error: { uk: 'Неможливо зараз.', en: 'Unavailable right now.' } };
    }
    const next = cloneState(state);
    const player = getActivePlayer(next);
    if (player.seals.length < 3) {
      return {
        state,
        error: { uk: 'Спочатку зберіть усі 3 Печатки.', en: 'Collect all 3 Seals first.' },
      };
    }
    if (player.finalTrialsPassed >= 3) {
      return {
        state,
        error: { uk: 'Усі 3 фінальні випробування вже пройдено.', en: 'All 3 Final Trials already passed.' },
      };
    }
    if (player.actionsRemaining <= 0) {
      return { state, error: { uk: 'Немає дій у цьому ході.', en: 'No actions remaining.' } };
    }

    const loc = LOCATION_MAP.get(player.locationId)!;
    if (loc.regionId !== 'reg_abyssal_citadel' && loc.terrain !== 'shrine') {
      return {
        state,
        error: {
          uk: 'Фінальні випробування проходять у Святилищах або в Безодні Цитаделі.',
          en: 'Final Trials must be attempted at a Shrine or inside the Abyssal Citadel.',
        },
      };
    }

    player.actionsRemaining -= 1;
    const eff = getPlayerEffectiveStats(player);
    const bestStat = Math.max(eff.strength, eff.intellect, eff.fate);
    const rngBefore = next.rngState;
    const roll = rollD6(next.rngState);
    next.rngState = roll.nextState;
    const total = roll.roll + bestStat;

    if (total >= 7) {
      player.finalTrialsPassed += 1;
      player.experience += 1;
      const passText: LocalizedText = {
        uk: `${player.name} проходить Фінальне випробування ${player.finalTrialsPassed}/3 (d6=${roll.roll}+${bestStat}=${total}, +1 досвіду).`,
        en: `${player.name} passes Final Trial ${player.finalTrialsPassed}/3 (d6=${roll.roll}+${bestStat}=${total}, +1 XP).`,
      };
      recordDiceRoll(next, player, 'final_trial', roll.roll, bestStat, total, rngBefore, roll.nextState, passText);
      addChronicle(next, 'trial', player.id, passText);
    } else {
      player.hp = Math.max(0, player.hp - 1);
      const failText: LocalizedText = {
        uk: `${player.name} не долає Фінальне випробування (${roll.roll}+${bestStat}=${total} < 7) і втрачає 1 HP.`,
        en: `${player.name} fails Final Trial (${roll.roll}+${bestStat}=${total} < 7) and loses 1 HP.`,
      };
      recordDiceRoll(next, player, 'final_trial', roll.roll, bestStat, total, rngBefore, roll.nextState, failText);
      addChronicle(next, 'trial', player.id, failText);
      handlePlayerDefeatIfNeeded(next, player);
    }

    if (next.phase === 'PLAYING' && !player.isDefeated) {
      syncTurnCycleActionGuidance(next);
    }
    next.updatedAt = Date.now();
    return { state: next };
  },

  challengeGateGuardian(state: GameState): EngineResult {
    if (state.phase !== 'PLAYING' || state.turnPhase !== 'ACTION') {
      return { state, error: { uk: 'Неможливо зараз.', en: 'Unavailable right now.' } };
    }
    const next = cloneState(state);
    const player = getActivePlayer(next);
    const loc = LOCATION_MAP.get(player.locationId)!;
    if (!loc.isGateGuardianLair) {
      return { state, error: { uk: 'Охоронець Брами стоїть у loc_42.', en: 'Gate Guardian awaits at loc_42.' } };
    }
    if (player.gateGuardianDefeated) {
      return { state, error: { uk: 'Охоронця Брами вже переможено.', en: 'Gate Guardian already defeated.' } };
    }

    const enemy = ENEMY_MAP.get('enemy_gate_guardian')!;
    next.combat = {
      enemyId: enemy.id,
      enemyCurrentHp: enemy.maxHp,
      enemyMaxHp: enemy.maxHp,
      isDefending: false,
      roundCount: 1,
      lastPlayerRoll: null,
      lastEnemyRoll: null,
      combatPurpose: 'gate_guardian',
    };
    next.turnPhase = 'COMBAT';
    next.turnCycleStep = 'encounter';
    next.turnGuidance = {
      uk: `Крок 6: Бій із Охоронцем Брами "${enemy.name.uk}"!`,
      en: `Step 6: Combat with Gate Guardian "${enemy.name.en}"!`,
    };
    addChronicle(next, 'trial', player.id, {
      uk: `${player.name} кидає виклик Охоронцю Брами: "${enemy.name.uk}"!`,
      en: `${player.name} challenges "${enemy.name.en}"!`,
    });
    next.updatedAt = Date.now();
    return { state: next };
  },

  challengeCitadelGuardian(state: GameState): EngineResult {
    if (state.phase !== 'PLAYING' || state.turnPhase !== 'ACTION') {
      return { state, error: { uk: 'Неможливо зараз.', en: 'Unavailable right now.' } };
    }
    const next = cloneState(state);
    const player = getActivePlayer(next);
    const loc = LOCATION_MAP.get(player.locationId)!;

    let enemyId: string | null = null;
    if (loc.id === 'loc_80') enemyId = 'enemy_citadel_sentinel';
    if (loc.id === 'loc_81') enemyId = 'enemy_citadel_inquisitor';

    if (!enemyId) {
      return {
        state,
        error: {
          uk: 'Вартові Цитаделі стоять у локаціях loc_80 та loc_81.',
          en: 'Citadel Guardians await at Iron Seraph Bastion (loc_80) and Abyss Inquisitor Hall (loc_81).',
        },
      };
    }
    if (player.seals.length < 3 || player.finalTrialsPassed < 3) {
      return {
        state,
        error: {
          uk: 'Потрібні 3 Печатки та 3 пройдених фінальних випробування.',
          en: 'Requires all 3 Seals and 3 passed Final Trials.',
        },
      };
    }
    if (player.citadelGuardiansDefeated >= 2) {
      return { state, error: { uk: 'Обидва Вартові Цитаделі вже подолані.', en: 'Both Citadel Guardians are already defeated.' } };
    }
    if ((player.defeatedCitadelGuardianIds ?? []).includes(enemyId)) {
      return {
        state,
        error: {
          uk: 'Цей Вартовий Цитаделі вже переможений. Шукайте іншого у сусідній вежі.',
          en: 'This Citadel Guardian is already defeated. Seek the other guardian.',
        },
      };
    }

    const enemy = ENEMY_MAP.get(enemyId)!;
    next.combat = {
      enemyId: enemy.id,
      enemyCurrentHp: enemy.maxHp,
      enemyMaxHp: enemy.maxHp,
      isDefending: false,
      roundCount: 1,
      lastPlayerRoll: null,
      lastEnemyRoll: null,
      combatPurpose: 'citadel_guardian',
    };
    next.turnPhase = 'COMBAT';
    next.turnCycleStep = 'encounter';
    next.turnGuidance = {
      uk: `Крок 6: Бій із Вартовим Цитаделі "${enemy.name.uk}"!`,
      en: `Step 6: Combat with Citadel Guardian "${enemy.name.en}"!`,
    };
    addChronicle(next, 'trial', player.id, {
      uk: `${player.name} вступає в бій із "${enemy.name.uk}"!`,
      en: `${player.name} engages "${enemy.name.en}"!`,
    });
    next.updatedAt = Date.now();
    return { state: next };
  },

  challengeVoidLord(state: GameState): EngineResult {
    if (state.phase !== 'PLAYING' || state.turnPhase !== 'ACTION') {
      return { state, error: { uk: 'Неможливо зараз.', en: 'Unavailable right now.' } };
    }
    const next = cloneState(state);
    const player = getActivePlayer(next);
    const loc = LOCATION_MAP.get(player.locationId)!;

    if (!loc.isFinalBossLair) {
      return {
        state,
        error: { uk: 'Володар Порожнечі чекає на Троні Порожнечі.', en: 'The Lord of the Void awaits at the Throne of the Void.' },
      };
    }
    if (
      player.seals.length < 3 ||
      player.finalTrialsPassed < 3 ||
      player.citadelGuardiansDefeated < 2
    ) {
      return {
        state,
        error: {
          uk: 'Потрібно: 3 Печатки, 3 фінальні випробування та перемога над 2 Вартовими Цитаделі.',
          en: 'Requires 3 Seals, 3 Final Trials, and 2 defeated Citadel Guardians.',
        },
      };
    }

    const boss = ENEMY_MAP.get('enemy_void_lord')!;
    next.combat = {
      enemyId: boss.id,
      enemyCurrentHp: boss.maxHp,
      enemyMaxHp: boss.maxHp,
      isDefending: false,
      roundCount: 1,
      lastPlayerRoll: null,
      lastEnemyRoll: null,
      combatPurpose: 'void_lord',
    };
    next.turnPhase = 'COMBAT';
    next.turnCycleStep = 'encounter';
    next.turnGuidance = {
      uk: 'Крок 6: Фінальна битва проти Володаря Порожнечі!',
      en: 'Step 6: Final battle against the Lord of the Void!',
    };
    addChronicle(next, 'seal', player.id, {
      uk: `${player.name} розпочинає фінальну битву з Володарем Порожнечі!`,
      en: `${player.name} begins the final battle against the Lord of the Void!`,
    });
    next.updatedAt = Date.now();
    return { state: next };
  },

  combatAttack(state: GameState): EngineResult {
    if (state.phase !== 'PLAYING' || state.turnPhase !== 'COMBAT' || !state.combat) {
      return { state, error: { uk: 'Зараз немає активного бою.', en: 'No active combat.' } };
    }

    const next = cloneState(state);
    const player = getActivePlayer(next);
    const combat = next.combat!;
    const enemy = resolveCombatEnemyStats(combat);
    const eff = getPlayerEffectiveStats(player);

    const rngBefore = next.rngState;
    const playerRoll = rollD6(next.rngState);
    next.rngState = playerRoll.nextState;
    const enemyRoll = rollD6(next.rngState);
    next.rngState = enemyRoll.nextState;

    combat.lastPlayerRoll = playerRoll.roll;
    combat.lastEnemyRoll = enemyRoll.roll;

    const loc = LOCATION_MAP.get(player.locationId)!;
    const timeMod =
      next.timeOfDay === 'night' || next.timeOfDay === 'dusk' ? loc.nightEffect : loc.dayEffect;
    const weatherLocMod = loc.weatherModifiers[next.weather]?.combatMod ?? 0;

    const combatStat = Math.max(eff.strength, eff.intellect);
    const gearAtk = computeEquipmentCombatAttack(player);
    const playerMod = combatStat + player.tempAttackBonus + gearAtk + timeMod.attackMod;
    const playerPower = playerRoll.roll + playerMod;
    const worldMod = getWorldEnemyAttackMod(next);
    const enemyPower = enemyRoll.roll + enemy.attack + worldMod;
    const weatherDef = WEATHER_MODIFIERS[next.weather].defenseMod + weatherLocMod + timeMod.defenseMod;
    const totalDefense = eff.armor + player.tempDefenseBonus + weatherDef + (combat.isDefending ? 2 : 0);

    recordDiceRoll(
      next,
      player,
      'combat_attack',
      playerRoll.roll,
      playerMod,
      playerPower,
      rngBefore,
      playerRoll.nextState,
      {
        uk: `Бій з "${enemy.name.uk}": герой d6=${playerRoll.roll} (${playerPower}) проти ворога ${enemyPower}.`,
        en: `Combat vs "${enemy.name.en}": hero d6=${playerRoll.roll} (${playerPower}) vs enemy ${enemyPower}.`,
      }
    );

    if (playerPower >= enemyPower) {
      const damageToEnemy = Math.max(2, playerPower - enemy.defense);
      combat.enemyCurrentHp = Math.max(0, combat.enemyCurrentHp - damageToEnemy);
      addChronicle(next, 'combat', player.id, {
        uk: `${player.name} перемагає в зіткненні (d6=${playerRoll.roll}+${playerMod}=${playerPower} проти ${enemyPower}) і завдає ${damageToEnemy} шкоди "${enemy.name.uk}".`,
        en: `${player.name} wins clash (d6=${playerRoll.roll}+${playerMod}=${playerPower} vs ${enemyPower}) dealing ${damageToEnemy} damage to "${enemy.name.en}".`,
      });

      if (combat.enemyCurrentHp <= 0) {
        resolveCombatVictory(next, player, combat);
        next.updatedAt = Date.now();
        return { state: next };
      }
      combat.isDefending = false;
      combat.roundCount += 1;
    } else {
      const rawHurt = Math.max(1, enemyPower - totalDefense);
      const damageToPlayer = Math.min(2, rawHurt);
      player.hp = Math.max(0, player.hp - damageToPlayer);
      combat.isDefending = false;
      combat.roundCount += 1;

      addChronicle(next, 'combat', player.id, {
        uk: `"${enemy.name.uk}" переважає (${enemyPower} проти ${playerPower}) → ${player.name} отримує ${damageToPlayer} шкоди.`,
        en: `"${enemy.name.en}" prevails (${enemyPower} vs ${playerPower}) → ${player.name} takes ${damageToPlayer} damage.`,
      });

      handlePlayerDefeatIfNeeded(next, player);
    }

    next.updatedAt = Date.now();
    return { state: next };
  },

  combatDefend(state: GameState): EngineResult {
    if (state.phase !== 'PLAYING' || state.turnPhase !== 'COMBAT' || !state.combat) {
      return { state, error: { uk: 'Зараз немає активного бою.', en: 'No active combat.' } };
    }

    const next = cloneState(state);
    const player = getActivePlayer(next);
    const combat = next.combat!;
    const enemy = resolveCombatEnemyStats(combat);
    const eff = getPlayerEffectiveStats(player);

    const enemyRoll = rollD6(next.rngState);
    next.rngState = enemyRoll.nextState;
    next.lastDiceRoll = enemyRoll.roll;
    combat.lastEnemyRoll = enemyRoll.roll;

    const worldMod = getWorldEnemyAttackMod(next);
    const enemyStrike = enemyRoll.roll + enemy.attack + worldMod;
    const guardDefense = eff.armor + player.tempDefenseBonus + 4;
    const damageToPlayer = enemyStrike > guardDefense + 2 ? 1 : 0;

    player.hp = Math.max(0, player.hp - damageToPlayer);
    if (player.hp > 0) {
      player.hp = Math.min(HERO_STAT_LIMITS.maxHp, player.maxHp, player.hp + 1);
    }
    combat.isDefending = true;
    combat.roundCount += 1;

    addChronicle(next, 'combat', player.id, {
      uk: `${player.name} тримає щит проти "${enemy.name.uk}" (d6=${enemyRoll.roll}): отримано ${damageToPlayer} шкоди, +1 HP витримки.`,
      en: `${player.name} braces against "${enemy.name.en}" (d6=${enemyRoll.roll}): ${damageToPlayer} damage taken, +1 HP recovered.`,
    });

    handlePlayerDefeatIfNeeded(next, player);
    next.updatedAt = Date.now();
    return { state: next };
  },

  combatFlee(state: GameState): EngineResult {
    if (state.phase !== 'PLAYING' || state.turnPhase !== 'COMBAT' || !state.combat) {
      return { state, error: { uk: 'Немає бою для відступу.', en: 'No active combat to flee.' } };
    }
    if (state.combat.combatPurpose === 'void_lord') {
      return {
        state,
        error: { uk: 'Від Володаря Порожнечі не можна відступити!', en: 'Cannot flee from the Lord of the Void!' },
      };
    }

    const next = cloneState(state);
    const player = getActivePlayer(next);
    const eff = getPlayerEffectiveStats(player);
    const rngBefore = next.rngState;
    const roll = rollD6(next.rngState);
    next.rngState = roll.nextState;

    const fleeText: LocalizedText =
      roll.roll + eff.fate >= 5
        ? {
            uk: `${player.name} успішно відступає з бою (d6=${roll.roll}+${eff.fate}).`,
            en: `${player.name} successfully flees combat (d6=${roll.roll}+${eff.fate}).`,
          }
        : {
            uk: `Відступ не вдався (d6=${roll.roll}+${eff.fate} < 5): -1 HP.`,
            en: `Flee failed (d6=${roll.roll}+${eff.fate} < 5): -1 HP.`,
          };

    recordDiceRoll(
      next,
      player,
      'combat_flee',
      roll.roll,
      eff.fate,
      roll.roll + eff.fate,
      rngBefore,
      roll.nextState,
      fleeText
    );
    addChronicle(next, 'combat', player.id, fleeText);

    if (roll.roll + eff.fate >= 5) {
      if (next.combat?.enemyCardId) {
        next.adventureDiscardPile = [...(next.adventureDiscardPile ?? []), next.combat.enemyCardId];
      }
      next.combat = null;
      next.turnPhase = 'ACTION';
      syncTurnCycleActionGuidance(next);
    } else {
      player.hp = Math.max(0, player.hp - 1);
      handlePlayerDefeatIfNeeded(next, player);
    }

    next.updatedAt = Date.now();
    return { state: next };
  },

  endTurn(state: GameState): EngineResult {
    if (state.phase !== 'PLAYING') {
      return { state, error: { uk: 'Гра завершена.', en: 'Game has ended.' } };
    }
    if (state.turnPhase !== 'ACTION') {
      return {
        state,
        error: { uk: 'Спочатку завершіть поточний бій або подію.', en: 'Resolve current combat or encounter first.' },
      };
    }

    const next = cloneState(state);
    const player = getActivePlayer(next);
    next.turnCycleStep = 'turn_end';
    addChronicle(next, 'system', player.id, {
      uk: `7. Завершення ходу: ${player.name} завершує дії раунду ${next.round}.`,
      en: `7. End Turn: ${player.name} concludes Round ${next.round}.`,
    });
    TurnManager.advanceTurn(next);
    return { state: next };
  },

  /**
   * Executes one full deterministic AI turn for the active AI player.
   */
  runAiTurn(state: GameState): GameState {
    let current = cloneState(state);
    const active = getActivePlayer(current);
    if (!active.isAI || current.phase !== 'PLAYING') return current;

    // 1. Spend XP to upgrade primary stat if >= 3, equip gear, or heal if low HP
    const currActive = getActivePlayer(current);
    if (currActive.experience >= HERO_STAT_LIMITS.xpPerStatUpgrade) {
      const targetStat = currActive.intellect > currActive.strength ? 'intellect' : 'strength';
      const upgraded = RulesEngine.upgradeStat(current, targetStat);
      if (!upgraded.error) current = upgraded.state;
    }

    for (const cardId of [...getActivePlayer(current).hand]) {
      const card = CARD_MAP.get(cardId);
      if (!card) continue;
      if (card.equipSlot && !getActivePlayer(current).equipment[card.equipSlot]) {
        current = RulesEngine.playCard(current, cardId).state;
      } else if (!card.combatOnly && card.effect.healHp && getActivePlayer(current).hp <= getActivePlayer(current).maxHp - 3) {
        current = RulesEngine.playCard(current, cardId).state;
      }
    }

    // 2. Use actions intelligently
    let safety = 0;
    while (
      current.phase === 'PLAYING' &&
      getActivePlayer(current).id === active.id &&
      safety < 12
    ) {
      safety += 1;
      const p = getActivePlayer(current);

      if (current.turnPhase === 'ENCOUNTER') {
        current = RulesEngine.resolveEncounter(current).state;
        continue;
      }

      if (current.turnPhase === 'COMBAT') {
        if (!p.abilityUsedThisTurn) {
          current = RulesEngine.useHeroAbility(current).state;
          continue;
        }
        const combatCard = p.hand.find((cid) => {
          const c = CARD_MAP.get(cid);
          return c && c.combatOnly;
        });
        if (combatCard) {
          current = RulesEngine.playCard(current, combatCard).state;
          continue;
        }
        current = RulesEngine.combatAttack(current).state;
        continue;
      }

      if (p.actionsRemaining <= 0) break;

      const loc = LOCATION_MAP.get(p.locationId)!;
      if (p.hp <= Math.floor(p.maxHp * 0.45)) {
        current = RulesEngine.restAtLocation(current).state;
        continue;
      }

      if (loc.sealGuardianId && loc.sealReward && !p.seals.includes(loc.sealReward)) {
        current = RulesEngine.challengeSealGuardian(current).state;
        continue;
      }

      if (loc.isGateGuardianLair && !p.gateGuardianDefeated) {
        current = RulesEngine.challengeGateGuardian(current).state;
        continue;
      }

      if (
        p.seals.length === 3 &&
        p.finalTrialsPassed < 3 &&
        (loc.regionId === 'reg_abyssal_citadel' || loc.terrain === 'shrine')
      ) {
        current = RulesEngine.attemptFinalTrial(current).state;
        continue;
      }

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
        current = RulesEngine.challengeCitadelGuardian(current).state;
        continue;
      }

      if (
        loc.isFinalBossLair &&
        p.seals.length === 3 &&
        p.finalTrialsPassed >= 3 &&
        p.citadelGuardiansDefeated >= 2
      ) {
        current = RulesEngine.challengeVoidLord(current).state;
        continue;
      }

      let goalLocId = 'loc_28';
      if (!p.seals.includes('seal_power')) goalLocId = 'loc_28';
      else if (!p.gateGuardianDefeated) goalLocId = 'loc_42';
      else if (!p.seals.includes('seal_fate')) goalLocId = 'loc_66';
      else if (!p.seals.includes('seal_wisdom')) goalLocId = 'loc_71';
      else if (p.finalTrialsPassed < 3) goalLocId = 'loc_73';
      else if (p.citadelGuardiansDefeated < 2) {
        const defeatedIds = p.defeatedCitadelGuardianIds ?? [];
        goalLocId = !defeatedIds.includes('enemy_citadel_sentinel') ? 'loc_80' : 'loc_81';
      } else {
        goalLocId = 'loc_84';
      }

      const bestNeighbor = NavigationGraph.findNextStepToward(p, p.locationId, goalLocId);

      if (p.locationId !== goalLocId && bestNeighbor) {
        current = RulesEngine.moveToLocation(current, bestNeighbor).state;
      } else {
        current = RulesEngine.exploreLocation(current).state;
      }
    }

    if (current.phase === 'PLAYING' && current.turnPhase === 'ACTION' && getActivePlayer(current).id === active.id) {
      current = RulesEngine.endTurn(current).state;
    }

    return current;
  },
};

export function getAllLocationsCount(): number {
  return LOCATIONS.length;
}
