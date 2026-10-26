import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState, reduceGame, createGameStore } from '../src/core/game-state.js';
import { findConflicts } from '../src/core/board.js';
import { uniqueSolution, completedWithChangedClue } from './fixtures/boards.js';

const puzzle = Object.freeze(uniqueSolution.map((n, i) => i < 35 ? 0 : n));
const action = (type, fields = {}) => ({ type, ...fields });
function playing() {
  let state = reduceGame(createInitialState(), action('NEW_GAME_REQUESTED', { requestId: 1, difficulty: 'easy' }));
  return reduceGame(state, action('GENERATION_SUCCEEDED', { requestId: 1, difficulty: 'easy', puzzle, nowMs: 100 }));
}
const snapshot = (state) => JSON.stringify({ ...state, notes: state.notes.map((notes) => [...notes]) });

test('initial snapshots have independent notes and the planned idle values', () => {
  const a = createInitialState(), b = createInitialState();
  assert.equal(a.status, 'idle');
  assert.equal(a.requestId, 0);
  assert.equal(a.puzzle, null); assert.equal(a.values, null);
  assert.equal(a.selectedIndex, null); assert.equal(a.activeDifficulty, null);
  assert.equal(a.selectedDifficulty, 'easy'); assert.equal(a.noteMode, false);
  assert.equal(a.completionDialogOpen, false); assert.equal(a.error, null);
  assert.equal(new Set(a.notes).size, 81);
  a.notes[0].add(1);
  assert.equal(a.notes[1].size, 0); assert.equal(b.notes[0].size, 0);
});

test('request reset and success copy clues, values and notes while keeping selected difficulty separate', () => {
  let state = playing();
  state = reduceGame(state, action('SET_DIFFICULTY', { difficulty: 'hard' }));
  const before = snapshot(state);
  const requested = reduceGame(state, action('NEW_GAME_REQUESTED', { requestId: 2, difficulty: 'easy' }));
  assert.equal(snapshot(state), before);
  assert.equal(requested.selectedDifficulty, 'hard'); assert.equal(requested.activeDifficulty, 'easy');
  assert.equal(requested.puzzle, null); assert.equal(requested.values, null);
  assert.deepEqual(requested.timer, { startedAtMs: null, stoppedAtMs: null });
  const ready = reduceGame(requested, action('GENERATION_SUCCEEDED', { requestId: 2, difficulty: 'easy', puzzle, nowMs: 200 }));
  assert.equal(ready.status, 'playing'); assert.equal(ready.selectedIndex, 0);
  assert.notEqual(ready.puzzle, puzzle); assert.notEqual(ready.values, ready.puzzle);
  assert.equal(new Set(ready.notes).size, 81);
  assert.deepEqual(ready.timer, { startedAtMs: 200, stoppedAtMs: null });
});

test('stale and mismatched generation actions preserve the exact state reference', () => {
  const state = reduceGame(createInitialState(), action('NEW_GAME_REQUESTED', { requestId: 2, difficulty: 'easy' }));
  assert.equal(reduceGame(state, action('NEW_GAME_REQUESTED', { requestId: 1, difficulty: 'easy' })), state);
  assert.equal(reduceGame(state, action('GENERATION_SUCCEEDED', { requestId: 1, difficulty: 'easy', puzzle, nowMs: 100 })), state);
  assert.equal(reduceGame(state, action('GENERATION_FAILED', { requestId: 1, code: 'limit', message: 'failed' })), state);
  const normal = uniqueSolution.map((n, i) => i < 45 ? 0 : n);
  assert.equal(reduceGame(state, action('GENERATION_SUCCEEDED', { requestId: 2, difficulty: 'normal', puzzle: normal, nowMs: 100 })), state);
});

test('failure has no board or timer and preserves error text', () => {
  const requested = reduceGame(playing(), action('NEW_GAME_REQUESTED', { requestId: 2, difficulty: 'easy' }));
  const failed = reduceGame(requested, action('GENERATION_FAILED', { requestId: 2, code: 'node-budget', message: '다시 시도' }));
  assert.equal(failed.status, 'error'); assert.equal(failed.puzzle, null); assert.equal(failed.values, null);
  assert.deepEqual(failed.error, { code: 'node-budget', message: '다시 시도' });
  assert.deepEqual(failed.timer, { startedAtMs: null, stoppedAtMs: null });
  assert.equal(reduceGame(failed, action('ENTER_DIGIT', { digit: 1 })), failed);
});

