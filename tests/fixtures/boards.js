const board = (rows) => Object.freeze(rows.join('').split('').map(Number));
export const uniquePuzzle = board([
  '530070000', '600195000', '098000060', '800060003', '400803001',
  '700020006', '060000280', '000419005', '000080079',
]);
export const uniqueSolution = board([
  '534678912', '672195348', '198342567', '859761423', '426853791',
  '713924856', '961537284', '287419635', '345286179',
]);
export const conflictingPuzzle = Object.freeze(uniquePuzzle.map((n, i) => i === 2 ? 5 : n));
// Confirmed by complete count=0 and no initial conflicts in solver.test.js.
export const unsolvablePuzzle = Object.freeze(uniquePuzzle.map((n, i) => i === 2 ? 1 : n));
export const multipleSolutions = Object.freeze(Array(81).fill(0));
export const completedWithChangedClue = Object.freeze(uniqueSolution.map((n) => n === 1 ? 2 : n === 2 ? 1 : n));

export function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}