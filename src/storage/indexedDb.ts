import { ADVENTURE_DECK_CARD_IDS, CARD_MAP, HERO_DECK_CARD_IDS } from '../data/cards';
import { ENEMY_MAP } from '../data/enemies';
import { HERO_MAP } from '../data/heroes';
import { LOCATION_MAP } from '../data/locations';
import { MAJOR_WORLD_EVENT_MAP } from '../data/worldEvents';
import { DayNightManager } from '../engine/DayNightManager';
import { WEATHER_PROFILES } from '../engine/WeatherManager';
import {
  ChronicleEntry,
  GameState,
  HERO_INVENTORY_LIMITS,
  HERO_STAT_LIMITS,
  Language,
  LocalizedText,
  MajorWorldEventId,
  PlayerState,
  SaveIntegrityReport,
  SaveLoadResult,
  SaveSlotKind,
  SaveSlotSummary,
  SealType,
  WeatherType,
} from '../types/game';

export const SAVE_SCHEMA_VERSION = 3;
export const AUTOSAVE_SAVE_ID = 'autosave_latest';
const ACTIVE_SESSION_STORAGE_KEY = 'cfr_active_session_v1';

const DB_NAME = 'ChroniclesForgottenRealmsDB';
const DB_VERSION = 2;
const STORE_SAVES = 'saves';
const STORE_BACKUPS = 'save_backups';
const STORE_SETTINGS = 'settings';

export interface StoredSaveRecord {
  saveId: string;
  label: string;
  saveKind: SaveSlotKind;
  schemaVersion: number;
  checksum: string;
  createdAt: number;
  updatedAt: number;
  state: GameState;
}

export interface SaveStorageBackend {
  getSave(saveId: string): Promise<StoredSaveRecord | null>;
  putSave(record: StoredSaveRecord): Promise<void>;
  getAllSaves(): Promise<StoredSaveRecord[]>;
  deleteSave(saveId: string): Promise<void>;
  getBackup(saveId: string): Promise<StoredSaveRecord | null>;
  putBackup(record: StoredSaveRecord): Promise<void>;
  deleteBackup(saveId: string): Promise<void>;
  getSetting<T>(key: string): Promise<T | null>;
  putSetting<T>(key: string, value: T): Promise<void>;
}

let customBackend: SaveStorageBackend | null = null;

export function setSaveStorageBackendForTests(backend: SaveStorageBackend | null): void {
  customBackend = backend;
}

export function createMemorySaveStorageBackend(): SaveStorageBackend {
  const saves = new Map<string, StoredSaveRecord>();
  const backups = new Map<string, StoredSaveRecord>();
  const settings = new Map<string, unknown>();

  const clone = <T>(val: T): T => JSON.parse(JSON.stringify(val)) as T;

  return {
    async getSave(saveId) {
      const hit = saves.get(saveId);
      return hit ? clone(hit) : null;
    },
    async putSave(record) {
      saves.set(record.saveId, clone(record));
    },
    async getAllSaves() {
      return Array.from(saves.values()).map(clone);
    },
    async deleteSave(saveId) {
      saves.delete(saveId);
    },
    async getBackup(saveId) {
      const hit = backups.get(saveId);
      return hit ? clone(hit) : null;
    },
    async putBackup(record) {
      backups.set(record.saveId, clone(record));
    },
    async deleteBackup(saveId) {
      backups.delete(saveId);
    },
    async getSetting<T>(key: string) {
      return settings.has(key) ? clone(settings.get(key) as T) : null;
    },
    async putSetting<T>(key: string, value: T) {
      settings.set(key, clone(value));
    },
  };
}