test('malformed payloads reject even when a user action would otherwise be a no-op', () => {
  const invalid = [
    [null, TypeError], [action('UNKNOWN'), TypeError],
    [action('SELECT_CELL', { index: '1' }), TypeError], [action('SELECT_CELL', { index: 81 }), RangeError],
    [action('ENTER_DIGIT', { digit: 0 }), RangeError], [action('ENTER_DIGIT', { digit: 1.5 }), RangeError],
    [action('MOVE_SELECTION', { direction: 'diagonal' }), RangeError],
    [action('SET_DIFFICULTY', { difficulty: 'expert' }), RangeError],
    [action('NEW_GAME_REQUESTED', { requestId: -1, difficulty: 'easy' }), RangeError],
    [action('GENERATION_FAILED', { requestId: 1, code: 1, message: 'x' }), TypeError],
    [action('GAME_COMPLETED', { nowMs: NaN }), RangeError],
    [action('GENERATION_SUCCEEDED', { requestId: 1, difficulty: 'easy', puzzle: [], nowMs: 0 }), TypeError],
    [action('GENERATION_SUCCEEDED', { requestId: 1, difficulty: 'easy', puzzle: uniqueSolution, nowMs: 0 }), RangeError],
  ];
  for (const [input, error] of invalid) assert.throws(() => reduceGame(createInitialState(), input), error);
  const conflict = puzzle.slice(); conflict[0] = 1; conflict[1] = 1;
  assert.throws(() => reduceGame(createInitialState(), action('GENERATION_SUCCEEDED', { requestId: 1, difficulty: 'easy', puzzle: conflict, nowMs: 0 })), RangeError);
});

test('clues can be selected but input, clear and pencil edits are no-ops', () => {
  const state = reduceGame(playing(), action('SELECT_CELL', { index: 40 }));
  for (const input of [action('ENTER_DIGIT', { digit: 1 }), action('CLEAR_CELL')]) assert.equal(reduceGame(state, input), state);
  const notes = reduceGame(state, action('TOGGLE_NOTE_MODE'));
  assert.equal(reduceGame(notes, action('ENTER_DIGIT', { digit: 1 })), notes);
});

test('all arrow boundaries stop without wrapping and null selection picks first editable cell', () => {
  for (const [index, direction] of [[0, 'up'], [0, 'left'], [8, 'right'], [72, 'down'], [80, 'right'], [80, 'down']]) {
    const state = { ...playing(), selectedIndex: index };
    assert.equal(reduceGame(state, action('MOVE_SELECTION', { direction })), state);
  }
  assert.equal(reduceGame({ ...playing(), selectedIndex: null }, action('MOVE_SELECTION', { direction: 'right' })).selectedIndex, 0);
  assert.equal(reduceGame({ ...playing(), selectedIndex: 34 }, action('MOVE_SELECTION', { direction: 'right' })).selectedIndex, 35);
});

test('pencil toggles copy only changed branches and do not alter old notes or values', () => {
  let state = reduceGame(playing(), action('TOGGLE_NOTE_MODE'));
  const before = snapshot(state);
  Object.freeze(state.values); Object.freeze(state.puzzle); Object.freeze(state.notes); Object.freeze(state);
  const added = reduceGame(state, action('ENTER_DIGIT', { digit: 3 }));
  assert.equal(snapshot(state), before);
  assert.equal(added.notes[0].has(3), true); assert.equal(state.notes[0].size, 0);
  assert.notEqual(added.notes, state.notes); assert.notEqual(added.notes[0], state.notes[0]);
  assert.equal(added.values, state.values);
  const removed = reduceGame(added, action('ENTER_DIGIT', { digit: 3 }));
  assert.equal(removed.notes[0].size, 0); assert.equal(added.notes[0].has(3), true);
});

