import { CardDefinition, CardRarity } from '../../types/game';

interface AdventureSpec {
  id: string;
  uk: string;
  en: string;
  descUk: string;
  descEn: string;
  stat: 'strength' | 'intellect' | 'fate';
  diff: number;
  rarity: CardRarity;
  gold?: number;
  xp?: number;
  card?: boolean;
  heal?: number;
  penHp?: number;
  penGold?: number;
  curse?: string;
}

const ADVENTURE_SPECS: AdventureSpec[] = [
  { id: 'card_201', uk: 'Обвал старого лісового мосту', en: 'Collapse of the Old Forest Bridge', descUk: 'Гнилі балки тріщать під ногами: пробийтеся силою крізь уламки.', descEn: 'Rotting beams crack underfoot: muscle your way across.', stat: 'strength', diff: 6, rarity: 'common', gold: 9, xp: 1, penHp: 1 },
  { id: 'card_202', uk: 'Забутий межовий стовп', en: 'Forgotten Boundary Pillar', descUk: 'Розберіть стерті руни давньої межі й знайдіть тайник.', descEn: 'Decipher weathered boundary runes to find a hidden nook.', stat: 'intellect', diff: 6, rarity: 'common', gold: 8, xp: 1, card: true, penHp: 1 },
  { id: 'card_203', uk: 'Перехрестя срібної монети', en: 'Silver Coin Crossroads', descUk: 'На роздоріжжі лежить гаманець із дивною печаткою — довіртесь удачі.', descEn: 'A stamped purse rests at the crossroads — trust your luck.', stat: 'fate', diff: 6, rarity: 'common', gold: 14, penGold: 3, penHp: 1 },
  { id: 'card_204', uk: 'Капкан браконьєра в хащі', en: 'Poacher’s Thicket Snare', descUk: 'Зігнута сталь клацнула біля чобіт — розтисніть щелепи капкана.', descEn: 'Bent steel snaps near your boot — pry open the jaws.', stat: 'strength', diff: 7, rarity: 'common', xp: 2, gold: 6, penHp: 2 },
  { id: 'card_205', uk: 'Покинутий віз зброяра', en: 'Abandoned Armorer Wagon', descUk: 'Переверніть важкий борт воза, щоб дістати вцілілий ящик.', descEn: 'Heave the heavy wagon side to reach a surviving crate.', stat: 'strength', diff: 7, rarity: 'uncommon', gold: 10, card: true, penHp: 1 },
  { id: 'card_206', uk: 'Тіньова бібліотека сторожки', en: 'Shadowed Watchpost Library', descUk: 'Зберіть уцілілі сувої серед обгорілих полиць.', descEn: 'Recover intact scrolls among charred watchpost shelves.', stat: 'intellect', diff: 7, rarity: 'common', xp: 2, card: true, penHp: 1 },
  { id: 'card_207', uk: 'Шепіт туманного колодязя', en: 'Whisper of the Mist Well', descUk: 'У глибині блищить старовинний медальйон на цепу.', descEn: 'An ancient medallion gleams deep inside the misty well.', stat: 'fate', diff: 7, rarity: 'common', gold: 12, heal: 2, penHp: 1 },
  { id: 'card_208', uk: 'Вовче лігво під коренем', en: 'Root-Hollow Wolf Den', descUk: 'Порозкидайте каміння біля нори, не розбудивши зграю.', descEn: 'Clear the stones around the hollow without waking the pack.', stat: 'strength', diff: 7, rarity: 'common', gold: 11, xp: 1, penHp: 2 },
  { id: 'card_209', uk: 'Шифрований лист розвідника', en: 'Scout’s Ciphered Dispatch', descUk: 'Розгадайте код патрулів на обірваному пергаменті.', descEn: 'Crack the patrol cipher on a torn strip of parchment.', stat: 'intellect', diff: 7, rarity: 'common', gold: 12, xp: 2, penGold: 2, penHp: 1 },
  { id: 'card_210', uk: 'Привал біля цілющого дуба', en: 'Camp Beneath the Healing Oak', descUk: 'Дерево реагує лише на чисте серце й щасливу зірку.', descEn: 'The ancient oak opens its sap only to fortunate souls.', stat: 'fate', diff: 6, rarity: 'common', heal: 3, xp: 1, penHp: 1 },
  { id: 'card_211', uk: 'Підйом по обсипній кручі', en: 'Ascent Up the Scree Cliff', descUk: 'Захопіться за коріння й витягніть себе на скельну терасу.', descEn: 'Grip knotted roots and haul up to the stone ledge.', stat: 'strength', diff: 8, rarity: 'uncommon', gold: 12, xp: 2, penHp: 2 },
  { id: 'card_212', uk: 'Дзеркало кришталевого ставка', en: 'Mirror of the Crystal Pond', descUk: 'Вдивіться у відображення зірок, не піддавшись ілюзії.', descEn: 'Read the star reflection without succumbing to mirage.', stat: 'intellect', diff: 8, rarity: 'uncommon', heal: 2, xp: 2, card: true, penHp: 1 },
  { id: 'card_213', uk: 'Жебрак на кам’яному переїзді', en: 'Beggar at the Stone Ford', descUk: 'Таємничий старець пропонує парі на кістки.', descEn: 'A mysterious elder offers a wager on ivory dice.', stat: 'fate', diff: 7, rarity: 'common', gold: 16, card: true, penGold: 5, penHp: 0 },
  { id: 'card_214', uk: 'Прорив крізь терновий частокіл', en: 'Breach Through Briar Palisade', descUk: 'Прорубайте прохід у колючій стіні, що заступила яр.', descEn: 'Hew a narrow path through a wall of iron-hard briars.', stat: 'strength', diff: 7, rarity: 'common', gold: 8, heal: 1, xp: 1, penHp: 2 },
  { id: 'card_215', uk: 'Замурований вівтар мулярів', en: 'Walled Shrine of Masons', descUk: 'Знайдіть прихований важіль у кладці давньої стіни.', descEn: 'Locate the concealed lever inside ancient masonry.', stat: 'intellect', diff: 8, rarity: 'uncommon', gold: 15, card: true, penHp: 1 },
  { id: 'card_216', uk: 'Зустріч із білим оленем', en: 'Glimpse of the White Stag', descUk: 'Священний звір виводить тих, кому усміхнулася Доля.', descEn: 'The sacred stag guides those favored by Fortune.', stat: 'fate', diff: 8, rarity: 'uncommon', heal: 3, xp: 2, penHp: 1 },
  { id: 'card_217', uk: 'Затоплена комора млина', en: 'Flooded Mill Storehouse', descUk: 'Підійміть важку дубову ляду з мутного дна.', descEn: 'Wrench open the waterlogged oak hatch in muddy water.', stat: 'strength', diff: 8, rarity: 'uncommon', gold: 16, penHp: 2 },
  { id: 'card_218', uk: 'Астрономічний годинник вежі', en: 'Spire Astral Sundial', descUk: 'Вирівняйте бронзові диски за картою північного неба.', descEn: 'Align bronze rings to the northern constellations.', stat: 'intellect', diff: 8, rarity: 'uncommon', xp: 3, gold: 10, penHp: 1 },
  { id: 'card_219', uk: 'Плитка хиткого навісного мосту', en: 'Plank of the Swaying Span', descUk: 'Буря хитає канати — втримайте рівновагу над прірвою.', descEn: 'Gales lash the ropes — keep balance above the gorge.', stat: 'fate', diff: 8, rarity: 'uncommon', gold: 14, xp: 2, penHp: 2 },
  { id: 'card_220', uk: 'Полеглим прапором покладена варта', en: 'Fallen Banner Watch', descUk: 'Зніміть тяжку плиту з могили невідомого командира.', descEn: 'Shift a heavy slab from an unmarked commander’s cache.', stat: 'strength', diff: 8, rarity: 'uncommon', gold: 13, card: true, penHp: 2 },
  { id: 'card_221', uk: 'Загадка дзвінких колон', en: 'Riddle of the Chiming Pillars', descUk: 'Відтворіть мелодію вітру на чотирьох кам’яних флейтах.', descEn: 'Echo the wind’s motif across four carved stone flutes.', stat: 'intellect', diff: 8, rarity: 'uncommon', xp: 2, heal: 2, card: true, penHp: 1 },
  { id: 'card_222', uk: 'Заблукалий гінця королівської пошти', en: 'Lost Royal Courier', descUk: 'Знайдіть сумку з депешами в густому очереті.', descEn: 'Spot the courier’s leather satchel amidst tall reeds.', stat: 'fate', diff: 7, rarity: 'common', gold: 15, xp: 1, penHp: 1 },
  { id: 'card_223', uk: 'Облога кам’яного лазу', en: 'Rockslide Tunnel Clearing', descUk: 'Розтягніть завал валунів, що закрив стару штольню.', descEn: 'Haul fallen boulders blocking an old silver adit.', stat: 'strength', diff: 9, rarity: 'uncommon', gold: 19, xp: 2, penHp: 2 },
  { id: 'card_224', uk: 'Алхімічна реторта без написів', en: 'Unlabeled Alchemical Retort', descUk: 'Визначте безпечну суміш за кольором диму й запахом.', descEn: 'Identify the safe reagent by vapor hue and scent.', stat: 'intellect', diff: 8, rarity: 'uncommon', heal: 4, card: true, penHp: 2 },
  { id: 'card_225', uk: 'Проклята скринька збирача податків', en: 'Taxman’s Hexed Strongbox', descUk: 'Обережно знешкодьте голку з прокляттям на замку.', descEn: 'Evade the cursed needle spring inside the keyhole.', stat: 'fate', diff: 8, rarity: 'uncommon', gold: 20, penHp: 1, curse: 'card_140' },
  { id: 'card_226', uk: 'Спуск у пересохле русло', en: 'Descent into the Dry Riverbed', descUk: 'Зістрибніть на піщану косу, уникнувши зсуву берега.', descEn: 'Drop onto the sandbar while dodging collapsing banks.', stat: 'strength', diff: 7, rarity: 'common', gold: 10, xp: 1, heal: 1, penHp: 1 },
  { id: 'card_227', uk: 'Мапа підводних порогів', en: 'Chart of Sunken Rapids', descUk: 'Складіть безпечний фарватер за відмітками старого лоцмана.', descEn: 'Plot safe passage using an old pilot’s notch marks.', stat: 'intellect', diff: 7, rarity: 'common', gold: 11, card: true, penHp: 1 },
  { id: 'card_228', uk: 'Скарб у дуплі громового в’яза', en: 'Hollow of the Thunder Elm', descUk: 'У розщепленому стовбурі хтось сховав мішечок.', descEn: 'Someone tucked a pouch inside the lightning-split elm.', stat: 'fate', diff: 7, rarity: 'common', gold: 14, card: true, penHp: 1 },
  { id: 'card_229', uk: 'Спроба підняти дзвін каплиці', en: 'Raising the Chapel Bell', descUk: 'Поверніть бронзовий дзвін на балку — пожертви вдячних сіл.', descEn: 'Hoist the fallen bell back into its beam for villager coin.', stat: 'strength', diff: 9, rarity: 'uncommon', gold: 20, heal: 2, penHp: 2 },
  { id: 'card_230', uk: 'Рукопис про виток річок', en: 'Treatise on River Springs', descUk: 'Перепишіть втрачений розділ географії для академії.', descEn: 'Copy a lost geographical folio for the high academy.', stat: 'intellect', diff: 7, rarity: 'common', xp: 2, gold: 11, penHp: 1 },
  { id: 'card_231', uk: 'Дзвін монет у фонтані мандрів', en: 'Coins in the Wayfarer Fountain', descUk: 'Вкиньте мідяк і перевірте, що принесе течія.', descEn: 'Toss a copper piece and test what the current returns.', stat: 'fate', diff: 6, rarity: 'common', gold: 12, heal: 2, penGold: 4, penHp: 0 },
  { id: 'card_232', uk: 'Переправа через розлючений потік', en: 'Crossing the Swollen Torrent', descUk: 'Утримайтеся на слизькому камінні посеред крижаної води.', descEn: 'Brace against ice-cold rapids on slick stepping stones.', stat: 'strength', diff: 8, rarity: 'uncommon', xp: 2, gold: 12, penHp: 2 },
  { id: 'card_233', uk: 'Склеп літописця без дверей', en: 'Doorless Chronicler Vault', descUk: 'Зрозумійте порядок натискання плит на підлозі.', descEn: 'Deduce the sequence of pressure tiles on the floor.', stat: 'intellect', diff: 9, rarity: 'rare', gold: 18, card: true, xp: 2, penHp: 2 },
  { id: 'card_234', uk: 'Падіння метеоритного осколка', en: 'Fall of a Star-Iron Shard', descUk: 'Устигніть до остиглого кратера раніше за падальників.', descEn: 'Reach the cooling impact crater ahead of scavengers.', stat: 'fate', diff: 9, rarity: 'rare', gold: 16, card: true, xp: 2, penHp: 2 },
  { id: 'card_235', uk: 'Прорив крізь зачинену браму форту', en: 'Ramming the Shut Fort Postern', descUk: 'Вибийте заіржавілий засув бічної хвіртки.', descEn: 'Batter through the rusted bolt of a postern gate.', stat: 'strength', diff: 8, rarity: 'common', gold: 14, xp: 1, penHp: 2 },
  { id: 'card_236', uk: 'Розшифровка зоряного календаря', en: 'Decoding the Star Calendar', descUk: 'Обчисліть дату затемнення на стелі занедбаного храму.', descEn: 'Calculate eclipse cycles carved on a ruined ceiling.', stat: 'intellect', diff: 8, rarity: 'uncommon', xp: 3, card: true, penHp: 1 },
  { id: 'card_237', uk: 'Гра з бродячим ілюзіоністом', en: 'Shell Game with a Wandering Illusionist', descUk: 'Відгадайте, під якою чашею схована золота фішка.', descEn: 'Guess which bronze cup conceals the gilded token.', stat: 'fate', diff: 7, rarity: 'common', gold: 18, penGold: 6, penHp: 0 },
  { id: 'card_238', uk: 'Кузня згаслого горна', en: 'Forge of the Cold Hearth', descUk: 'Роздуйте важкі міхи, щоб виплавити цінний зливок.', descEn: 'Pump heavy bellows to recover a pure silver ingot.', stat: 'strength', diff: 8, rarity: 'uncommon', gold: 17, xp: 1, penHp: 1 },
  { id: 'card_239', uk: 'Зламаний голем у канаві', en: 'Broken Golem in the Ditch', descUk: 'Вийміть енергетичне ядро без замикання рун.', descEn: 'Extract the runic core without triggering an arc.', stat: 'intellect', diff: 9, rarity: 'rare', gold: 16, card: true, xp: 2, penHp: 2 },
  { id: 'card_240', uk: 'Тінь біля старої шибениці', en: 'Shadow at the Old Gibbet', descUk: 'Відверніть пристріт, якщо втримаєте ясність духу.', descEn: 'Ward off an evil eye if fortune holds steady.', stat: 'fate', diff: 8, rarity: 'uncommon', xp: 2, gold: 10, penHp: 1, curse: 'card_138' },
  { id: 'card_241', uk: 'Гігантський корч на переправі', en: 'Giant Snag Across the Ferry', descUk: 'Стягніть мотузкою повалений стовбур із русла.', descEn: 'Haul a waterlogged trunk clear of the ferry cable.', stat: 'strength', diff: 7, rarity: 'common', gold: 13, heal: 1, penHp: 1 },
  { id: 'card_242', uk: 'Травник на межі болота', en: 'Herbalist on the Fen Edge', descUk: 'Допоможіть відібрати отруйні пагони від цілющих.', descEn: 'Sort venomous nightshade from healing marshwort.', stat: 'intellect', diff: 7, rarity: 'common', heal: 4, xp: 1, penHp: 2 },
  { id: 'card_243', uk: 'Стежка світлячків у сутінках', en: 'Firefly Trail at Dusk', descUk: 'Чи виведуть вогники до притулку, чи в трясовину?', descEn: 'Will the lantern-flies lead to shelter or sinkhole?', stat: 'fate', diff: 7, rarity: 'common', heal: 3, card: true, penHp: 2 },
  { id: 'card_244', uk: 'Заіржавіла решітка акведука', en: 'Rusted Aqueduct Grate', descUk: 'Зігніть прути, щоб скоротити шлях крізь галерею.', descEn: 'Bend iron bars to shortcut beneath the stone arches.', stat: 'strength', diff: 8, rarity: 'uncommon', gold: 14, xp: 2, penHp: 2 },
  { id: 'card_245', uk: 'Стародавня шахівниця царів', en: 'Ancient Chessboard of Kings', descUk: 'Знайдіть єдиний переможний мат у кам’яній партії.', descEn: 'Find the sole forced checkmate on the marble board.', stat: 'intellect', diff: 9, rarity: 'rare', gold: 15, xp: 3, card: true, penHp: 1 },
  { id: 'card_246', uk: 'Блукаюча лавка дивних реліквій', en: 'Wandering Curio Stall', descUk: 'Витягніть згортки з мішка мандрівного колекціонера.', descEn: 'Draw a wrapped curiosity from a collector’s sack.', stat: 'fate', diff: 8, rarity: 'uncommon', card: true, gold: 10, penGold: 5, penHp: 0 },
  { id: 'card_247', uk: 'Арена покинутого гарнізону', en: 'Yard of the Deserted Garrison', descUk: 'Пройдіть смугу тренувальних манекенів із вантажем.', descEn: 'Clear the weighted sparring course for hidden prize coin.', stat: 'strength', diff: 8, rarity: 'uncommon', xp: 3, gold: 10, penHp: 2 },
  { id: 'card_248', uk: 'Тріснутий обеліск покаяння', en: 'Cracked Obelisk of Penance', descUk: 'Прочитайте очищувальну формулу без помилки у вимові.', descEn: 'Chant the ancient purification formula flawlessly.', stat: 'intellect', diff: 8, rarity: 'uncommon', heal: 3, xp: 2, penHp: 1, curse: 'card_137' },
  { id: 'card_249', uk: 'Впалий мішок караванника', en: 'Dropped Caravan Pack', descUk: 'Помітьте шкіряний тюк під кущем раніше за розбійників.', descEn: 'Spot a leather pack beneath thorns before bandits arrive.', stat: 'fate', diff: 7, rarity: 'common', gold: 17, penHp: 1 },
  { id: 'card_250', uk: 'Зчеплення з лавиною на перевалі', en: 'Holding Against Pass Avalanche', descUk: 'Вперіться щитом і втримайте навіс снігу.', descEn: 'Plant your boots and brace against sliding snow.', stat: 'strength', diff: 9, rarity: 'rare', xp: 3, heal: 1, gold: 12, penHp: 3 },
  { id: 'card_251', uk: 'Крізь прокляте коріння хащі', en: 'Through Cursed Bramble Roots', descUk: 'Живі гілки стискають стежку — вирвіться із захватів.', descEn: 'Living thorns constrict the path — tear free of their grip.', stat: 'strength', diff: 9, rarity: 'uncommon', xp: 2, gold: 14, penHp: 2, curse: 'card_142' },
  { id: 'card_252', uk: 'Печатка на дверях чорної вежі', en: 'Sigil on the Blacktower Door', descUk: 'Розімкніть п’ять переплетених ліній без дотику.', descEn: 'Unweave five interlocking lines without touching iron.', stat: 'intellect', diff: 9, rarity: 'rare', gold: 20, card: true, penHp: 2 },
  { id: 'card_253', uk: 'Плитка проклятого склепу', en: 'Slab of the Cursed Crypt', descUk: 'Кроки лунають порожнечею — не наступи на гнилу руну.', descEn: 'Hollow echoes warn of a rotted hex-stone.', stat: 'fate', diff: 9, rarity: 'rare', gold: 18, xp: 2, penHp: 2, curse: 'card_136' },
  { id: 'card_254', uk: 'Охололий лавовий міст', en: 'Cooling Magma Span', descUk: 'Перестрибніть розпечену тріщину з повним спорядженням.', descEn: 'Vault a glowing fissure in full adventuring gear.', stat: 'strength', diff: 9, rarity: 'uncommon', gold: 15, xp: 2, penHp: 3 },
  { id: 'card_255', uk: 'Лабораторія зниклого піроманта', en: 'Missing Pyromancer’s Study', descUk: 'Знешкодьте витік ефіру й заберіть нотатки.', descEn: 'Seal a volatile ether leak and claim the notes.', stat: 'intellect', diff: 9, rarity: 'rare', xp: 3, card: true, penHp: 2 },
  { id: 'card_256', uk: 'Тріск сухих кісток під попелом', en: 'Dry Bones Beneath the Ash', descUk: 'Знайдіть вцілілу скриньку, не потривоживши духа.', descEn: 'Recover a trinket box without waking the ash shade.', stat: 'fate', diff: 8, rarity: 'uncommon', gold: 19, penHp: 2 },
  { id: 'card_257', uk: 'Брама розбитого легіону', en: 'Gate of the Shattered Legion', descUk: 'Підійміть важку герсу, щоб пройти залом героїв.', descEn: 'Heave the bent iron portcullis to pass the hall.', stat: 'strength', diff: 10, rarity: 'rare', xp: 3, card: true, penHp: 2 },
  { id: 'card_258', uk: 'Залишки храмової мозаїки', en: 'Fragments of Temple Mosaic', descUk: 'Складіть обличчя Світанкової Богині з семи уламків.', descEn: 'Restore the Dawn Goddess visage from seven shards.', stat: 'intellect', diff: 9, rarity: 'rare', heal: 4, xp: 2, gold: 12, penHp: 1 },
  { id: 'card_259', uk: 'Перемовини з привидом капітана', en: 'Parley with the Ghost Captain', descUk: 'Вгадайте пароль старої варти на попелястих мурах.', descEn: 'Name the lost watchword on the cinderswept wall.', stat: 'fate', diff: 9, rarity: 'rare', gold: 22, card: true, penHp: 2 },
  { id: 'card_260', uk: 'Поєдинок із кам’яним стражем порогу', en: 'Trial of the Stone Sentinel', descUk: 'Витримайте натиск гранітного щита на мосту.', descEn: 'Hold your ground against a granite sentinel’s shove.', stat: 'strength', diff: 10, rarity: 'rare', xp: 3, gold: 18, penHp: 3 },
  { id: 'card_261', uk: 'Дзеркальний лабіринт ілюзій', en: 'Mirrored Hall of Mirages', descUk: 'Відрізніть справжній вихід від п’яти фальшивих арк.', descEn: 'Spot the true exit among five reflected archways.', stat: 'intellect', diff: 9, rarity: 'rare', xp: 3, card: true, penHp: 2 },
  { id: 'card_262', uk: 'Зарубана скарбниця демонів', en: 'Sealed Demon Treasury', descUk: 'Доторкніться до руни-замка, сподіваючись на прихильність Долі.', descEn: 'Touch the lock-rune hoping Fate shields your hand.', stat: 'fate', diff: 9, rarity: 'rare', gold: 24, penHp: 2, curse: 'card_139' },
  { id: 'card_263', uk: 'Колодязь сірчаної пари', en: 'Sulfur Steam Vent', descUk: 'Затисніть засувку аварійного клапана древньої шахти.', descEn: 'Crank shut the rusted relief valve of a deep mine.', stat: 'strength', diff: 9, rarity: 'uncommon', gold: 16, heal: 2, penHp: 2 },
  { id: 'card_264', uk: 'Книга проклятих імен', en: 'Ledger of Cursed Names', descUk: 'Викресліть власне ім’я священним чорнилом без похибки.', descEn: 'Strike out your sign with blessed ink cleanly.', stat: 'intellect', diff: 9, rarity: 'rare', xp: 3, heal: 2, penHp: 1, curse: 'card_143' },
  { id: 'card_265', uk: 'Скарб у розколині вулкану', en: 'Treasure in the Caldera Crack', descUk: 'Встигніть схопити кубок до наступного викиду попелу.', descEn: 'Snatch a gilded chalice before the next ash burst.', stat: 'fate', diff: 9, rarity: 'rare', gold: 25, penHp: 3 },
  { id: 'card_266', uk: 'Тягар залізної статуї', en: 'Burden of the Iron Statue', descUk: 'Зсуньте схиленого колоса, що перекрив прохід до вівтаря.', descEn: 'Slide a tilted iron colossus clear of the shrine.', stat: 'strength', diff: 10, rarity: 'rare', gold: 20, card: true, penHp: 2 },
  { id: 'card_267', uk: 'Печера шепочучих кристалів', en: 'Cavern of Whispering Crystals', descUk: 'Заглушіть дисонанс правильним обертом лінзи.', descEn: 'Silence the crystal dissonance by rotating the prism.', stat: 'intellect', diff: 9, rarity: 'rare', heal: 3, card: true, xp: 2, penHp: 2 },
  { id: 'card_268', uk: 'Кістка пророцтва в попелі', en: 'Oracle Bone in the Cinder', descUk: 'Зчитайте знак майбутнього переходу на тріснутій кістці.', descEn: 'Read the coming road sign on a scorched bone.', stat: 'fate', diff: 8, rarity: 'uncommon', xp: 2, card: true, penHp: 1 },
  { id: 'card_269', uk: 'Зруйнована дамба чорної ріки', en: 'Broken Dam of the Black River', descUk: 'Укріпіть підпору балкою, щоб зберегти брід.', descEn: 'Brace the sluice beam to save the stone causeway.', stat: 'strength', diff: 8, rarity: 'uncommon', gold: 15, xp: 2, penHp: 2 },
  { id: 'card_270', uk: 'Механізм небесної сфери', en: 'Orrery of the Sky Sphere', descUk: 'Зберіть загублені шестерні й запустіть старий планетарій.', descEn: 'Reassemble brass gears to restart the ancient orrery.', stat: 'intellect', diff: 10, rarity: 'rare', xp: 4, card: true, penHp: 2 },
  { id: 'card_271', uk: 'Втеча від кривавої хмари', en: 'Outrunning the Crimson Cloud', descUk: 'Оберіть вірну ущелину, поки отруйний вихор не накрив шлях.', descEn: 'Pick the safe ravine before the toxic gust hits.', stat: 'fate', diff: 9, rarity: 'rare', heal: 2, xp: 2, penHp: 3 },
  { id: 'card_272', uk: 'Знищення оскверненого тотема', en: 'Shattering the Blight Totem', descUk: 'Розтрощіть чорний ідол одним точним ударом.', descEn: 'Smash the dark idol with a single crushing blow.', stat: 'strength', diff: 9, rarity: 'uncommon', xp: 3, heal: 2, penHp: 2 },
  { id: 'card_273', uk: 'Архів забутої гільдії картографів', en: 'Cartographers’ Forgotten Vault', descUk: 'Систематизуйте пожовклі схеми переходів.', descEn: 'Catalog yellowed passage maps for deep knowledge.', stat: 'intellect', diff: 8, rarity: 'uncommon', gold: 14, xp: 2, card: true, penHp: 1 },
  { id: 'card_274', uk: 'Золота чаша під загрозою обвалу', en: 'Gilded Bowl Under Falling Slate', descUk: 'Встигніть підмінити чашу піском, як у старих легендах.', descEn: 'Swap the chalice for sand cleanly as legends tell.', stat: 'fate', diff: 9, rarity: 'rare', gold: 26, penHp: 2 },
  { id: 'card_275', uk: 'Стіна живого обсидіану', en: 'Wall of Living Obsidian', descUk: 'Пробийте вузьку тріщину у крихкому вулканічному склі.', descEn: 'Cleave a narrow passage through volcanic glass.', stat: 'strength', diff: 10, rarity: 'rare', xp: 3, card: true, penHp: 3 },
  { id: 'card_276', uk: 'Ритуал трьох свічок на перехресті', en: 'Three-Candle Crossroad Rite', descUk: 'Утримуйте полум’я в правильній послідовності стихій.', descEn: 'Keep the three flames lit in proper elemental order.', stat: 'intellect', diff: 8, rarity: 'uncommon', heal: 4, xp: 1, penHp: 1 },
  { id: 'card_277', uk: 'Скарб у пащі кам’яного лева', en: 'Maw of the Stone Lion', descUk: 'Протягніть руку в темну пащу до клацання засува.', descEn: 'Reach inside the stone jaw before the latch snaps.', stat: 'fate', diff: 9, rarity: 'rare', gold: 21, card: true, penHp: 2 },
  { id: 'card_278', uk: 'Ланцюг підйомного мосту цитаделі', en: 'Chain of the Citadel Drawbridge', descUk: 'Прокрутіть важкий ворот крізь іржу віків.', descEn: 'Turn the heavy winch through centuries of rust.', stat: 'strength', diff: 10, rarity: 'rare', xp: 3, gold: 18, penHp: 2 },
  { id: 'card_279', uk: 'Вивчення фрески Першої війни', en: 'Studying the First War Fresco', descUk: 'Відкрийте вразливе місце темних обладунків за давнім малюнком.', descEn: 'Spot armor weakpoints hidden in ancient battle murals.', stat: 'intellect', diff: 9, rarity: 'rare', xp: 3, gold: 12, penHp: 1 },
  { id: 'card_280', uk: 'Знак комет над полем битви', en: 'Comet Omen Over the Battlefield', descUk: 'Прослідкуйте траєкторію уламка, що впав поблизу.', descEn: 'Trace a fallen star’s arc to its glowing impact site.', stat: 'fate', diff: 9, rarity: 'rare', xp: 3, card: true, penHp: 2 },
  { id: 'card_281', uk: 'Очистка заваленого джерела', en: 'Clearing the Choked Spring', descUk: 'Приберіть уламки граніту, що перекрили живу воду.', descEn: 'Roll away granite blocks choking a sacred spring.', stat: 'strength', diff: 8, rarity: 'common', heal: 5, gold: 8, penHp: 2 },
  { id: 'card_282', uk: 'Трактат про тишу безодні', en: 'Codex of Abyssal Silence', descUk: 'Зрозумійте закони внутрішнього регіону без утрати розуму.', descEn: 'Grasp inner-realm laws without yielding sanity.', stat: 'intellect', diff: 10, rarity: 'rare', xp: 4, card: true, penHp: 2, curse: 'card_145' },
  { id: 'card_283', uk: 'Шепіт загубленого брата по зброї', en: 'Echo of a Lost Shieldmate', descUk: 'Знайдіть медальйон і передайте нагороду в пам’ять про героя.', descEn: 'Recover a fallen comrade’s signet amidst ruins.', stat: 'fate', diff: 8, rarity: 'uncommon', gold: 15, heal: 2, xp: 1, penHp: 1 },
  { id: 'card_284', uk: 'Стародавній таран облоги', en: 'Ancient Siege Ram', descUk: 'Зруште обковану колоду проти кам’яної перешкоди.', descEn: 'Drive the iron-shod beam through a collapsed arch.', stat: 'strength', diff: 9, rarity: 'uncommon', gold: 18, xp: 2, penHp: 2 },
  { id: 'card_285', uk: 'Сувій подвійного відбиття', en: 'Scroll of Twin Reflection', descUk: 'Прочитайте дзеркальний текст за допомогою срібного щитка.', descEn: 'Read inverted runes using a polished silver buckler.', stat: 'intellect', diff: 9, rarity: 'rare', xp: 3, gold: 14, penHp: 1 },
  { id: 'card_286', uk: 'Ставка на останню зірку світанку', en: 'Wager on the Last Dawn Star', descUk: 'Випробуйте свою прихильність перед самою Цитаделлю.', descEn: 'Test your fortune at the threshold of the Citadel.', stat: 'fate', diff: 10, rarity: 'rare', gold: 24, xp: 3, penHp: 2 },
  { id: 'card_287', uk: 'Стрімкий спуск по замерзлому схилу', en: 'Sprint Down the Frozen Slope', descUk: 'Утримуйте щит замість саней та уникайте гострих скель.', descEn: 'Ride your shield down ice while dodging jagged crags.', stat: 'strength', diff: 8, rarity: 'uncommon', xp: 2, gold: 12, penHp: 2 },
  { id: 'card_288', uk: 'Печатка магістра гільдії світла', en: 'Sigil of the Light Guildmaster', descUk: 'Відновіть магічний ключ із трьох розсипаних пластин.', descEn: 'Reconstruct the key-plate from three fractured wards.', stat: 'intellect', diff: 9, rarity: 'rare', card: true, heal: 3, gold: 15, penHp: 1 },
  { id: 'card_289', uk: 'Скриня без замка в тіньовій залі', en: 'Lockless Chest in Shadow Hall', descUk: 'Чи справді всередині золото, чи проклята пастка?', descEn: 'Is it gold inside, or an unholy hex?', stat: 'fate', diff: 9, rarity: 'rare', gold: 26, penHp: 2, curse: 'card_144' },
  { id: 'card_290', uk: 'Випробування крицевої витримки', en: 'Ordeal of Iron Endurance', descUk: 'Пройдіть коридором кам’яних маятників без зупинки.', descEn: 'Sprint through a corridor of swinging stone pendulums.', stat: 'strength', diff: 10, rarity: 'rare', xp: 4, gold: 16, penHp: 3 },
  { id: 'card_291', uk: 'Таємниця чорного обеліска', en: 'Secret of the Black Obelisk', descUk: 'Розпізнайте фальшиву руну, що притягує морок.', descEn: 'Identify the counterfeit rune drawing in darkness.', stat: 'intellect', diff: 10, rarity: 'rare', xp: 3, card: true, gold: 18, penHp: 2 },
  { id: 'card_292', uk: 'Міст із падаючих плит', en: 'Bridge of Falling Flagstones', descUk: 'Пробіжіть крізь руїни, доки підлога сиплеться у безодню.', descEn: 'Dash across collapsing masonry over the abyss.', stat: 'fate', diff: 9, rarity: 'rare', xp: 3, gold: 20, penHp: 3 },
  { id: 'card_293', uk: 'Поламаний віз постачання ордену', en: 'Shattered Order Supply Cart', descUk: 'Відсуньте камінну брилу від недоторканого запасника.', descEn: 'Heave a boulder off an intact knightly supply chest.', stat: 'strength', diff: 8, rarity: 'uncommon', heal: 3, card: true, gold: 10, penHp: 1 },
  { id: 'card_294', uk: 'Гармонія розбитих дзвонів', en: 'Harmony of Broken Bells', descUk: 'Налаштуйте три тріснуті дзвони храму, щоб розвіяти морок.', descEn: 'Tune three cracked temple bells to banish gloom.', stat: 'intellect', diff: 9, rarity: 'rare', heal: 4, xp: 3, penHp: 1 },
  { id: 'card_295', uk: 'Палаючий медальйон у золі', en: 'Smoldering Locket in Cinders', descUk: 'Вихопіть гарячий трофей із вулканічного попелу.', descEn: 'Pluck a warm relic locket from volcanic ash.', stat: 'fate', diff: 9, rarity: 'rare', gold: 22, xp: 2, penHp: 2 },
  { id: 'card_296', uk: 'Прорив крізь крижану завісу', en: 'Shattering the Glacial Veil', descUk: 'Розбийте крижану брилу перед стародавньою схованкою.', descEn: 'Cleave an ice barrier sealing a lost alcove.', stat: 'strength', diff: 9, rarity: 'uncommon', gold: 18, card: true, penHp: 2 },
  { id: 'card_297', uk: 'Читання попелястих літописів', en: 'Reading the Ashen Annals', descUk: 'Відтворіть втрачені імена героїв зі спопелілих сторінок.', descEn: 'Recover hero names from brittle, scorched pages.', stat: 'intellect', diff: 9, rarity: 'rare', xp: 4, gold: 14, penHp: 1 },
  { id: 'card_298', uk: 'Виклик долі перед Троном', en: 'Wager Before the Abyss Throne', descUk: 'Кінцевий знак удачі перед вирішальним ударом.', descEn: 'One final test of fortune near the Throne of the Void.', stat: 'fate', diff: 10, rarity: 'rare', gold: 25, xp: 3, card: true, penHp: 2 },
  { id: 'card_299', uk: 'Підняття поваленого стягу Світанку', en: 'Raising the Fallen Dawn Banner', descUk: 'Увіткніть древній штандарт у твердий граніт двору.', descEn: 'Plant the heavy Dawn standard into solid citadel rock.', stat: 'strength', diff: 10, rarity: 'rare', xp: 4, heal: 3, gold: 15, penHp: 2 },
  { id: 'card_300', uk: 'Остання загадка Першої Печатки', en: 'Final Enigma of the First Seal', descUk: 'Розв’яжіть верховну головоломку прадавніх архітекторів.', descEn: 'Solve the grand cipher left by the Realm’s architects.', stat: 'intellect', diff: 10, rarity: 'rare', xp: 4, gold: 24, card: true, penHp: 2 },
];

