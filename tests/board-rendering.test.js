import { layoutChecks, allChecksPass } from './browser/board-assertions.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { getCellModels } from '../src/ui/board.js';
import { createDisplayState, bindInitialBoardLifecycle } from '../src/main.js';
import { uniquePuzzle, uniqueSolution } from './fixtures/boards.js';

test('display state follows planned fields with independent puzzle, values and note sets', () => {
  const state = createDisplayState(uniquePuzzle);
  assert.equal(state.status, 'playing');
  assert.deepEqual(state.puzzle, uniquePuzzle);
  assert.deepEqual(state.values, uniquePuzzle);
  assert.notEqual(state.puzzle, uniquePuzzle);
  assert.notEqual(state.puzzle, state.values);
  assert.equal(new Set(state.notes).size, 81);
  assert.equal(state.selectedIndex, 2);
  assert.deepEqual(state.timer, { startedAtMs: null, stoppedAtMs: null });
  assert.equal(createDisplayState(uniqueSolution).selectedIndex, null);
});

test('projection covers all cells, clues, box boundaries and a single selected tab stop', () => {
  const models = getCellModels(createDisplayState(uniquePuzzle));
  assert.equal(models.length, 81);
  assert.equal(models.filter((cell) => cell.fixed).length, 30);
  assert.equal(models.filter((cell) => cell.value === 0).length, 51);
  assert.equal(models.filter((cell) => cell.boxRight).length, 18);
  assert.equal(models.filter((cell) => cell.boxBottom).length, 18);
  assert.equal(models.filter((cell) => cell.tabIndex === 0).length, 1);
  assert.equal(models[0].label, '1행 1열, 숫자 5, 고정 단서');
  assert.equal(models[80].label, '9행 9열, 숫자 9, 고정 단서');
});

test('notes are projected in order without mutating arrays, sets or display state', () => {
  const state = createDisplayState(uniquePuzzle);
  state.notes[2] = new Set([9, 1, 4]);
  const before = [...state.notes[2]];
  Object.freeze(state.puzzle);
  Object.freeze(state.values);
  Object.freeze(state.notes);
  Object.freeze(state);
  const models = getCellModels(state);
  assert.deepEqual(models[2].notes, [1, 4, 9]);
  assert.match(models[2].label, /메모 1, 4, 9/);
  assert.deepEqual([...state.notes[2]], before);
  models[2].notes.push(2);
  assert.deepEqual([...state.notes[2]], before);
});

test('conflicts are described on both cells and derive from values, not a hidden answer', () => {
  const state = createDisplayState(uniquePuzzle);
  state.values[2] = 5;
  const models = getCellModels(state);
  assert.equal(models[0].conflict, true);
  assert.equal(models[2].conflict, true);
  assert.match(models[2].label, /숫자 5, 입력 칸, 중복 오류/);
  assert.equal(state.puzzle[2], 0);
});

test('loading and error projections disable every cell with no focusable stale values', () => {
  const loading = createDisplayState();
  for (const status of ['generating', 'error']) {
    const cells = getCellModels({ ...loading, status });
    assert.equal(cells.length, 81);
    assert.ok(cells.every((cell) => cell.disabled && cell.value === 0 && cell.tabIndex === -1));
  }
});

test('malformed presentation inputs fail explicitly without silently changing the contract', () => {
  const state = createDisplayState(uniquePuzzle);
  assert.throws(() => createDisplayState([]), TypeError);
  assert.throws(() => getCellModels(null), TypeError);
  assert.throws(() => getCellModels({ ...state, values: null }), TypeError);
  assert.throws(() => getCellModels({ ...state, selectedIndex: 81 }), RangeError);
  assert.throws(() => getCellModels({ ...state, notes: [] }), TypeError);
  assert.throws(() => getCellModels({ ...state, notes: Array(81).fill([]) }), TypeError);
  const notes = Array.from({ length: 81 }, () => new Set());
  notes[2].add(10);
  assert.throws(() => getCellModels({ ...state, notes }), TypeError);
});
test('playing boards with null selection retain one keyboard entry without changing selection', () => {
  for (const puzzle of [uniquePuzzle, uniqueSolution]) {
    const state = createDisplayState(puzzle);
    state.selectedIndex = null;
    const cells = getCellModels(state);
    assert.equal(cells.filter((cell) => cell.tabIndex === 0).length, 1);
    const expected = puzzle.includes(0) ? puzzle.indexOf(0) : 0;
    assert.equal(cells[expected].tabIndex, 0);
    assert.equal(state.selectedIndex, null);
    assert.ok(cells.every((cell) => cell.selected === false));
  }
});
test('fixture rejects missing thick borders, zero-size cells and horizontal overflow', () => {
  const facts = { viewport: 320, scrollWidth: 320, cellWidth: 30, cellHeight: 30, boxRightWidth: '3px', boxBottomWidth: '3px' };
  assert.equal(allChecksPass(layoutChecks(facts)), true);
  for (const override of [
    { boxRightWidth: '1px' }, { boxBottomWidth: '1px' }, { scrollWidth: 321 },
    { cellWidth: 0, cellHeight: 0 }, { cellHeight: 34 }, { viewport: NaN },
  ]) {
    assert.equal(allChecksPass(layoutChecks({ ...facts, ...override })), false);
  }
  assert.equal(allChecksPass({}), false);
  assert.equal(allChecksPass({ cells81: true, boxRightWidth: '1px' }), false);
});
test('initial board resumes after a cached-page return and cleans up its own listeners', () => {
  const target = new EventTarget();
  const signals = [];
  const dispose = bindInitialBoardLifecycle(target, (signal) => { signals.push(signal); });
  assert.equal(signals.length, 1);
  target.dispatchEvent(new Event('pagehide'));
  assert.equal(signals[0].aborted, true);
  target.dispatchEvent(new Event('pageshow'));
  assert.equal(signals.length, 1);
  const restored = new Event('pageshow');
  Object.defineProperty(restored, 'persisted', { value: true });
  target.dispatchEvent(restored);
  assert.equal(signals.length, 2);
  assert.equal(signals[1].aborted, false);
  target.dispatchEvent(restored);
  assert.equal(signals.length, 2);
  dispose();
  assert.equal(signals[1].aborted, true);
  target.dispatchEvent(restored);
  assert.equal(signals.length, 2);
});