function isIndexedDbAvailable(): boolean {
  return typeof indexedDB !== 'undefined';
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!isIndexedDbAvailable()) {
      reject(new Error('IndexedDB is not available in this environment.'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_SAVES)) {
        db.createObjectStore(STORE_SAVES, { keyPath: 'saveId' });
      }
      if (!db.objectStoreNames.contains(STORE_BACKUPS)) {
        db.createObjectStore(STORE_BACKUPS, { keyPath: 'saveId' });
      }
      if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
        db.createObjectStore(STORE_SETTINGS, { keyPath: 'key' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

const indexedDbBackend: SaveStorageBackend = {
  async getSave(saveId) {
    if (!isIndexedDbAvailable()) return null;
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_SAVES, 'readonly');
      const req = tx.objectStore(STORE_SAVES).get(saveId);
      req.onsuccess = () => {
        db.close();
        resolve((req.result as StoredSaveRecord | undefined) ?? null);
      };
      req.onerror = () => {
        db.close();
        reject(req.error);
      };
    });
  },

  async putSave(record) {
    if (!isIndexedDbAvailable()) return;
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_SAVES, 'readwrite');
      tx.objectStore(STORE_SAVES).put(record);
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    });
  },

  async getAllSaves() {
    if (!isIndexedDbAvailable()) return [];
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_SAVES, 'readonly');
      const req = tx.objectStore(STORE_SAVES).getAll();
      req.onsuccess = () => {
        db.close();
        resolve((req.result as StoredSaveRecord[]) || []);
      };
      req.onerror = () => {
        db.close();
        reject(req.error);
      };
    });
  },

  async deleteSave(saveId) {
    if (!isIndexedDbAvailable()) return;
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_SAVES, 'readwrite');
      tx.objectStore(STORE_SAVES).delete(saveId);
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    });
  },

  async getBackup(saveId) {
    if (!isIndexedDbAvailable()) return null;
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_BACKUPS, 'readonly');
      const req = tx.objectStore(STORE_BACKUPS).get(saveId);
      req.onsuccess = () => {
        db.close();
        resolve((req.result as StoredSaveRecord | undefined) ?? null);
      };
      req.onerror = () => {
        db.close();
        reject(req.error);
      };
    });
  },

  async putBackup(record) {
    if (!isIndexedDbAvailable()) return;
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_BACKUPS, 'readwrite');
      tx.objectStore(STORE_BACKUPS).put(record);
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    });
  },

  async deleteBackup(saveId) {
    if (!isIndexedDbAvailable()) return;
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_BACKUPS, 'readwrite');
      tx.objectStore(STORE_BACKUPS).delete(saveId);
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    });
  },

  async getSetting<T>(key: string): Promise<T | null> {
    if (!isIndexedDbAvailable()) return null;
    const db = await openDatabase();
    return new Promise<T | null>((resolve, reject) => {
      const tx = db.transaction(STORE_SETTINGS, 'readonly');
      const req = tx.objectStore(STORE_SETTINGS).get(key);
      req.onsuccess = () => {
        db.close();
        const res = req.result as { key: string; value: T } | undefined;
        resolve(res?.value ?? null);
      };
      req.onerror = () => {
        db.close();
        reject(req.error);
      };
    });
  },

  async putSetting<T>(key: string, value: T) {
    if (!isIndexedDbAvailable()) return;
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_SETTINGS, 'readwrite');
      tx.objectStore(STORE_SETTINGS).put({ key, value });
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    });
  },
};

function getBackend(): SaveStorageBackend {
  return customBackend ?? indexedDbBackend;
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(',')}]`;
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj)
    .filter((k) => obj[k] !== undefined)
    .sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(',')}}`;
}

export function computeStateChecksum(state: GameState): string {
  const payload = stableStringify(state);
  let fnv = 0x811c9dc5;
  let djb = 5381;
  for (let i = 0; i < payload.length; i++) {
    const code = payload.charCodeAt(i);
    fnv ^= code;
    fnv = Math.imul(fnv, 0x01000193);
    djb = (Math.imul(djb, 33) ^ code) >>> 0;
  }
  return `${(fnv >>> 0).toString(16).padStart(8, '0')}-${(djb >>> 0).toString(16).padStart(8, '0')}`;
}

export function migrateSavePayload(rawState: GameState): {
  state: GameState;
  migratedFromVersion?: number;
} {
  const sourceVersion = typeof rawState.version === 'number' ? rawState.version : 1;
  const seenIds = new Set<string>();
  const chronicle: ChronicleEntry[] = (rawState.chronicle ?? []).map((entry, idx) => {
    let id = entry.id || `migrated_entry_${idx}`;
    if (seenIds.has(id)) {
      id = `${id}_dedup_${idx}`;
    }
    seenIds.add(id);
    const scope =
      entry.scope ??
      (entry.playerId === null || entry.type === 'world' ? 'global' : 'local');
    return { ...entry, id, scope };
  });

  const hasHeroDeck = Array.isArray(rawState.deck) && rawState.deck.length > 0;
  const fallbackHeroDeck = [...HERO_DECK_CARD_IDS];
  const adventureDeck = Array.isArray(rawState.adventureDeck)
    ? rawState.adventureDeck
    : [...ADVENTURE_DECK_CARD_IDS];

  const migratedPlayers: PlayerState[] = (rawState.players ?? []).map((p) => {
    const legacy = p as PlayerState & { wisdom?: number };
    return {
      ...p,
      intellect:
        typeof p.intellect === 'number'
          ? p.intellect
          : typeof legacy.wisdom === 'number'
            ? legacy.wisdom
            : 3,
      experience: typeof p.experience === 'number' ? p.experience : 0,
      companions: Array.isArray(p.companions) ? p.companions : [],
      curses: Array.isArray(p.curses) ? p.curses : [],
      hand: Array.isArray(p.hand) ? p.hand : [],
      inventory: Array.isArray(p.inventory) ? p.inventory : [],
      seals: Array.isArray(p.seals) ? p.seals : [],
      visitedLocationIds:
        Array.isArray(p.visitedLocationIds) && p.visitedLocationIds.length > 0
          ? p.visitedLocationIds
          : [p.locationId || 'loc_01'],
      defeatedCitadelGuardianIds: Array.isArray(p.defeatedCitadelGuardianIds)
        ? p.defeatedCitadelGuardianIds
        : [],
    };
  });

  const migrated: GameState = {
    ...rawState,
    version: SAVE_SCHEMA_VERSION,
    chronicle,
    deck: hasHeroDeck ? rawState.deck : fallbackHeroDeck.slice(4),
    discardPile: Array.isArray(rawState.discardPile) ? rawState.discardPile : [],
    adventureDeck,
    adventureDiscardPile: Array.isArray(rawState.adventureDiscardPile)
      ? rawState.adventureDiscardPile
      : [],
    marketCardIds: Array.isArray(rawState.marketCardIds)
      ? rawState.marketCardIds
      : fallbackHeroDeck.slice(0, 4),
    diceHistory: Array.isArray(rawState.diceHistory) ? rawState.diceHistory : [],
    turnCycleStep: rawState.turnCycleStep ?? 'dice_roll',
    turnGuidance: rawState.turnGuidance ?? null,
    activeMajorEvents: Array.isArray(rawState.activeMajorEvents)
      ? rawState.activeMajorEvents
      : [],
    completedMajorEventIds: Array.isArray(rawState.completedMajorEventIds)
      ? rawState.completedMajorEventIds
      : [],
    npcStates: rawState.npcStates ?? {},
    activeNpcDialog: rawState.activeNpcDialog ?? null,
    aiDecisionLog: Array.isArray(rawState.aiDecisionLog) ? rawState.aiDecisionLog : [],
    weatherDurationRemaining:
      typeof rawState.weatherDurationRemaining === 'number'
        ? rawState.weatherDurationRemaining
        : 2,
    weatherTotalDuration:
      typeof rawState.weatherTotalDuration === 'number' ? rawState.weatherTotalDuration : 2,
    players: migratedPlayers,
  };

  DayNightManager.syncState(migrated);

  return {
    state: migrated,
    migratedFromVersion: sourceVersion < SAVE_SCHEMA_VERSION ? sourceVersion : undefined,
  };
}

