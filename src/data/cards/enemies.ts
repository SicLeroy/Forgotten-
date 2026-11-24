import { CardDefinition, CardRarity } from '../../types/game';

interface EnemyCardSpec {
  id: string;
  uk: string;
  en: string;
  rarity: CardRarity;
  hp: number;
  atk: number;
  def: number;
  gold: number;
  xp: number;
  traitUk: string;
  traitEn: string;
  descUk: string;
  descEn: string;
}

const ENEMY_CARD_SPECS: EnemyCardSpec[] = [
  { id: 'card_151', uk: 'Сірий лісовий вовк', en: 'Grey Timber Wolf', rarity: 'common', hp: 5, atk: 2, def: 1, gold: 5, xp: 1, traitUk: 'Швидкий випад', traitEn: 'Swift Lunge', descUk: 'Хижак західних лісів шукає здобич на стежках.', descEn: 'Predator of the western woods stalking lonely trails.' },
  { id: 'card_152', uk: 'Бродячий розбійник тракту', en: 'Highroad Footpad', rarity: 'common', hp: 6, atk: 2, def: 1, gold: 8, xp: 1, traitUk: 'Засідка біля мосту', traitEn: 'Bridge Ambush', descUk: 'Озброєний дубиною грабіжник вимагає мито.', descEn: 'Club-wielding brigand demanding illegal toll.' },
  { id: 'card_153', uk: 'Болотна п’явка-повзун', en: 'Bog Crawler Leech', rarity: 'common', hp: 5, atk: 1, def: 2, gold: 5, xp: 1, traitUk: 'Слизький панцир', traitEn: 'Slick Hide', descUk: 'Чіпляється за ноги мандрівників на переправах.', descEn: 'Lashes onto travelers crossing muddy fords.' },
  { id: 'card_154', uk: 'Дикий кабан-сікач', en: 'Tusked Razorboar', rarity: 'common', hp: 7, atk: 2, def: 2, gold: 6, xp: 1, traitUk: 'Лють тарана', traitEn: 'Charging Gore', descUk: 'Розлючений звір проламує підлісок.', descEn: 'Enraged beast crashing through dense brush.' },
  { id: 'card_155', uk: 'Кістяний лучник кургану', en: 'Barrow Bone Archer', rarity: 'common', hp: 5, atk: 3, def: 1, gold: 7, xp: 1, traitUk: 'Холодний постріл', traitEn: 'Cold Volley', descUk: 'Піднятий тінями стрілець древніх могильників.', descEn: 'Risen marksman guarding ancient burial mounds.' },
  { id: 'card_156', uk: 'Зграйний ворон-стерв’ятник', en: 'Carrion Dire-Raven', rarity: 'common', hp: 4, atk: 3, def: 0, gold: 5, xp: 1, traitUk: 'Наліт з неба', traitEn: 'Sky Dive', descUk: 'Велетенський чорний птах атакує очі й руки.', descEn: 'Oversized black bird diving at eyes and blades.' },
  { id: 'card_157', uk: 'Мідний голем сторожі', en: 'Brass Watch Golem', rarity: 'uncommon', hp: 8, atk: 2, def: 3, gold: 10, xp: 2, traitUk: 'Литий корпус', traitEn: 'Cast Plating', descUk: 'Автоматон забутих майстрів охороняє руїни.', descEn: 'Clockwork sentinel patrolling forgotten masonry.' },
  { id: 'card_158', uk: 'Тіньовий кинджальник культу', en: 'Cult Shadowblade', rarity: 'common', hp: 6, atk: 3, def: 1, gold: 9, xp: 1, traitUk: 'Нічний укол', traitEn: 'Night Thrust', descUk: 'Фанатик Порожнечі чатує біля перехресть.', descEn: 'Void cultist lurking beside shadowed crossroads.' },
  { id: 'card_159', uk: 'Гірська гарпія вітрів', en: 'Gale Mountain Harpy', rarity: 'common', hp: 6, atk: 3, def: 1, gold: 8, xp: 1, traitUk: 'Крик скель', traitEn: 'Cliff Shriek', descUk: 'Крилатий хижак скидає каміння з карнизів.', descEn: 'Winged predator hurling stones from ledges.' },
  { id: 'card_160', uk: 'Здичавілий найманець без честі', en: 'Oathless Sellsword', rarity: 'common', hp: 7, atk: 3, def: 2, gold: 11, xp: 1, traitUk: 'Брудний прийом', traitEn: 'Foul Feint', descUk: 'Дезертир у старій кольчузі шукає легкої наживи.', descEn: 'Chainmailed deserter hunting lone wanderers.' },
  { id: 'card_161', uk: 'Моховий троль ущелини', en: 'Mossy Ravine Troll', rarity: 'uncommon', hp: 9, atk: 3, def: 2, gold: 11, xp: 2, traitUk: 'Груба сила', traitEn: 'Brute Smash', descUk: 'Незграбний велетень із кам’яною палицею.', descEn: 'Lumbering brute swinging a boulder club.' },
  { id: 'card_162', uk: 'Привид затопленого порому', en: 'Sunken Ferry Wraith', rarity: 'uncommon', hp: 6, atk: 4, def: 2, gold: 10, xp: 2, traitUk: 'Крижаний дотик', traitEn: 'Frost Touch', descUk: 'Туманний дух виринає над чорною водою.', descEn: 'Misty spirit rising above dark river eddies.' },
  { id: 'card_163', uk: 'Отруйний павук-прядильник', en: 'Venomweaver Spider', rarity: 'common', hp: 5, atk: 3, def: 1, gold: 7, xp: 1, traitUk: 'Липка павутина', traitEn: 'Sticky Web', descUk: 'Плете пастки між старими дубами й колонами.', descEn: 'Spins snares between ancient oaks and pillars.' },
  { id: 'card_164', uk: 'Залізний людожер прикордоння', en: 'Borderland Ogre', rarity: 'uncommon', hp: 10, atk: 3, def: 2, gold: 12, xp: 2, traitUk: 'Важкий замах', traitEn: 'Heavy Cleave', descUk: 'Величезний громила з кованим тесаком.', descEn: 'Towering ogre hauling a forged cleaver.' },
  { id: 'card_165', uk: 'Гнилий упир цвинтаря', en: 'Graveyard Ghoul', rarity: 'common', hp: 6, atk: 3, def: 1, gold: 7, xp: 1, traitUk: 'Чумні кігті', traitEn: 'Foul Claws', descUk: 'Нишпорить серед розбитих надгробків.', descEn: 'Prowls between shattered tombstones at dusk.' },
  { id: 'card_166', uk: 'Кам’яний ящір кар’єру', en: 'Quarry Basilisk', rarity: 'uncommon', hp: 8, atk: 3, def: 3, gold: 11, xp: 2, traitUk: 'Кам’яний погляд', traitEn: 'Stone Glare', descUk: 'Броньована рептилія ховається у вапняку.', descEn: 'Armored reptile coiled among quarry slabs.' },
  { id: 'card_167', uk: 'Червоний біс-підпалювач', en: 'Crimson Fire-Imp', rarity: 'common', hp: 5, atk: 4, def: 1, gold: 8, xp: 1, traitUk: 'Іскровий плювок', traitEn: 'Cinder Spit', descUk: 'Маленький демон кидає жмені жару.', descEn: 'Mischievous fiend flinging handfuls of embers.' },
  { id: 'card_168', uk: 'Мертвий прапороносець руїн', en: 'Ruin Standard-Bearer', rarity: 'uncommon', hp: 8, atk: 3, def: 2, gold: 10, xp: 2, traitUk: 'Порожній стяг', traitEn: 'Hollow Banner', descUk: 'Нежить, що й досі тримає порваний королівський прапор.', descEn: 'Undead soldier clutching a tattered royal standard.' },
  { id: 'card_169', uk: 'Проклята лісова віщунка', en: 'Cursed Grove Hag', rarity: 'uncommon', hp: 7, atk: 4, def: 2, gold: 12, xp: 2, traitUk: 'Зловісне шепотіння', traitEn: 'Hex Chant', descUk: 'Плете пристріт у серці проклятої хащі.', descEn: 'Weaves hexes deep inside the blighted thicket.' },
  { id: 'card_170', uk: 'Попелястий пес пекла', en: 'Ashen Hellhound', rarity: 'uncommon', hp: 8, atk: 4, def: 2, gold: 12, xp: 2, traitUk: 'Вогненна паща', traitEn: 'Blazing Maw', descUk: 'Вовкулака з вулканічних тріщин дихає жаром.', descEn: 'Volcanic beast exhaling scorching ash.' },
  { id: 'card_171', uk: 'Вартовий тріснутого обеліска', en: 'Cracked Obelisk Warden', rarity: 'uncommon', hp: 9, atk: 3, def: 3, gold: 13, xp: 2, traitUk: 'Рунний щит', traitEn: 'Rune Ward', descUk: 'Оживлена статуя стародавнього храму.', descEn: 'Animated statue guarding a temple monolith.' },
  { id: 'card_172', uk: 'Потопельник чорних очеретів', en: 'Blackreed Drowner', rarity: 'common', hp: 6, atk: 3, def: 2, gold: 8, xp: 1, traitUk: 'Захват баговиння', traitEn: 'Mire Grasp', descUk: 'Підступна істота тягне жертву під воду.', descEn: 'Sly creature dragging prey beneath the reeds.' },
  { id: 'card_173', uk: 'Кривавий вовкулака повні', en: 'Fullmoon Bloodwarg', rarity: 'uncommon', hp: 9, atk: 4, def: 2, gold: 13, xp: 2, traitUk: 'Нічний ривок', traitEn: 'Midnight Pounce', descUk: 'Масивний звір полює під блідим місяцем.', descEn: 'Massive beast hunting under a pale moon.' },
  { id: 'card_174', uk: 'Сірчаний елементаль кратера', en: 'Crater Brimstone Elemental', rarity: 'uncommon', hp: 10, atk: 4, def: 3, gold: 14, xp: 2, traitUk: 'Лавова кірка', traitEn: 'Molten Crust', descUk: 'Згусток розплавленої породи й отруйної пари.', descEn: 'Living mass of magma and choking sulfur.' },
  { id: 'card_175', uk: 'Демон-ланцюговик порогу', en: 'Threshold Chainfiend', rarity: 'uncommon', hp: 9, atk: 4, def: 3, gold: 15, xp: 2, traitUk: 'Брязкіт гаків', traitEn: 'Hooked Chains', descUk: 'Розмахує розпеченими ланцюгами біля брам.', descEn: 'Wields red-hot iron chains near ruined gates.' },
  { id: 'card_176', uk: 'Лицар безголосої клятви', en: 'Vowless Black Knight', rarity: 'rare', hp: 11, atk: 4, def: 4, gold: 17, xp: 3, traitUk: 'Чорний панцир', traitEn: 'Ebon Plate', descUk: 'Падший паладин у зчорнілих турнірних латах.', descEn: 'Fallen paladin clad in blackened tourney armor.' },
  { id: 'card_177', uk: 'Безлика мара катакомб', en: 'Catacomb Faceless Specter', rarity: 'uncommon', hp: 7, atk: 5, def: 2, gold: 14, xp: 2, traitUk: 'Пожирач страху', traitEn: 'Dread Feast', descUk: 'Проникає крізь щити холодним подихом.', descEn: 'Phases through shields with a chilling wail.' },
  { id: 'card_178', uk: 'Бронзовий мінотавр лабіринту', en: 'Labyrinth Bronze Minotaur', rarity: 'rare', hp: 12, atk: 4, def: 3, gold: 18, xp: 3, traitUk: 'Роги прориву', traitEn: 'Breaker Horns', descUk: 'Охоронець занедбаних коридорів Середнього регіону.', descEn: 'Guardian of tangled Middle Region corridors.' },
  { id: 'card_179', uk: 'Химера попелястих круч', en: 'Ashcrag Chimera', rarity: 'rare', hp: 11, atk: 5, def: 3, gold: 18, xp: 3, traitUk: 'Подвійний укус', traitEn: 'Twin Snap', descUk: 'Триголова потвора нападає з гірських розломів.', descEn: 'Three-headed monstrosity leaping from crags.' },
  { id: 'card_180', uk: 'Жерця темного вівтаря', en: 'Dark Altar Hierophant', rarity: 'uncommon', hp: 8, atk: 5, def: 2, gold: 15, xp: 2, traitUk: 'Тіньовий промінь', traitEn: 'Shadow Ray', descUk: 'Спрямовує заборонену магію проти мандрівників.', descEn: 'Channels forbidden hexes against intruders.' },
  { id: 'card_181', uk: 'Шпигунка гільдії отрут', en: 'Venom Guild Assassin', rarity: 'uncommon', hp: 7, atk: 5, def: 2, gold: 16, xp: 2, traitUk: 'Смертельне жало', traitEn: 'Lethal Sting', descUk: 'Атакує зненацька отруєним стилеттом.', descEn: 'Strikes silently with venomous twin blades.' },
  { id: 'card_182', uk: 'Крижаний велетень перевалів', en: 'Frostpass Giant', rarity: 'rare', hp: 13, atk: 4, def: 3, gold: 19, xp: 3, traitUk: 'Льодовий обух', traitEn: 'Glacier Club', descUk: 'Володар засніжених хребтів, невблаганний у бою.', descEn: 'Lord of frozen ridges wielding an ice monolith.' },
  { id: 'card_183', uk: 'Панцирний скорпіон пустки', en: 'Wasteland Dreadscorpion', rarity: 'uncommon', hp: 9, atk: 4, def: 4, gold: 14, xp: 2, traitUk: 'Хітиновий панцир', traitEn: 'Chitin Shell', descUk: 'Величезний хижак розпечених руїн.', descEn: 'Giant chitin-plated stalker of scorched ruins.' },
  { id: 'card_184', uk: 'Виверна сірих шпилів', en: 'Greyspire Wyvern', rarity: 'rare', hp: 12, atk: 5, def: 3, gold: 20, xp: 3, traitUk: 'Ядовитий хвіст', traitEn: 'Barbed Tail', descUk: 'Крилатий ящір пікірує на здобич зі скель.', descEn: 'Winged drake diving from jagged spires.' },
  { id: 'card_185', uk: 'Палаючий іфрит кузні', en: 'Forge Flame-Ifrit', rarity: 'rare', hp: 11, atk: 5, def: 3, gold: 19, xp: 3, traitUk: 'Вогняне кільце', traitEn: 'Flame Ring', descUk: 'Дух вулканічного полум’я в броні з жару.', descEn: 'Volcanic spirit wrapped in living fire.' },
  { id: 'card_186', uk: 'Сліпий мисливець тунелів', en: 'Tunnel Blindstalker', rarity: 'uncommon', hp: 8, atk: 4, def: 3, gold: 13, xp: 2, traitUk: 'Чуття звуку', traitEn: 'Echo Hunt', descUk: 'Бездоганно чує кожен крок у підземеллі.', descEn: 'Tracks every footstep through pitch-black tunnels.' },
  { id: 'card_187', uk: 'Чумний чорнокнижник башти', en: 'Spire Plague-Warlock', rarity: 'rare', hp: 10, atk: 5, def: 3, gold: 18, xp: 3, traitUk: 'Хмара мороку', traitEn: 'Blight Cloud', descUk: 'Насичує повітря навколо руйнівною маною.', descEn: 'Saturates the air with corrupting mana.' },
  { id: 'card_188', uk: 'Стародавня мумія казначея', en: 'Ancient Treasurer Mummy', rarity: 'uncommon', hp: 9, atk: 4, def: 3, gold: 18, xp: 2, traitUk: 'Золотий оберіг', traitEn: 'Gilded Ward', descUk: 'Безсмертний сторож королівських склепів.', descEn: 'Undying keeper of royal treasury vaults.' },
  { id: 'card_189', uk: 'Грозовий гаргуль собору', en: 'Cathedral Storm Gargoyle', rarity: 'uncommon', hp: 10, atk: 4, def: 4, gold: 15, xp: 2, traitUk: 'Гранітні крила', traitEn: 'Granite Wings', descUk: 'Оживає під час грози над розбитими арками.', descEn: 'Wakes amidst thunder atop broken cathedral arches.' },
  { id: 'card_190', uk: 'Демонічний полководець попелу', en: 'Ashen Demon Warlord', rarity: 'rare', hp: 13, atk: 5, def: 4, gold: 22, xp: 3, traitUk: 'Пекловий натиск', traitEn: 'Hellish Surge', descUk: 'Командир авангарду демонів із зубчастим мечем.', descEn: 'Demon vanguard commander bearing a serrated blade.' },
  { id: 'card_191', uk: 'Тіньовий титан брами', en: 'Gate Shadow Titan', rarity: 'rare', hp: 14, atk: 5, def: 4, gold: 24, xp: 3, traitUk: 'Розтрощення', traitEn: 'Crushing Blow', descUk: 'Монументальний конструкт перед Внутрішнім регіоном.', descEn: 'Monumental construct barring inner pathways.' },
  { id: 'card_192', uk: 'Некро-лорд розбитих склепів', en: 'Shattered Crypt Necrolord', rarity: 'rare', hp: 11, atk: 6, def: 3, gold: 21, xp: 3, traitUk: 'Жнива душ', traitEn: 'Soul Reap', descUk: 'Викликає вихори праху та заморожує серце.', descEn: 'Commands bone storms and freezing dread.' },
  { id: 'card_193', uk: 'Панцирна гідра чорної затоки', en: 'Blackbay Plated Hydra', rarity: 'rare', hp: 14, atk: 5, def: 3, gold: 23, xp: 3, traitUk: 'П’ять пащ', traitEn: 'Five Maws', descUk: 'Багатоголове чудовисько затоплених святилищ.', descEn: 'Many-headed terror of drowned sanctuaries.' },
  { id: 'card_194', uk: 'Сутінковий серафим зради', en: 'Dusk Betrayer Seraph', rarity: 'rare', hp: 12, atk: 6, def: 4, gold: 25, xp: 3, traitUk: 'Поламані крила', traitEn: 'Shattered Wings', descUk: 'Падший небесний воїн служить Порожнечі.', descEn: 'Fallen celestial knight bound to the Void.' },
  { id: 'card_195', uk: 'Безодний пожирач іскор', en: 'Abyssal Spark-Devourer', rarity: 'rare', hp: 12, atk: 6, def: 3, gold: 22, xp: 3, traitUk: 'Висмоктування магії', traitEn: 'Mana Siphon', descUk: 'Пожирає магічну енергію кожної зброї.', descEn: 'Feeds upon enchanted steel and spellcraft.' },
  { id: 'card_196', uk: 'Костяний дракон забуття', en: 'Bone Dragon of Oblivion', rarity: 'rare', hp: 15, atk: 6, def: 4, gold: 28, xp: 3, traitUk: 'Подих праху', traitEn: 'Dust Breath', descUk: 'Гігантський скелет крилатого володаря давніх віків.', descEn: 'Colossal drake skeleton awakened by Void tremors.' },
  { id: 'card_197', uk: 'Берсерк розплавленої руди', en: 'Molten-Ore Berserker', rarity: 'uncommon', hp: 10, atk: 5, def: 2, gold: 16, xp: 2, traitUk: 'Сліпа лють', traitEn: 'Blind Fury', descUk: 'Зневажає захист, кидаючись у відчайдушну атаку.', descEn: 'Abandons guard to unleash relentless blows.' },
  { id: 'card_198', uk: 'Око споглядача безодні', en: 'Abyssal Beholder Eye', rarity: 'rare', hp: 11, atk: 6, def: 4, gold: 22, xp: 3, traitUk: 'Промінь заціпеніння', traitEn: 'Stasis Ray', descUk: 'Літаюча сфера зі жорстокими магічними променями.', descEn: 'Floating orb firing paralyzing arcane beams.' },
  { id: 'card_199', uk: 'Залізний кат цитаделі', en: 'Citadel Iron Executioner', rarity: 'rare', hp: 14, atk: 6, def: 4, gold: 26, xp: 3, traitUk: 'Сокира вироку', traitEn: 'Verdict Axe', descUk: 'Безжальний сторож внутрішніх коридорів.', descEn: 'Relentless warden of the inner corridors.' },
  { id: 'card_200', uk: 'Первісний жах серця темряви', en: 'Primordial Heart Terror', rarity: 'rare', hp: 16, atk: 6, def: 5, gold: 32, xp: 4, traitUk: 'Аура безодні', traitEn: 'Abyssal Aura', descUk: 'Наймогутніше породження тіні перед самим Троном.', descEn: 'Deadliest spawn of darkness before the Throne.' },
];

