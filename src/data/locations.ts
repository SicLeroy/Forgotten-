import {
  AccessConditionType,
  AdventureSymbol,
  LocalizedText,
  LocationAccessCondition,
  LocationDefinition,
  LocationTerrain,
  LocationTimeEffect,
  LocationWeatherEffect,
  RegionId,
  SectorId,
  WeatherType,
} from '../types/game';

interface RawNodeSeed {
  uk: string;
  en: string;
  terrain: LocationTerrain;
  danger: number;
  symbol: AdventureSymbol;
}

interface SectorSpec {
  sectorId: SectorId;
  regionId: RegionId;
  sectorName: LocalizedText;
  nodes: RawNodeSeed[];
}

const ACCESS_CONDITIONS: Record<AccessConditionType, LocationAccessCondition> = {
  open: {
    type: 'open',
    description: {
      uk: 'Відкритий доступ із початку гри',
      en: 'Open access from the start of the game',
    },
  },
  gate_guardian: {
    type: 'gate_guardian',
    description: {
      uk: 'Потрібно перемогти Охоронця Брами (loc_42)',
      en: 'Requires defeating the Gate Guardian (loc_42)',
    },
  },
  three_seals: {
    type: 'three_seals',
    description: {
      uk: 'Потрібно зібрати всі три Печатки (Сили, Мудрості, Долі)',
      en: 'Requires all Three Seals (Power, Wisdom, Fate)',
    },
  },
};