const VALID_SEALS = new Set<SealType>(['seal_power', 'seal_wisdom', 'seal_fate']);

export function verifySaveIntegrity(
  state: unknown,
  expectedChecksum?: string,
  schemaVersion = SAVE_SCHEMA_VERSION,
  migratedFromVersion?: number
): SaveIntegrityReport {
  const fatalErrors: LocalizedText[] = [];
  const repairedIssues: LocalizedText[] = [];

  if (!state || typeof state !== 'object' || Array.isArray(state)) {
    fatalErrors.push({
      uk: 'Структура збереження не є коректним об’єктом стану.',
      en: 'Save payload is not a valid state object.',
    });
    return {
      valid: false,
      checksumMatched: false,
      schemaVersion,
      migratedFromVersion,
      repairedIssues,
      fatalErrors,
    };
  }

  const candidate = state as GameState;
  const checksumMatched = expectedChecksum
    ? computeStateChecksum(candidate) === expectedChecksum
    : true;

  if (!checksumMatched) {
    fatalErrors.push({
      uk: 'Контрольна сума збереження не збігається — виявлено пошкодження даних.',
      en: 'Save checksum mismatch — data corruption detected.',
    });
  }

  if (typeof candidate.saveId !== 'string' || !candidate.saveId.trim()) {
    fatalErrors.push({
      uk: 'Відсутній ідентифікатор збереження saveId.',
      en: 'Missing save identifier saveId.',
    });
  }

  if (!Array.isArray(candidate.players) || candidate.players.length < 1 || candidate.players.length > 6) {
    fatalErrors.push({
      uk: 'Некоректна кількість гравців (допустимо 1–6).',
      en: 'Invalid player count (must be 1–6).',
    });
  }

  if (typeof candidate.round !== 'number' || !Number.isFinite(candidate.round) || candidate.round < 1) {
    fatalErrors.push({
      uk: 'Некоректний номер раунду.',
      en: 'Invalid round number.',
    });
  }

  if (typeof candidate.seed !== 'number' || !Number.isFinite(candidate.seed)) {
    fatalErrors.push({
      uk: 'Відсутнє або пошкоджене зерно генератора (seed).',
      en: 'Missing or corrupted RNG seed.',
    });
  }

  if (typeof candidate.rngState !== 'number' || !Number.isFinite(candidate.rngState)) {
    fatalErrors.push({
      uk: 'Пошкоджений стан генератора випадкових чисел.',
      en: 'Corrupted RNG state.',
    });
  }

  if (Array.isArray(candidate.players)) {
    for (const p of candidate.players) {
      if (!p || typeof p !== 'object') {
        fatalErrors.push({ uk: 'Пошкоджений запис героя.', en: 'Corrupted hero record.' });
        continue;
      }
      if (!HERO_MAP.has(p.heroId)) {
        fatalErrors.push({
          uk: `Невідомий герой у збереженні: ${p.heroId}.`,
          en: `Unknown hero ID in save: ${p.heroId}.`,
        });
      }
      if (!LOCATION_MAP.has(p.locationId)) {
        fatalErrors.push({
          uk: `Невідома локація у збереженні: ${p.locationId}.`,
          en: `Unknown location ID in save: ${p.locationId}.`,
        });
      }
      if (
        typeof p.hp !== 'number' ||
        !Number.isFinite(p.hp) ||
        p.hp < 0 ||
        typeof p.maxHp !== 'number' ||
        p.maxHp < 1
      ) {
        fatalErrors.push({
          uk: `Пошкоджено здоров’я героя ${p.name || p.id}.`,
          en: `Corrupted HP values for hero ${p.name || p.id}.`,
        });
      }
      if (
        typeof p.strength !== 'number' ||
        typeof p.intellect !== 'number' ||
        typeof p.fate !== 'number' ||
        typeof p.gold !== 'number' ||
        typeof p.experience !== 'number' ||
        p.gold < 0 ||
        p.experience < 0
      ) {
        fatalErrors.push({
          uk: `Пошкоджені характеристики або ресурси героя ${p.name || p.id}.`,
          en: `Corrupted stats or resources for hero ${p.name || p.id}.`,
        });
      }
      for (const s of p.seals ?? []) {
        if (!VALID_SEALS.has(s)) {
          fatalErrors.push({
            uk: `Невідома Печатка у збереженні: ${s}.`,
            en: `Unknown seal ID in save: ${s}.`,
          });
        }
      }
      const allOwnedCards = [
        ...(p.hand ?? []),
        ...(p.inventory ?? []),
        ...(p.companions ?? []),
        ...(p.curses ?? []),
        p.equipment?.weapon,
        p.equipment?.armor,
        p.equipment?.talisman,
      ].filter((id): id is string => Boolean(id));
      for (const cid of allOwnedCards) {
        if (!CARD_MAP.has(cid)) {
          fatalErrors.push({
            uk: `Невідома карта в інвентарі: ${cid}.`,
            en: `Unknown card ID in inventory: ${cid}.`,
          });
        }
      }
    }

    if (
      typeof candidate.activePlayerIndex !== 'number' ||
      candidate.activePlayerIndex < 0 ||
      candidate.activePlayerIndex >= candidate.players.length
    ) {
      fatalErrors.push({
        uk: 'Пошкоджено індекс черги ходів.',
        en: 'Corrupted activePlayerIndex in turn queue.',
      });
    }
  }

  if (!(candidate.weather in WEATHER_PROFILES)) {
    fatalErrors.push({
      uk: `Невідомий тип погоди: ${String(candidate.weather)}.`,
      en: `Unknown weather type: ${String(candidate.weather)}.`,
    });
  }

  if ((candidate.activeMajorEvents?.length ?? 0) > 2) {
    fatalErrors.push({
      uk: 'Перевищено ліміт активних світових подій (>2).',
      en: 'Active major world events exceed maximum (2).',
    });
  }

  if (candidate.combat) {
    if (
      typeof candidate.combat.enemyCurrentHp !== 'number' ||
      candidate.combat.enemyCurrentHp < 0 ||
      (!ENEMY_MAP.has(candidate.combat.enemyId) && candidate.combat.combatPurpose !== 'pvp' && !candidate.combat.enemyCardId)
    ) {
      fatalErrors.push({
        uk: 'Пошкоджено стан активного ворога/бою.',
        en: 'Corrupted active combat/enemy state.',
      });
    }
  }

  if (!Array.isArray(candidate.chronicle)) {
    fatalErrors.push({
      uk: 'Відсутній журнал пригод.',
      en: 'Missing chronicle adventure log.',
    });
  }

  return {
    valid: fatalErrors.length === 0,
    checksumMatched,
    schemaVersion,
    migratedFromVersion,
    repairedIssues,
    fatalErrors,
  };
}

