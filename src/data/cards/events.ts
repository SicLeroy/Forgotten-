import { CardDefinition } from '../../types/game';

export const EVENT_CARDS: CardDefinition[] = [
  {
    id: 'card_126',
    name: { uk: 'Караван соляного шляху', en: 'Saltroad Merchant Caravan' },
    description: {
      uk: 'Мандрівні купці дарують припаси й оновлюють товари на ринку: +12 золота та 1 карта в руку.',
      en: 'Traveling merchants share supplies and refresh market wares: +12 Gold and draw 1 card.',
    },
    category: 'event',
    rarity: 'common',
    activationCondition: {
      type: 'explore_event',
      description: { uk: 'Активується при витягуванні з колоди пригод.', en: 'Triggers when drawn from the Adventure Deck.' },
    },
    duration: {
      type: 'instant',
      description: { uk: 'Миттєва дорожня подія.', en: 'Instant road event.' },
    },
    discardCondition: {
      type: 'adventure_discard',
      description: { uk: 'Скидається у відбій пригод після завершення.', en: 'Placed in the adventure discard pile once resolved.' },
    },
    logText: {
      uk: 'Подія: «Караван соляного шляху» приносить +12 золота та карту!',
      en: 'Event: "Saltroad Merchant Caravan" grants +12 Gold and 1 card!',
    },
    equipSlot: null,
    goldCost: 0,
    combatOnly: false,
    effect: { bonusGold: 12, drawCards: 1 },
  },
  {
    id: 'card_127',
    name: { uk: 'Раптова злива над долиною', en: 'Sudden Valley Cloudburst' },
    description: {
      uk: 'Погода змінюється на Зливу, але мандрівник знаходить 6 золотих у розмитій колії.',
      en: 'Weather shifts to Heavy Rain, yet you spot 6 Gold in the washed-out track.',
    },
    category: 'event',
    rarity: 'common',
    activationCondition: {
      type: 'explore_event',
      description: { uk: 'Активується при дослідженні локації.', en: 'Triggers when exploring a location.' },
    },
    duration: {
      type: 'instant',
      description: { uk: 'Миттєва зміна погоди.', en: 'Instant weather shift.' },
    },
    discardCondition: {
      type: 'adventure_discard',
      description: { uk: 'Після активації потрапляє у відбій пригод.', en: 'Moves to adventure discard after resolving.' },
    },
    logText: {
      uk: 'Подія: «Раптова злива над долиною» — погода стає дощовою, знайдено +6 золота.',
      en: 'Event: "Sudden Valley Cloudburst" shifts weather to Rain and yields +6 Gold.',
    },
    equipSlot: null,
    goldCost: 0,
    combatOnly: false,
    effect: { weatherShift: 'rain', bonusGold: 6 },
  },
  {
    id: 'card_128',
    name: { uk: 'Джерело чистого світанку', en: 'Spring of Clear Dawn' },
    description: {
      uk: 'Цілюща вода знімає втому й очищує душу: +3 HP та зняття 1 прокляття.',
      en: 'Healing spring washes away fatigue and malice: +3 HP and cleanses 1 curse.',
    },
    category: 'event',
    rarity: 'uncommon',
    activationCondition: {
      type: 'explore_event',
      description: { uk: 'Активується при витягуванні під час дослідження.', en: 'Triggers when drawn during exploration.' },
    },
    duration: {
      type: 'instant',
      description: { uk: 'Миттєве зцілення й очищення.', en: 'Instant healing and cleansing.' },
    },
    discardCondition: {
      type: 'adventure_discard',
      description: { uk: 'Скидається у відбій пригод.', en: 'Discarded to adventure discard.' },
    },
    logText: {
      uk: 'Подія: «Джерело чистого світанку» відновлює +3 HP та знімає прокляття!',
      en: 'Event: "Spring of Clear Dawn" restores +3 HP and cleanses a curse!',
    },
    equipSlot: null,
    goldCost: 0,
    combatOnly: false,
    effect: { healHp: 3, removeCurse: true, weatherShift: 'clear' },
  },
  {
    id: 'card_129',
    name: { uk: 'Попелястий шквал з ущелини', en: 'Gorge Ash Gale' },
    description: {
      uk: 'Погода змінюється на Попелясту бурю, але вітер відкриває давній сувій (+1 досвіду, +1 карта).',
      en: 'Weather turns to Ash Storm, yet the wind uncovers an ancient scroll (+1 XP, +1 card).',
    },
    category: 'event',
    rarity: 'uncommon',
    activationCondition: {
      type: 'explore_event',
      description: { uk: 'Спрацьовує при виході з колоди пригод.', en: 'Triggers when drawn from Adventure Deck.' },
    },
    duration: {
      type: 'instant',
      description: { uk: 'Зміна погоди та нагорода.', en: 'Weather change and discovery.' },
    },
    discardCondition: {
      type: 'adventure_discard',
      description: { uk: 'Переходить у відбій пригод.', en: 'Sent to adventure discard.' },
    },
    logText: {
      uk: 'Подія: «Попелястий шквал з ущелини» — буря попелу, але знайдено +1 досвіду і карту.',
      en: 'Event: "Gorge Ash Gale" brings Ash Storm yet grants +1 XP and 1 card.',
    },
    equipSlot: null,
    goldCost: 0,
    combatOnly: false,
    effect: { weatherShift: 'ash_storm', bonusXp: 1, drawCards: 1 },
  },
  {
    id: 'card_130',
    name: { uk: 'Зустріч із мандрівним літописцем', en: 'Wandering Chronicler Encounter' },
    description: {
      uk: 'Мудрець записує ваші подвиги й ділиться порадами: +2 досвіду та +1 додаткова дія.',
      en: 'A sage records your deeds and offers tactical counsel: +2 XP and +1 extra action.',
    },
    category: 'event',
    rarity: 'uncommon',
    activationCondition: {
      type: 'explore_event',
      description: { uk: 'Активується при відкритті карти події.', en: 'Activates upon drawing this event.' },
    },
    duration: {
      type: 'turn',
      description: { uk: 'Бонус дії зберігається до кінця ходу.', en: 'Bonus action lasts for the current turn.' },
    },
    discardCondition: {
      type: 'adventure_discard',
      description: { uk: 'Скидається у відбій пригод.', en: 'Moved to adventure discard.' },
    },
    logText: {
      uk: 'Подія: літописець дарує +2 досвіду та +1 додаткову дію!',
      en: 'Event: the chronicler grants +2 XP and +1 extra action!',
    },
    equipSlot: null,
    goldCost: 0,
    combatOnly: false,
    effect: { bonusXp: 2, extraActions: 1 },
  },
  {
    id: 'card_131',
    name: { uk: 'Крижаний буран півночі', en: 'Northern Frost Squall' },
    description: {
      uk: 'Холод сковує дороги (Крижаний вітер), але надихає на пильність (+1 Доля).',
      en: 'Chill locks the trails (Frost Wind), sharpening vigilance (+1 Fate).',
    },
    category: 'event',
    rarity: 'common',
    activationCondition: {
      type: 'explore_event',
      description: { uk: 'Активується при дослідженні.', en: 'Triggers during exploration.' },
    },
    duration: {
      type: 'instant',
      description: { uk: 'Миттєва подія погоди.', en: 'Immediate weather event.' },
    },
    discardCondition: {
      type: 'adventure_discard',
      description: { uk: 'Скидається у відбій пригод.', en: 'Sent to adventure discard.' },
    },
    logText: {
      uk: 'Подія: «Крижаний буран півночі» змінює погоду та додає +1 Долі.',
      en: 'Event: "Northern Frost Squall" shifts weather and adds +1 Fate.',
    },
    equipSlot: null,
    goldCost: 0,
    combatOnly: false,
    effect: { weatherShift: 'frost_wind', bonusFate: 1 },
  },
  {
    id: 'card_132',
    name: { uk: 'Табір найманців без прапора', en: 'Bannerless Mercenary Camp' },
    description: {
      uk: 'Найманці діляться зброярським точилом і картами дозорів: +2 тимч. атаки та +2 карти.',
      en: 'Mercenaries share whetstones and scout maps: +2 Temp Attack and draw 2 cards.',
    },
    category: 'event',
    rarity: 'uncommon',
    activationCondition: {
      type: 'explore_event',
      description: { uk: 'Витягується під час дослідження.', en: 'Drawn during location exploration.' },
    },
    duration: {
      type: 'turn',
      description: { uk: 'Бонус атаки триває до кінця ходу.', en: 'Attack bonus lasts until turn end.' },
    },
    discardCondition: {
      type: 'adventure_discard',
      description: { uk: 'Скидається після застосування.', en: 'Discarded after resolving.' },
    },
    logText: {
      uk: 'Подія: «Табір найманців без прапора» дає +2 до атаки і 2 карти!',
      en: 'Event: "Bannerless Mercenary Camp" grants +2 Attack and 2 cards!',
    },
    equipSlot: null,
    goldCost: 0,
    combatOnly: false,
    effect: { bonusAttack: 2, drawCards: 2 },
  },
  {
    id: 'card_133',
    name: { uk: 'Густий передранковий туман', en: 'Dense Pre-Dawn Mist' },
    description: {
      uk: 'Погода стає туманною, але в безпечній тиші герой відпочиває (+2 HP, +1 до захисту).',
      en: 'Weather becomes Mist, letting the hero catch breath (+2 HP, +1 Temp Defense).',
    },
    category: 'event',
    rarity: 'common',
    activationCondition: {
      type: 'explore_event',
      description: { uk: 'Активується автоматично з колоди пригод.', en: 'Triggers automatically from the Adventure Deck.' },
    },
    duration: {
      type: 'turn',
      description: { uk: 'Захисний бонус триває до кінця ходу.', en: 'Defense bonus lasts until end of turn.' },
    },
    discardCondition: {
      type: 'adventure_discard',
      description: { uk: 'Переходить у відбій пригод.', en: 'Placed in adventure discard.' },
    },
    logText: {
      uk: 'Подія: густий туман дарує перепочинок (+2 HP, +1 захисту).',
      en: 'Event: thick mist offers respite (+2 HP, +1 Defense).',
    },
    equipSlot: null,
    goldCost: 0,
    combatOnly: false,
    effect: { weatherShift: 'mist', healHp: 2, bonusDefense: 1 },
  },
  {
    id: 'card_134',
    name: { uk: 'Затемнення Порожнечі над вежами', en: 'Void Eclipse Over the Spires' },
    description: {
      uk: 'Небо темніє (Затемнення Порожнечі), але магія загострюється: +2 досвіду й +1 Доля.',
      en: 'Skies darken (Void Eclipse), sharpening arcane resolve: +2 XP and +1 Fate.',
    },
    category: 'event',
    rarity: 'rare',
    activationCondition: {
      type: 'explore_event',
      description: { uk: 'Спрацьовує при витягуванні з колоди пригод.', en: 'Triggers when drawn from Adventure Deck.' },
    },
    duration: {
      type: 'instant',
      description: { uk: 'Негайний вплив знамення.', en: 'Immediate omen effect.' },
    },
    discardCondition: {
      type: 'adventure_discard',
      description: { uk: 'Скидається після розіграшу.', en: 'Discarded after resolving.' },
    },
    logText: {
      uk: 'Подія: «Затемнення Порожнечі над вежами» дає +2 досвіду і +1 Долі.',
      en: 'Event: "Void Eclipse Over the Spires" grants +2 XP and +1 Fate.',
    },
    equipSlot: null,
    goldCost: 0,
    combatOnly: false,
    effect: { weatherShift: 'void_eclipse', bonusXp: 2, bonusFate: 1 },
  },
  {
    id: 'card_135',
    name: { uk: 'Великий ярмарок вільних гільдій', en: 'Grand Free-Guild Fair' },
    description: {
      uk: 'Нагорода від гільдій: +18 золота, +1 карта та миттєве оновлення ринку.',
      en: 'Guild patronage: +18 Gold, draw 1 card, and immediate market restock.',
    },
    category: 'event',
    rarity: 'rare',
    activationCondition: {
      type: 'explore_event',
      description: { uk: 'Активується при відкритті під час дослідження.', en: 'Activates upon exploration draw.' },
    },
    duration: {
      type: 'instant',
      description: { uk: 'Миттєва нагорода гільдії.', en: 'Instant guild reward.' },
    },
    discardCondition: {
      type: 'adventure_discard',
      description: { uk: 'Переходить у відбій пригод.', en: 'Moves to adventure discard.' },
    },
    logText: {
      uk: 'Подія: «Великий ярмарок вільних гільдій» — +18 золота, +1 карта та нові товари!',
      en: 'Event: "Grand Free-Guild Fair" grants +18 Gold, +1 card, and fresh wares!',
    },
    equipSlot: null,
    goldCost: 0,
    combatOnly: false,
    effect: { bonusGold: 18, drawCards: 1 },
  },
];
