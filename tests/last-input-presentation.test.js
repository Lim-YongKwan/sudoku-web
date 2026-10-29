import test from 'node:test';
import assert from 'node:assert/strict';
import { lastInputChecks } from './browser/last-input-assertions.js';
function facts(expectedIndex = 2) {
  return { expectedIndex, viewport: 320, scrollWidth: 320,
    cells: Array.from({ length: 81 }, (_, index) => ({ index, recent: index === expectedIndex,
      label: '입력 칸' + (index === expectedIndex ? ', 최근 입력' : ''),
      fixed: false, disabled: false, digit: index === expectedIndex ? '4' : '',
      visible: true, underline: true, thickness: 2 })) };
}
const passes = value => Object.values(lastInputChecks(value)).every(Boolean);
test('measured recent marker and cleared/completed board facts pass independently', () => {
  assert.ok(passes(facts()));
  const complete = facts(null); complete.cells.forEach(cell => { cell.disabled = true; });
  assert.ok(passes(complete));
});
test('presentation checks reject absent/duplicate/stale markers and missing cells', () => {
  for (const change of [f => { f.cells[2].recent = false; }, f => { f.cells[3].recent = true; },
    f => { f.expectedIndex = 3; }, f => { f.cells.pop(); }]) { const f = facts(); change(f); assert.equal(passes(f), false); }
});
test('presentation checks reject missing underline/accessibility, hidden or locked clue markers', () => {
  for (const change of [c => { c.underline = false; }, c => { c.thickness = NaN; },
    c => { c.label = '입력 칸'; }, c => { c.visible = false; }, c => { c.fixed = true; },
    c => { c.disabled = true; }, c => { c.digit = ''; }]) {
    const f = facts(); change(f.cells[2]); assert.equal(passes(f), false);
  }
});
test('presentation checks reject viewport overflow and stale accessible marker after clearing', () => {
  const f = facts(); f.scrollWidth = 321; assert.equal(lastInputChecks(f).noHorizontalOverflow, false);
  const cleared = facts(null); cleared.cells[2].label += ', 최근 입력';
  assert.equal(lastInputChecks(cleared).accessibleMarker, false);
});
