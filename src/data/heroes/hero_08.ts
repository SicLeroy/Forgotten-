import { HERO_STAT_LIMITS, HeroDefinition } from '../../types/game';

export const hero08: HeroDefinition = {
  id: 'hero_08',
  className: { uk: 'Некромант', en: 'Necromancer' },
  name: { uk: 'Морвейн Темний Пакт', en: 'Morvain Darkpact' },
  title: { uk: 'Некромант · Заклинач Гробовищ', en: 'Necromancer · Binder of Barrow Spirits' },
  description: {
    uk: 'Володар забороненої магії з високим Інтелектом, що обмінює життєву силу на карти та могутні удари.',
    en: 'Wielder of forbidden arts with high Intellect who trades vitality for cards and fierce strikes.',
  },
  lore: {
    uk: 'Вигнаний зі Столичної Академії за вивчення ритуалів тіні. Морвейн знає мову мертвих і використовує силу духів, аби зупинити самого Володаря Порожнечі.',
    en: 'Exiled from the Capital Academy for studying shadow rites, Morvain commands ancestral spirits to halt the Lord of the Void.',
  },
  portraitPath: '/src/assets/images/hero_08_necromancer_1795553563475.jpg',
  startingRegionId: 'reg_sunspire_vale',
  startingLocationId: 'loc_08',
  baseStats: {
    hp: 4,
    maxHp: HERO_STAT_LIMITS.maxHp,
    strength: 2,
    intellect: 5,
    fate: 3,
    armor: 0,
    gold: 16,
    experience: 2,
    actionsPerTurn: 2,
  },
  startingEquipment: {
    weapon: 'card_012',
    armor: null,
    talisman: null,
  },
  startingResources: {
    gold: 16,
    experience: 2,
    cards: ['card_098', 'card_065'],
    description: {
      uk: '16 золота, 2 досвіду, Кісткова коса некрополя, Молнія вершин, Відвар полинового коріння.',
      en: '16 Gold, 2 XP, Necropolis Bonescythe, Peak Lightning, Wormwood Root Decoction.',
    },
  },
  abilityName: { uk: 'Жнива душ', en: 'Soul Harvest' },
  abilityDescription: {
    uk: 'Витрачає 1 HP (залишається мін. 1), щоб добрати 2 карти й отримати +2 до атаки на хід.',
    en: 'Spend 1 HP (min 1 left) to draw 2 cards and gain +2 Attack this turn.',
  },
  abilityType: 'necromancer_harvest',
};
