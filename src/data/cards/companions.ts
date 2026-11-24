import { CardDefinition, CardRarity } from '../../types/game';

interface CompanionSpec {
  id: string;
  uk: string;
  en: string;
  rarity: CardRarity;
  cost: number;
  strength?: number;
  intellect?: number;
  fate?: number;
  armor?: number;
  attack?: number;
  goldPerTurn?: number;
  healPerTurn?: number;
  descUk: string;
  descEn: string;
}

const COMPANION_SPECS: CompanionSpec[] = [
  {
    id: 'card_111',
    uk: 'Борко, верховинський розвідник',
    en: 'Borko, Highland Scout',
    rarity: 'common',
    cost: 15,
    strength: 1,
    fate: 1,
    descUk: 'Знає гірські стежки та засідки. +1 Сила, +1 Доля.',
    descEn: 'Knows highland trails and ambushes. +1 Strength, +1 Fate.',
  },
  {
    id: 'card_112',
    uk: 'Мірелла, архівістка руїн',
    en: 'Mirella, Ruins Archivist',
    rarity: 'common',
    cost: 16,
    intellect: 2,
    descUk: 'Розшифровує стародавні написи. +2 до Інтелекту.',
    descEn: 'Deciphers forgotten inscriptions. +2 Intellect.',
  },
  {
    id: 'card_113',
    uk: 'Гаррик, щитоносець гільдії',
    en: 'Garrik, Guild Shieldbearer',
    rarity: 'common',
    cost: 16,
    armor: 2,
    descUk: 'Приймає перший удар на дубовий щит. +2 до Броні.',
    descEn: 'Catches the opening strike on an oak shield. +2 Armor.',
  },
  {
    id: 'card_114',
    uk: 'Соловейко, мандрівний скарбник',
    en: 'Lark, Traveling Purser',
    rarity: 'common',
    cost: 14,
    goldPerTurn: 2,
    fate: 1,
    descUk: 'Виторговує кращі ціни та знаходить монети. +1 Доля, +2 золота щоходу.',
    descEn: 'Haggles sharp prices and finds stray coin. +1 Fate, +2 Gold per turn.',
  },
  {
    id: 'card_115',
    uk: 'Сестра Олена, травниця світанку',
    en: 'Sister Olena, Dawn Herbalist',
    rarity: 'uncommon',
    cost: 20,
    healPerTurn: 1,
    intellect: 1,
    descUk: 'Перев’язує рани на привалі. +1 Інтелект, +1 HP на початку ходу.',
    descEn: 'Binds wounds at every camp. +1 Intellect, +1 HP at turn start.',
  },
  {
    id: 'card_116',
    uk: 'Срібний вовк Іскра',
    en: 'Spark, Silver Timberwolf',
    rarity: 'uncommon',
    cost: 19,
    strength: 1,
    attack: 1,
    fate: 1,
    descUk: 'Вірний звір атакує разом із героєм. +1 Сила, +1 Доля, +1 до атаки.',
    descEn: 'Loyal beast lunges beside you. +1 Strength, +1 Fate, +1 Attack.',
  },
  {
    id: 'card_117',
    uk: 'Торін, коваль похідної кузні',
    en: 'Torin, Field Ironsmith',
    rarity: 'uncommon',
    cost: 21,
    strength: 1,
    armor: 1,
    attack: 1,
    descUk: 'Гострить клинок і латає панцир. +1 Сила, +1 Броня, +1 до атаки.',
    descEn: 'Hones blades and patches plates on the march. +1 Strength, +1 Armor, +1 Attack.',
  },
  {
    id: 'card_118',
    uk: 'Аелін, сокіл-вісник',
    en: 'Aelin, Messenger Falcon',
    rarity: 'uncommon',
    cost: 18,
    fate: 2,
    descUk: 'Оглядає обрій із небес. +2 до Долі.',
    descEn: 'Scouts the horizon from high above. +2 Fate.',
  },
  {
    id: 'card_119',
    uk: 'Брат Касіан, клірик очищення',
    en: 'Brother Cassian, Purifier Cleric',
    rarity: 'uncommon',
    cost: 22,
    intellect: 1,
    armor: 1,
    healPerTurn: 1,
    descUk: 'Читає молитви захисту. +1 Інтелект, +1 Броня, +1 HP щоходу.',
    descEn: 'Chants wards of preservation. +1 Intellect, +1 Armor, +1 HP per turn.',
  },
  {
    id: 'card_120',
    uk: 'Раґнар, ветеран облог',
    en: 'Ragnar, Siege Veteran',
    rarity: 'rare',
    cost: 26,
    strength: 2,
    armor: 1,
    descUk: 'Безстрашний боєць авангарду. +2 Сила, +1 Броня.',
    descEn: 'Fearless vanguard fighter. +2 Strength, +1 Armor.',
  },
  {
    id: 'card_121',
    uk: 'Веспер, чарівниця іскор',
    en: 'Vesper, Spark Enchantress',
    rarity: 'rare',
    cost: 27,
    intellect: 2,
    attack: 1,
    descUk: 'Підсилює кожен випад чарами вогню. +2 Інтелект, +1 до атаки.',
    descEn: 'Laces every strike with ember sparks. +2 Intellect, +1 Attack.',
  },
  {
    id: 'card_122',
    uk: 'Джед, майстер-торговець гільдії',
    en: 'Jed, Guild Quartermaster',
    rarity: 'rare',
    cost: 24,
    goldPerTurn: 4,
    armor: 1,
    descUk: 'Веде обоз і забезпечує постачання. +1 Броня, +4 золота щоходу.',
    descEn: 'Runs supply lines and escrows. +1 Armor, +4 Gold per turn.',
  },
  {
    id: 'card_123',
    uk: 'Люміна, дух світляного ліхтаря',
    en: 'Lumina, Lantern Wisp',
    rarity: 'rare',
    cost: 26,
    intellect: 1,
    fate: 1,
    healPerTurn: 1,
    descUk: 'Розганяє темряву й лікує рани. +1 Інтелект, +1 Доля, +1 HP щоходу.',
    descEn: 'Dispels gloom and mends minor wounds. +1 Intellect, +1 Fate, +1 HP per turn.',
  },
  {
    id: 'card_124',
    uk: 'Валькірія попелястого легіону',
    en: 'Valkyrie of the Ashen Legion',
    rarity: 'rare',
    cost: 30,
    strength: 2,
    attack: 2,
    descUk: 'Крилатий охоронець б’є без промаху. +2 Сила, +2 до атаки в бою.',
    descEn: 'Winged champion striking beside the hero. +2 Strength, +2 Combat Attack.',
  },
  {
    id: 'card_125',
    uk: 'Елдріс, старійшина срібних друїдів',
    en: 'Eldris, Silver Druid Elder',
    rarity: 'rare',
    cost: 31,
    intellect: 2,
    fate: 1,
    healPerTurn: 1,
    goldPerTurn: 1,
    descUk: 'Мудрий союзник гармонії: +2 Інтелект, +1 Доля, +1 HP та +1 золото щоходу.',
    descEn: 'Wise ally of balance: +2 Intellect, +1 Fate, +1 HP and +1 Gold per turn.',
  },
];

