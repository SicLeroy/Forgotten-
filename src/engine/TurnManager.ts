import { CARD_MAP } from '../data/cards';
import { HERO_MAP } from '../data/heroes';
import { LOCATION_MAP } from '../data/locations';
import { TIME_CYCLE, WEATHER_LIST, WORLD_EVENTS } from '../data/world';
import {
  ChronicleEntry,
  GameState,
  HERO_INVENTORY_LIMITS,
  HERO_STAT_LIMITS,
  LocalizedText,
  TimeOfDay,
  WeatherType,
} from '../types/game';
import { getActivePlayerFromState } from './GameState';
import { RandomManager } from './RandomManager';

const MAX_CHRONICLE_ENTRIES = 80;

let chronicleSeq = 0;

export function appendChronicleEntry(
  state: GameState,
  type: ChronicleEntry['type'],
  playerId: string | null,
  text: LocalizedText
): void {
  const existing = new Set(state.chronicle.map((e) => e.id));
  let id = `log_${state.round}_${state.rngState}_${++chronicleSeq}`;
  while (existing.has(id)) {
    id = `log_${state.round}_${state.rngState}_${++chronicleSeq}`;
  }
  const entry: ChronicleEntry = {
    id,
    round: state.round,
    timeOfDay: state.timeOfDay,
    playerId,
    type,
    text,
  };
  state.chronicle = [entry, ...state.chronicle].slice(0, MAX_CHRONICLE_ENTRIES);
}

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
   * applying location time/weather, companion turn bonuses, and active curse drains.
   */
  applyTurnStartAndEffects(state: GameState, isInitialTurn = false): void {
    const player = getActivePlayerFromState(state);
    if (player.isDefeated || state.phase !== 'PLAYING') return;

    state.turnCycleStep = 'turn_start';
    appendChronicleEntry(state, 'system', player.id, {
      uk: `1. Початок ходу: ${player.name} (Раунд ${state.round}, дій: ${player.actionsRemaining}).`,
      en: `1. Turn Start: ${player.name} (Round ${state.round}, actions: ${player.actionsRemaining}).`,
    });

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
      const isNightWindow = state.timeOfDay === 'night' || state.timeOfDay === 'dusk';
      const timeEff = isNightWindow ? loc.nightEffect : loc.dayEffect;
      const weatherEff = loc.weatherModifiers[state.weather];
      timeSummaryUk = timeEff.description.uk;
      timeSummaryEn = timeEff.description.en;
      weatherSummaryUk = weatherEff.description.uk;
      weatherSummaryEn = weatherEff.description.en;

      if (
        !isInitialTurn &&
        (loc.terrain === 'sanctuary' || loc.terrain === 'village') &&
        (state.timeOfDay === 'dawn' || state.timeOfDay === 'day')
      ) {
        const cap = Math.min(HERO_STAT_LIMITS.maxHp, player.maxHp);
        const before = player.hp;
        player.hp = Math.min(cap, player.hp + 1);
        healed += player.hp - before;
      }
    }

    if (!isInitialTurn) {
      // Apply active Companion per-turn benefits
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

      // Apply active Curse per-turn drains (does not fatally kill at start; leaves min 1 HP unless combat drops HP)
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

    appendChronicleEntry(state, 'world', player.id, {
      uk: `2. Застосування ефектів${loc ? ` у "${loc.name.uk}"` : ''}: ${timeSummaryUk || 'звичайні умови'}; погода — ${weatherSummaryUk || 'без змін'}${extraNotesUk.length ? `; ${extraNotesUk.join(', ')}` : ''}.`,
      en: `2. Apply Effects${loc ? ` at "${loc.name.en}"` : ''}: ${timeSummaryEn || 'standard conditions'}; weather — ${weatherSummaryEn || 'steady'}${extraNotesEn.length ? `; ${extraNotesEn.join(', ')}` : ''}.`,
    });

    state.turnCycleStep = 'dice_roll';
    state.turnGuidance = {
      uk: `Крок 3: Киньте d6 для руху (${loc ? loc.name.uk : ''}) або оберіть дію на локації.`,
      en: `Step 3: Roll d6 to move${loc ? ` from ${loc.name.en}` : ''} or choose a location action.`,
    };
  },

  /**
   * Executes Step 8 (Turn Handoff) to the next living hero.
   */
  advanceTurn(state: GameState): void {
    const prevPlayer = getActivePlayerFromState(state);
    prevPlayer.tempAttackBonus = 0;
    prevPlayer.tempDefenseBonus = 0;

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
      const timeIdx = (TIME_CYCLE.indexOf(state.timeOfDay) + 1) % TIME_CYCLE.length;
      state.timeOfDay = TIME_CYCLE[timeIdx] as TimeOfDay;

      const weatherRoll = RandomManager.randomInt(state.rngState, 0, WEATHER_LIST.length - 1);
      state.rngState = weatherRoll.nextState;
      state.weather = WEATHER_LIST[weatherRoll.value] as WeatherType;

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

        appendChronicleEntry(state, 'world', null, {
          uk: `Світова подія (Раунд ${state.round}): "${evt.name.uk}" — ${evt.effectSummary.uk}.`,
          en: `World Event (Round ${state.round}): "${evt.name.en}" — ${evt.effectSummary.en}.`,
        });
      } else {
        state.activeWorldEventId = null;
      }
    }

    state.turnCycleStep = 'turn_handoff';
    appendChronicleEntry(state, 'system', nextPlayer.id, {
      uk: `8. Передача ходу: ${prevPlayer.name} передає хід герою ${nextPlayer.name}.`,
      en: `8. Turn Handoff: ${prevPlayer.name} hands turn over to ${nextPlayer.name}.`,
    });

    if (state.phase === 'PLAYING') {
      TurnManager.applyTurnStartAndEffects(state);
    }

    state.updatedAt = Date.now();
  },
};
