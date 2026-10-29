import test from 'node:test';
import assert from 'node:assert/strict';
import { solveBoard, countSolutions } from '../.build/src/core/solver.js';
import { isComplete, isValidBoard } from '../.build/src/core/board.js';
import { uniquePuzzle, uniqueSolution, conflictingPuzzle, multipleSolutions, unsolvablePuzzle, seededRandom } from './fixtures/boards.js';

const fast = { now: () => 0, yieldControl: async () => {} };

test('solving and exhaustive counting preserve clues and frozen input', async () => {
  const solved = await solveBoard(uniquePuzzle, fast);
  assert.equal(solved.status, 'solved');
  assert.deepEqual(solved.board, uniqueSolution);
  assert.notEqual(solved.board, uniqueSolution);
  assert.ok(isComplete(solved.board, uniquePuzzle));
  assert.ok(solved.stats.nodes > 0);
  assert.deepEqual(await countSolutions(uniquePuzzle, fast), {
    status: 'complete', count: 1, stats: { nodes: solved.stats.nodes, elapsedMs: 0 },
  });
});

test('the proposed unsolvable fixture has no initial conflicts and zero solutions', async () => {
  assert.equal(isValidBoard(unsolvablePuzzle), true);
  const solved = await solveBoard(unsolvablePuzzle, fast);
  assert.equal(solved.status, 'unsolvable');
  assert.equal(solved.board, null);
  const counted = await countSolutions(unsolvablePuzzle, fast);
  assert.equal(counted.status, 'complete');
  assert.equal(counted.count, 0);
});

test('conflicting clues, multiple solutions and already-complete input are distinct', async () => {
  assert.equal((await solveBoard(conflictingPuzzle, fast)).status, 'invalid');
  const invalid = await countSolutions(conflictingPuzzle, fast);
  assert.equal(invalid.status, 'invalid');
  assert.equal(invalid.count, 0);
  const many = await countSolutions(multipleSolutions, fast);
  assert.equal(many.status, 'limit-reached');
  assert.equal(many.count, 2);
  const solved = await solveBoard(uniqueSolution, fast);
  assert.equal(solved.status, 'solved');
  assert.deepEqual(solved.board, uniqueSolution);
  assert.notEqual(solved.board, uniqueSolution);
  const counted = await countSolutions(uniqueSolution, fast);
  assert.equal(counted.status, 'complete');
  assert.equal(counted.count, 1);
});

test('a partial count of one is not an exhaustive uniqueness proof', async () => {
  const first = await solveBoard(multipleSolutions, fast);
  const counted = await countSolutions(multipleSolutions, { ...fast, maxNodes: first.stats.nodes });
  assert.equal(counted.status, 'budget-exceeded');
  assert.equal(counted.count, 1);
  assert.equal(counted.stats.nodes, first.stats.nodes);
});

test('node limits, elapsed-time limits and pre-abort are deterministic', async () => {
  const nodes = await solveBoard(uniquePuzzle, { ...fast, maxNodes: 1 });
  assert.equal(nodes.status, 'budget-exceeded');
  assert.equal(nodes.stats.nodes, 1);
  assert.equal(nodes.board, null);
  let time = 0;
  const timed = await countSolutions(uniquePuzzle, { ...fast, now: () => time++, maxElapsedMs: 3 });
  assert.equal(timed.status, 'budget-exceeded');
  const controller = new AbortController();
  controller.abort();
  const aborted = await solveBoard(uniquePuzzle, { ...fast, signal: controller.signal });
  assert.equal(aborted.status, 'aborted');
  assert.equal(aborted.stats.nodes, 0);
});

test('default task yielding lets a timer cancel a running search', async () => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 0);
  try {
    const result = await countSolutions(multipleSolutions, { signal: controller.signal, yieldEveryNodes: 1 });
    assert.equal(result.status, 'aborted');
  } finally { clearTimeout(timer); }
});

