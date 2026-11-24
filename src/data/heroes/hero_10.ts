import { HERO_STAT_LIMITS, HeroDefinition } from '../../types/game';

export const hero10: HeroDefinition = {
  id: 'hero_10',
  className: { uk: 'Ельфійський лицар', en: 'Elven Knight' },
  name: { uk: 'Таларіон Місячний Клинок', en: 'Thalarion Moonblade' },
  title: { uk: 'Ельфійський лицар · Чатовий Руїн', en: 'Elven Knight · Sentinel of Ancient Ruins' },
  description: {
    uk: 'Благородний майстер меча та магії з рівними показниками Сили й Інтелекту.',
    en: 'Noble spellsword balancing refined Strength and Intellect in equal measure.',
  },
  lore: {
    uk: 'Захисник давніх ельфійських залів, що пробудився від столітньої варти, коли Печатки розкололися. Поєднує витончений фехтувальний танець із силою рун.',
    en: 'Guardian of twilight elven halls awakened from a century-long vigil when the Seals shattered, uniting blade mastery with ancient runes.',
  },
  portraitPath: '/src/assets/images/hero_10_elven_knight_1795553564629.jpg',
  startingRegionId: 'reg_sunspire_vale',
  startingLocationId: 'loc_10',
  baseStats: {
    hp: 5,
    maxHp: HERO_STAT_LIMITS.maxHp,
    strength: 4,
    intellect: 4,
    fate: 2,
    armor: 2,
    gold: 16,
    experience: 1,
    actionsPerTurn: 2,
  },
  startingEquipment: {
    weapon: 'card_009',
    armor: null,
    talisman: null,
  },
  startingResources: {
    gold: 16,
    experience: 1,
    cards: ['card_055', 'card_100'],
    description: {
      uk: '16 золота, 1 досвіду, Ельфійська шабля світанку, Пір’яний талісман удачі, Пісня кам’яної твердині.',
      en: '16 Gold, 1 XP, Elven Dawnsabre, Plumed Charm of Luck, Chant of Stone Bastion.',
    },
  },
  abilityName: { uk: 'Танець клинка', en: 'Blade Dance' },
  abilityDescription: {
    uk: '+2 до атаки, +1 до захисту на хід та добір 1 карти.',
    en: 'Gain +2 Attack, +1 Defense this turn, and draw 1 card.',
  },
  abilityType: 'elven_blade_dance',
};
