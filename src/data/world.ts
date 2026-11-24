import { TimeOfDay, WeatherType, WorldEventDefinition } from '../types/game';

export const TIME_CYCLE: TimeOfDay[] = ['dawn', 'day', 'dusk', 'night'];

export const WEATHER_LIST: WeatherType[] = [
  'clear',
  'mist',
  'rain',
  'ash_storm',
  'frost_wind',
  'void_eclipse',
];

export const WEATHER_MODIFIERS: Record<
  WeatherType,
  { attackMod: number; defenseMod: number; dangerMod: number }
> = {
  clear: { attackMod: 0, defenseMod: 0, dangerMod: 0 },
  mist: { attackMod: 0, defenseMod: 1, dangerMod: 0 },
  rain: { attackMod: -1, defenseMod: 0, dangerMod: 1 },
  ash_storm: { attackMod: 1, defenseMod: -1, dangerMod: 1 },
  frost_wind: { attackMod: 0, defenseMod: 1, dangerMod: 1 },
  void_eclipse: { attackMod: 1, defenseMod: 0, dangerMod: 2 },
};

export const WORLD_EVENTS: WorldEventDefinition[] = [
  {
    id: 'event_01',
    name: { uk: 'Благословення Світанку', en: 'Blessing of Dawn' },
    description: {
      uk: 'Теплі промені розганяють морок над шляхами.',
      en: 'Warm sunlight parts the gloom across ancient roads.',
    },
    effectSummary: { uk: '+2 HP усім живим героям', en: '+2 HP to all living heroes' },
    type: 'blessing',
    hpDelta: 2,
    goldDelta: 0,
    fateDelta: 0,
    enemyAttackMod: 0,
  },
  {
    id: 'event_02',
    name: { uk: 'Караван гільдії', en: 'Guild Caravan' },
    description: {
      uk: 'Мандрівні купці роздають припаси захисникам земель.',
      en: 'Traveling merchants share supplies with realm defenders.',
    },
    effectSummary: { uk: '+6 золота кожному герою', en: '+6 Gold to each hero' },
    type: 'market',
    hpDelta: 0,
    goldDelta: 6,
    fateDelta: 0,
    enemyAttackMod: 0,
  },
  {
    id: 'event_03',
    name: { uk: 'Трепет Безодні', en: 'Tremor of the Abyss' },
    description: {
      uk: 'Земля здригається від подиху Порожнечі.',
      en: 'The earth shudders beneath the breath of the Void.',
    },
    effectSummary: { uk: '-2 HP героям, +1 атака ворогів', en: '-2 HP to heroes, +1 enemy attack' },
    type: 'hazard',
    hpDelta: -2,
    goldDelta: 0,
    fateDelta: 0,
    enemyAttackMod: 1,
  },
  {
    id: 'event_04',
    name: { uk: 'Знамення Трьох Сузір’їв', en: 'Omen of Three Constellations' },
    description: {
      uk: 'Зорі шикуються у стародавній символ трьох Печаток.',
      en: 'Stars align into the ancient crest of the Three Seals.',
    },
    effectSummary: { uk: '+1 Доля на цей раунд (+3 золота)', en: '+1 Fate aura (+3 Gold)' },
    type: 'omen',
    hpDelta: 0,
    goldDelta: 3,
    fateDelta: 1,
    enemyAttackMod: 0,
  },
  {
    id: 'event_05',
    name: { uk: 'Попіл минулих битв', en: 'Ashes of Old Battles' },
    description: {
      uk: 'Вітер відкриває забуті схованки воїнів.',
      en: 'High winds uncover forgotten caches of fallen warriors.',
    },
    effectSummary: { uk: '+5 золота кожному герою', en: '+5 Gold to each hero' },
    type: 'omen',
    hpDelta: 0,
    goldDelta: 5,
    fateDelta: 0,
    enemyAttackMod: 0,
  },
  {
    id: 'event_06',
    name: { uk: 'Охоронний передзвін', en: 'Sanctuary Chimes' },
    description: {
      uk: 'Дзвони святилищ послаблюють лють монстрів.',
      en: 'Ancient shrine bells weaken the fury of roaming beasts.',
    },
    effectSummary: { uk: '-1 атака ворогів у раунді', en: '-1 enemy attack this round' },
    type: 'blessing',
    hpDelta: 1,
    goldDelta: 0,
    fateDelta: 0,
    enemyAttackMod: -1,
  },
  {
    id: 'event_07',
    name: { uk: 'Холодний розлам', en: 'Frost Rift' },
    description: {
      uk: 'Крижаний вітер виснажує мандрівників.',
      en: 'Bittersweet frost winds sap travelers’ endurance.',
    },
    effectSummary: { uk: '-1 HP кожному герою', en: '-1 HP to each hero' },
    type: 'hazard',
    hpDelta: -1,
    goldDelta: 0,
    fateDelta: 0,
    enemyAttackMod: 0,
  },
  {
    id: 'event_08',
    name: { uk: 'Дар старої таверни', en: 'Old Tavern Bounty' },
    description: {
      uk: 'Місцеві жителі щедро вітають шукачів Печаток.',
      en: 'Locals warmly reward seekers of the Seals.',
    },
    effectSummary: { uk: '+3 HP і +4 золота', en: '+3 HP and +4 Gold' },
    type: 'blessing',
    hpDelta: 3,
    goldDelta: 4,
    fateDelta: 0,
    enemyAttackMod: 0,
  },
  {
    id: 'event_09',
    name: { uk: 'Тінь Цитаделі', en: 'Shadow of the Citadel' },
    description: {
      uk: 'Вартові Порожнечі скликають дозори.',
      en: 'The Void’s sentinels rally patrols across the realm.',
    },
    effectSummary: { uk: '+1 до атаки всіх ворогів', en: '+1 attack to all enemies' },
    type: 'hazard',
    hpDelta: 0,
    goldDelta: 0,
    fateDelta: 0,
    enemyAttackMod: 1,
  },
  {
    id: 'event_10',
    name: { uk: 'Скарбниця пілігримів', en: 'Pilgrim Trove' },
    description: {
      uk: 'Вздовж стежок знайдено давні монети.',
      en: 'Ancient coins surface along worn pilgrim paths.',
    },
    effectSummary: { uk: '+8 золота кожному герою', en: '+8 Gold to each hero' },
    type: 'market',
    hpDelta: 0,
    goldDelta: 8,
    fateDelta: 0,
    enemyAttackMod: 0,
  },
];

export const WORLD_EVENT_MAP = new Map(WORLD_EVENTS.map((e) => [e.id, e]));
