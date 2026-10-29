import type { Board } from '../types.js';
/** A Board is a dense, row-major Array of 81 integers in [0, 9]. */
export function assertBoard(board: unknown): asserts board is Board {
  if (!Array.isArray(board) || board.length !== 81) throw new TypeError('Board must contain 81 cells.');
  for (let i = 0; i < 81; i++) {
    if (!Object.hasOwn(board, i) || !Number.isInteger(board[i]) || board[i] < 0 || board[i] > 9) {
      throw new TypeError('Board cells must be integers from 0 to 9.');
    }
  }
}

const units: number[][] = [];
for (let n = 0; n < 9; n++) {
  units.push(Array.from({ length: 9 }, (_, i) => n * 9 + i));
  units.push(Array.from({ length: 9 }, (_, i) => i * 9 + n));
  const row = Math.floor(n / 3) * 3;
  const col = (n % 3) * 3;
  units.push(Array.from({ length: 9 }, (_, i) => (row + Math.floor(i / 3)) * 9 + col + i % 3));
}

export function findConflicts(board: Board): Set<number> {
  assertBoard(board);
  const conflicts = new Set<number>();
  for (const unit of units) {
    const first = new Map<number, number>();
    for (const index of unit) {
      const digit = board[index];
      if (digit === 0) continue;
      if (first.has(digit)) {
        const previous = first.get(digit);
        if (previous !== undefined) conflicts.add(previous);
        conflicts.add(index);
      } else first.set(digit, index);
    }
  }
  return conflicts;
}

export function isValidBoard(board: Board): boolean {
  return findConflicts(board).size === 0;
}

export function isComplete(board: Board, puzzle: Board): boolean {
  assertBoard(board);
  assertBoard(puzzle);
  return !board.includes(0) && isValidBoard(board) && isValidBoard(puzzle)
    && puzzle.every((digit, index) => digit === 0 || digit === board[index]);
}