const SECTOR_SPECS: SectorSpec[] = [
  // ================= OUTER REGION (6 sectors x 7 = 42) =================
  {
    sectorId: 'sec_forest',
    regionId: 'reg_sunspire_vale',
    sectorName: { uk: 'Лісові землі', en: 'Forest Lands' },
    nodes: [
      { uk: 'Бастіон Сонячного Шпиля', en: 'Sunspire Bastion', terrain: 'sanctuary', danger: 1, symbol: 'crown' },
      { uk: 'Бібліотека Світанку', en: 'Dawn Library', terrain: 'sanctuary', danger: 1, symbol: 'scroll' },
      { uk: 'Туманний Сосняк', en: 'Misty Pinewood', terrain: 'wilds', danger: 2, symbol: 'sword' },
      { uk: 'Вовче Лігво', en: 'Wolf Hollow', terrain: 'wilds', danger: 3, symbol: 'skull' },
      { uk: 'Сутінкова Просіка', en: 'Duskwood Clearing', terrain: 'wilds', danger: 2, symbol: 'chest' },
      { uk: 'Зелені Кургани', en: 'Green Barrows', terrain: 'shrine', danger: 2, symbol: 'shrine' },
      { uk: 'Сторожка Лісничого', en: 'Forester Lodge', terrain: 'village', danger: 1, symbol: 'scroll' },
    ],
  },
  {
    sectorId: 'sec_rural',
    regionId: 'reg_sunspire_vale',
    sectorName: { uk: 'Сільські землі', en: 'Rural Lands' },
    nodes: [
      { uk: 'Стара Корчма на Тракту', en: 'Old Road Tavern', terrain: 'village', danger: 1, symbol: 'chest' },
      { uk: 'Перехрестя Мандрівників', en: 'Traveler Crossroads', terrain: 'village', danger: 1, symbol: 'scroll' },
      { uk: 'Селище Лісорубів', en: 'Woodcutter Hamlet', terrain: 'village', danger: 1, symbol: 'chest' },
      { uk: 'Закинутий Млин', en: 'Abandoned Mill', terrain: 'ruins', danger: 2, symbol: 'sword' },
      { uk: 'Золота Нива', en: 'Golden Acreage', terrain: 'village', danger: 1, symbol: 'chest' },
      { uk: 'Пасіка Старого Оріона', en: 'Orion Apiary', terrain: 'sanctuary', danger: 1, symbol: 'shrine' },
      { uk: 'Ярмаркова Площа', en: 'Market Meadow', terrain: 'village', danger: 1, symbol: 'chest' },
    ],
  },
  {
    sectorId: 'sec_mountain',
    regionId: 'reg_sunspire_vale',
    sectorName: { uk: 'Гірські землі', en: 'Mountain Lands' },
    nodes: [
      { uk: 'Підгірна Кузня Торґара', en: 'Torgar Foothill Forge', terrain: 'village', danger: 1, symbol: 'chest' },
      { uk: 'Табір Високих Скель', en: 'High Crag Camp', terrain: 'wilds', danger: 2, symbol: 'sword' },
      { uk: 'Оглядовий Уступ Орлів', en: 'Eagle Crest Overlook', terrain: 'pass', danger: 2, symbol: 'scroll' },
      { uk: 'Шлях Громових Каменів', en: 'Thunderstone Trail', terrain: 'pass', danger: 3, symbol: 'skull' },
      { uk: 'Глибокий Яр Тіней', en: 'Deep Shadow Gorge', terrain: 'wilds', danger: 3, symbol: 'sword' },
      { uk: 'Північний Вітровал', en: 'Northwind Ridge', terrain: 'pass', danger: 2, symbol: 'scroll' },
      { uk: 'Кам’яний Кар’єр', en: 'Granite Quarry', terrain: 'wilds', danger: 2, symbol: 'chest' },
    ],
  },
  {
    sectorId: 'sec_ancient_ruins',
    regionId: 'reg_sunspire_vale',
    sectorName: { uk: 'Стародавні руїни', en: 'Ancient Ruins' },
    nodes: [
      { uk: 'Каплиця Ордену Рун', en: 'Chapel of the Rune Order', terrain: 'shrine', danger: 1, symbol: 'shrine' },
      { uk: 'Зруйнована Вартова Вежа', en: 'Ruined Watchtower', terrain: 'ruins', danger: 3, symbol: 'sword' },
      { uk: 'Кам’яне Коло Предків', en: 'Ancestral Stone Circle', terrain: 'shrine', danger: 2, symbol: 'shrine' },
      { uk: 'Розбитий Міст Королів', en: 'Shattered King Bridge', terrain: 'ruins', danger: 3, symbol: 'skull' },
      { uk: 'Криниця Відлуння', en: 'Echoing Well', terrain: 'shrine', danger: 2, symbol: 'scroll' },
      { uk: 'Оплот Спадкоємців', en: 'Heir Outpost', terrain: 'sanctuary', danger: 2, symbol: 'crown' },
      { uk: 'Святилище Громового Піку', en: 'Thunderpeak Sanctum', terrain: 'shrine', danger: 4, symbol: 'crown' },
    ],
  },
  {
    sectorId: 'sec_river',
    regionId: 'reg_sunspire_vale',
    sectorName: { uk: 'Річкові землі', en: 'River Lands' },
    nodes: [
      { uk: 'Брід Срібної Ріки', en: 'Silver River Ford', terrain: 'wilds', danger: 2, symbol: 'scroll' },
      { uk: 'Моховий Акведук', en: 'Mossbound Aqueduct', terrain: 'ruins', danger: 3, symbol: 'sword' },
      { uk: 'Рибальська Пристань', en: 'Angler Pier', terrain: 'village', danger: 1, symbol: 'chest' },
      { uk: 'Дельта Тихих Верб', en: 'Willow Delta', terrain: 'wilds', danger: 2, symbol: 'scroll' },
      { uk: 'Кам’яна Дамба', en: 'Stone Weir', terrain: 'pass', danger: 2, symbol: 'sword' },
      { uk: 'Острів Лілій', en: 'Lily Isle', terrain: 'shrine', danger: 2, symbol: 'shrine' },
      { uk: 'Паромна Переправа', en: 'Ferry Crossing', terrain: 'pass', danger: 2, symbol: 'chest' },
    ],
  },
  {
    sectorId: 'sec_borderlands',
    regionId: 'reg_sunspire_vale',
    sectorName: { uk: 'Прикордоння', en: 'Borderlands' },
    nodes: [
      { uk: 'Сонячний Ліхтарний Пагорб', en: 'Lantern Hill', terrain: 'shrine', danger: 2, symbol: 'shrine' },
      { uk: 'Застава Залізного Дуба', en: 'Ironoak Garrison', terrain: 'fortress', danger: 3, symbol: 'sword' },
      { uk: 'Пост Прикордонної Варти', en: 'Border Watch Post', terrain: 'fortress', danger: 3, symbol: 'sword' },
      { uk: 'Сутінковий Рів', en: 'Twilight Trench', terrain: 'wilds', danger: 3, symbol: 'skull' },
      { uk: 'Згарище Давнього Обозу', en: 'Burned Caravan Trail', terrain: 'ruins', danger: 3, symbol: 'chest' },
      { uk: 'Брама Сонячного Шпиля', en: 'Sunspire Border Gate', terrain: 'pass', danger: 3, symbol: 'gate' },
      { uk: 'Застава Охоронця Брами', en: 'Gate Guardian Bastion', terrain: 'fortress', danger: 4, symbol: 'gate' },
    ],
  },

  // ================= MIDDLE REGION (5 sectors x 6 = 30) =================
  {
    sectorId: 'sec_cursed_forest',
    regionId: 'reg_ashen_marches',
    sectorName: { uk: 'Проклятий ліс', en: 'Cursed Forest' },
    nodes: [
      { uk: 'Вартова Брама Попелу', en: 'Cinderwatch Gate', terrain: 'pass', danger: 3, symbol: 'gate' },
      { uk: 'Шепотливі Терни', en: 'Whispering Thorns', terrain: 'wilds', danger: 4, symbol: 'sword' },
      { uk: 'Гай Мертвих В’язів', en: 'Dead Elm Grove', terrain: 'wilds', danger: 4, symbol: 'skull' },
      { uk: 'Болото Сірих Вогнів', en: 'Greyfire Bog', terrain: 'wilds', danger: 4, symbol: 'scroll' },
      { uk: 'Хатина Самітника', en: 'Hermit Hollow', terrain: 'sanctuary', danger: 2, symbol: 'chest' },
      { uk: 'Тіньовий Перелісок', en: 'Shadow Thicket', terrain: 'wilds', danger: 4, symbol: 'sword' },
    ],
  },
  {
    sectorId: 'sec_ruined_lands',
    regionId: 'reg_ashen_marches',
    sectorName: { uk: 'Землі руїн', en: 'Ruined Lands' },
    nodes: [
      { uk: 'Перший Розколотий Обеліск', en: 'First Cracked Obelisk', terrain: 'ruins', danger: 3, symbol: 'scroll' },
      { uk: 'Поле Тліючих Списів', en: 'Field of Smoldering Spears', terrain: 'ruins', danger: 4, symbol: 'sword' },
      { uk: 'Алея Німих Монолітів', en: 'Alley of Mute Monoliths', terrain: 'ruins', danger: 4, symbol: 'skull' },
      { uk: 'Руїни Древньої Обсерваторії', en: 'Ancient Observatory Ruins', terrain: 'ruins', danger: 4, symbol: 'scroll' },
      { uk: 'Гробовище Сталевих Лицарів', en: 'Tomb of Steel Knights', terrain: 'ruins', danger: 5, symbol: 'chest' },
      { uk: 'Сірий Караван-Сарай', en: 'Grey Caravanserai', terrain: 'village', danger: 2, symbol: 'chest' },
    ],
  },
  {
    sectorId: 'sec_volcanic',
    regionId: 'reg_ashen_marches',
    sectorName: { uk: 'Вулканічні землі', en: 'Volcanic Lands' },
    nodes: [
      { uk: 'Базальтова Долина', en: 'Basalt Valley', terrain: 'wilds', danger: 4, symbol: 'sword' },
      { uk: 'Тріщина Жар-Каменю', en: 'Emberstone Fissure', terrain: 'wilds', danger: 4, symbol: 'skull' },
      { uk: 'Каньйон Вічного Попелу', en: 'Canyon of Eternal Ash', terrain: 'wilds', danger: 4, symbol: 'sword' },
      { uk: 'Озеро Чорного Скла', en: 'Lake of Black Glass', terrain: 'wilds', danger: 4, symbol: 'scroll' },
      { uk: 'Печера Дрейкових Гнізд', en: 'Drake Nest Cavern', terrain: 'wilds', danger: 5, symbol: 'skull' },
      { uk: 'Магмовий Перевал', en: 'Magma Pass', terrain: 'pass', danger: 5, symbol: 'sword' },
    ],
  },
  {
    sectorId: 'sec_demon_lands',
    regionId: 'reg_ashen_marches',
    sectorName: { uk: 'Землі демонів', en: 'Demon Lands' },
    nodes: [
      { uk: 'Келія Заклинача', en: 'Hexweaver Cell', terrain: 'ruins', danger: 4, symbol: 'scroll' },
      { uk: 'Розлом Безодні', en: 'Abyssal Rift', terrain: 'wilds', danger: 5, symbol: 'skull' },
      { uk: 'Бастіон Попелястих Вартових', en: 'Ashen Warden Keep', terrain: 'fortress', danger: 4, symbol: 'sword' },
      { uk: 'Пекловий Капище', en: 'Infernal Altar', terrain: 'shrine', danger: 5, symbol: 'skull' },
      { uk: 'Кістяна Бруковка', en: 'Bone Causeway', terrain: 'pass', danger: 5, symbol: 'sword' },
      { uk: 'Святилище Зоряної Долі', en: 'Starweaver Sanctum', terrain: 'shrine', danger: 5, symbol: 'crown' },
    ],
  },
  {
    sectorId: 'sec_ancient_temples',
    regionId: 'reg_ashen_marches',
    sectorName: { uk: 'Стародавні храми', en: 'Ancient Temples' },
    nodes: [
      { uk: 'Святилище Згаслого Вогню', en: 'Shrine of Extinguished Flame', terrain: 'shrine', danger: 3, symbol: 'shrine' },
      { uk: 'Прихисток Мандрівних Ченців', en: 'Wandering Monk Refuge', terrain: 'sanctuary', danger: 2, symbol: 'chest' },
      { uk: 'Дзеркальний Колодязь Рун', en: 'Mirrored Rune Well', terrain: 'shrine', danger: 4, symbol: 'scroll' },
      { uk: 'Зал Тріснутої Мудрості', en: 'Hall of Fractured Wisdom', terrain: 'ruins', danger: 4, symbol: 'scroll' },
      { uk: 'Обсидіановий Архіваріум', en: 'Obsidian Archive', terrain: 'shrine', danger: 5, symbol: 'crown' },
      { uk: 'Брама Трьох Печаток', en: 'Gate of Three Seals', terrain: 'pass', danger: 4, symbol: 'gate' },
    ],
  },

  // ================= INNER REGION (4 sectors x 3 = 12) =================
  {
    sectorId: 'sec_shattered_gates',
    regionId: 'reg_abyssal_citadel',
    sectorName: { uk: 'Зруйновані брами', en: 'Shattered Gates' },
    nodes: [
      { uk: 'Передмістя Розколотої Прірви', en: 'Chasm Bridgehead', terrain: 'pass', danger: 5, symbol: 'gate' },
      { uk: 'Міст Блідого Місяця', en: 'Pale Moon Bridge', terrain: 'pass', danger: 5, symbol: 'sword' },
      { uk: 'Схов Останніх Пілігримів', en: 'Last Pilgrim Shelter', terrain: 'sanctuary', danger: 3, symbol: 'shrine' },
    ],
  },
  {
    sectorId: 'sec_path_of_trials',
    regionId: 'reg_abyssal_citadel',
    sectorName: { uk: 'Шлях випробувань', en: 'Path of Trials' },
    nodes: [
      { uk: 'Зала Застиглого Часу', en: 'Hall of Frozen Time', terrain: 'shrine', danger: 5, symbol: 'shrine' },
      { uk: 'Вівтар Розколотої Долі', en: 'Altar of Shattered Fate', terrain: 'shrine', danger: 5, symbol: 'scroll' },
      { uk: 'Зал Випробування Клятви', en: 'Hall of Oath Trials', terrain: 'shrine', danger: 6, symbol: 'shrine' },
    ],
  },
  {
    sectorId: 'sec_guardian_citadel',
    regionId: 'reg_abyssal_citadel',
    sectorName: { uk: 'Цитадель охоронців', en: 'Citadel of Guardians' },
    nodes: [
      { uk: 'Зовнішній Вал Цитаделі', en: 'Outer Citadel Rampart', terrain: 'fortress', danger: 6, symbol: 'sword' },
      { uk: 'Бастіон Залізного Серафима', en: 'Iron Seraph Bastion', terrain: 'fortress', danger: 6, symbol: 'skull' },
      { uk: 'Зала Інквізитора Безодні', en: 'Abyss Inquisitor Hall', terrain: 'fortress', danger: 6, symbol: 'skull' },
    ],
  },
  {
    sectorId: 'sec_heart_of_darkness',
    regionId: 'reg_abyssal_citadel',
    sectorName: { uk: 'Серце темряви', en: 'Heart of Darkness' },
    nodes: [
      { uk: 'Коридор Безмовних Кроків', en: 'Corridor of Mute Steps', terrain: 'ruins', danger: 6, symbol: 'sword' },
      { uk: 'Провалля Шепотів', en: 'Whispering Chasm', terrain: 'wilds', danger: 6, symbol: 'skull' },
      { uk: 'Трон Порожнечі', en: 'Throne of the Void', terrain: 'void_throne', danger: 6, symbol: 'crown' },
    ],
  },
];

