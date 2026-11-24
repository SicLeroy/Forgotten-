/**
 * Deterministic, reproducible PRNG (Mulberry32) with explicit serializable state.
 * Never alters or rigs d6 rolls; guarantees identical outcomes for identical seeds/states.
 */

export function normalizeSeed(seed?: number): number {
  if (typeof seed === 'number' && Number.isFinite(seed)) {
    return (Math.floor(seed) >>> 0) || 1;
  }
  return (Date.now() >>> 0) || 1;
}

export function nextRandom(rngState: number): { value: number; nextState: number } {
  let t = (rngState + 0x6d2b79f5) | 0;
  const nextState = t >>> 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  const value = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  return { value, nextState };
}

export function rollD6(rngState: number): { roll: number; nextState: number } {
  const { value, nextState } = nextRandom(rngState);
  const roll = Math.floor(value * 6) + 1;
  return { roll, nextState };
}

export function rollMultipleD6(
  rngState: number,
  count: number
): { rolls: number[]; total: number; nextState: number } {
  let current = rngState;
  const rolls: number[] = [];
  let total = 0;
  for (let i = 0; i < count; i++) {
    const res = rollD6(current);
    rolls.push(res.roll);
    total += res.roll;
    current = res.nextState;
  }
  return { rolls, total, nextState: current };
}

export function randomInt(
  rngState: number,
  minInclusive: number,
  maxInclusive: number
): { value: number; nextState: number } {
  const { value, nextState } = nextRandom(rngState);
  const span = maxInclusive - minInclusive + 1;
  return {
    value: minInclusive + Math.floor(value * span),
    nextState,
  };
}

export function shuffleWithState<T>(
  items: readonly T[],
  rngState: number
): { shuffled: T[]; nextState: number } {
  const arr = [...items];
  let current = rngState;
  for (let i = arr.length - 1; i > 0; i--) {
    const { value, nextState } = randomInt(current, 0, i);
    current = nextState;
    const tmp = arr[i];
    arr[i] = arr[value];
    arr[value] = tmp;
  }
  return { shuffled: arr, nextState: current };
}
