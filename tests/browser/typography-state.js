import { createDisplayState } from '../../src/main.js';

/** Development specimen only; normal gameplay still goes through the store. */
export function createTypographyState(mode) {
  if (!['playing', 'conflict', 'generating', 'completed'].includes(mode)) throw new RangeError('Unknown typography mode.');
  const puzzle = Array(81).fill(0);
  for (let i = 0; i < 9; i++) puzzle[i] = i + 1;
  const state = createDisplayState(mode === 'generating' ? null : puzzle);
  if (state.values) {
    for (let row = 1; row < (mode === 'completed' ? 9 : 2); row++) {
      for (let col = 0; col < 9; col++) state.values[row * 9 + col] = (row * 3 + Math.floor(row / 3) + col) % 9 + 1;
    }
    if (mode !== 'completed') state.notes[18] = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    // Swap rather than replace so all nine editable comparison digits survive.
    if (mode === 'conflict') [state.values[9], state.values[15]] = [state.values[15], state.values[9]];
    state.selectedIndex = mode === 'conflict' ? 9 : mode === 'completed' ? null : 18;
    state.status = mode === 'completed' ? 'completed' : 'playing';
  }
  return state;
}