export const COMPANION_CARDS: CardDefinition[] = COMPANION_SPECS.map((c) => ({
  id: c.id,
  name: { uk: c.uk, en: c.en },
  description: { uk: c.descUk, en: c.descEn },
  category: 'companion',
  rarity: c.rarity,
  activationCondition: {
    type: 'recruit_companion',
    description: {
      uk: 'Найміть у загін із руки або ринку (максимум 3 супутники).',
      en: 'Recruit into your party from hand or market (max 3 companions).',
    },
  },
  duration: {
    type: 'permanent_companion',
    description: {
      uk: 'Супроводжує героя постійно, доки не буде відпущений.',
      en: 'Follows the hero permanently until dismissed.',
    },
  },
  discardCondition: {
    type: 'dismiss_companion',
    description: {
      uk: 'Скидається при звільненні місця для нового супутника.',
      en: 'Discarded if dismissed to free a companion slot.',
    },
  },
  logText: {
    uk: `Супутник «${c.uk}» приєднується до загону героя!`,
    en: `Companion "${c.en}" joins the hero's party!`,
  },
  equipSlot: null,
  goldCost: c.cost,
  combatOnly: false,
  effect: {
    companionBonus: {
      ...(c.strength ? { strength: c.strength } : {}),
      ...(c.intellect ? { intellect: c.intellect } : {}),
      ...(c.fate ? { fate: c.fate } : {}),
      ...(c.armor ? { armor: c.armor } : {}),
      ...(c.attack ? { attack: c.attack } : {}),
      ...(c.goldPerTurn ? { goldPerTurn: c.goldPerTurn } : {}),
      ...(c.healPerTurn ? { healPerTurn: c.healPerTurn } : {}),
    },
  },
}));
