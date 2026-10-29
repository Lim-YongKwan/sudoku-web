import { createTypographyState } from '../.build/tests/browser/typography-state.js';
import { getCellModels } from '../.build/src/ui/board.js';
import { isComplete, isValidBoard } from '../.build/src/core/board.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { typographyChecks } from './browser/typography-assertions.js';
import { allChecksPass } from './browser/board-assertions.js';

const facts = (mode = 'playing') => ({
  mode, digitCount: mode === 'completed' ? 81 : mode === 'generating' ? 0 : 18,
  noteCount: mode === 'playing' || mode === 'conflict' ? 9 : 0, textWithinCells: true, expectedLock: true,
  pairs: mode === 'generating' ? [] : Array.from({length: 9}, (_, index) => ({
    clueDigit: String(index + 1), entryDigit: String(index + 1), clueFont: 'Local rounded', entryFont: 'Local rounded',
    clueSize: 20, entrySize: 20, clueLineHeight: 20, entryLineHeight: 20,
    clueWeight: 700, entryWeight: 600, clueAlign: 'center', entryAlign: 'center',
    clueBackground: 'rgb(237, 241, 233)', entryBackground: 'rgb(255, 255, 255)',
  })),
});
test('typography measurements accept each populated or empty presentation mode', () => {
  for (const mode of ['playing', 'conflict', 'generating', 'completed']) assert.equal(allChecksPass(typographyChecks(facts(mode))), true);
});
test('typography measurements reject lost clue backgrounds including completed boards', () => {
  for (const mode of ['playing', 'completed']) {
    const sample = facts(mode); sample.pairs[0].clueBackground = sample.pairs[0].entryBackground;
    assert.equal(typographyChecks(sample).clueBackgroundDistinct, false);
  }
});
test('empty, mismatched and incomplete digit samples cannot pass typography checks', () => {
  for (const mutate of [s => s.pairs = [], s => s.pairs.pop(), s => s.pairs[0].entryDigit = '2', s => s.digitCount = 0, s => s.noteCount = 0]) {
    const sample = facts(); mutate(sample); assert.equal(allChecksPass(typographyChecks(sample)), false);
  }
});
test('typography measurements reject inconsistent fonts, alignment and unreadable weights', () => {
  for (const override of [{entryFont:''},{entryFont:'Other font'},{entrySize:0},{entrySize:NaN},{entryLineHeight:0},{entryAlign:'start'},{entryWeight:400},{clueWeight:900}]) {
    const sample = facts(); Object.assign(sample.pairs[0],override); assert.equal(allChecksPass(typographyChecks(sample)),false);
  }
});
test('clipping, lock failure and unknown presentation modes remain failures', () => {
  for (const override of [{textWithinCells:false},{expectedLock:false},{mode:'unknown'}]) assert.equal(allChecksPass(typographyChecks({...facts(),...override})),false);
});
test('actual specimen keeps all nine comparison pairs and a valid complete board', () => {
  for (const mode of ['playing','conflict','completed']) {
    const state = createTypographyState(mode), cells = getCellModels(state);
    for (let digit = 1; digit <= 9; digit++) {
      assert.ok(cells.some(cell => cell.fixed && cell.value === digit));
      assert.ok(cells.some(cell => !cell.fixed && cell.value === digit));
    }
    assert.equal(isValidBoard(state.values), mode !== 'conflict');
    assert.equal(isComplete(state.values,state.puzzle), mode === 'completed');
    assert.equal(cells.filter(cell=>cell.notes.length===9).length,mode==='completed'?0:1);
  }
  assert.ok(getCellModels(createTypographyState('generating')).every(cell=>cell.value===0&&cell.disabled));
  const first=createTypographyState('playing'); first.values[9]=9;
  assert.equal(createTypographyState('playing').values[9],4);
  assert.throws(()=>createTypographyState('unknown'),RangeError);
});
