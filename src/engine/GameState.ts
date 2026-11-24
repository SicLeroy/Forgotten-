import { CARD_MAP } from '../data/cards';
import { GameState, HERO_STAT_LIMITS, PlayerState } from '../types/game';

export type { GameState, PlayerState };

export function cloneGameState(state: GameState): GameState {
  return JSON.parse(JSON.stringify(state)) as GameState;
}

export function getActivePlayerFromState(state: GameState): PlayerState {
  return state.players[state.activePlayerIndex];
}

export function computeEquipmentCombatAttack(player: PlayerState): number {
  let bonus = 0;
  if (player.equipment.weapon) {
    const w = CARD_MAP.get(player.equipment.weapon);
    if (w?.effect.bonusAttack) bonus += w.effect.bonusAttack;
  }
  for (const compId of player.companions ?? []) {
    const comp = CARD_MAP.get(compId);
    if (comp?.effect.companionBonus?.attack) {
      bonus += comp.effect.companionBonus.attack;
    }
  }
  return bonus;
}

export function computeEffectiveStats(player: PlayerState): {
  strength: number;
  intellect: number;
  fate: number;
  armor: number;
} {
  let strength = player.strength;
  let intellect = player.intellect;
  let fate = player.fate;
  let armor = player.armor;

  // 1. Equipped Weapon, Armor (and optional legacy talisman)
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

  // 2. Passive relics/charms carried in inventory (duration.type === 'equipped' or charm items)
  for (const invId of player.inventory) {
    const card = CARD_MAP.get(invId);
    if (!card) continue;
    if (!card.equipSlot && (card.duration.type === 'equipped' || card.category === 'legendary_artifact')) {
      strength += card.effect.bonusStrength ?? 0;
      intellect += card.effect.bonusIntellect ?? 0;
      fate += card.effect.bonusFate ?? 0;
      armor += card.effect.bonusDefense ?? 0;
    }
  }

  // 3. Active Companions (up to 3)
  for (const compId of player.companions ?? []) {
    const comp = CARD_MAP.get(compId);
    const cb = comp?.effect.companionBonus;
    if (!cb) continue;
    strength += cb.strength ?? 0;
    intellect += cb.intellect ?? 0;
    fate += cb.fate ?? 0;
    armor += cb.armor ?? 0;
  }

  // 4. Three Seals
  if (player.seals.includes('seal_power')) strength += 1;
  if (player.seals.includes('seal_wisdom')) intellect += 1;
  if (player.seals.includes('seal_fate')) fate += 1;

  // 5. Active Curses (until cleansed)
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
  };
}
