import { ChronicleEntry, ChronicleScope, GameState, LocalizedText } from '../types/game';

const MAX_CHRONICLE_ENTRIES = 120;

let chronicleSeq = 0;

export function inferChronicleScope(
  type: ChronicleEntry['type'],
  playerId: string | null,
  explicitScope?: ChronicleScope
): ChronicleScope {
  if (explicitScope) return explicitScope;
  if (type === 'world' && playerId === null) return 'global';
  if (type === 'seal' || (type === 'system' && playerId === null)) return 'global';
  return 'local';
}

export function appendChronicleEntry(
  state: GameState,
  type: ChronicleEntry['type'],
  playerId: string | null,
  text: LocalizedText,
  explicitScope?: ChronicleScope
): void {
  const existing = new Set(state.chronicle.map((e) => e.id));
  let id = `log_${state.round}_${state.rngState}_${++chronicleSeq}`;
  while (existing.has(id)) {
    id = `log_${state.round}_${state.rngState}_${++chronicleSeq}`;
  }
  const entry: ChronicleEntry = {
    id,
    round: state.round,
    timeOfDay: state.timeOfDay,
    playerId,
    type,
    scope: inferChronicleScope(type, playerId, explicitScope),
    text,
  };
  state.chronicle = [entry, ...state.chronicle].slice(0, MAX_CHRONICLE_ENTRIES);
}