export function repairCorruptedState(rawState: unknown): {
  repaired: GameState | null;
  issues: LocalizedText[];
} {
  if (!rawState || typeof rawState !== 'object' || Array.isArray(rawState)) {
    return { repaired: null, issues: [] };
  }

  const base = JSON.parse(JSON.stringify(rawState)) as Partial<GameState>;
  if (!Array.isArray(base.players) || base.players.length === 0) {
    return { repaired: null, issues: [] };
  }

  const issues: LocalizedText[] = [];
  const validPlayers: PlayerState[] = base.players.slice(0, 6).map((rawP, idx) => {
    const hero = HERO_MAP.get(rawP?.heroId ?? '') ?? HERO_MAP.get('hero_01')!;
    if (!HERO_MAP.has(rawP?.heroId ?? '')) {
      issues.push({
        uk: `Відновлено героя для слота ${idx + 1}.`,
        en: `Restored valid hero definition for player slot ${idx + 1}.`,
      });
    }
    const locId = LOCATION_MAP.has(rawP?.locationId ?? '')
      ? rawP.locationId!
      : hero.startingLocationId;
    if (locId !== rawP?.locationId) {
      issues.push({
        uk: `Відновлено коректну локацію для ${rawP?.name ?? hero.name.uk}.`,
        en: `Restored valid location for ${rawP?.name ?? hero.name.en}.`,
      });
    }

    const maxHp = Math.max(1, Math.min(HERO_STAT_LIMITS.maxHp, Number(rawP?.maxHp) || hero.baseStats.maxHp));
    const hpRaw = typeof rawP?.hp === 'number' && Number.isFinite(rawP.hp) ? rawP.hp : maxHp;
    const hp = Math.max(0, Math.min(maxHp, hpRaw));
    if (hp !== rawP?.hp) {
      issues.push({
        uk: `Виправлено здоров’я героя ${rawP?.name ?? hero.name.uk}.`,
        en: `Repaired HP bounds for ${rawP?.name ?? hero.name.en}.`,
      });
    }

    const filterCards = (ids: unknown, limit?: number) => {
      const valid = Array.isArray(ids)
        ? ids.filter((id): id is string => typeof id === 'string' && CARD_MAP.has(id))
        : [];
      return typeof limit === 'number' ? valid.slice(0, limit) : valid;
    };

    const seals = Array.isArray(rawP?.seals)
      ? rawP.seals.filter((s): s is SealType => VALID_SEALS.has(s))
      : [];

    return {
      id: typeof rawP?.id === 'string' && rawP.id ? rawP.id : `p_${idx + 1}`,
      name: typeof rawP?.name === 'string' && rawP.name.trim() ? rawP.name : hero.name.uk,
      isAI: Boolean(rawP?.isAI),
      aiDifficulty: rawP?.aiDifficulty,
      aiStyle: rawP?.aiStyle,
      heroId: hero.id,
      locationId: locId,
      hp,
      maxHp,
      strength: Math.max(1, Math.min(HERO_STAT_LIMITS.maxStrength, Number(rawP?.strength) || hero.baseStats.strength)),
      intellect: Math.max(1, Math.min(HERO_STAT_LIMITS.maxIntellect, Number(rawP?.intellect) || hero.baseStats.intellect)),
      fate: Math.max(0, Math.min(HERO_STAT_LIMITS.maxFate, Number.isFinite(rawP?.fate) ? Number(rawP?.fate) : hero.baseStats.fate)),
      armor: Math.max(0, Number.isFinite(rawP?.armor) ? Number(rawP?.armor) : hero.baseStats.armor),
      gold: Math.max(0, Number.isFinite(rawP?.gold) ? Number(rawP?.gold) : 0),
      experience: Math.max(0, Number.isFinite(rawP?.experience) ? Number(rawP?.experience) : 0),
      hand: filterCards(rawP?.hand, HERO_INVENTORY_LIMITS.maxHandSize),
      inventory: filterCards(rawP?.inventory, HERO_INVENTORY_LIMITS.maxOtherItems),
      companions: filterCards(rawP?.companions, HERO_INVENTORY_LIMITS.maxCompanions),
      curses: filterCards(rawP?.curses),
      equipment: {
        weapon: rawP?.equipment?.weapon && CARD_MAP.has(rawP.equipment.weapon) ? rawP.equipment.weapon : null,
        armor: rawP?.equipment?.armor && CARD_MAP.has(rawP.equipment.armor) ? rawP.equipment.armor : null,
        talisman: rawP?.equipment?.talisman && CARD_MAP.has(rawP.equipment.talisman) ? rawP.equipment.talisman : null,
      },
      seals,
      gateGuardianDefeated: Boolean(rawP?.gateGuardianDefeated),
      finalTrialsPassed: Math.max(0, Math.min(3, Number(rawP?.finalTrialsPassed) || 0)),
      citadelGuardiansDefeated: Math.max(0, Math.min(2, Number(rawP?.citadelGuardiansDefeated) || 0)),
      defeatedCitadelGuardianIds: Array.isArray(rawP?.defeatedCitadelGuardianIds)
        ? rawP.defeatedCitadelGuardianIds
        : [],
      voidLordDefeated: Boolean(rawP?.voidLordDefeated),
      actionsRemaining: Math.max(0, Number.isFinite(rawP?.actionsRemaining) ? Number(rawP?.actionsRemaining) : 2),
      tempAttackBonus: Number.isFinite(rawP?.tempAttackBonus) ? Number(rawP?.tempAttackBonus) : 0,
      tempDefenseBonus: Number.isFinite(rawP?.tempDefenseBonus) ? Number(rawP?.tempDefenseBonus) : 0,
      abilityUsedThisTurn: Boolean(rawP?.abilityUsedThisTurn),
      isDefeated: Boolean(rawP?.isDefeated) || hp <= 0,
      visitedLocationIds:
        Array.isArray(rawP?.visitedLocationIds) && rawP.visitedLocationIds.length > 0
          ? rawP.visitedLocationIds.filter((id) => LOCATION_MAP.has(id))
          : [locId],
      enemiesSlain: Math.max(0, Number(rawP?.enemiesSlain) || 0),
    };
  });

  const round = typeof base.round === 'number' && Number.isFinite(base.round) && base.round >= 1 ? Math.floor(base.round) : 1;
  if (round !== base.round) {
    issues.push({ uk: 'Відновлено номер раунду.', en: 'Repaired round counter.' });
  }

  let activeIdx =
    typeof base.activePlayerIndex === 'number' &&
    Number.isInteger(base.activePlayerIndex) &&
    base.activePlayerIndex >= 0 &&
    base.activePlayerIndex < validPlayers.length
      ? base.activePlayerIndex
      : 0;

  if (validPlayers[activeIdx]?.isDefeated) {
    const firstAlive = validPlayers.findIndex((p) => !p.isDefeated);
    if (firstAlive >= 0) activeIdx = firstAlive;
  }
  if (activeIdx !== base.activePlayerIndex) {
    issues.push({ uk: 'Відновлено чергу ходів.', en: 'Repaired active player turn queue.' });
  }

  const weather: WeatherType =
    base.weather && base.weather in WEATHER_PROFILES ? base.weather : 'clear';
  if (weather !== base.weather) {
    issues.push({ uk: 'Відновлено коректну погоду.', en: 'Repaired weather state.' });
  }

  const validMajorEvents = Array.isArray(base.activeMajorEvents)
    ? base.activeMajorEvents
        .filter((e) => e && MAJOR_WORLD_EVENT_MAP.has(e.id as MajorWorldEventId))
        .slice(0, 2)
    : [];
  if (validMajorEvents.length !== (base.activeMajorEvents?.length ?? 0)) {
    issues.push({ uk: 'Виправлено список світових подій.', en: 'Repaired active major world events.' });
  }

  let combat = base.combat ?? null;
  let turnPhase = base.turnPhase ?? 'ACTION';
  if (combat && (typeof combat.enemyCurrentHp !== 'number' || combat.enemyCurrentHp < 0)) {
    combat = null;
    if (turnPhase === 'COMBAT') turnPhase = 'ACTION';
    issues.push({ uk: 'Скинуто пошкоджений стан бою.', en: 'Reset corrupted combat encounter.' });
  } else if (turnPhase === 'COMBAT' && !combat) {
    turnPhase = 'ACTION';
  }

  const repairedState: GameState = {
    saveId: typeof base.saveId === 'string' && base.saveId.trim() ? base.saveId : `recovered_${Date.now()}`,
    version: SAVE_SCHEMA_VERSION,
    seed: typeof base.seed === 'number' && Number.isFinite(base.seed) ? base.seed : 20261125,
    rngState: typeof base.rngState === 'number' && Number.isFinite(base.rngState) ? base.rngState : 20261125,
    mode: base.mode === 'local_hotseat' ? 'local_hotseat' : 'solo_ai',
    phase: base.phase === 'VICTORY' || base.phase === 'DEFEAT' ? base.phase : 'PLAYING',
    turnPhase,
    turnCycleStep: base.turnCycleStep ?? 'dice_roll',
    turnGuidance: base.turnGuidance ?? null,
    round,
    activePlayerIndex: activeIdx,
    timeOfDay: base.timeOfDay ?? 'day',
    dayNightCycleRound: base.dayNightCycleRound,
    dayNightPhase: base.dayNightPhase,
    weather,
    weatherDurationRemaining: Math.max(1, Number(base.weatherDurationRemaining) || 2),
    weatherTotalDuration: Math.max(1, Number(base.weatherTotalDuration) || 2),
    activeWorldEventId: base.activeWorldEventId ?? null,
    activeMajorEvents: validMajorEvents,
    completedMajorEventIds: Array.isArray(base.completedMajorEventIds) ? base.completedMajorEventIds : [],
    npcStates: base.npcStates ?? {},
    activeNpcDialog: base.activeNpcDialog ?? null,
    players: validPlayers,
    deck: Array.isArray(base.deck)
      ? base.deck.filter((id) => CARD_MAP.has(id))
      : [...HERO_DECK_CARD_IDS].slice(4),
    discardPile: Array.isArray(base.discardPile)
      ? base.discardPile.filter((id) => CARD_MAP.has(id))
      : [],
    adventureDeck: Array.isArray(base.adventureDeck)
      ? base.adventureDeck.filter((id) => CARD_MAP.has(id))
      : [...ADVENTURE_DECK_CARD_IDS],
    adventureDiscardPile: Array.isArray(base.adventureDiscardPile)
      ? base.adventureDiscardPile.filter((id) => CARD_MAP.has(id))
      : [],
    marketCardIds: Array.isArray(base.marketCardIds)
      ? base.marketCardIds.filter((id) => CARD_MAP.has(id))
      : [...HERO_DECK_CARD_IDS].slice(0, 4),
    movement: base.movement ?? null,
    combat,
    encounter: base.encounter ?? null,
    lastDiceRoll: typeof base.lastDiceRoll === 'number' ? base.lastDiceRoll : null,
    diceHistory: Array.isArray(base.diceHistory) ? base.diceHistory : [],
    winnerPlayerId: base.winnerPlayerId ?? null,
    chronicle: Array.isArray(base.chronicle) ? base.chronicle : [],
    aiDifficulty: base.aiDifficulty,
    aiDecisionLog: Array.isArray(base.aiDecisionLog) ? base.aiDecisionLog : [],
    updatedAt: Date.now(),
  };

  DayNightManager.syncState(repairedState);
  return { repaired: repairedState, issues };
}

