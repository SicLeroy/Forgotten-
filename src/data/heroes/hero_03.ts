import { HERO_STAT_LIMITS, HeroDefinition } from '../../types/game';

export const hero03: HeroDefinition = {
  id: 'hero_03',
  className: { uk: 'Лучник', en: 'Archer' },
  name: { uk: 'Ренділ Тисовий Лук', en: 'Rendil Yewbow' },
  title: { uk: 'Лучник · Слідопит Туманних Сосняків', en: 'Archer · Ranger of Misty Pinewood' },
  description: {
    uk: 'Збалансований мисливець, що влучає здалеку та впевнено почувається в небезпечних переходах.',
    en: 'Balanced marksman who strikes from afar and excels across hazardous wilderness routes.',
  },
  lore: {
    uk: 'Виріс серед лісових стежок Туманного Сосняка. Його стріли не раз зупиняли розбійників Старого Тракту, доки тінь з Попелястих Меж не поглинула його варту.',
    en: 'Raised among the mossy trails of Misty Pinewood. His arrows held the Old Road safe until ash-born raiders swept past the borders.',
  },
  portraitPath: '/src/assets/images/hero_03_archer_1795553561321.jpg',
  startingRegionId: 'reg_sunspire_vale',
  startingLocationId: 'loc_03',
  baseStats: {
    hp: 5,
    maxHp: HERO_STAT_LIMITS.maxHp,
    strength: 4,
    intellect: 3,
    fate: 3,
    armor: 1,
    gold: 16,
    experience: 1,
    actionsPerTurn: 2,
  },
  startingEquipment: {
    weapon: 'card_002',
    armor: 'card_026',
    talisman: null,
  },
  startingResources: {
    gold: 16,
    experience: 1,
    cards: ['card_046'],
    description: {
      uk: '16 золота, 1 досвіду, Лук ясеневого гаю, Шкіряна куртка слідопита, Флакон роси світанку.',
      en: '16 Gold, 1 XP, Ashwood Longbow, Pathfinder Leather Jerkin, Vial of Dawn Dew.',
    },
  },
  abilityName: { uk: 'Прицільний постріл', en: 'Precision Shot' },
  abilityDescription: {
    uk: 'У бою завдає 2 прямої шкоди ворогу; поза боєм дає +2 до атаки на хід.',
    en: 'In combat deals 2 direct damage; outside combat grants +2 Attack this turn.',
  },
  abilityType: 'archer_precision',
};
