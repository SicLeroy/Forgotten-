import { HERO_STAT_LIMITS, HeroDefinition } from '../../types/game';

export const hero05: HeroDefinition = {
  id: 'hero_05',
  className: { uk: 'Злодій', en: 'Rogue' },
  name: { uk: 'Корвін Тіньовий Клинок', en: 'Corvin Shadowblade' },
  title: { uk: 'Злодій · Майстер Потаємних Стежок', en: 'Rogue · Master of Hidden Ways' },
  description: {
    uk: 'Спритний розвідник із високою Долею та Інтелектом, що накопичує золото й діє швидше за інших.',
    en: 'Agile scout with high Fate and Intellect who amasses gold and outpaces rivals.',
  },
  lore: {
    uk: 'Знавець підземних ходів Ярмаркової Площі та закинутих веж. Спершу шукав лише втрачені скарби королів, але тепер іде за Печатками заради порятунку краю.',
    en: 'Explorer of forgotten vaults beneath Market Meadow. What began as treasure hunting turned into a race to keep the Three Seals out of Void hands.',
  },
  portraitPath: '/src/assets/images/hero_05_rogue_1795553562660.jpg',
  startingRegionId: 'reg_sunspire_vale',
  startingLocationId: 'loc_05',
  canTriggerMidwayEvents: true,
  baseStats: {
    hp: 4,
    maxHp: HERO_STAT_LIMITS.maxHp,
    strength: 3,
    intellect: 4,
    fate: 4,
    armor: 1,
    gold: 25,
    experience: 1,
    actionsPerTurn: 2,
  },
  startingEquipment: {
    weapon: 'card_004',
    armor: 'card_030',
    talisman: null,
  },
  startingResources: {
    gold: 25,
    experience: 1,
    cards: ['card_060'],
    description: {
      uk: '25 золота, 1 досвіду, Стилет тіньового провулку, Накидка нічної варти, Мапа забутих контрабандистів.',
      en: '25 Gold, 1 XP, Shadowalley Stiletto, Nightwatch Hooded Mantle, Forgotten Smuggler Chart.',
    },
  },
  abilityName: { uk: 'Тіньовий крок', en: 'Shadow Step' },
  abilityDescription: {
    uk: '+1 дія в ході та +5 золота; може зупинятися й активувати події на проміжних локаціях.',
    en: '+1 action this turn and +5 Gold; may stop early to trigger events midway along routes.',
  },
  abilityType: 'rogue_shadow',
};
