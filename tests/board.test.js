import test from 'node:test';
import assert from 'node:assert/strict';
import { assertBoard, findConflicts, isValidBoard, isComplete } from '../.build/src/core/board.js';
import { uniquePuzzle, uniqueSolution, conflictingPuzzle, completedWithChangedClue } from './fixtures/boards.js';

test('board APIs reject malformed, sparse, coerced and non-integer boards', () => {
  const invalid = [null, {}, new Uint8Array(81), [], Array(80).fill(0), Array(82).fill(0), Array(81)];
  for (const digit of [NaN, Infinity, '1', 1.5, -1, 10, undefined]) {
    invalid.push(Array(81).fill(digit));
  }
  for (const input of invalid) {
    for (const fn of [assertBoard, findConflicts, isValidBoard]) assert.throws(() => fn(input), TypeError);
    assert.throws(() => isComplete(uniqueSolution, input), TypeError);
    assert.throws(() => isComplete(input, uniquePuzzle), TypeError);
  }
});

test('conflicts include every duplicate in rows, columns and boxes, excluding blanks', () => {
  for (const indices of [[0, 4, 8], [0, 36, 72], [0, 10, 20]]) {
    const board = Array(81).fill(0);
    for (const i of indices) board[i] = 7;
    assert.deepEqual(findConflicts(Object.freeze(board)), new Set(indices));
  }
  assert.deepEqual(findConflicts(Array(81).fill(0)), new Set());
  assert.equal(isValidBoard(conflictingPuzzle), false);
});

test('completion requires full validity and the original clues, without mutation', () => {
  assert.equal(isValidBoard(uniquePuzzle), true);
  assert.equal(isComplete(uniquePuzzle, uniquePuzzle), false);
  assert.equal(isComplete(uniqueSolution, uniquePuzzle), true);
  assert.equal(isValidBoard(completedWithChangedClue), true);
  assert.equal(isComplete(completedWithChangedClue, uniquePuzzle), false);
  assert.equal(isComplete(uniqueSolution, conflictingPuzzle), false);
  const snapshot = uniquePuzzle.slice();
  findConflicts(uniquePuzzle);
  assert.deepEqual(uniquePuzzle, snapshot);
});