export const ENEMY_CARDS: CardDefinition[] = ENEMY_CARD_SPECS.map((e) => ({
  id: e.id,
  name: { uk: e.uk, en: e.en },
  description: {
    uk: `${e.descUk} (${e.hp} HP · ATK ${e.atk} · DEF ${e.def} · +${e.gold}з., +${e.xp} досв.)`,
    en: `${e.descEn} (${e.hp} HP · ATK ${e.atk} · DEF ${e.def} · +${e.gold}g, +${e.xp} XP)`,
  },
  category: 'enemy',
  rarity: e.rarity,
  activationCondition: {
    type: 'combat_encounter',
    description: {
      uk: 'Розпочинає бій при витягуванні під час дослідження.',
      en: 'Initiates combat when drawn during exploration.',
    },
  },
  duration: {
    type: 'combat',
    description: {
      uk: 'Перебуває на столі до перемоги, втечі або загибелі героя.',
      en: 'Active until defeated, fled from, or hero falls.',
    },
  },
  discardCondition: {
    type: 'adventure_discard',
    description: {
      uk: 'Скидається у відбій пригод після завершення сутички.',
      en: 'Placed in the adventure discard pile once combat ends.',
    },
  },
  logText: {
    uk: `Сутичка! Із тіні виходить ворог «${e.uk}» (HP ${e.hp}, Атака ${e.atk}).`,
    en: `Ambush! "${e.en}" emerges from shadow (HP ${e.hp}, ATK ${e.atk}).`,
  },
  equipSlot: null,
  goldCost: 0,
  combatOnly: false,
  effect: {
    enemyProfile: {
      name: { uk: e.uk, en: e.en },
      maxHp: e.hp,
      attack: e.atk,
      defense: e.def,
      goldReward: e.gold,
      xpReward: e.xp,
      trait: { uk: e.traitUk, en: e.traitEn },
    },
  },
}));