function defaultLabelForState(state: GameState, saveKind: SaveSlotKind, customLabel?: string): string {
  if (customLabel?.trim()) return customLabel.trim();
  const activePlayer = state.players[state.activePlayerIndex];
  const hero = activePlayer ? HERO_MAP.get(activePlayer.heroId) : undefined;
  const heroLabel = hero ? hero.name.uk : 'Хроніка';
  return saveKind === 'autosave'
    ? `[Авто] ${heroLabel} · Раунд ${state.round}`
    : `${heroLabel} · Раунд ${state.round}`;
}

export async function saveGameToIndexedDb(
  state: GameState,
  customLabel?: string,
  options?: { saveIdOverride?: string; saveKind?: SaveSlotKind }
): Promise<StoredSaveRecord> {
  const backend = getBackend();
  const saveKind: SaveSlotKind = options?.saveKind ?? 'manual';
  const targetSaveId = options?.saveIdOverride ?? state.saveId;
  const snapshotState: GameState = {
    ...(JSON.parse(JSON.stringify(state)) as GameState),
    saveId: targetSaveId,
    version: SAVE_SCHEMA_VERSION,
    updatedAt: Date.now(),
  };

  // Preserve previous valid save into backup store before overwriting
  const existing = await backend.getSave(targetSaveId).catch(() => null);
  if (existing) {
    const prevCheck = verifySaveIntegrity(existing.state, existing.checksum, existing.schemaVersion);
    if (prevCheck.valid) {
      await backend.putBackup(existing).catch(() => {});
    }
  }

  const checksum = computeStateChecksum(snapshotState);
  const record: StoredSaveRecord = {
    saveId: targetSaveId,
    label: defaultLabelForState(snapshotState, saveKind, customLabel),
    saveKind,
    schemaVersion: SAVE_SCHEMA_VERSION,
    checksum,
    createdAt: existing?.createdAt ?? Date.now(),
    updatedAt: snapshotState.updatedAt,
    state: snapshotState,
  };

  await backend.putSave(record);

  // Also ensure a fresh backup exists right away on first write
  if (!existing) {
    await backend.putBackup(record).catch(() => {});
  }

  if (snapshotState.phase === 'PLAYING') {
    await setActiveSessionSaveId(targetSaveId).catch(() => {});
  }

  return record;
}

