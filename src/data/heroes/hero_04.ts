import { HERO_STAT_LIMITS, HeroDefinition } from '../../types/game';

export const hero04: HeroDefinition = {
  id: 'hero_04',
  className: { uk: 'Паладин', en: 'Paladin' },
  name: { uk: 'Лоріан Світлоносний', en: 'Lorian Lightbearer' },
  title: { uk: 'Паладин · Лицар Сонячної Присяги', en: 'Paladin · Knight of the Sunlit Oath' },
  description: {
    uk: 'Стійкий захисник із високим Здоров’ям, здатний зцілювати рани та витримувати потужні удари.',
    en: 'Resilient protector with high HP who heals wounds and absorbs heavy enemy blows.',
  },
  lore: {
    uk: 'Рукоположений у каплиці Ордену Рун, Лоріан зберігає уламок першого світанкового знамена. Він вірить, що світло Печаток здатне очистити навіть Безодню.',
    en: 'Anointed at the Chapel of the Rune Order, Lorian carries a shard of the First Dawn banner, sworn to cleanse the Abyss with the Three Seals.',
  },
  portraitPath: '/src/assets/images/hero_04_paladin_1795553562654.jpg',
  startingRegionId: 'reg_sunspire_vale',
  startingLocationId: 'loc_04',
  baseStats: {
    hp: 6,
    maxHp: HERO_STAT_LIMITS.maxHp,
    strength: 4,
    intellect: 3,
    fate: 2,
    armor: 2,
    gold: 14,
    experience: 1,
    actionsPerTurn: 2,
  },
  startingEquipment: {
    weapon: 'card_015',
    armor: 'card_033',
    talisman: null,
  },
  startingResources: {
    gold: 14,
    experience: 1,
    cards: ['card_092'],
    description: {
      uk: '14 золота, 1 досвіду, Пернач сонячного ордену, Лати срібного бастіону, Молитва ранкового світла.',
      en: '14 Gold, 1 XP, Sunorder Flanged Mace, Silver Bastion Brigandine, Prayer of Morning Light.',
    },
  },
  abilityName: { uk: 'Священний оплот', en: 'Sacred Bulwark' },
  abilityDescription: {
    uk: 'Відновлює 2 HP (до макс. 10) та дає +2 до захисту на поточний хід.',
    en: 'Restores 2 HP (up to 10) and grants +2 Defense for this turn.',
  },
  abilityType: 'paladin_bulwark',
};
