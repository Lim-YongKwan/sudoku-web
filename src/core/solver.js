import { assertBoard, isValidBoard } from './board.js';
import { searchRuntime, shuffled } from '../utils/search-runtime.js';

const ALL = 0b1111111110;
const boxOf = (row, col) => Math.floor(row / 3) * 3 + Math.floor(col / 3);

/** Internal entry for generator budget sharing. Public callers use the two wrappers below. */
export async function runSearch(input, options, shared, counting) {
  assertBoard(input);
  const runtime = searchRuntime(options, shared);
  if (counting && (options.limit === undefined ? 2 : options.limit) !== 2) throw new RangeError('limit must be 2.');
  const board = input.slice();
  let count = 0;
  let solution = null;
  let reason = runtime.check();
  const result = (status) => ({ status, count, board: solution, stats: runtime.stats(), reason });
  if (reason) return result(reason === 'aborted' ? 'aborted' : 'budget-exceeded');
  if (!isValidBoard(board)) return result('invalid');

  const rows = Array(9).fill(0);
  const cols = Array(9).fill(0);
  const boxes = Array(9).fill(0);
  board.forEach((digit, index) => {
    if (!digit) return;
    const row = Math.floor(index / 9), col = index % 9;
    rows[row] |= 1 << digit;
    cols[col] |= 1 << digit;
    boxes[boxOf(row, col)] |= 1 << digit;
  });

  async function visit() {
    reason = await runtime.enter();
    if (reason) return true;
    let selected = -1, candidates = [], smallest = 10;
    for (let index = 0; index < 81; index++) {
      if (board[index] !== 0) continue;
      const row = Math.floor(index / 9), col = index % 9;
      const mask = ALL & ~(rows[row] | cols[col] | boxes[boxOf(row, col)]);
      const digits = [];
      for (let digit = 1; digit <= 9; digit++) if (mask & (1 << digit)) digits.push(digit);
      if (!digits.length) return false;
      if (digits.length < smallest) {
        selected = index;
        candidates = digits;
        smallest = digits.length;
      }
    }
    if (selected === -1) {
      count++;
      if (!solution) solution = board.slice();
      return !counting || count === 2;
    }
    const row = Math.floor(selected / 9), col = selected % 9, box = boxOf(row, col);
    for (const digit of shuffled(candidates, runtime.rng)) {
      const bit = 1 << digit;
      board[selected] = digit;
      rows[row] |= bit; cols[col] |= bit; boxes[box] |= bit;
      const stop = await visit();
      board[selected] = 0;
      rows[row] &= ~bit; cols[col] &= ~bit; boxes[box] &= ~bit;
      if (stop) return true;
    }
    return false;
  }

  await visit();
  reason = runtime.check() ?? reason;
  if (reason) {
    solution = null;
    return result(reason === 'aborted' ? 'aborted' : 'budget-exceeded');
  }
  return result(counting ? (count === 2 ? 'limit-reached' : 'complete') : (count ? 'solved' : 'unsolvable'));
}

export async function solveBoard(board, options = {}) {
  const result = await runSearch(board, options, undefined, false);
  return { status: result.status, board: result.board, stats: result.stats };
}

export async function countSolutions(board, options = {}) {
  const result = await runSearch(board, options, undefined, true);
  return { status: result.status, count: result.count, stats: result.stats };
}