const TERRAIN_DESC_UK: Record<LocationTerrain, string> = {
  sanctuary: 'Захищена твердиня, де герої можуть безпечно перепочити та поповнити припаси.',
  village: 'Оживлене поселення мандрівників і торговців.',
  wilds: 'Дикі непередбачувані простори, багаті на засідки та здобич.',
  ruins: 'Залишки давніх цивілізацій із таємничими артефактами.',
  shrine: 'Місце стародавньої магії та духовних випробувань.',
  pass: 'Ключовий прохід, що з’єднує землі та регіони.',
  fortress: 'Укріплений рубіж, де чатують загартовані вартові.',
  void_throne: 'Серце темряви, де вирішується доля Забутих Земель.',
};

const TERRAIN_DESC_EN: Record<LocationTerrain, string> = {
  sanctuary: 'A sheltered stronghold where heroes recover strength and prepare.',
  village: 'A lively settlement of travelers and local merchants.',
  wilds: 'Untamed expanse full of hidden perils and unexpected finds.',
  ruins: 'Ancient remnants concealing forgotten relics and curses.',
  shrine: 'A site of ancient magic and spiritual trials.',
  pass: 'A strategic crossing linking distant sectors and regions.',
  fortress: 'A fortified bastion guarded by relentless sentinels.',
  void_throne: 'The heart of darkness where the fate of the Forgotten Realms is decided.',
};

