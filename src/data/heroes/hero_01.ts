import { HERO_STAT_LIMITS, HeroDefinition } from '../../types/game';

export const hero01: HeroDefinition = {
  id: 'hero_01',
  className: { uk: 'Воїн', en: 'Warrior' },
  name: { uk: 'Кайрен Залізний Обіт', en: 'Kaelen Ironvow' },
  title: { uk: 'Воїн · Командувач Останньої Застави', en: 'Warrior · Warden of the Last Bastion' },
  description: {
    uk: 'Загартований фронтовий боєць із високою Силою та міцним здоров’ям для прямих сутичок.',
    en: 'Battle-hardened frontline fighter with high Strength and durability for direct combat.',
  },
  lore: {
    uk: 'Колишній командувач прикордонної варти Долини Сонячного Шпиля. Після падіння Північної Вежі присягнув повернути три Печатки та прорвати облогу Цитаделі.',
    en: 'Former captain of the Sunspire Vale watch. After the fall of the Northern Watchtower, he swore an oath to reclaim the Three Seals and breach the Citadel.',
  },
  portraitPath: '/src/assets/images/hero_01_warrior_1795553561875.jpg',
  startingRegionId: 'reg_sunspire_vale',
  startingLocationId: 'loc_01',
  baseStats: {
    hp: 6,
    maxHp: HERO_STAT_LIMITS.maxHp,
    strength: 5,
    intellect: 2,
    fate: 2,
    armor: 1,
    gold: 15,
    experience: 1,
    actionsPerTurn: 2,
  },
  startingEquipment: {
    weapon: 'card_001',
    armor: 'card_027',
    talisman: null,
  },
  startingResources: {
    gold: 15,
    experience: 1,
    cards: ['card_051'],
    description: {
      uk: '15 золота, 1 досвіду, Залізний меч варти, Кольчуга прикордоння, Олія крицевого блиску.',
      en: '15 Gold, 1 XP, Iron Watchman Sword, Borderland Chainmail, Steelshine Blade Oil.',
    },
  },
  abilityName: { uk: 'Бойовий натиск', en: 'Battle Surge' },
  abilityDescription: {
    uk: '+2 до атаки та +1 до захисту до кінця ходу.',
    en: 'Gain +2 Attack and +1 Defense until end of turn.',
  },
  abilityType: 'warrior_surge',
};