test('cancellation and elapsed-time expiry are rechecked after a yielded task', async () => {
  let time = 0, calls = 0;
  const controller = new AbortController();
  const result = await countSolutions(uniquePuzzle, {
    now: () => time, maxElapsedMs: 1, yieldEveryNodes: 1, signal: controller.signal,
    yieldControl: async () => { calls++; time = 2; controller.abort(); },
  });
  assert.equal(result.status, 'aborted');
  assert.equal(calls, 1);
  assert.equal(result.count, 0);
});

test('search validates options, monotonic clocks and random values', async () => {
  for (const name of ['maxNodes', 'maxElapsedMs', 'yieldEveryNodes']) {
    for (const value of [0, -1, NaN, Infinity, '10', null]) {
      await assert.rejects(solveBoard(uniquePuzzle, { [name]: value }), RangeError);
    }
  }
  for (const value of [1.5, Number.MAX_SAFE_INTEGER + 1]) {
    await assert.rejects(solveBoard(uniquePuzzle, { maxNodes: value }), RangeError);
  }
  await assert.rejects(solveBoard([], fast), TypeError);
  await assert.rejects(solveBoard(uniquePuzzle, null), RangeError);
  await assert.rejects(countSolutions(uniquePuzzle, { limit: 1 }), RangeError);
  await assert.rejects(countSolutions(uniquePuzzle, { limit: null }), RangeError);
  await assert.rejects(solveBoard(uniquePuzzle, { sharedBudget: {} }), RangeError);
  for (const options of [{ now: 1 }, { now: null }, { signal: {} }, { yieldControl: 1 }, { yieldControl: null }, { rng: 1 }, { rng: null }]) {
    await assert.rejects(solveBoard(uniquePuzzle, options), RangeError);
  }
  await assert.rejects(solveBoard(uniquePuzzle, { now: () => NaN }), RangeError);
  let clock = 2;
  await assert.rejects(solveBoard(uniquePuzzle, { now: () => clock-- }), RangeError);
  await assert.rejects(solveBoard(uniquePuzzle, { yieldEveryNodes: 1, yieldControl: () => {} }), RangeError);
  for (const value of [-0.1, 1, Infinity, NaN]) {
    await assert.rejects(solveBoard(multipleSolutions, { ...fast, rng: () => value }), RangeError);
  }
});

test('seeded search is reproducible and calls do not share writable state', async () => {
  const [a, b] = await Promise.all([1, 1].map((seed) => solveBoard(multipleSolutions, { ...fast, rng: seededRandom(seed) })));
  assert.deepEqual(a, b);
  assert.notEqual(a.board, b.board);
  a.board[0] = 0;
  assert.notEqual(b.board[0], 0);
});
// Intentionally simple reference: first empty cell, direct row/column/box
// scans, no production masks, MRV or board helpers.
function referenceCount(input) {
  const board = input.slice();
  function visit() {
    const index = board.indexOf(0);
    if (index === -1) return 1;
    const row = Math.floor(index / 9), col = index % 9;
    let count = 0;
    for (let digit = 1; digit <= 9; digit++) {
      let allowed = true;
      for (let i = 0; i < 9; i++) {
        const boxIndex = (Math.floor(row / 3) * 3 + Math.floor(i / 3)) * 9
          + Math.floor(col / 3) * 3 + i % 3;
        if (board[row * 9 + i] === digit || board[i * 9 + col] === digit || board[boxIndex] === digit) {
          allowed = false;
          break;
        }
      }
      if (!allowed) continue;
      board[index] = digit;
      count += visit();
      board[index] = 0;
      if (count >= 2) return 2;
    }
    return count;
  }
  return visit();
}

test('solution counts agree with an independent direct-scan reference', async () => {
  const cases = [uniqueSolution.map((n) => n === 1 || n === 2 ? 0 : n)];
  for (let seed = 1; seed <= 12; seed++) {
    const rng = seededRandom(seed);
    const board = uniqueSolution.slice();
    for (let removed = 0; removed < 20;) {
      const index = Math.floor(rng() * 81);
      if (board[index]) { board[index] = 0; removed++; }
    }
    cases.push(board);
  }
  for (const board of cases) {
    const expected = referenceCount(board);
    const result = await countSolutions(Object.freeze(board), fast);
    assert.equal(result.count, expected);
    assert.equal(result.status, expected === 2 ? 'limit-reached' : 'complete');
  }
});