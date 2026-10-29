import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameSession } from '../.build/src/main.js';
import { generatePuzzle, DIFFICULTY_BLANKS } from '../.build/src/core/generator.js';
import { solveBoard, countSolutions } from '../.build/src/core/solver.js';
import { isComplete } from '../.build/src/core/board.js';
import { seededRandom } from './fixtures/boards.js';

const search = { now: () => 0, yieldControl: async () => {} };
function sessionWith(generate) {
  const jobs = new Map();
  let serial = 0, time = 100;
  const session = createGameSession({
    generate, now: () => time,
    schedule: (fn) => { jobs.set(++serial, fn); return serial; },
    cancel: (id) => jobs.delete(id),
  });
  return { session, jobs, setTime: (value) => { time = value; } };
}

// These tests integrate the actual generator, solver and production session. They do not use DOM.
test('acceptance: real three-difficulty generation flows through play, completion and restart', { timeout: 30000 }, async (t) => {
  const h = sessionWith((difficulty, { signal }) => generatePuzzle(difficulty, { signal, rng: seededRandom(42) }));
  try {
    for (const difficulty of Object.keys(DIFFICULTY_BLANKS)) {
      h.session.dispatch({ type: 'SET_DIFFICULTY', difficulty });
      await h.session.newGame();
      const initial = h.session.store.getState();
      assert.equal(initial.status, 'playing');
      assert.equal(initial.activeDifficulty, difficulty);
      assert.equal(initial.puzzle.filter(n => !n).length, DIFFICULTY_BLANKS[difficulty]);
      assert.equal(h.jobs.size, 1);
      const clues = initial.puzzle.slice();
      const counted = await countSolutions(clues, search);
      assert.equal(counted.status, 'complete'); assert.equal(counted.count, 1);
      const solved = await solveBoard(clues, search);
      assert.equal(solved.status, 'solved');
      const clue = clues.findIndex(Boolean), empty = clues.indexOf(0);
      h.session.dispatch({ type: 'SELECT_CELL', index: clue });
      h.session.dispatch({ type: 'CLEAR_CELL' });
      assert.equal(h.session.store.getState().values[clue], clues[clue]);
      h.session.dispatch({ type: 'SELECT_CELL', index: empty });
      h.session.dispatch({ type: 'TOGGLE_NOTE_MODE' });
      h.session.dispatch({ type: 'ENTER_DIGIT', digit: solved.board[empty] });
      assert.deepEqual([...h.session.store.getState().notes[empty]], [solved.board[empty]]);
      h.session.dispatch({ type: 'TOGGLE_NOTE_MODE' });
      h.session.dispatch({ type: 'ENTER_DIGIT', digit: solved.board[empty] });
      h.session.dispatch({ type: 'CLEAR_CELL' });
      assert.equal(h.session.store.getState().values[empty], 0);
      assert.equal(h.session.store.getState().notes[empty].size, 0);
      h.setTime(12100);
      for (let index = 0; index < 81; index++) {
        if (clues[index]) continue;
        h.session.dispatch({ type: 'SELECT_CELL', index });
        h.session.dispatch({ type: 'ENTER_DIGIT', digit: solved.board[index] });
      }
      const completed = h.session.store.getState();
      assert.ok(isComplete(completed.values, completed.puzzle));
      assert.equal(completed.status, 'completed');
      assert.equal(completed.completionDialogOpen, true);
      assert.equal(h.jobs.size, 0);
      h.session.dispatch({ type: 'CLEAR_CELL' });
      assert.equal(h.session.store.getState(), completed);
      h.session.dispatch({ type: 'CLOSE_COMPLETION_DIALOG' });
      assert.equal(h.session.store.getState().completionDialogOpen, false);
      assert.deepEqual(initial.puzzle, clues);
      assert.deepEqual(initial.values, clues);
      t.diagnostic(JSON.stringify({ difficulty, seed:42, blankCount:DIFFICULTY_BLANKS[difficulty], unique:true, completed:true }));
    }
  } finally { h.session.dispose(); }
  assert.equal(h.jobs.size, 0);
});

test('acceptance: real generator budget failure clears state and actual retry starts a game', async () => {
  let calls = 0;
  const h = sessionWith((difficulty, { signal }) => generatePuzzle(difficulty, {
    signal, rng:seededRandom(42), ...(calls++ === 0 ? { maxTotalNodes:1 } : {}),
  }));
  try {
    await h.session.start();
    assert.equal(h.session.store.getState().status, 'error');
    assert.equal(h.session.store.getState().error.code, 'node-budget');
    assert.equal(h.session.store.getState().puzzle, null);
    assert.equal(h.jobs.size, 0);
    await h.session.newGame();
    assert.equal(h.session.store.getState().status, 'playing');
    assert.equal(h.session.store.getState().requestId, 2);
    assert.equal(h.jobs.size, 1);
  } finally { h.session.dispose(); }
});

test('acceptance: superseding an in-flight actual generator aborts it and retains the latest puzzle', async () => {
  let calls = 0, release, entered;
  const suspended = new Promise(resolve => { entered = resolve; });
  const blocked = new Promise(resolve => { release = resolve; });
  let oldResult;
  const h = sessionWith(async (difficulty, { signal }) => {
    const first = calls++ === 0;
    const result = await generatePuzzle(difficulty, {
      signal, rng:seededRandom(42),
      ...(first ? { yieldControl:async () => { entered(); await blocked; } } : {}),
    });
    if (first) oldResult = result;
    return result;
  });
  try {
    const first = h.session.start();
    await suspended;
    await h.session.newGame();
    const latest = h.session.store.getState();
    assert.equal(latest.status, 'playing');
    release(); await first;
    assert.equal(oldResult.status, 'aborted');
    assert.equal(h.session.store.getState(), latest);
    assert.equal(latest.requestId, 2);
    assert.equal(h.jobs.size, 1);
  } finally { release(); h.session.dispose(); }
});