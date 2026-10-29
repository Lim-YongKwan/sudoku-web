import type { GameState } from '../types.js';

/** Boards must be validated by the caller before checking this cross-field invariant. */
export function assertLastInputIndex(state: Pick<GameState, 'lastInputIndex' | 'status' | 'puzzle' | 'values'>): void {
  const index = state.lastInputIndex;
  if (index === null) return;
  if (typeof index !== 'number') throw new TypeError('lastInputIndex must be null or a number.');
  if (!Number.isSafeInteger(index) || index < 0 || index > 80) {
    throw new RangeError('lastInputIndex must be an index from 0 to 80.');
  }
  if (state.status !== 'playing' || state.puzzle === null || state.values === null
    || state.puzzle[index] !== 0 || state.values[index] === 0) {
    throw new RangeError('lastInputIndex requires a filled editable cell in a playing game.');
  }
}