function buildTimeEffects(terrain: LocationTerrain, danger: number): {
  dayEffect: LocationTimeEffect;
  nightEffect: LocationTimeEffect;
} {
  if (terrain === 'sanctuary' || terrain === 'village') {
    return {
      dayEffect: {
        description: { uk: 'Удень безпечний притулок (+1 до захисту)', en: 'Safe daytime haven (+1 Defense)' },
        attackMod: 0,
        defenseMod: 1,
        dangerMod: 0,
      },
      nightEffect: {
        description: { uk: 'Вночі варта насторожі (+0 загрози)', en: 'Night watch active (+0 Danger)' },
        attackMod: 0,
        defenseMod: 0,
        dangerMod: 0,
      },
    };
  }
  return {
    dayEffect: {
      description: {
        uk: danger >= 4 ? 'Денне світло послаблює тіні (+1 до атаки героя)' : 'Ясний огляд місцевості',
        en: danger >= 4 ? 'Daylight weakens shadows (+1 Hero Attack)' : 'Clear daytime visibility',
      },
      attackMod: danger >= 4 ? 1 : 0,
      defenseMod: 0,
      dangerMod: 0,
    },
    nightEffect: {
      description: {
        uk: `Темрява підсилює хижаків (+${Math.min(2, Math.ceil(danger / 3))} загрози вночі)`,
        en: `Darkness emboldens foes (+${Math.min(2, Math.ceil(danger / 3))} Night Danger)`,
      },
      attackMod: 0,
      defenseMod: -1,
      dangerMod: Math.min(2, Math.ceil(danger / 3)),
    },
  };
}

