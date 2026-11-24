import { ADVENTURE_DECK_CARD_IDS, HERO_DECK_CARD_IDS } from '../data/cards';
import { HERO_MAP } from '../data/heroes';
import { GameState, Language, PlayerState, SaveSlotSummary } from '../types/game';

const DB_NAME = 'ChroniclesForgottenRealmsDB';
const DB_VERSION = 1;
const STORE_SAVES = 'saves';
const STORE_SETTINGS = 'settings';

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
      if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
        db.createObjectStore(STORE_SETTINGS, { keyPath: 'key' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

interface StoredSaveRecord {
  saveId: string;
  label: string;
  updatedAt: number;
  state: GameState;
}

export async function saveGameToIndexedDb(state: GameState, customLabel?: string): Promise<void> {
  if (!isIndexedDbAvailable()) return;
  const db = await openDatabase();
  const activePlayer = state.players[state.activePlayerIndex];
  const hero = activePlayer ? HERO_MAP.get(activePlayer.heroId) : undefined;
  const label = customLabel?.trim() || `${hero ? hero.name.en : 'Chronicle'} · R${state.round}`;

  const record: StoredSaveRecord = {
    saveId: state.saveId,
    label,
    updatedAt: Date.now(),
    state,
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_SAVES, 'readwrite');
    const store = tx.objectStore(STORE_SAVES);
    store.put(record);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

export async function listSavedGames(): Promise<SaveSlotSummary[]> {
  if (!isIndexedDbAvailable()) return [];
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_SAVES, 'readonly');
    const store = tx.objectStore(STORE_SAVES);
    const req = store.getAll();
    req.onsuccess = () => {
      db.close();
      const records = (req.result as StoredSaveRecord[]) || [];
      const summaries: SaveSlotSummary[] = records
        .map((rec) => {
          const active = rec.state.players[rec.state.activePlayerIndex];
          const hero = active ? HERO_MAP.get(active.heroId) : undefined;
          return {
            saveId: rec.saveId,
            label: rec.label,
            mode: rec.state.mode,
            round: rec.state.round,
            phase: rec.state.phase,
            playerCount: rec.state.players.length,
            activeHeroName: hero ? hero.name : { uk: 'Герой', en: 'Hero' },
            updatedAt: rec.updatedAt,
          };
        })
        .sort((a, b) => b.updatedAt - a.updatedAt);
      resolve(summaries);
    };
    req.onerror = () => {
      db.close();
      reject(req.error);
    };
  });
}

function migrateLoadedState(state: GameState): GameState {
  const seenIds = new Set<string>();
  const chronicle = (state.chronicle ?? []).map((entry, idx) => {
    let id = entry.id;
    if (seenIds.has(id)) {
      id = `${entry.id}_dedup_${idx}`;
    }
    seenIds.add(id);
    return id === entry.id ? entry : { ...entry, id };
  });

  const hasHeroDeck = Array.isArray(state.deck) && state.deck.length > 0;
  const fallbackHeroDeck = [...HERO_DECK_CARD_IDS];
  const adventureDeck = Array.isArray(state.adventureDeck)
    ? state.adventureDeck
    : [...ADVENTURE_DECK_CARD_IDS];

  return {
    ...state,
    chronicle,
    deck: hasHeroDeck ? state.deck : fallbackHeroDeck.slice(4),
    adventureDeck,
    adventureDiscardPile: Array.isArray(state.adventureDiscardPile)
      ? state.adventureDiscardPile
      : [],
    marketCardIds: Array.isArray(state.marketCardIds)
      ? state.marketCardIds
      : fallbackHeroDeck.slice(0, 4),
    diceHistory: Array.isArray(state.diceHistory) ? state.diceHistory : [],
    turnCycleStep: state.turnCycleStep ?? 'dice_roll',
    turnGuidance: state.turnGuidance ?? null,
    players: state.players.map((p) => {
      const legacy = p as PlayerState & { wisdom?: number };
      return {
        ...p,
        intellect: typeof p.intellect === 'number' ? p.intellect : typeof legacy.wisdom === 'number' ? legacy.wisdom : 3,
        experience: typeof p.experience === 'number' ? p.experience : 0,
        companions: Array.isArray(p.companions) ? p.companions : [],
        curses: Array.isArray(p.curses) ? p.curses : [],
        defeatedCitadelGuardianIds: Array.isArray(p.defeatedCitadelGuardianIds)
          ? p.defeatedCitadelGuardianIds
          : [],
      };
    }),
  };
}

export async function loadGameFromIndexedDb(saveId: string): Promise<GameState | null> {
  if (!isIndexedDbAvailable()) return null;
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_SAVES, 'readonly');
    const store = tx.objectStore(STORE_SAVES);
    const req = store.get(saveId);
    req.onsuccess = () => {
      db.close();
      const rec = req.result as StoredSaveRecord | undefined;
      resolve(rec ? migrateLoadedState(rec.state) : null);
    };
    req.onerror = () => {
      db.close();
      reject(req.error);
    };
  });
}

export async function deleteSaveFromIndexedDb(saveId: string): Promise<void> {
  if (!isIndexedDbAvailable()) return;
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_SAVES, 'readwrite');
    const store = tx.objectStore(STORE_SAVES);
    store.delete(saveId);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

export async function saveLanguagePreference(lang: Language): Promise<void> {
  if (!isIndexedDbAvailable()) return;
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_SETTINGS, 'readwrite');
    tx.objectStore(STORE_SETTINGS).put({ key: 'language', value: lang });
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

export async function loadLanguagePreference(): Promise<Language | null> {
  if (!isIndexedDbAvailable()) return null;
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_SETTINGS, 'readonly');
    const req = tx.objectStore(STORE_SETTINGS).get('language');
    req.onsuccess = () => {
      db.close();
      const res = req.result as { key: string; value: Language } | undefined;
      resolve(res?.value ?? null);
    };
    req.onerror = () => {
      db.close();
      reject(req.error);
    };
  });
}
