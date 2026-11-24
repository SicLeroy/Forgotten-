import { CardDefinition } from '../../types/game';

export const LEGENDARY_ARTIFACT_CARDS: CardDefinition[] = [
  {
    id: 'card_146',
    name: {
      uk: 'Меч Вічного Світанку',
      en: 'Blade of Eternal Dawn',
    },
    description: {
      uk: 'Легендарний сонячний клинок древніх королів. +4 Сила, +2 Доля, +2 до атаки в бою.',
      en: 'Legendary solar blade of ancient kings. +4 Strength, +2 Fate, +2 Combat Attack.',
    },
    category: 'legendary_artifact',
    rarity: 'legendary',
    activationCondition: {
      type: 'equip_weapon',
      description: {
        uk: 'Екіпірується в слот основної зброї.',
        en: 'Equip in the primary weapon slot.',
      },
    },
    duration: {
      type: 'equipped',
      description: {
        uk: 'Постійний ефект, доки клинок у руках героя.',
        en: 'Permanent bonus while equipped.',
      },
    },
    discardCondition: {
      type: 'never_discarded_unless_sold',
      description: {
        uk: 'Не витрачається; можна зняти в інвентар або продати.',
        en: 'Never consumed; may be unequipped or sold.',
      },
    },
    logText: {
      uk: 'Герой підносить легендарний «Меч Вічного Світанку»!',
      en: 'Hero wields the legendary "Blade of Eternal Dawn"!',
    },
    equipSlot: 'weapon',
    goldCost: 55,
    combatOnly: false,
    effect: {
      bonusStrength: 4,
      bonusFate: 2,
      bonusAttack: 2,
    },
  },
  {
    id: 'card_147',
    name: {
      uk: 'Егіда Забутого Королівства',
      en: 'Aegis of the Forgotten Realm',
    },
    description: {
      uk: 'Незламний священний обладунок Перших Вартових. +5 Броня, +2 Інтелект, +1 Сила.',
      en: 'Unbreakable sacred armor of the First Wardens. +5 Armor, +2 Intellect, +1 Strength.',
    },
    category: 'legendary_artifact',
    rarity: 'legendary',
    activationCondition: {
      type: 'equip_armor',
      description: {
        uk: 'Екіпірується в слот обладунку.',
        en: 'Equip in the armor slot.',
      },
    },
    duration: {
      type: 'equipped',
      description: {
        uk: 'Постійний захист, доки обладунок одягнений.',
        en: 'Permanent protection while equipped.',
      },
    },
    discardCondition: {
      type: 'replace_or_sell',
      description: {
        uk: 'Не витрачається; знімається в інвентар при заміні.',
        en: 'Never consumed; moves to inventory when replaced.',
      },
    },
    logText: {
      uk: 'Герой одягає легендарну «Егіду Забутого Королівства»!',
      en: 'Hero dons the legendary "Aegis of the Forgotten Realm"!',
    },
    equipSlot: 'armor',
    goldCost: 56,
    combatOnly: false,
    effect: {
      bonusDefense: 5,
      bonusIntellect: 2,
      bonusStrength: 1,
    },
  },
  {
    id: 'card_148',
    name: {
      uk: 'Корона Першої Печатки',
      en: 'Crown of the First Seal',
    },
    description: {
      uk: 'Мирний або бойовий артефакт: +2 Інтелект, +2 Доля, знімає всі прокляття та відновлює 4 HP.',
      en: 'Supreme relic: +2 Intellect, +2 Fate while carried or played, cleanses all curses and restores 4 HP.',
    },
    category: 'legendary_artifact',
    rarity: 'legendary',
    activationCondition: {
      type: 'any_phase_relic',
      description: {
        uk: 'Дає пасивний бонус у інвентарі або знімає всі прокляття при активації.',
        en: 'Grants passive stats in inventory or cleanses all curses on activation.',
      },
    },
    duration: {
      type: 'instant',
      description: {
        uk: 'Миттєве очищення та лікування при розіграші, або пасивно в інвентарі.',
        en: 'Instant cleanse and heal when played, or passive aura in inventory.',
      },
    },
    discardCondition: {
      type: 'discard_on_activate',
      description: {
        uk: 'Скидається після активації очищення чи продажу.',
        en: 'Discarded once activated for cleansing or sold.',
      },
    },
    logText: {
      uk: 'Сяйво «Корони Першої Печатки» розсіює будь-яку скверну!',
      en: 'Radiance of the "Crown of the First Seal" purges all corruption!',
    },
    equipSlot: null,
    goldCost: 52,
    combatOnly: false,
    effect: {
      bonusIntellect: 2,
      bonusFate: 2,
      healHp: 4,
      removeAllCurses: true,
    },
  },
  {
    id: 'card_149',
    name: {
      uk: 'Серце Світового Древа',
      en: 'Heart of the Worldtree',
    },
    description: {
      uk: 'Безцінне зерно життя: +6 HP, +1 Доля назавжди, +2 до досвіду та очищення прокляття.',
      en: 'Priceless seed of life: +6 HP, +1 Fate, +2 XP, and removes a curse.',
    },
    category: 'legendary_artifact',
    rarity: 'legendary',
    activationCondition: {
      type: 'any_time',
      description: {
        uk: 'Активується з руки або інвентарю у будь-яку мить.',
        en: 'Activate from hand or inventory at any moment.',
      },
    },
    duration: {
      type: 'instant',
      description: {
        uk: 'Миттєво відновлює сили та пробуджує стародавню мудрість.',
        en: 'Instantly revitalizes the hero and grants ancient insight.',
      },
    },
    discardCondition: {
      type: 'discard_after_use',
      description: {
        uk: 'Переходить у скид після активації.',
        en: 'Moves to discard pile after use.',
      },
    },
    logText: {
      uk: '«Серце Світового Древа» наповнює героя життєвою силою!',
      en: '"Heart of the Worldtree" surges through the hero with vital energy!',
    },
    equipSlot: null,
    goldCost: 54,
    combatOnly: false,
    effect: {
      healHp: 6,
      bonusFate: 1,
      bonusXp: 2,
      removeCurse: true,
    },
  },
  {
    id: 'card_150',
    name: {
      uk: 'Небесна Астролябія Порожнечі',
      en: 'Celestial Void Astrolabe',
    },
    description: {
      uk: 'Обертає хід часу: +2 додаткові дії, +2 карти в руку, +3 тимчасової атаки та 5 шкоди ворогу в бою.',
      en: 'Bends time itself: +2 actions, draw 2 cards, +3 temp attack, and deals 5 damage in combat.',
    },
    category: 'legendary_artifact',
    rarity: 'legendary',
    activationCondition: {
      type: 'any_phase',
      description: {
        uk: 'Можна застосувати як у мирний хід, так і в розпалі бою.',
        en: 'May be played in peace or during active combat.',
      },
    },
    duration: {
      type: 'turn',
      description: {
        uk: 'Діє до кінця поточного ходу та миттєво вражає ворога в бою.',
        en: 'Lasts until end of turn and immediately strikes combat foes.',
      },
    },
    discardCondition: {
      type: 'discard_after_use',
      description: {
        uk: 'Скидається після розіграшу.',
        en: 'Discarded after resolution.',
      },
    },
    logText: {
      uk: '«Небесна Астролябія Порожнечі» викривляє саму тканину ходу!',
      en: '"Celestial Void Astrolabe" warps the flow of the turn!',
    },
    equipSlot: null,
    goldCost: 58,
    combatOnly: false,
    effect: {
      extraActions: 2,
      drawCards: 2,
      bonusAttack: 3,
      damageEnemy: 5,
    },
  },
];
