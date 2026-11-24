import { HERO_STAT_LIMITS, HeroDefinition } from '../../types/game';

export const hero11: HeroDefinition = {
  id: 'hero_11',
  className: { uk: 'Чаклунка', en: 'Sorceress' },
  name: { uk: 'Селеста Зоряна Іскра', en: 'Celesta Starspark' },
  title: { uk: 'Чаклунка · Віщунка Сузір’їв', en: 'Sorceress · Oracle of Constellations' },
  description: {
    uk: 'Природжена повелителька зоряного вогню з високим Інтелектом та Долею.',
    en: 'Born weaver of starfire possessing high Intellect and Fate.',
  },
  lore: {
    uk: 'Дитя затемнення, яке з юності бачило нитки долі на нічному небі. Її магія розриває темряву Порожнечі та веде союзників крізь прокляті землі.',
    en: 'Child of an eclipse who has read the threads of destiny since youth. Her starfire burns through Void shadow and guides allies.',
  },
  portraitPath: '/src/assets/images/hero_11_sorceress_1795553587879.jpg',
  startingRegionId: 'reg_sunspire_vale',
  startingLocationId: 'loc_11',
  baseStats: {
    hp: 4,
    maxHp: HERO_STAT_LIMITS.maxHp,
    strength: 2,
    intellect: 5,
    fate: 4,
    armor: 0,
    gold: 20,
    experience: 1,
    actionsPerTurn: 2,
  },
  startingEquipment: {
    weapon: 'card_010',
    armor: null,
    talisman: null,
  },
  startingResources: {
    gold: 20,
    experience: 1,
    cards: ['card_093', 'card_095', 'card_058'],
    description: {
      uk: '20 золота, 1 досвіду, Жезл кришталевої призми, Щит крижаної стіни, Таємний погляд, Котячий амулет.',
      en: '20 Gold, 1 XP, Crystal Prism Wand, Icewall Barrier, Arcane Clairvoyance, Midnight Cat Medallion.',
    },
  },
  abilityName: { uk: 'Зоряна іскра', en: 'Starfire Spark' },
  abilityDescription: {
    uk: 'У бою завдає 2 шкоди та дає +2 до атаки; поза боєм дає +1 дію та +1 до захисту.',
    en: 'In combat deals 2 damage and +2 Attack; outside combat grants +1 action and +1 Defense.',
  },
  abilityType: 'sorceress_starfire',
};
