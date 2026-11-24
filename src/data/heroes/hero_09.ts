import { HERO_STAT_LIMITS, HeroDefinition } from '../../types/game';

export const hero09: HeroDefinition = {
  id: 'hero_09',
  className: { uk: 'Мисливець на демонів', en: 'Demon Hunter' },
  name: { uk: 'Варкус Залізне Тавро', en: 'Varkus Ironbrand' },
  title: { uk: 'Мисливець на демонів · Переслідувач Безодні', en: 'Demon Hunter · Abyss Tracker' },
  description: {
    uk: 'Невблаганний боєць прикордоння, що спеціалізується на знищенні вартових та демонічних істот.',
    en: 'Relentless borderland slayer specialized in piercing monsters and demon guardians.',
  },
  lore: {
    uk: 'Після загибелі його загону біля Розлому Безодні викував срібний арбалет із уламків вівтаря. Полює на Охоронця Брами й створінь Середнього регіону.',
    en: 'After losing his company near the Abyssal Rift, he forged a rune-etched crossbow to hunt the Gate Guardian and Middle Region horrors.',
  },
  portraitPath: '/src/assets/images/hero_09_demon_hunter_1795553586576.jpg',
  startingRegionId: 'reg_sunspire_vale',
  startingLocationId: 'loc_09',
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
    weapon: 'card_011',
    armor: 'card_029',
    talisman: null,
  },
  startingResources: {
    gold: 16,
    experience: 1,
    cards: ['card_086'],
    description: {
      uk: '16 золота, 1 досвіду, Арбалет облогової вежі, Дублений нагрудник лісника, Метальний ніж мисливця.',
      en: '16 Gold, 1 XP, Siegetower Crossbow, Forester Boiled Breastplate, Fiendhunter Throwing Knife.',
    },
  },
  abilityName: { uk: 'Тавро мисливця', en: 'Hunter’s Brand' },
  abilityDescription: {
    uk: 'У бою завдає 3 прямої шкоди ворогу; поза боєм надає +2 до атаки на хід.',
    en: 'Deals 3 direct damage in combat; outside combat grants +2 Attack this turn.',
  },
  abilityType: 'demon_hunter_brand',
};