test('value entry clears only local notes, clear erases value and notes, note on filled cells is a no-op', () => {
  let state = reduceGame(playing(), action('TOGGLE_NOTE_MODE'));
  state = reduceGame(state, action('ENTER_DIGIT', { digit: 4 }));
  state = reduceGame(state, action('TOGGLE_NOTE_MODE'));
  const filled = reduceGame(state, action('ENTER_DIGIT', { digit: 5 }));
  assert.equal(filled.values[0], 5); assert.equal(filled.notes[0].size, 0); assert.equal(state.values[0], 0);
  const noteMode = reduceGame(filled, action('TOGGLE_NOTE_MODE'));
  assert.equal(reduceGame(noteMode, action('ENTER_DIGIT', { digit: 2 })), noteMode);
  const cleared = reduceGame(noteMode, action('CLEAR_CELL'));
  assert.equal(cleared.values[0], 0); assert.equal(cleared.notes[0].size, 0);
  assert.equal(reduceGame(cleared, action('CLEAR_CELL')), cleared);
});

test('wrong entries remain editable and conflicts are rule-based rather than solution-based', () => {
  let state = playing();
  state = reduceGame(state, action('ENTER_DIGIT', { digit: 6 }));
  assert.equal(findConflicts(state.values).has(0), false);
  state = reduceGame(state, action('ENTER_DIGIT', { digit: 3 }));
  assert.equal(findConflicts(state.values).has(0), true);
  assert.equal(state.puzzle[0], 0);
  assert.equal(reduceGame(state, action('CLEAR_CELL')).values[0], 0);
});

test('only clue-preserving valid full values complete and completion locks input', () => {
  const start = playing();
  assert.equal(reduceGame(start, action('GAME_COMPLETED', { nowMs: 200 })), start);
  for (const values of [completedWithChangedClue, uniqueSolution.map((n, i) => i === 0 ? 3 : n)]) {
    const state = { ...start, values };
    assert.equal(reduceGame(state, action('GAME_COMPLETED', { nowMs: 200 })), state);
  }
  const ready = { ...start, values: uniqueSolution.slice() };
  assert.throws(() => reduceGame(ready, action('GAME_COMPLETED', { nowMs: 99 })), RangeError);
  const completed = reduceGame(ready, action('GAME_COMPLETED', { nowMs: 200 }));
  assert.equal(completed.status, 'completed'); assert.equal(completed.completionDialogOpen, true);
  assert.deepEqual(completed.timer, { startedAtMs: 100, stoppedAtMs: 200 });
  for (const input of [action('ENTER_DIGIT', { digit: 1 }), action('CLEAR_CELL'), action('TOGGLE_NOTE_MODE'), action('SELECT_CELL', { index: 1 })]) {
    assert.equal(reduceGame(completed, input), completed);
  }
  assert.equal(reduceGame(completed, action('CLOSE_COMPLETION_DIALOG')).completionDialogOpen, false);
});

test('store clones initial data, notifies only changes and unsubscribes independently', () => {
  const initial = playing(), store = createGameStore(initial);
  initial.values[0] = 9; initial.notes[0].add(9);
  assert.equal(store.getState().values[0], 0); assert.equal(store.getState().notes[0].size, 0);
  let calls = 0;
  const listener = () => calls++;
  const a = store.subscribe(listener), b = store.subscribe(listener);
  store.dispatch(action('SELECT_CELL', { index: 0 }));
  assert.equal(calls, 0);
  store.dispatch(action('SELECT_CELL', { index: 1 }));
  assert.equal(calls, 2);
  a(); a();
  store.dispatch(action('SELECT_CELL', { index: 2 }));
  assert.equal(calls, 3);
  b();
  store.dispatch(action('SELECT_CELL', { index: 3 }));
  assert.equal(calls, 3);
  assert.throws(() => store.subscribe(null), TypeError);
});

test('subscriber dispatch is queued so observers see transitions in order', () => {
  const store = createGameStore(playing()), observed = [];
  store.subscribe((state) => { if (state.selectedIndex === 1) store.dispatch(action('SELECT_CELL', { index: 2 })); });
  store.subscribe((state) => observed.push(state.selectedIndex));
  store.dispatch(action('SELECT_CELL', { index: 1 }));
  assert.deepEqual(observed, [1, 2]);
});
test('store rejects sparse, non-Set and out-of-range initial notes', () => {
  for (const notes of [Array(81), Array.from({ length: 81 }, () => []), Array.from({ length: 81 }, () => new Set([10]))]) {
    assert.throws(() => createGameStore({ ...createInitialState(), notes }), TypeError);
  }
});