const STAT_LABEL_UK: Record<'strength' | 'intellect' | 'fate', string> = {
  strength: 'Сила',
  intellect: 'Інтелект',
  fate: 'Доля',
};

const STAT_LABEL_EN: Record<'strength' | 'intellect' | 'fate', string> = {
  strength: 'Strength',
  intellect: 'Intellect',
  fate: 'Fate',
};

export const ADVENTURE_CARDS: CardDefinition[] = ADVENTURE_SPECS.map((a) => ({
  id: a.id,
  name: { uk: a.uk, en: a.en },
  description: {
    uk: `${a.descUk} (${STAT_LABEL_UK[a.stat]} + d6 ≥ ${a.diff})`,
    en: `${a.descEn} (${STAT_LABEL_EN[a.stat]} + d6 ≥ ${a.diff})`,
  },
  category: 'adventure',
  rarity: a.rarity,
  activationCondition: {
    type: 'explore_adventure',
    description: {
      uk: 'Відкривається з колоди пригод під час дослідження локації.',
      en: 'Drawn from the Adventure Deck during exploration.',
    },
  },
  duration: {
    type: 'instant',
    description: {
      uk: 'Розв’язується перевіркою характеристики d6.',
      en: 'Resolved through a single d6 stat check.',
    },
  },
  discardCondition: {
    type: 'adventure_discard',
    description: {
      uk: 'Після завершення перевірки скидається у відбій пригод.',
      en: 'Placed in the adventure discard pile once resolved.',
    },
  },
  logText: {
    uk: `Пригода «${a.uk}»: перевірка ${STAT_LABEL_UK[a.stat]} ≥ ${a.diff}.`,
    en: `Adventure "${a.en}": ${STAT_LABEL_EN[a.stat]} check ≥ ${a.diff}.`,
  },
  equipSlot: null,
  goldCost: 0,
  combatOnly: false,
  effect: {
    statCheck: {
      stat: a.stat,
      difficulty: a.diff,
      ...(a.gold ? { rewardGold: a.gold } : {}),
      ...(a.xp ? { rewardXp: a.xp } : {}),
      ...(a.card ? { rewardCard: true } : {}),
      ...(a.heal ? { healHp: a.heal } : {}),
      ...(typeof a.penHp === 'number' ? { penaltyHp: a.penHp } : {}),
      ...(a.penGold ? { penaltyGold: a.penGold } : {}),
      ...(a.curse ? { curseCardId: a.curse } : {}),
    },
  },
}));