function buildWeatherModifiers(terrain: LocationTerrain): Record<WeatherType, LocationWeatherEffect> {
  return {
    clear: {
      description: { uk: 'Ясно: без штрафів до руху', en: 'Clear: no movement penalties' },
      moveMod: 0,
      combatMod: 0,
    },
    mist: {
      description: { uk: 'Туман: +1 до захисту в засідках', en: 'Mist: +1 Defense in cover' },
      moveMod: 0,
      combatMod: 1,
    },
    rain: {
      description: {
        uk: terrain === 'pass' || terrain === 'wilds' ? 'Злива: -1 до темпу на бездоріжжі' : 'Злива: слизька дорога',
        en: terrain === 'pass' || terrain === 'wilds' ? 'Rain: -1 pace on muddy trails' : 'Rain: slick ground',
      },
      moveMod: terrain === 'pass' || terrain === 'wilds' ? -1 : 0,
      combatMod: 0,
    },
    ash_storm: {
      description: { uk: 'Попеляста буря: -1 до захисту, +1 до люті бою', en: 'Ash Storm: -1 Defense, +1 Attack fury' },
      moveMod: -1,
      combatMod: -1,
    },
    frost_wind: {
      description: { uk: 'Крижаний вітер: +1 до стійкості', en: 'Frost Wind: +1 Endurance' },
      moveMod: 0,
      combatMod: 1,
    },
    void_eclipse: {
      description: { uk: 'Затемнення Порожнечі: посилені вороги (+1 загрози)', en: 'Void Eclipse: empowered enemies (+1 Threat)' },
      moveMod: 0,
      combatMod: -1,
    },
  };
}

