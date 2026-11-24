import { CardCategory, CardDefinition } from '../../types/game';
import { ADVENTURE_CARDS } from './adventures';
import { ARMOR_CARDS } from './armor';
import { COMPANION_CARDS } from './companions';
import { CURSE_CARDS } from './curses';
import { ENEMY_CARDS } from './enemies';
import { EVENT_CARDS } from './events';
import { ITEM_CARDS } from './items';
import { LEGENDARY_ARTIFACT_CARDS } from './legendary';
import { SPELL_CARDS } from './spells';
import { WEAPON_CARDS } from './weapons';

// Complete 300-card roster ordered card_001 .. card_300
export const CARDS: CardDefinition[] = [
  ...WEAPON_CARDS, // 25 (card_001 .. card_025)
  ...ARMOR_CARDS, // 20 (card_026 .. card_045)
  ...ITEM_CARDS, // 45 (card_046 .. card_090)
  ...SPELL_CARDS, // 20 (card_091 .. card_110)
  ...COMPANION_CARDS, // 15 (card_111 .. card_125)
  ...EVENT_CARDS, // 10 (card_126 .. card_135)
  ...CURSE_CARDS, // 10 (card_136 .. card_145)
  ...LEGENDARY_ARTIFACT_CARDS, // 5 (card_146 .. card_150)
  ...ENEMY_CARDS, // 50 (card_151 .. card_200)
  ...ADVENTURE_CARDS, // 100 (card_201 .. card_300)
];

export const CARD_MAP = new Map<string, CardDefinition>(CARDS.map((c) => [c.id, c]));

export const CARD_CATEGORY_COUNTS: Record<CardCategory, number> = {
  adventure: ADVENTURE_CARDS.length,
  enemy: ENEMY_CARDS.length,
  item: ITEM_CARDS.length,
  weapon: WEAPON_CARDS.length,
  armor: ARMOR_CARDS.length,
  spell: SPELL_CARDS.length,
  companion: COMPANION_CARDS.length,
  event: EVENT_CARDS.length,
  curse: CURSE_CARDS.length,
  legendary_artifact: LEGENDARY_ARTIFACT_CARDS.length,
};

// Hero/Loot Deck (130 playable, equippable, and companion cards)
export const HERO_DECK_CATEGORIES: ReadonlySet<CardCategory> = new Set([
  'weapon',
  'armor',
  'item',
  'spell',
  'companion',
  'legendary_artifact',
]);

// Adventure/World Deck (170 encounter, enemy, event, and curse cards)
export const ADVENTURE_DECK_CATEGORIES: ReadonlySet<CardCategory> = new Set([
  'adventure',
  'enemy',
  'event',
  'curse',
]);

export const HERO_DECK_CARD_IDS: string[] = CARDS.filter((c) =>
  HERO_DECK_CATEGORIES.has(c.category)
).map((c) => c.id);

export const ADVENTURE_DECK_CARD_IDS: string[] = CARDS.filter((c) =>
  ADVENTURE_DECK_CATEGORIES.has(c.category)
).map((c) => c.id);

export {
  ADVENTURE_CARDS,
  ARMOR_CARDS,
  COMPANION_CARDS,
  CURSE_CARDS,
  ENEMY_CARDS,
  EVENT_CARDS,
  ITEM_CARDS,
  LEGENDARY_ARTIFACT_CARDS,
  SPELL_CARDS,
  WEAPON_CARDS,
};
