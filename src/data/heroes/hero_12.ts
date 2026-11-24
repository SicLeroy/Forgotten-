import { HERO_STAT_LIMITS, HeroDefinition } from '../../types/game';

export const hero12: HeroDefinition = {
  id: 'hero_12',
  className: { uk: 'Алхімік', en: 'Alchemist' },
  name: { uk: 'Ґреґор Бурштиновий Тигель', en: 'Gregor Ambercrucible' },
  title: { uk: 'Алхімік · Майстер Гільдії Еліксирів', en: 'Alchemist · Master of the Elixir Guild' },
  description: {
    uk: 'Винахідливий майстер зілля, що поповнює здоров’я, добирає карти й перетворює небезпеки на золото.',
    en: 'Resourceful potion-maker who restores health, draws cards, and turns hazards into profit.',
  },
  lore: {
    uk: 'Головний дослідник підземної лабораторії біля Ярмаркової Площі. Створив формулу бурштинового тоніка, здатного протистояти навіть прокляттю Безодні.',
    en: 'Chief researcher of the Market Meadow apothecary guild who distilled an amber tonic strong enough to resist the Abyssal blight.',
  },
  portraitPath: '/src/assets/images/hero_12_alchemist_1795553565782.jpg',
  startingRegionId: 'reg_sunspire_vale',
  startingLocationId: 'loc_12',
  baseStats: {
    hp: 5,
    maxHp: HERO_STAT_LIMITS.maxHp,
    strength: 3,
    intellect: 4,
    fate: 3,
    armor: 1,
    gold: 22,
    experience: 1,
    actionsPerTurn: 2,
  },
  startingEquipment: {
    weapon: null,
    armor: 'card_039',
    talisman: null,
  },
  startingResources: {
    gold: 22,
    experience: 1,
    cards: ['card_063', 'card_052', 'card_059'],
    description: {
      uk: '22 золота, 1 досвіду, Фартух гранд-алхіміка, Мед альпійських пасік, Сірчана бомба, Польовий набір алхіміка.',
      en: '22 Gold, 1 XP, Grand Alchemist Wardcoat, Alpine Comb Honey, Sulfur Alchemist Bomb, Alchemist Field Satchel.',
    },
  },
  abilityName: { uk: 'Алхімічний еліксир', en: 'Alchemical Brew' },
  abilityDescription: {
    uk: 'Відновлює 2 HP (до макс. 10), додає +4 золота та добирає 1 карту.',
    en: 'Restores 2 HP (up to 10), gains +4 Gold, and draws 1 card.',
  },
  abilityType: 'alchemist_brew',
};
