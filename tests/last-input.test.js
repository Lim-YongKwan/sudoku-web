import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState, createGameStore, reduceGame } from '../.build/src/core/game-state.js';
import { createDisplayState, createGameSession } from '../.build/src/main.js';
import { getCellModels } from '../.build/src/ui/board.js';
import { uniquePuzzle, uniqueSolution } from './fixtures/boards.js';
const act = (state, type, fields = {}) => reduceGame(state, { type, ...fields });
const playing = () => ({ ...createDisplayState(uniquePuzzle), timer: { startedAtMs: 0, stoppedAtMs: null } });
const enter = (state, index, digit) => act(act(state, 'SELECT_CELL', { index }), 'ENTER_DIGIT', { digit });

test('recent starts empty and follows actual input/overwrite without mutating previous snapshots', () => {
  const initial = playing(); Object.freeze(initial.values); Object.freeze(initial.notes); Object.freeze(initial);
  assert.equal(createInitialState().lastInputIndex, null); assert.equal(initial.lastInputIndex, null);
  const first = enter(initial, 2, 4), second = enter(first, 3, 6), overwrite = enter(second, 2, 8);
  assert.equal(first.lastInputIndex, 2); assert.equal(second.lastInputIndex, 3); assert.equal(overwrite.lastInputIndex, 2);
  assert.equal(initial.values[2], 0); assert.equal(first.values[3], 0); assert.equal(first.values[2], 4);
});
test('same-value entry in an older cell and clue entry do not steal the recent marker', () => {
  let state = enter(enter(playing(), 2, 4), 3, 6);
  state = act(state, 'SELECT_CELL', { index: 2 });
  assert.equal(act(state, 'ENTER_DIGIT', { digit: 4 }), state);
  assert.equal(enter(state, 0, 9).lastInputIndex, 3);
  assert.equal(enter(state, 0, 9).values[0], 5);
  const notes = state.notes.slice(); notes[2] = new Set([1]);
  assert.equal(act({ ...state, notes }, 'ENTER_DIGIT', { digit: 4 }).lastInputIndex, 3);
});
test('selection, movement, memo toggles/edits and all assistance combinations preserve recent input', () => {
  let state = enter(playing(), 2, 4);
  state = act(state, 'MOVE_SELECTION', { direction: 'right' });
  state = act(state, 'TOGGLE_NOTE_MODE');
  state = act(state, 'ENTER_DIGIT', { digit: 6 });
  state = act(state, 'ENTER_DIGIT', { digit: 6 });
  for (const showDigitStock of [false, true]) for (const highlightMatchingDigits of [false, true]) {
    state = act(state, 'SET_ASSISTANCE', { option: 'showDigitStock', enabled: showDigitStock });
    state = act(state, 'SET_ASSISTANCE', { option: 'highlightMatchingDigits', enabled: highlightMatchingDigits });
    assert.equal(state.lastInputIndex, 2);
  }
  assert.equal(state.values[3], 0); assert.equal(state.notes[3].size, 0);
});
test('deleting another number or memo preserves marker; deleting the latest number clears it', () => {
  let state = enter(enter(playing(), 2, 4), 3, 6);
  state = act(act(state, 'SELECT_CELL', { index: 2 }), 'CLEAR_CELL');
  assert.equal(state.lastInputIndex, 3);
  state = act(state, 'TOGGLE_NOTE_MODE'); state = act(state, 'ENTER_DIGIT', { digit: 9 });
  state = act(state, 'CLEAR_CELL'); assert.equal(state.lastInputIndex, 3);
  state = act(act(state, 'SELECT_CELL', { index: 3 }), 'CLEAR_CELL');
  assert.equal(state.lastInputIndex, null); assert.equal(state.values[3], 0);
});
test('new request, failure/retry and generation success start with no recent marker', () => {
  let state = act(enter(playing(), 2, 4), 'NEW_GAME_REQUESTED', { requestId: 2, difficulty: 'easy' });
  assert.equal(state.lastInputIndex, null);
  state = act(state, 'GENERATION_FAILED', { requestId: 2, code: 'test', message: 'retry' });
  assert.equal(state.lastInputIndex, null);
  state = act(state, 'NEW_GAME_REQUESTED', { requestId: 3, difficulty: 'easy' });
  const puzzle = uniqueSolution.map((n, i) => i < 35 ? 0 : n);
  state = act(state, 'GENERATION_SUCCEEDED', { requestId: 3, difficulty: 'easy', puzzle, nowMs: 10 });
  assert.equal(state.lastInputIndex, null);
});
test('completion clears recent input and subsequent locked actions cannot restore it', () => {
  const values = uniqueSolution.slice(); values[2] = 0;
  let state = enter({ ...playing(), values }, 2, 4);
  assert.equal(state.lastInputIndex, 2);
  state = act(state, 'GAME_COMPLETED', { nowMs: 100 });
  assert.equal(state.status, 'completed'); assert.equal(state.lastInputIndex, null);
  assert.equal(act(state, 'CLEAR_CELL'), state); assert.equal(act(state, 'ENTER_DIGIT', { digit: 1 }), state);
  assert.ok(getCellModels(state).every((cell) => !cell.recent && cell.disabled));
});
test('store and renderer reject missing, out-of-range, empty, clue and non-playing recent markers', () => {
  const state = enter(playing(), 2, 4);
  for (const lastInputIndex of [undefined, '2', NaN, 1.5, -1, 81, 0, 3]) {
    for (const validate of [createGameStore, getCellModels]) assert.throws(() => validate({ ...state, lastInputIndex }));
  }
  for (const status of ['idle', 'generating', 'error', 'completed']) {
    assert.throws(() => createGameStore({ ...state, status }), RangeError);
    assert.throws(() => getCellModels({ ...state, status }), RangeError);
  }
  assert.equal(createGameStore(state).getState().lastInputIndex, 2);
});
test('recent projection is a single independent accessible marker even with conflict and moved focus', () => {
  const state = act(enter(playing(), 2, 5), 'SELECT_CELL', { index: 3 });
  const before = JSON.stringify(state); const models = getCellModels(state);
  assert.deepEqual(models.filter((cell) => cell.recent).map((cell) => cell.index), [2]);
  assert.equal(models[2].conflict, true); assert.equal(models[2].selected, false); assert.equal(models[2].fixed, false);
  assert.match(models[2].label, /중복 오류, 최근 입력/);
  assert.equal(models[3].tabIndex, 0); assert.equal(models[0].fixed, true);
  assert.equal(JSON.stringify(state), before);
});
test('elapsed ticks retain recent input without extra timers and disposal cancels the game timer', () => {
  let now = 0, callback, schedules = 0, cancellations = 0, seconds = 0;
  const app = createGameSession({ initialState: playing(), now: () => now,
    schedule: (fn, delay) => { assert.equal(delay, 250); callback = fn; schedules++; return 7; },
    cancel: (id) => { assert.equal(id, 7); cancellations++; }, onElapsed: (value) => { seconds = value; } });
  try {
    app.dispatch({ type: 'ENTER_DIGIT', digit: 4 });
    const snapshot = app.store.getState(); now = 120000; callback();
    assert.equal(seconds, 120); assert.equal(app.store.getState(), snapshot);
    assert.equal(snapshot.lastInputIndex, 2); assert.equal(schedules, 1);
  } finally { app.dispose(); }
  assert.equal(cancellations, 1);
});

test('session final entry completes and clears marker before returning the locked snapshot', () => {
  const values = uniqueSolution.slice(); values[2] = 0;
  const app = createGameSession({ initialState: { ...playing(), values }, now: () => 100,
    schedule: () => 1, cancel: () => {} });
  try {
    const state = app.dispatch({ type: 'ENTER_DIGIT', digit: 4 });
    assert.equal(state.status, 'completed'); assert.equal(state.lastInputIndex, null);
    assert.equal(state.completionDialogOpen, true);
    assert.ok(getCellModels(state).every(cell => !cell.recent && cell.disabled));
    assert.equal(app.dispatch({ type: 'ENTER_DIGIT', digit: 5 }), state);
  } finally { app.dispose(); }
});
