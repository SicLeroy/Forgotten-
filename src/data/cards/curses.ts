import { CardDefinition } from '../../types/game';

export const CURSE_CARDS: CardDefinition[] = [
  {
    id: 'card_136',
    name: { uk: 'Прокляття залізних пут', en: 'Curse of Iron Shackles' },
    description: {
      uk: 'Невидимі кайдани сковують м’язи: -1 до Сили та -1 до Броні, доки прокляття не знято.',
      en: 'Spectral shackles weigh down every swing: -1 Strength and -1 Armor until cleansed.',
    },
    category: 'curse',
    rarity: 'uncommon',
    activationCondition: {
      type: 'curse_attach',
      description: { uk: 'Накладається при витягуванні або провалі небезпечної пригоди.', en: 'Attaches when drawn or upon failing a perilous adventure.' },
    },
    duration: {
      type: 'until_cleansed',
      description: { uk: 'Залишається активним до очищення закляттям, предметом чи у Святилищі.', en: 'Persists until removed by a spell, item, or Shrine purification.' },
    },
    discardCondition: {
      type: 'cleansed',
      description: { uk: 'Скидається після очищення прокляття.', en: 'Discarded once purified.' },
    },
    logText: {
      uk: 'Прокляття! «Прокляття залізних пут» зменшує Силу і Броню на 1.',
      en: 'Curse! "Curse of Iron Shackles" reduces Strength and Armor by 1.',
    },
    equipSlot: null,
    goldCost: 0,
    combatOnly: false,
    effect: {
      cursePenalty: { strengthDelta: -1, armorDelta: -1 },
    },
  },
  {
    id: 'card_137',
    name: { uk: 'Шепіт туманного забуття', en: 'Whisper of Mist Oblivion' },
    description: {
      uk: 'Думки плутаються в мороці: -2 до Інтелекту, доки скверну не очищено.',
      en: 'Thoughts tangle in cold fog: -2 Intellect until cleansed.',
    },
    category: 'curse',
    rarity: 'uncommon',
    activationCondition: {
      type: 'curse_attach',
      description: { uk: 'Автоматично чіпляється до героя при появі.', en: 'Automatically afflicts the hero when triggered.' },
    },
    duration: {
      type: 'until_cleansed',
      description: { uk: 'Діє до зняття прокляття.', en: 'Remains until cleansed.' },
    },
    discardCondition: {
      type: 'cleansed',
      description: { uk: 'Видаляється обрядом очищення або зіллям.', en: 'Removed via cleansing ritual or potion.' },
    },
    logText: {
      uk: 'Прокляття! «Шепіт туманного забуття» знижує Інтелект на 2.',
      en: 'Curse! "Whisper of Mist Oblivion" lowers Intellect by 2.',
    },
    equipSlot: null,
    goldCost: 0,
    combatOnly: false,
    effect: {
      cursePenalty: { intellectDelta: -2 },
    },
  },
  {
    id: 'card_138',
    name: { uk: 'Тінь розбитого дзеркала', en: 'Shadow of the Shattered Mirror' },
    description: {
      uk: 'Удача відвертається від героя: -1 до Долі та -1 до Інтелекту до очищення.',
      en: 'Fortune turns sour: -1 Fate and -1 Intellect until cleansed.',
    },
    category: 'curse',
    rarity: 'uncommon',
    activationCondition: {
      type: 'curse_attach',
      description: { uk: 'Вступає в дію негайно при отриманні карти.', en: 'Takes hold immediately upon affliction.' },
    },
    duration: {
      type: 'until_cleansed',
      description: { uk: 'Зникає лише після очищення.', en: 'Lasts until purified.' },
    },
    discardCondition: {
      type: 'cleansed',
      description: { uk: 'Скидається після зняття прокляття.', en: 'Discarded when cleansed.' },
    },
    logText: {
      uk: 'Прокляття! «Тінь розбитого дзеркала» забирає 1 Долю і 1 Інтелект.',
      en: 'Curse! "Shadow of the Shattered Mirror" drains 1 Fate and 1 Intellect.',
    },
    equipSlot: null,
    goldCost: 0,
    combatOnly: false,
    effect: {
      cursePenalty: { fateDelta: -1, intellectDelta: -1 },
    },
  },
  {
    id: 'card_139',
    name: { uk: 'Кровоточива мітка попелу', en: 'Bleeding Ashen Brand' },
    description: {
      uk: 'Пекуча рана не загоюється сама: -1 HP на початку кожного ходу героя до очищення.',
      en: 'A smoldering brand refuses to close: -1 HP at the start of each hero turn until cleansed.',
    },
    category: 'curse',
    rarity: 'rare',
    activationCondition: {
      type: 'curse_attach',
      description: { uk: 'Накладається під час дослідження темних земель.', en: 'Inflicted while exploring shadowed realms.' },
    },
    duration: {
      type: 'until_cleansed',
      description: { uk: 'Спрацьовує на кожному початку ходу, доки не знято.', en: 'Ticks at turn start until purified.' },
    },
    discardCondition: {
      type: 'cleansed',
      description: { uk: 'Скидається заклинанням, амулетом або у Святилищі.', en: 'Removed by spell, charm, or Shrine.' },
    },
    logText: {
      uk: 'Прокляття! «Кровоточива мітка попелу» виснажуватиме -1 HP щоходу.',
      en: 'Curse! "Bleeding Ashen Brand" will drain 1 HP each turn.',
    },
    equipSlot: null,
    goldCost: 0,
    combatOnly: false,
    effect: {
      cursePenalty: { hpDrainPerTurn: 1 },
    },
  },
  {
    id: 'card_140',
    name: { uk: 'Лихоманка іржавого золота', en: 'Rustgold Greed Fever' },
    description: {
      uk: 'Монети тануть у проклятому гаманці: -3 золота щоходу до очищення.',
      en: 'Coins crumble to dust in your pouch: loses 3 Gold each turn until cleansed.',
    },
    category: 'curse',
    rarity: 'common',
    activationCondition: {
      type: 'curse_attach',
      description: { uk: 'Накладається при провалі жадібної спокуси або засідці.', en: 'Attaches upon temptation or ambush.' },
    },
    duration: {
      type: 'until_cleansed',
      description: { uk: 'Діє на початку кожного ходу.', en: 'Triggers at the start of every turn.' },
    },
    discardCondition: {
      type: 'cleansed',
      description: { uk: 'Зникає після очищення прокляття.', en: 'Cleared upon curse removal.' },
    },
    logText: {
      uk: 'Прокляття! «Лихоманка іржавого золота» нищить по 3 золоті щоходу.',
      en: 'Curse! "Rustgold Greed Fever" corrodes 3 Gold per turn.',
    },
    equipSlot: null,
    goldCost: 0,
    combatOnly: false,
    effect: {
      cursePenalty: { goldDrainPerTurn: 3 },
    },
  },
  {
    id: 'card_141',
    name: { uk: 'Іній розколотого щита', en: 'Rime of the Cracked Shield' },
    description: {
      uk: 'Броня кришиться від холоду Порожнечі: -2 до Броні, доки прокляття не знято.',
      en: 'Void frost makes plates brittle: -2 Armor until cleansed.',
    },
    category: 'curse',
    rarity: 'uncommon',
    activationCondition: {
      type: 'curse_attach',
      description: { uk: 'Прикріплюється до героя при отриманні.', en: 'Attaches to the hero upon draw.' },
    },
    duration: {
      type: 'until_cleansed',
      description: { uk: 'Триває до повного зняття.', en: 'Persists until cleansed.' },
    },
    discardCondition: {
      type: 'cleansed',
      description: { uk: 'Скидається при очищенні.', en: 'Discarded when cleansed.' },
    },
    logText: {
      uk: 'Прокляття! «Іній розколотого щита» зменшує Броню на 2.',
      en: 'Curse! "Rime of the Cracked Shield" lowers Armor by 2.',
    },
    equipSlot: null,
    goldCost: 0,
    combatOnly: false,
    effect: {
      cursePenalty: { armorDelta: -2 },
    },
  },
  {
    id: 'card_142',
    name: { uk: 'Отрута сірого коріння', en: 'Greyroot Venombind' },
    description: {
      uk: 'Болотна отрута підточує витривалість: -1 Сила та -1 HP щоходу.',
      en: 'Swamp toxin saps vigor: -1 Strength and -1 HP per turn until cleansed.',
    },
    category: 'curse',
    rarity: 'rare',
    activationCondition: {
      type: 'curse_attach',
      description: { uk: 'Активується при витягуванні з колоди пригод.', en: 'Attaches when drawn from the Adventure Deck.' },
    },
    duration: {
      type: 'until_cleansed',
      description: { uk: 'Діє постійно й на старті ходу.', en: 'Continuous penalty and turn-start drain.' },
    },
    discardCondition: {
      type: 'cleansed',
      description: { uk: 'Скидається лише засобами зняття проклять.', en: 'Cleared only by curse-removal effects.' },
    },
    logText: {
      uk: 'Прокляття! «Отрута сірого коріння» дає -1 Сили і -1 HP щоходу.',
      en: 'Curse! "Greyroot Venombind" inflicts -1 Strength and -1 HP per turn.',
    },
    equipSlot: null,
    goldCost: 0,
    combatOnly: false,
    effect: {
      cursePenalty: { strengthDelta: -1, hpDrainPerTurn: 1 },
    },
  },
  {
    id: 'card_143',
    name: { uk: 'Морок воронячого пророцтва', en: 'Gloom of the Crow Prophecy' },
    description: {
      uk: 'Зловісні круки плутають стежки: -2 до Долі, доки закляття не очищено.',
      en: 'Ominous crows cloud your path: -2 Fate until cleansed.',
    },
    category: 'curse',
    rarity: 'rare',
    activationCondition: {
      type: 'curse_attach',
      description: { uk: 'Чіпляється при витягуванні карти прокляття.', en: 'Attaches immediately when drawn.' },
    },
    duration: {
      type: 'until_cleansed',
      description: { uk: 'Триває до обряду очищення.', en: 'Lasts until purified.' },
    },
    discardCondition: {
      type: 'cleansed',
      description: { uk: 'Видаляється після зняття прокляття.', en: 'Removed once cleansed.' },
    },
    logText: {
      uk: 'Прокляття! «Морок воронячого пророцтва» відбирає 2 очки Долі.',
      en: 'Curse! "Gloom of the Crow Prophecy" reduces Fate by 2.',
    },
    equipSlot: null,
    goldCost: 0,
    combatOnly: false,
    effect: {
      cursePenalty: { fateDelta: -2 },
    },
  },
  {
    id: 'card_144',
    name: { uk: 'Печатка скупої безодні', en: 'Signet of Miser’s Abyss' },
    description: {
      uk: 'Тягар жадоби й безсилля: -1 Сила та -2 золота на початку кожного ходу.',
      en: 'Burden of greed and frailty: -1 Strength and -2 Gold each turn.',
    },
    category: 'curse',
    rarity: 'common',
    activationCondition: {
      type: 'curse_attach',
      description: { uk: 'Накладається при контакті з проклятим скарбом.', en: 'Attaches upon touching cursed treasure.' },
    },
    duration: {
      type: 'until_cleansed',
      description: { uk: 'Залишається до очищення.', en: 'Persists until cleansed.' },
    },
    discardCondition: {
      type: 'cleansed',
      description: { uk: 'Скидається після очищення.', en: 'Discarded when cleansed.' },
    },
    logText: {
      uk: 'Прокляття! «Печатка скупої безодні» зменшує Силу і витягує золото щоходу.',
      en: 'Curse! "Signet of Miser’s Abyss" saps Strength and Gold each turn.',
    },
    equipSlot: null,
    goldCost: 0,
    combatOnly: false,
    effect: {
      cursePenalty: { strengthDelta: -1, goldDrainPerTurn: 2 },
    },
  },
  {
    id: 'card_145',
    name: { uk: 'Погляд Порожнечі крізь сон', en: 'Void’s Sleepless Gaze' },
    description: {
      uk: 'Важкий кошмар виснажує героя: -1 Інтелект, -1 Доля та -1 HP щоходу до очищення.',
      en: 'Relentless nightmare saps hero resolve: -1 Intellect, -1 Fate, -1 HP per turn until cleansed.',
    },
    category: 'curse',
    rarity: 'rare',
    activationCondition: {
      type: 'curse_attach',
      description: { uk: 'Прикріплюється при витягуванні в небезпечному регіоні.', en: 'Afflicts the hero when drawn.' },
    },
    duration: {
      type: 'until_cleansed',
      description: { uk: 'Триває до зняття прокляття в храмі чи заклинанням.', en: 'Lasts until purified by shrine or spell.' },
    },
    discardCondition: {
      type: 'cleansed',
      description: { uk: 'Скидається після зняття.', en: 'Discarded after cleansing.' },
    },
    logText: {
      uk: 'Прокляття! «Погляд Порожнечі крізь сон» гнітить розум, долю і здоров’я.',
      en: 'Curse! "Void’s Sleepless Gaze" drains mind, fate, and vitality.',
    },
    equipSlot: null,
    goldCost: 0,
    combatOnly: false,
    effect: {
      cursePenalty: { intellectDelta: -1, fateDelta: -1, hpDrainPerTurn: 1 },
    },
  },
];