export async function saveAutoToIndexedDb(state: GameState): Promise<StoredSaveRecord> {
  return saveGameToIndexedDb(state, undefined, {
    saveIdOverride: AUTOSAVE_SAVE_ID,
    saveKind: 'autosave',
  });
}

export async function saveNewManualSlotToIndexedDb(
  state: GameState,
  customLabel?: string
): Promise<StoredSaveRecord> {
  const manualId = `save_manual_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  return saveGameToIndexedDb(state, customLabel, {
    saveIdOverride: manualId,
    saveKind: 'manual',
  });
}

export async function listSavedGames(): Promise<SaveSlotSummary[]> {
  const backend = getBackend();
  const records = await backend.getAllSaves();
  const summaries = await Promise.all(
    records.map(async (rec) => {
      const migrated = migrateSavePayload(rec.state);
      const report = verifySaveIntegrity(
        rec.state,
        rec.checksum,
        rec.schemaVersion ?? rec.state?.version ?? 1,
        migrated.migratedFromVersion
      );
      const backup = await backend.getBackup(rec.saveId).catch(() => null);
      const active = migrated.state.players[migrated.state.activePlayerIndex];
      const hero = active ? HERO_MAP.get(active.heroId) : undefined;
      return {
        saveId: rec.saveId,
        label: rec.label,
        saveKind: rec.saveKind ?? (rec.saveId === AUTOSAVE_SAVE_ID ? 'autosave' : 'manual'),
        schemaVersion: rec.schemaVersion ?? rec.state?.version ?? 1,
        checksumValid: report.valid,
        hasBackup: Boolean(backup),
        mode: migrated.state.mode,
        round: migrated.state.round,
        phase: migrated.state.phase,
        playerCount: migrated.state.players.length,
        activeHeroName: hero ? hero.name : { uk: 'Герой', en: 'Hero' },
        updatedAt: rec.updatedAt,
      } satisfies SaveSlotSummary;
    })
  );

  return summaries.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function loadGameWithRecoveryFromIndexedDb(saveId: string): Promise<SaveLoadResult> {
  const backend = getBackend();
  const rec = await backend.getSave(saveId);
  if (!rec) {
    return {
      state: null,
      recovered: false,
      recoverySource: 'none',
      report: {
        valid: false,
        checksumMatched: false,
        schemaVersion: SAVE_SCHEMA_VERSION,
        repairedIssues: [],
        fatalErrors: [
          {
            uk: 'Збереження не знайдено в IndexedDB.',
            en: 'Save slot not found in IndexedDB.',
          },
        ],
      },
    };
  }

  const schemaVersion = rec.schemaVersion ?? rec.state?.version ?? 1;
  const checksumMatched = rec.checksum
    ? computeStateChecksum(rec.state) === rec.checksum
    : true;
  const migrated = migrateSavePayload(rec.state);
  const primaryCheck = verifySaveIntegrity(
    migrated.state,
    undefined,
    SAVE_SCHEMA_VERSION,
    schemaVersion < SAVE_SCHEMA_VERSION ? schemaVersion : migrated.migratedFromVersion
  );
  primaryCheck.checksumMatched = checksumMatched;
  if (!checksumMatched) {
    primaryCheck.valid = false;
    primaryCheck.fatalErrors.unshift({
      uk: 'Контрольна сума збереження не збігається — виявлено пошкодження даних.',
      en: 'Save checksum mismatch — data corruption detected.',
    });
  }

  if (primaryCheck.valid) {
    return {
      state: migrated.state,
      recovered: Boolean(migrated.migratedFromVersion),
      recoverySource: 'primary',
      report: primaryCheck,
      notice: migrated.migratedFromVersion
        ? {
            uk: `Збереження мігровано з версії v${migrated.migratedFromVersion} до v${SAVE_SCHEMA_VERSION}.`,
            en: `Migrated save schema from v${migrated.migratedFromVersion} to v${SAVE_SCHEMA_VERSION}.`,
          }
        : undefined,
    };
  }

  // Primary save failed integrity or checksum: attempt backup recovery first
  const backup = await backend.getBackup(saveId).catch(() => null);
  if (backup) {
    const backupSchemaVersion = backup.schemaVersion ?? backup.state?.version ?? 1;
    const backupChecksumOk = backup.checksum
      ? computeStateChecksum(backup.state) === backup.checksum
      : true;
    const migratedBackup = migrateSavePayload(backup.state);
    const backupCheck = verifySaveIntegrity(
      migratedBackup.state,
      undefined,
      SAVE_SCHEMA_VERSION,
      backupSchemaVersion < SAVE_SCHEMA_VERSION ? backupSchemaVersion : migratedBackup.migratedFromVersion
    );
    backupCheck.checksumMatched = backupChecksumOk;
    if (backupChecksumOk && backupCheck.valid) {
      return {
        state: migratedBackup.state,
        recovered: true,
        recoverySource: 'backup',
        report: {
          ...backupCheck,
          repairedIssues: [
            {
              uk: 'Основне збереження було пошкоджено — відновлено останню перевірену резервну копію.',
              en: 'Primary save was corrupted — restored from last verified backup snapshot.',
            },
          ],
        },
        notice: {
          uk: 'Виявлено пошкодження основного збереження. Партію відновлено з резервної копії.',
          en: 'Primary save corruption detected. Match recovered from verified backup.',
        },
      };
    }
  }

  // Attempt structural repair if backup unavailable or also invalid
  const { repaired, issues } = repairCorruptedState(rec.state);
  if (repaired) {
    const postRepairReport = verifySaveIntegrity(repaired, undefined, SAVE_SCHEMA_VERSION);
    if (postRepairReport.valid) {
      return {
        state: repaired,
        recovered: true,
        recoverySource: 'repaired',
        report: {
          ...postRepairReport,
          checksumMatched: primaryCheck.checksumMatched,
          repairedIssues: issues,
        },
        notice: {
          uk: 'Дані збереження було частково пошкоджено й автоматично відновлено.',
          en: 'Save data had structural issues and was automatically repaired.',
        },
      };
    }
  }

  return {
    state: null,
    recovered: false,
    recoverySource: 'none',
    report: primaryCheck,
    notice: {
      uk: 'Збереження пошкоджене і не підлягає відновленню.',
      en: 'Save data is corrupted and could not be recovered.',
    },
  };
}

export async function loadGameFromIndexedDb(saveId: string): Promise<GameState | null> {
  const res = await loadGameWithRecoveryFromIndexedDb(saveId);
  return res.state;
}

export async function deleteSaveFromIndexedDb(saveId: string): Promise<void> {
  const backend = getBackend();
  await backend.deleteSave(saveId);
  await backend.deleteBackup(saveId).catch(() => {});
  const activeId = await getActiveSessionSaveId().catch(() => null);
  if (activeId === saveId) {
    await clearActiveSessionSaveId().catch(() => {});
  }
}

export async function setActiveSessionSaveId(saveId: string): Promise<void> {
  const backend = getBackend();
  await backend.putSetting('activeSessionSaveId', saveId);
  if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
    try {
      window.localStorage.setItem(ACTIVE_SESSION_STORAGE_KEY, saveId);
    } catch {
      // Ignore storage quota errors
    }
  }
}

export async function getActiveSessionSaveId(): Promise<string | null> {
  const backend = getBackend();
  const fromDb = await backend.getSetting<string>('activeSessionSaveId').catch(() => null);
  if (fromDb) return fromDb;
  if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
    try {
      return window.localStorage.getItem(ACTIVE_SESSION_STORAGE_KEY);
    } catch {
      return null;
    }
  }
  return null;
}

export async function clearActiveSessionSaveId(): Promise<void> {
  const backend = getBackend();
  await backend.putSetting('activeSessionSaveId', null);
  if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
    try {
      window.localStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY);
    } catch {
      // Ignore storage quota errors
    }
  }
}

export async function getResumableSession(): Promise<SaveLoadResult | null> {
  const activeId = await getActiveSessionSaveId().catch(() => null);
  if (activeId) {
    const res = await loadGameWithRecoveryFromIndexedDb(activeId);
    if (res.state && res.state.phase === 'PLAYING') {
      return res;
    }
  }
  const autoRes = await loadGameWithRecoveryFromIndexedDb(AUTOSAVE_SAVE_ID);
  if (autoRes.state && autoRes.state.phase === 'PLAYING') {
    return autoRes;
  }
  return null;
}

export async function corruptSaveRecordForTests(
  saveId: string,
  mutator: (record: StoredSaveRecord) => StoredSaveRecord
): Promise<void> {
  const backend = getBackend();
  const rec = await backend.getSave(saveId);
  if (!rec) throw new Error(`Save ${saveId} not found`);
  await backend.putSave(mutator(rec));
}

export async function saveLanguagePreference(lang: Language): Promise<void> {
  const backend = getBackend();
  await backend.putSetting('language', lang);
}

export async function loadLanguagePreference(): Promise<Language | null> {
  const backend = getBackend();
  return backend.getSetting<Language>('language');
}
