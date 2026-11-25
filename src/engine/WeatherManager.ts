import { LOCATION_MAP } from '../data/locations';
import { MAJOR_WORLD_EVENT_MAP } from '../data/worldEvents';
import { HERO_STAT_LIMITS } from '../types/game';
import {
  GameState,
  LocalizedText,
  LocationDefinition,
  MajorWorldEventId,
  PlayerState,
  RegionId,
  WeatherProfile,
  WeatherRegionalEffect,
  WeatherType,
} from '../types/game';
import { DayNightManager } from './DayNightManager';
import { getActivePlayerFromState } from './GameState';
import { RandomManager } from './RandomManager';

export const CORE_WEATHER_TYPES: WeatherType[] = [
  'clear',
  'rain',
  'heavy_rain',
  'mist',
  'magic_fog',
  'snow',
  'blizzard',
  'heat',
  'dry_wind',
  'thunderstorm',
];

export const WEATHER_PROFILES: Record<WeatherType, WeatherProfile> = {
  clear: {
    id: 'clear',
    name: { uk: 'Ясна погода', en: 'Clear Sky' },
    description: {
      uk: 'Чисте небо без перешкод: безперешкодний рух і ясний огляд шляхів.',
      en: 'Unclouded skies: unobstructed movement and clear visibility across routes.',
    },
    minDuration: 1,
    maxDuration: 3,
    moveMod: 0,
    physicalMod: 0,
    magicMod: 0,
    defenseMod: 0,
    dangerMod: 0,
    blocksMountainPass: false,
    concealsEncounter: false,
    triggersMagicEvent: false,
    regionEffects: {
      reg_sunspire_vale: {
        description: { uk: 'Долина сяє миром (+1 до захисту в дорозі).', en: 'Sunspire roads gleam clearly (+1 Defense).' },
        moveMod: 0,
        physicalMod: 0,
        magicMod: 0,
        defenseMod: 1,
        dangerMod: 0,
      },
      reg_ashen_marches: {
        description: { uk: 'Попіл осідає — добрий огляд руїн.', en: 'Ash settles, granting crisp sightlines.' },
        moveMod: 0,
        physicalMod: 0,
        magicMod: 0,
        defenseMod: 0,
        dangerMod: 0,
      },
      reg_abyssal_citadel: {
        description: { uk: 'Холодне прояснення над Цитаделлю.', en: 'Brief cold clarity over the Citadel.' },
        moveMod: 0,
        physicalMod: 0,
        magicMod: 0,
        defenseMod: 0,
        dangerMod: 0,
      },
    },
  },
  rain: {
    id: 'rain',
    name: { uk: 'Дощ', en: 'Rain' },
    description: {
      uk: 'Рівний дощ розмиває путівці й збиває вогонь (-1 крок на гірських/диких стежках).',
      en: 'Steady rainfall muddies trails and dampens torches (-1 pace on wild/pass paths).',
    },
    minDuration: 1,
    maxDuration: 2,
    moveMod: 0,
    physicalMod: 0,
    magicMod: 0,
    defenseMod: 0,
    dangerMod: 1,
    blocksMountainPass: false,
    concealsEncounter: false,
    triggersMagicEvent: false,
    regionEffects: {
      reg_sunspire_vale: {
        description: { uk: 'Теплий дощ освіжає ліси, але робить броди слизькими.', en: 'Warm rain feeds the woods yet slickens river fords.' },
        moveMod: 0,
        physicalMod: 0,
        magicMod: 0,
        defenseMod: 0,
        dangerMod: 0,
      },
      reg_ashen_marches: {
        description: { uk: 'Шипляча пара над вулканами (-1 до фіз. атаки).', en: 'Hissing steam rises off volcanic ash (-1 Physical).' },
        moveMod: -1,
        physicalMod: -1,
        magicMod: 0,
        defenseMod: 0,
        dangerMod: 1,
      },
      reg_abyssal_citadel: {
        description: { uk: 'Кислотна мряка роз’їдає камінь (+1 загрози).', en: 'Acrid drizzle pelts obsidian walls (+1 Danger).' },
        moveMod: 0,
        physicalMod: 0,
        magicMod: 0,
        defenseMod: -1,
        dangerMod: 1,
      },
    },
  },
  heavy_rain: {
    id: 'heavy_rain',
    name: { uk: 'Сильна злива', en: 'Heavy Rain' },
    description: {
      uk: 'Злива заливає дороги (-1 до руху), гасить полум’я, але врівноважує захист.',
      en: 'Torrential rain floods trails (-1 Movement) and hinders heavy strikes.',
    },
    minDuration: 1,
    maxDuration: 2,
    moveMod: -1,
    physicalMod: -1,
    magicMod: 0,
    defenseMod: 0,
    dangerMod: 1,
    blocksMountainPass: false,
    concealsEncounter: false,
    triggersMagicEvent: false,
    regionEffects: {
      reg_sunspire_vale: {
        description: { uk: 'Розлиті ріки уповільнюють марш (-1 крок).', en: 'Swollen rivers slow travel (-1 step).' },
        moveMod: -1,
        physicalMod: -1,
        magicMod: 0,
        defenseMod: 0,
        dangerMod: 1,
      },
      reg_ashen_marches: {
        description: { uk: 'Злива прибиває вулканічний жар (+1 до магії води).', en: 'Downpour cools ash fields (+1 Magic).' },
        moveMod: -1,
        physicalMod: -1,
        magicMod: 1,
        defenseMod: 0,
        dangerMod: 1,
      },
      reg_abyssal_citadel: {
        description: { uk: 'Потоки чорного дощу тиснуть на щити (-1 рух, -1 захист).', en: 'Black rain batters shields (-1 move, -1 defense).' },
        moveMod: -1,
        physicalMod: -1,
        magicMod: 0,
        defenseMod: -1,
        dangerMod: 2,
      },
    },
  },
  mist: {
    id: 'mist',
    name: { uk: 'Туман', en: 'Mist' },
    description: {
      uk: 'Густий туман приховує зустрічі під час прибуття, дає +1 захисту і відкриває втечу.',
      en: 'Dense mist conceals arrival encounters, grants +1 Defense, and unlocks Flee.',
    },
    minDuration: 1,
    maxDuration: 2,
    moveMod: 0,
    physicalMod: 0,
    magicMod: 0,
    defenseMod: 1,
    dangerMod: 0,
    blocksMountainPass: false,
    concealsEncounter: true,
    triggersMagicEvent: false,
    regionEffects: {
      reg_sunspire_vale: {
        description: { uk: 'Тихий туман ховає мандрівника від засідок.', en: 'Soft valley mist hides travelers from ambushes.' },
        moveMod: 0,
        physicalMod: 0,
        magicMod: 0,
        defenseMod: 1,
        dangerMod: -1,
      },
      reg_ashen_marches: {
        description: { uk: 'Попелястий туман маскує кроки (+1 до захисту).', en: 'Ashen mist masks movement (+1 Defense).' },
        moveMod: 0,
        physicalMod: 0,
        magicMod: 0,
        defenseMod: 1,
        dangerMod: 0,
      },
      reg_abyssal_citadel: {
        description: { uk: 'Морок туману плутає варту Цитаделі.', en: 'Citadel mist baffles patrols (+1 Defense).' },
        moveMod: 0,
        physicalMod: 0,
        magicMod: 0,
        defenseMod: 1,
        dangerMod: 0,
      },
    },
  },
  magic_fog: {
    id: 'magic_fog',
    name: { uk: 'Магічний туман', en: 'Arcane Fog' },
    description: {
      uk: 'Сяючий ефірний туман приховує засідки, підсилює магію (+2) і будить таємні чари.',
      en: 'Luminous ether fog conceals ambushes, boosts Magic (+2), and sparks arcane phenomena.',
    },
    minDuration: 1,
    maxDuration: 2,
    moveMod: 0,
    physicalMod: -1,
    magicMod: 2,
    defenseMod: 1,
    dangerMod: 1,
    blocksMountainPass: false,
    concealsEncounter: true,
    triggersMagicEvent: true,
    regionEffects: {
      reg_sunspire_vale: {
        description: { uk: 'Древні руни в лісах пробуджуються (+2 до магії).', en: 'Ancient forest runes awaken (+2 Magic).' },
        moveMod: 0,
        physicalMod: -1,
        magicMod: 2,
        defenseMod: 1,
        dangerMod: 0,
      },
      reg_ashen_marches: {
        description: { uk: 'Храми резонують з магічним туманом (+2 до магії).', en: 'Temples resonate with arcane fog (+2 Magic).' },
        moveMod: 0,
        physicalMod: -1,
        magicMod: 2,
        defenseMod: 1,
        dangerMod: 1,
      },
      reg_abyssal_citadel: {
        description: { uk: 'Ефірний туман пронизує Цитадель (+2 магія, +1 загроза).', en: 'Ether surges through the Citadel (+2 Magic, +1 Danger).' },
        moveMod: 0,
        physicalMod: -1,
        magicMod: 2,
        defenseMod: 1,
        dangerMod: 1,
      },
    },
  },
  snow: {
    id: 'snow',
    name: { uk: 'Сніг', en: 'Snow' },
    description: {
      uk: 'Снігопад вкриває шляхи (-1 крок у диких землях і перевалах), гартує стійкість (+1 захисту).',
      en: 'Snowfall blankets roads (-1 step in wilds/passes) and steels endurance (+1 Defense).',
    },
    minDuration: 1,
    maxDuration: 2,
    moveMod: -1,
    physicalMod: 0,
    magicMod: 0,
    defenseMod: 1,
    dangerMod: 1,
    blocksMountainPass: false,
    concealsEncounter: false,
    triggersMagicEvent: false,
    regionEffects: {
      reg_sunspire_vale: {
        description: { uk: 'Сніг сповільнює гірські стежки (-1 рух).', en: 'Snow slows mountain ridges (-1 move).' },
        moveMod: -1,
        physicalMod: 0,
        magicMod: 0,
        defenseMod: 1,
        dangerMod: 0,
      },
      reg_ashen_marches: {
        description: { uk: 'Сірий сніг гасить жар, але холодить руїни.', en: 'Gray snow cools ash yet chills ancient ruins.' },
        moveMod: -1,
        physicalMod: 0,
        magicMod: 0,
        defenseMod: 1,
        dangerMod: 1,
      },
      reg_abyssal_citadel: {
        description: { uk: 'Крижані пластівці глушать звук кроків.', en: 'Frost flakes deaden echoes across black stone.' },
        moveMod: -1,
        physicalMod: 0,
        magicMod: 0,
        defenseMod: 1,
        dangerMod: 1,
      },
    },
  },
  blizzard: {
    id: 'blizzard',
    name: { uk: 'Заметіль', en: 'Blizzard' },
    description: {
      uk: 'Буран засипає гірські переходи (прохід закрито!) та знижує швидкість руху (-2).',
      en: 'Howling blizzard seals mountain passes (blocked!) and slows movement (-2).',
    },
    minDuration: 1,
    maxDuration: 2,
    moveMod: -2,
    physicalMod: -1,
    magicMod: -1,
    defenseMod: 0,
    dangerMod: 2,
    blocksMountainPass: true,
    concealsEncounter: false,
    triggersMagicEvent: false,
    regionEffects: {
      reg_sunspire_vale: {
        description: { uk: 'Гірські перевали Зовнішнього краю завалені снігом!', en: 'Outer mountain passes are snowbound and impassable!' },
        moveMod: -2,
        physicalMod: -1,
        magicMod: -1,
        defenseMod: 0,
        dangerMod: 2,
      },
      reg_ashen_marches: {
        description: { uk: 'Попеляста заметіль сліпить та блокує перевали!', en: 'Ash-blizzard blinds scouts and seals passes!' },
        moveMod: -2,
        physicalMod: -1,
        magicMod: -1,
        defenseMod: 0,
        dangerMod: 2,
      },
      reg_abyssal_citadel: {
        description: { uk: 'Мертва хуртовина ріже броню й перекриває вузькі переходи.', en: 'Deadly gale seals Citadel passes (-2 move).' },
        moveMod: -2,
        physicalMod: -1,
        magicMod: -1,
        defenseMod: 0,
        dangerMod: 2,
      },
    },
  },
  heat: {
    id: 'heat',
    name: { uk: 'Спека', en: 'Scorching Heat' },
    description: {
      uk: 'Палюча спека виснажує в броні (-1 до захисту), але розпалює натиск (+1 фіз. атака).',
      en: 'Blistering heat saps armor stamina (-1 Defense) yet stokes fierce strikes (+1 Physical).',
    },
    minDuration: 1,
    maxDuration: 2,
    moveMod: 0,
    physicalMod: 1,
    magicMod: 0,
    defenseMod: -1,
    dangerMod: 1,
    blocksMountainPass: false,
    concealsEncounter: false,
    triggersMagicEvent: false,
    regionEffects: {
      reg_sunspire_vale: {
        description: { uk: 'Спекотне сонце прискорює висохлі дороги (+1 атака, -1 захист).', en: 'Dry sunlit roads favor aggressive strikes (+1 Physical, -1 Defense).' },
        moveMod: 0,
        physicalMod: 1,
        magicMod: 0,
        defenseMod: -1,
        dangerMod: 0,
      },
      reg_ashen_marches: {
        description: { uk: 'Пекельна спека вулканів виснажує мандрівників (-1 рух, -1 захист).', en: 'Volcanic heat drains travelers (-1 move, -1 defense).' },
        moveMod: -1,
        physicalMod: 1,
        magicMod: 0,
        defenseMod: -1,
        dangerMod: 1,
      },
      reg_abyssal_citadel: {
        description: { uk: 'Розпечені плити Цитаделі палять повітря (+1 загроза).', en: 'Superheated Citadel slabs burn the air (+1 Danger).' },
        moveMod: -1,
        physicalMod: 1,
        magicMod: 0,
        defenseMod: -1,
        dangerMod: 2,
      },
    },
  },
  dry_wind: {
    id: 'dry_wind',
    name: { uk: 'Суховій', en: 'Dry Wind' },
    description: {
      uk: 'Гарячий сухий вітер розносить пісок і іскри (+1 фіз. атака, -1 до магії).',
      en: 'Parched gale whips up dust and sparks (+1 Physical Attack, -1 Magic).',
    },
    minDuration: 1,
    maxDuration: 2,
    moveMod: 0,
    physicalMod: 1,
    magicMod: -1,
    defenseMod: -1,
    dangerMod: 1,
    blocksMountainPass: false,
    concealsEncounter: false,
    triggersMagicEvent: false,
    regionEffects: {
      reg_sunspire_vale: {
        description: { uk: 'Пиловий суховій жене подорожніх трактами (+1 фіз.).', en: 'Dusty dry wind sweeps the valley roads (+1 Physical).' },
        moveMod: 0,
        physicalMod: 1,
        magicMod: -1,
        defenseMod: 0,
        dangerMod: 0,
      },
      reg_ashen_marches: {
        description: { uk: 'Суховій підіймає гарячий попіл (-1 магія, +1 загроза).', en: 'Dry gale lifts hot ash (-1 Magic, +1 Danger).' },
        moveMod: 0,
        physicalMod: 1,
        magicMod: -1,
        defenseMod: -1,
        dangerMod: 1,
      },
      reg_abyssal_citadel: {
        description: { uk: 'Виючий суховій Порожнечі розхитує концентрацію (-1 магія).', en: 'Howling wind disrupts spellcasting (-1 Magic).' },
        moveMod: 0,
        physicalMod: 1,
        magicMod: -1,
        defenseMod: -1,
        dangerMod: 1,
      },
    },
  },
  thunderstorm: {
    id: 'thunderstorm',
    name: { uk: 'Гроза', en: 'Thunderstorm' },
    description: {
      uk: 'Буря з блискавками сповільнює похід (-1 рух), заряджає магію (+2) та активує магічні події.',
      en: 'Lightning storm slows march (-1 move), surges Magic (+2), and triggers arcane storm events.',
    },
    minDuration: 1,
    maxDuration: 2,
    moveMod: -1,
    physicalMod: 0,
    magicMod: 2,
    defenseMod: 0,
    dangerMod: 2,
    blocksMountainPass: false,
    concealsEncounter: false,
    triggersMagicEvent: true,
    regionEffects: {
      reg_sunspire_vale: {
        description: { uk: 'Грозові розряди б’ють по руїнах і святилищах (+2 магії).', en: 'Lightning arcs over ruins and shrines (+2 Magic).' },
        moveMod: -1,
        physicalMod: 0,
        magicMod: 2,
        defenseMod: 0,
        dangerMod: 1,
      },
      reg_ashen_marches: {
        description: { uk: 'Вогняні блискавки над храмами (+2 магія, магічні сплески).', en: 'Fire-lightning splits sky above temples (+2 Magic).' },
        moveMod: -1,
        physicalMod: 0,
        magicMod: 2,
        defenseMod: 0,
        dangerMod: 2,
      },
      reg_abyssal_citadel: {
        description: { uk: 'Шторм Порожнечі розриває небо Цитаделі (+2 магія, +2 загроза).', en: 'Void thunderstorm fractures Citadel skies (+2 Magic, +2 Danger).' },
        moveMod: -1,
        physicalMod: 0,
        magicMod: 2,
        defenseMod: 0,
        dangerMod: 2,
      },
    },
  },
  ash_storm: {
    id: 'ash_storm',
    name: { uk: 'Попеляста буря', en: 'Ash Storm' },
    description: {
      uk: 'Смерч розпеченого попелу (-1 рух, -1 захист, +1 атака).',
      en: 'Swirling volcanic ash (-1 move, -1 Defense, +1 Attack).',
    },
    minDuration: 1,
    maxDuration: 2,
    moveMod: -1,
    physicalMod: 1,
    magicMod: 0,
    defenseMod: -1,
    dangerMod: 1,
    blocksMountainPass: false,
    concealsEncounter: false,
    triggersMagicEvent: false,
    regionEffects: {
      reg_sunspire_vale: {
        description: { uk: 'Занесений попіл заважає дихати (-1 захист).', en: 'Drifting ash irritates scouts (-1 Defense).' },
        moveMod: -1,
        physicalMod: 1,
        magicMod: 0,
        defenseMod: -1,
        dangerMod: 1,
      },
      reg_ashen_marches: {
        description: { uk: 'Рідна стихія Попелястих Рубіжів (-1 рух, +1 загрози).', en: 'Fierce native gale of the Ashen Marches (-1 move, +1 Danger).' },
        moveMod: -1,
        physicalMod: 1,
        magicMod: 0,
        defenseMod: -1,
        dangerMod: 2,
      },
      reg_abyssal_citadel: {
        description: { uk: 'Густий попіл вкриває стіни Цитаделі.', en: 'Heavy ash blankets the Citadel.' },
        moveMod: -1,
        physicalMod: 1,
        magicMod: 0,
        defenseMod: -1,
        dangerMod: 1,
      },
    },
  },
  frost_wind: {
    id: 'frost_wind',
    name: { uk: 'Крижаний вітер', en: 'Frost Wind' },
    description: {
      uk: 'Пронизливий вітер загартовує оборону (+1 захист), але тисне холодом.',
      en: 'Piercing frost wind hardens guard (+1 Defense) while chilling marches.',
    },
    minDuration: 1,
    maxDuration: 2,
    moveMod: 0,
    physicalMod: 0,
    magicMod: 0,
    defenseMod: 1,
    dangerMod: 1,
    blocksMountainPass: false,
    concealsEncounter: false,
    triggersMagicEvent: false,
    regionEffects: {
      reg_sunspire_vale: {
        description: { uk: 'Холодний північний вітер (+1 до захисту).', en: 'Crisp northern wind (+1 Defense).' },
        moveMod: 0,
        physicalMod: 0,
        magicMod: 0,
        defenseMod: 1,
        dangerMod: 0,
      },
      reg_ashen_marches: {
        description: { uk: 'Мороз контрастує з попелом (+1 захист).', en: 'Frost cuts across warm ash (+1 Defense).' },
        moveMod: 0,
        physicalMod: 0,
        magicMod: 0,
        defenseMod: 1,
        dangerMod: 1,
      },
      reg_abyssal_citadel: {
        description: { uk: 'Крижаний вихор навколо башт (+1 захист).', en: 'Icy gale around Citadel spires (+1 Defense).' },
        moveMod: 0,
        physicalMod: 0,
        magicMod: 0,
        defenseMod: 1,
        dangerMod: 1,
      },
    },
  },
  void_eclipse: {
    id: 'void_eclipse',
    name: { uk: 'Затемнення Порожнечі', en: 'Void Eclipse' },
    description: {
      uk: 'Темрява Порожнечі посилює ворогів (+2 загрози), але відкриває шлях до магії (+1).',
      en: 'Void darkness emboldens foes (+2 Danger) yet sharpens dark magic (+1).',
    },
    minDuration: 1,
    maxDuration: 2,
    moveMod: 0,
    physicalMod: 0,
    magicMod: 1,
    defenseMod: 0,
    dangerMod: 2,
    blocksMountainPass: false,
    concealsEncounter: false,
    triggersMagicEvent: true,
    regionEffects: {
      reg_sunspire_vale: {
        description: { uk: 'Тривожна тінь затьмарює сонце (+1 загроза).', en: 'An ominous shadow dims the sun (+1 Danger).' },
        moveMod: 0,
        physicalMod: 0,
        magicMod: 1,
        defenseMod: 0,
        dangerMod: 1,
      },
      reg_ashen_marches: {
        description: { uk: 'Розломи мерехтять у темряві (+1 магія, +2 загроза).', en: 'Rifts glow under the eclipse (+1 Magic, +2 Danger).' },
        moveMod: 0,
        physicalMod: 0,
        magicMod: 1,
        defenseMod: 0,
        dangerMod: 2,
      },
      reg_abyssal_citadel: {
        description: { uk: 'Повний резонанс Порожнечі (+2 магія, +2 загроза).', en: 'Total Void resonance (+2 Magic, +2 Danger).' },
        moveMod: 0,
        physicalMod: 0,
        magicMod: 2,
        defenseMod: 0,
        dangerMod: 2,
      },
    },
  },
};