function polarToCanvas(radius: number, angleDeg: number): { x: number; y: number } {
  const cx = 700;
  const cy = 520;
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: Math.round(cx + radius * Math.cos(rad)),
    y: Math.round(cy + radius * Math.sin(rad)),
  };
}

function formatLocId(num: number): string {
  return `loc_${String(num).padStart(2, '0')}`;
}

function buildAll84Locations(): LocationDefinition[] {
  const all: LocationDefinition[] = [];
  const sectorBuckets: LocationDefinition[][] = [];
  let globalIndex = 1;

  // Counters per region to compute deterministic ring positions
  let outerSectorIdx = 0;
  let middleSectorIdx = 0;
  let innerSectorIdx = 0;

  for (const spec of SECTOR_SPECS) {
    const bucket: LocationDefinition[] = [];
    const accessType: AccessConditionType =
      spec.regionId === 'reg_sunspire_vale'
        ? 'open'
        : spec.regionId === 'reg_ashen_marches'
          ? 'gate_guardian'
          : 'three_seals';

    spec.nodes.forEach((node, localIdx) => {
      let coords = { x: 700, y: 520 };

      if (spec.regionId === 'reg_sunspire_vale') {
        const baseDeg = -90 + outerSectorIdx * 60;
        if (localIdx < 4) {
          const offsets = [-21, -7, 7, 21];
          coords = polarToCanvas(460, baseDeg + offsets[localIdx]);
        } else {
          const offsets = [-17, 0, 17];
          coords = polarToCanvas(376, baseDeg + offsets[localIdx - 4]);
        }
      } else if (spec.regionId === 'reg_ashen_marches') {
        const baseDeg = -90 + middleSectorIdx * 72;
        if (localIdx < 3) {
          const offsets = [-20, 0, 20];
          coords = polarToCanvas(292, baseDeg + offsets[localIdx]);
        } else {
          const offsets = [-20, 0, 20];
          coords = polarToCanvas(220, baseDeg + offsets[localIdx - 3]);
        }
      } else {
        const baseDeg = -90 + innerSectorIdx * 90;
        if (spec.sectorId === 'sec_heart_of_darkness' && localIdx === 2) {
          coords = { x: 700, y: 520 }; // Throne of the Void at the center!
        } else if (localIdx < 2) {
          const offsets = [-22, 22];
          coords = polarToCanvas(146, baseDeg + offsets[localIdx]);
        } else {
          coords = polarToCanvas(88, baseDeg);
        }
      }

      const times = buildTimeEffects(node.terrain, node.danger);
      const loc: LocationDefinition = {
        id: formatLocId(globalIndex),
        index: globalIndex,
        regionId: spec.regionId,
        sectorId: spec.sectorId,
        sectorName: spec.sectorName,
        name: { uk: node.uk, en: node.en },
        description: {
          uk: `${node.uk} (${spec.sectorName.uk}). ${TERRAIN_DESC_UK[node.terrain]}`,
          en: `${node.en} (${spec.sectorName.en}). ${TERRAIN_DESC_EN[node.terrain]}`,
        },
        terrain: node.terrain,
        dangerLevel: node.danger,
        x: coords.x,
        y: coords.y,
        neighbors: [],
        accessCondition: ACCESS_CONDITIONS[accessType],
        adventureSymbol: node.symbol,
        dayEffect: times.dayEffect,
        nightEffect: times.nightEffect,
        weatherModifiers: buildWeatherModifiers(node.terrain),
      };

      bucket.push(loc);
      all.push(loc);
      globalIndex += 1;
    });

    if (spec.regionId === 'reg_sunspire_vale') outerSectorIdx += 1;
    else if (spec.regionId === 'reg_ashen_marches') middleSectorIdx += 1;
    else innerSectorIdx += 1;

    sectorBuckets.push(bucket);
  }

  const byId = new Map(all.map((l) => [l.id, l]));
  const link = (aId: string, bId: string) => {
    const a = byId.get(aId);
    const b = byId.get(bId);
    if (!a || !b || aId === bId) return;
    if (!a.neighbors.includes(bId)) a.neighbors.push(bId);
    if (!b.neighbors.includes(aId)) b.neighbors.push(aId);
  };

  // Connect Outer Region (sectors 0..5, 7 nodes each)
  for (let s = 0; s < 6; s++) {
    const sec = sectorBuckets[s];
    const nextSec = sectorBuckets[(s + 1) % 6];
    // Outer ring 0-1-2-3
    link(sec[0].id, sec[1].id);
    link(sec[1].id, sec[2].id);
    link(sec[2].id, sec[3].id);
    // Inner track 4-5-6
    link(sec[4].id, sec[5].id);
    link(sec[5].id, sec[6].id);
    // Radial branches
    link(sec[0].id, sec[4].id);
    link(sec[2].id, sec[5].id);
    link(sec[3].id, sec[6].id);
    // Sector-to-sector continuity
    link(sec[3].id, nextSec[0].id);
    link(sec[6].id, nextSec[4].id);
  }

  // Connect Middle Region (sectors 6..10, 6 nodes each)
  for (let i = 0; i < 5; i++) {
    const sec = sectorBuckets[6 + i];
    const nextSec = sectorBuckets[6 + ((i + 1) % 5)];
    link(sec[0].id, sec[1].id);
    link(sec[1].id, sec[2].id);
    link(sec[3].id, sec[4].id);
    link(sec[4].id, sec[5].id);
    link(sec[0].id, sec[3].id);
    link(sec[1].id, sec[4].id);
    link(sec[2].id, sec[5].id);
    link(sec[2].id, nextSec[0].id);
    link(sec[5].id, nextSec[3].id);
  }

  // Connect Inner Region (sectors 11..14, 3 nodes each)
  for (let i = 0; i < 4; i++) {
    const sec = sectorBuckets[11 + i];
    const nextSec = sectorBuckets[11 + ((i + 1) % 4)];
    link(sec[0].id, sec[1].id);
    link(sec[0].id, sec[2].id);
    link(sec[1].id, sec[2].id);
    link(sec[1].id, nextSec[0].id);
  }
  // Connect Inner Region inner core spokes to Throne of the Void (loc_84)
  link('loc_75', 'loc_78');
  link('loc_78', 'loc_81');
  link('loc_81', 'loc_84');
  link('loc_75', 'loc_84');

  // Inter-region Gate 1: Outer Borderlands (loc_42) <-> Middle Cursed Forest Entry (loc_43)
  link('loc_42', 'loc_43');
  byId.get('loc_42')!.isInterRegionGate = true;
  byId.get('loc_42')!.isGateGuardianLair = true;
  byId.get('loc_43')!.isInterRegionGate = true;

  // Inter-region Gate 2: Middle Ancient Temples (loc_72) <-> Inner Shattered Gates (loc_73)
  link('loc_72', 'loc_73');
  byId.get('loc_72')!.isInterRegionGate = true;
  byId.get('loc_73')!.isInterRegionGate = true;

  // Assign Three Seals in Outer & Middle Regions (so 3 Seals unlock Inner Region!)
  const loc28 = byId.get('loc_28')!;
  loc28.sealGuardianId = 'enemy_guardian_power';
  loc28.sealReward = 'seal_power';

  const loc71 = byId.get('loc_71')!;
  loc71.sealGuardianId = 'enemy_guardian_wisdom';
  loc71.sealReward = 'seal_wisdom';

  const loc66 = byId.get('loc_66')!;
  loc66.sealGuardianId = 'enemy_guardian_fate';
  loc66.sealReward = 'seal_fate';

  // Final Boss Lair at center
  byId.get('loc_84')!.isFinalBossLair = true;

  return all;
}

export const LOCATIONS: LocationDefinition[] = buildAll84Locations();
export const LOCATION_MAP = new Map(LOCATIONS.map((l) => [l.id, l]));
export const SECTORS_LIST = SECTOR_SPECS.map((s) => ({
  sectorId: s.sectorId,
  regionId: s.regionId,
  sectorName: s.sectorName,
  count: s.nodes.length,
}));
