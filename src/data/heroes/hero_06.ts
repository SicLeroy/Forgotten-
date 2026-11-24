import { HERO_STAT_LIMITS, HeroDefinition } from '../../types/game';

export const hero06: HeroDefinition = {
  id: 'hero_06',
  className: { uk: 'Варвар', en: 'Barbarian' },
  name: { uk: 'Броґар Громобій', en: 'Brogar Thunderaxe' },
  title: { uk: 'Варвар · Воїн Високих Скель', en: 'Barbarian · Raider of High Crags' },
  description: {
    uk: 'Неприборканий берсерк із максимальною стартовою Силою та запасом Здоров’я.',
    en: 'Untamed berserker boasting peak starting Strength and high Health.',
  },
  lore: {
    uk: 'Нащадок гірських кланів, що пережив буревій на Шляху Громових Каменів. Не довіряє чарам, але поважає чесний бій і клятву крові проти Порожнечі.',
    en: 'Survivor of the northern crag storms. Distrustful of sorcery, he answers the encroaching Void with heavy steel and unyielding fury.',
  },
  portraitPath: '/src/assets/images/hero_06_barbarian_1795553563099.jpg',
  startingRegionId: 'reg_sunspire_vale',
  startingLocationId: 'loc_06',
  baseStats: {
    hp: 6,
    maxHp: HERO_STAT_LIMITS.maxHp,
    strength: 5,
    intellect: 2,
    fate: 2,
    armor: 1,
    gold: 12,
    experience: 2,
    actionsPerTurn: 2,
  },
  startingEquipment: {
    weapon: 'card_006',
    armor: null,
    talisman: null,
  },
  startingResources: {
    gold: 12,
    experience: 2,
    cards: ['card_054'],
    description: {
      uk: '12 золота, 2 досвіду, Сокира північного клану, Дорожній сухпайок сторожі.',
      en: '12 Gold, 2 XP, Northclan Battleaxe, Watchman Trail Rations.',
    },
  },
  abilityName: { uk: 'Лють берсерка', en: 'Berserker Rage' },
  abilityDescription: {
    uk: 'Витрачає 1 HP (залишається мін. 1), щоб отримати +3 до атаки на цей хід.',
    en: 'Spend 1 HP (min 1 left) to gain +3 Attack for this turn.',
  },
  abilityType: 'barbarian_rage',
};
