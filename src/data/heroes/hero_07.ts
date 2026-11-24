import { HERO_STAT_LIMITS, HeroDefinition } from '../../types/game';

export const hero07: HeroDefinition = {
  id: 'hero_07',
  className: { uk: 'Друїд', en: 'Druid' },
  name: { uk: 'Оріон Хранитель Гаїв', en: 'Orion Grovekeeper' },
  title: { uk: 'Друїд · Мудрець Зелених Курганів', en: 'Druid · Sage of Green Barrows' },
  description: {
    uk: 'Гармонійний чарівник природи, який лікує рани, підтримує захист і розкриває таємниці землі.',
    en: 'Balanced nature mystic who restores vitality, bolsters defense, and uncovers ancient lore.',
  },
  lore: {
    uk: 'Хранитель прадавнього гаю біля Острова Лілій. Коли води Срібної Ріки потемніли від попелу, Оріон взяв оленячий посох і вирушив зцілити розколоті землі.',
    en: 'Keeper of the sacred grove beside Lily Isle. When ash darkened the Silver River, Orion took his stag-antler staff to heal the fractured realms.',
  },
  portraitPath: '/src/assets/images/hero_07_druid_1795553563582.jpg',
  startingRegionId: 'reg_sunspire_vale',
  startingLocationId: 'loc_07',
  baseStats: {
    hp: 5,
    maxHp: HERO_STAT_LIMITS.maxHp,
    strength: 3,
    intellect: 4,
    fate: 3,
    armor: 1,
    gold: 15,
    experience: 1,
    actionsPerTurn: 2,
  },
  startingEquipment: {
    weapon: 'card_016',
    armor: 'card_028',
    talisman: null,
  },
  startingResources: {
    gold: 15,
    experience: 1,
    cards: ['card_047', 'card_057'],
    description: {
      uk: '15 золота, 1 досвіду, Серп місячного друїда, Бавовняний плащ травника, Еліксир гірського бальзаму, Кора вікового ясена.',
      en: '15 Gold, 1 XP, Moondruid Sickle, Herbalist Linen Cloak, Mountain Balm Elixir, Elder Ash Bark Charm.',
    },
  },
  abilityName: { uk: 'Поклик природи', en: 'Nature’s Renewal' },
  abilityDescription: {
    uk: 'Відновлює 2 HP (до макс. 10), додає +1 до захисту та дозволяє добрати 1 карту.',
    en: 'Restores 2 HP (up to 10), grants +1 Defense, and draws 1 card.',
  },
  abilityType: 'druid_renewal',
};