const REGION_WEATHER_BASE_WEIGHTS: Record<RegionId, Record<WeatherType, number>> = {
  reg_sunspire_vale: {
    clear: 28,
    rain: 18,
    heavy_rain: 9,
    mist: 14,
    magic_fog: 6,
    snow: 9,
    blizzard: 4,
    heat: 5,
    dry_wind: 3,
    thunderstorm: 4,
    ash_storm: 0,
    frost_wind: 0,
    void_eclipse: 0,
  },
  reg_ashen_marches: {
    clear: 10,
    rain: 7,
    heavy_rain: 9,
    mist: 8,
    magic_fog: 11,
    snow: 4,
    blizzard: 6,
    heat: 20,
    dry_wind: 15,
    thunderstorm: 10,
    ash_storm: 0,
    frost_wind: 0,
    void_eclipse: 0,
  },
  reg_abyssal_citadel: {
    clear: 4,
    rain: 5,
    heavy_rain: 10,
    mist: 11,
    magic_fog: 20,
    snow: 7,
    blizzard: 13,
    heat: 7,
    dry_wind: 8,
    thunderstorm: 15,
    ash_storm: 0,
    frost_wind: 0,
    void_eclipse: 0,
  },
};

export const WeatherManager = {
  getProfile(weather: WeatherType): WeatherProfile {
    return WEATHER_PROFILES[weather] ?? WEATHER_PROFILES.clear;
  },

  getRegionWeatherEffect(weather: WeatherType, regionId: RegionId): WeatherRegionalEffect {
    const profile = WeatherManager.getProfile(weather);
    return profile.regionEffects[regionId];
  },

  getWeightedWeatherPool(
    regionId: RegionId,
    isNight: boolean,
    activeWorldEventId: string | null = null,
    sealsCount = 0,
    activeMajorEventIds: MajorWorldEventId[] = []
  ): Array<{ weather: WeatherType; weight: number }> {
    const base = { ...REGION_WEATHER_BASE_WEIGHTS[regionId] };

    if (isNight) {
      base.clear = Math.max(2, Math.floor(base.clear * 0.5));
      base.mist += 8;
      base.magic_fog += 7;
      base.blizzard += 4;
      base.thunderstorm += 5;
      base.heat = Math.max(1, Math.floor(base.heat * 0.6));
    }

    if (activeWorldEventId === 'event_01') {
      base.clear += 18;
    } else if (activeWorldEventId === 'event_07') {
      base.snow += 12;
      base.blizzard += 10;
    } else if (activeWorldEventId === 'event_03' || activeWorldEventId === 'event_09') {
      base.thunderstorm += 10;
      base.dry_wind += 6;
    }

    for (const majorId of activeMajorEventIds) {
      const def = MAJOR_WORLD_EVENT_MAP.get(majorId);
      if (!def) continue;
      for (const wb of def.weatherBias) {
        if (wb in base) {
          base[wb] += 12;
        }
      }
    }

    if (sealsCount >= 3) {
      base.magic_fog += 6;
      base.thunderstorm += 6;
    }

    return CORE_WEATHER_TYPES.map((w) => ({
      weather: w,
      weight: Math.max(1, base[w] ?? 1),
    }));
  },

  pickNextWeather(
    state: GameState,
    regionOverride?: RegionId
  ): { weather: WeatherType; duration: number } {
    const activePlayer = getActivePlayerFromState(state);
    const loc = LOCATION_MAP.get(activePlayer.locationId);
    const regionId: RegionId = regionOverride ?? loc?.regionId ?? 'reg_sunspire_vale';
    const isNight = DayNightManager.isNight(state);
    const pool = WeatherManager.getWeightedWeatherPool(
      regionId,
      isNight,
      state.activeWorldEventId,
      activePlayer.seals.length,
      (state.activeMajorEvents ?? []).map((e) => e.id)
    );

    const totalWeight = pool.reduce((sum, item) => sum + item.weight, 0);
    const roll = RandomManager.randomInt(state.rngState, 1, totalWeight);
    state.rngState = roll.nextState;

    let cursor = 0;
    let chosen: WeatherType = pool[0].weather;
    for (const item of pool) {
      cursor += item.weight;
      if (roll.value <= cursor) {
        chosen = item.weather;
        break;
      }
    }

    const profile = WeatherManager.getProfile(chosen);
    const durRoll = RandomManager.randomInt(state.rngState, profile.minDuration, profile.maxDuration);
    state.rngState = durRoll.nextState;

    return { weather: chosen, duration: durRoll.value };
  },

  /**
   * Shifts weather safely WITHOUT mutating any already-determined dice rolls
   * (movement roll, encounter check roll, or diceHistory).
   */
  shiftWeather(state: GameState, nextWeather: WeatherType, duration?: number): void {
    const profile = WeatherManager.getProfile(nextWeather);
    let resolvedDuration = duration;
    if (resolvedDuration === undefined) {
      const durRoll = RandomManager.randomInt(state.rngState, profile.minDuration, profile.maxDuration);
      state.rngState = durRoll.nextState;
      resolvedDuration = durRoll.value;
    }
    state.weather = nextWeather;
    state.weatherDurationRemaining = Math.max(1, resolvedDuration);
    state.weatherTotalDuration = Math.max(1, resolvedDuration);
  },

  /**
   * Decrements weather duration at round end; shifts weather when duration reaches 0
   * and triggers regional weather events. Never modifies existing dice rolls.
   */
  advanceRoundWeather(state: GameState): {
    changed: boolean;
    weather: WeatherType;
    durationRemaining: number;
    eventSummary: LocalizedText | null;
  } {
    const remaining = (state.weatherDurationRemaining ?? 1) - 1;
    if (remaining > 0) {
      state.weatherDurationRemaining = remaining;
      return {
        changed: false,
        weather: state.weather,
        durationRemaining: remaining,
        eventSummary: null,
      };
    }

    const picked = WeatherManager.pickNextWeather(state);
    state.weather = picked.weather;
    state.weatherDurationRemaining = picked.duration;
    state.weatherTotalDuration = picked.duration;

    const eventSummary = WeatherManager.applyRoundWeatherEvent(state);
    return {
      changed: true,
      weather: picked.weather,
      durationRemaining: picked.duration,
      eventSummary,
    };
  },

  applyRoundWeatherEvent(state: GameState): LocalizedText | null {
    const w = state.weather;
    if (w === 'thunderstorm') {
      for (const p of state.players) {
        if (p.isDefeated) continue;
        p.experience += 1;
        p.tempAttackBonus += 1;
      }
      return {
        uk: 'Погодна подія (Гроза): блискавки пробудили магічні потоки (+1 досвіду й +1 темп. атаки живим героям).',
        en: 'Weather Event (Thunderstorm): arcane lightning surges (+1 XP and +1 temp Attack to living heroes).',
      };
    }
    if (w === 'magic_fog') {
      for (const p of state.players) {
        if (p.isDefeated) continue;
        p.tempDefenseBonus += 1;
      }
      return {
        uk: 'Погодна подія (Магічний туман): ефірна завіса приховує героїв (+1 захисту, засідки сховані).',
        en: 'Weather Event (Arcane Fog): ethereal veil grants +1 Defense and conceals ambushes.',
      };
    }
    if (w === 'blizzard') {
      return {
        uk: 'Погодна подія (Заметіль): снігові завали закрили гірські переходи (-2 до кроку).',
        en: 'Weather Event (Blizzard): snowdrifts seal mountain passes (-2 movement).',
      };
    }
    if (w === 'heat') {
      for (const p of state.players) {
        if (p.isDefeated) continue;
        const loc = LOCATION_MAP.get(p.locationId);
        if (loc && (loc.regionId === 'reg_ashen_marches' || loc.regionId === 'reg_abyssal_citadel') && p.hp > 1) {
          p.hp -= 1;
        }
      }
      return {
        uk: 'Погодна подія (Спека): нестерпна спека обпалює в Середньому та Внутрішньому регіонах.',
        en: 'Weather Event (Scorching Heat): fierce heat drains travelers in Middle & Inner regions.',
      };
    }
    if (w === 'dry_wind') {
      for (const p of state.players) {
        if (p.isDefeated) continue;
        p.gold += 2;
      }
      return {
        uk: 'Погодна подія (Суховій): вітер здув пил із давніх монет (+2 золота героям).',
        en: 'Weather Event (Dry Wind): parched gales uncover ancient coins (+2 Gold to heroes).',
      };
    }
    if (w === 'clear') {
      for (const p of state.players) {
        if (p.isDefeated) continue;
        p.hp = Math.min(HERO_STAT_LIMITS.maxHp, p.maxHp, p.hp + 1);
      }
      return {
        uk: 'Погодна подія (Ясна погода): чисте небо відновлює +1 HP живим героям.',
        en: 'Weather Event (Clear Sky): clear skies restore +1 HP to living heroes.',
      };
    }
    return null;
  },

  isRouteBlockedByWeather(
    weather: WeatherType,
    fromLocation: LocationDefinition,
    toLocation: LocationDefinition
  ): { blocked: boolean; reason?: LocalizedText } {
    const profile = WeatherManager.getProfile(weather);
    if (!profile.blocksMountainPass) {
      return { blocked: false };
    }
    if (toLocation.terrain !== 'pass') {
      return { blocked: false };
    }
    // Never soft-lock a hero trapped inside a node where EVERY neighbor is a pass
    const hasNonPassEscape = fromLocation.neighbors.some((nId) => {
      const n = LOCATION_MAP.get(nId);
      return n && n.terrain !== 'pass';
    });
    if (!hasNonPassEscape && fromLocation.terrain === 'pass') {
      return { blocked: false };
    }
    return {
      blocked: true,
      reason: {
        uk: 'Заметіль завалила гірський перехід!',
        en: 'Blizzard has closed this mountain pass!',
      },
    };
  },

  getMoveModifier(weather: WeatherType, location: LocationDefinition): number {
    const regEff = WeatherManager.getRegionWeatherEffect(weather, location.regionId);
    const locMod = location.weatherModifiers[weather]?.moveMod ?? 0;
    // Prefer the specific regional effect; if location terrain adds extra penalty, keep deterministic range [-2..+1]
    const combined = Math.min(1, Math.max(-2, regEff.moveMod !== 0 ? regEff.moveMod : locMod));
    return combined;
  },

  getCombatModifiers(
    weather: WeatherType,
    location: LocationDefinition
  ): { physicalMod: number; magicMod: number; defenseMod: number; dangerMod: number } {
    const regEff = WeatherManager.getRegionWeatherEffect(weather, location.regionId);
    const locCombatMod = location.weatherModifiers[weather]?.combatMod ?? 0;
    return {
      physicalMod: regEff.physicalMod + (locCombatMod > 0 ? 0 : locCombatMod),
      magicMod: regEff.magicMod + (location.terrain === 'shrine' && regEff.magicMod > 0 ? 1 : 0),
      defenseMod: regEff.defenseMod,
      dangerMod: regEff.dangerMod,
    };
  },

  shouldConcealEncounter(weather: WeatherType): boolean {
    return WeatherManager.getProfile(weather).concealsEncounter;
  },

  shouldTriggerMagicWeatherEvent(weather: WeatherType, location: LocationDefinition): boolean {
    const profile = WeatherManager.getProfile(weather);
    if (!profile.triggersMagicEvent) return false;
    return location.terrain === 'shrine' || location.terrain === 'ruins' || weather === 'thunderstorm';
  },

  applyHeroWeatherArrivalInteraction(
    state: GameState,
    player: PlayerState,
    location: LocationDefinition
  ): LocalizedText | null {
    if (state.weather === 'thunderstorm' && (location.terrain === 'shrine' || location.terrain === 'ruins')) {
      player.experience += 1;
      player.tempAttackBonus += 1;
      return {
        uk: `Гроза над "${location.name.uk}" активувала магічну подію: +1 досвіду та +1 до атаки!`,
        en: `Thunderstorm over "${location.name.en}" triggered a magic surge: +1 XP and +1 Attack!`,
      };
    }
    if (state.weather === 'magic_fog' && location.terrain === 'shrine') {
      player.fate = Math.min(HERO_STAT_LIMITS.maxFate, player.fate + 1);
      return {
        uk: `Магічний туман у "${location.name.uk}" наповнив героя силою: +1 Долі!`,
        en: `Arcane Fog at "${location.name.en}" infused the hero: +1 Fate!`,
      };
    }
    return null;
  },
};
