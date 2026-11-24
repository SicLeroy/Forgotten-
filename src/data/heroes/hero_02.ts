import { HERO_STAT_LIMITS, HeroDefinition } from '../../types/game';

export const hero02: HeroDefinition = {
  id: 'hero_02',
  className: { uk: 'Маг', en: 'Mage' },
  name: { uk: 'Аларік Зорянописець', en: 'Alaric Starscribe' },
  title: { uk: 'Маг · Архівіст Бібліотеки Світанку', en: 'Mage · Archivist of the Dawn Library' },
  description: {
    uk: 'Майстер арканних знань із високим Інтелектом і Долею, що керує ходом битви через закляття та карти.',
    en: 'Master of arcane lore with high Intellect and Fate who shapes battles with spells and cards.',
  },
  lore: {
    uk: 'Старший хранитель стародавніх астролябій Бібліотеки Світанку. Виявив пророцтво про затемнення Порожнечі та вирушив у мандри, щоб розшифрувати руни Трьох Печаток.',
    en: 'Senior keeper of the Dawn Library astrolabes. Uncovered the Void Eclipse prophecy and set out to decode the runes of the Three Seals.',
  },
  portraitPath: '/src/assets/images/hero_02_mage_1795553561849.jpg',
  startingRegionId: 'reg_sunspire_vale',
  startingLocationId: 'loc_02',
  baseStats: {
    hp: 4,
    maxHp: HERO_STAT_LIMITS.maxHp,
    strength: 2,
    intellect: 5,
    fate: 4,
    armor: 0,
    gold: 18,
    experience: 1,
    actionsPerTurn: 2,
  },
  startingEquipment: {
    weapon: 'card_005',
    armor: null,
    talisman: null,
  },
  startingResources: {
    gold: 18,
    experience: 1,
    cards: ['card_056', 'card_091', 'card_094'],
    description: {
      uk: '18 золота, 1 досвіду, Посох болотяного вогню, Амулет трьох зірок, Спалах сонячної іскри, Прискорення вітрокрила.',
      en: '18 Gold, 1 XP, Marshfire Quarterstaff, Tristar Amber Talisman, Sunspark Bolt, Windwing Haste.',
    },
  },
  abilityName: { uk: 'Таємна концентрація', en: 'Arcane Focus' },
  abilityDescription: {
    uk: 'Добрати 2 карти; у бою додатково завдає 2 магічної шкоди ворогу.',
    en: 'Draw 2 cards; in combat also deals 2 arcane damage to the enemy.',
  },
  abilityType: 'mage_focus',
};
