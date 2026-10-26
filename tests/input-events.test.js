import test from 'node:test';
import assert from 'node:assert/strict';
import { keyAction, bindInput } from '../src/ui/events.js';

test('board keyboard policy maps arrows, digits and deletion without intercepting Tab', () => {
  assert.deepEqual(keyAction({ key: 'ArrowLeft' }, true), { type: 'MOVE_SELECTION', direction: 'left' });
  for (let digit = 1; digit <= 9; digit++) assert.deepEqual(keyAction({ key: String(digit) }, true), { type: 'ENTER_DIGIT', digit });
  for (const key of ['Backspace', 'Delete']) assert.deepEqual(keyAction({ key }, true), { type: 'CLEAR_CELL' });
  for (const key of ['Tab', '0', 'a', 'Enter', ' ']) assert.equal(keyAction({ key }, true), null);
});

test('external forms and all modifier shortcuts remain native', () => {
  for (const key of ['ArrowUp', 'Backspace', '1']) {
    assert.equal(keyAction({ key }, false), null);
    assert.equal(keyAction({ key }, true, true), null);
    for (const modifier of ['ctrlKey', 'metaKey', 'altKey', 'shiftKey', 'isComposing', 'defaultPrevented']) {
      assert.equal(keyAction({ key, [modifier]: true }, true), null);
    }
  }
});
// EventTarget boundary double: this tests routing/listener ownership, not DOM or touch.
class InputScope extends EventTarget {
  constructor() {
    super();
    this.cell = { dataset: { index: '2' }, disabled: false };
    this.focuses = 0;
  }
  closest(selector) { return selector.startsWith('.sudoku-cell') ? this.cell : null; }
  contains(node) { return node === this.cell; }
  querySelector() { return { focus: () => { this.focuses++; } }; }
  key(value) {
    const event = new Event('keydown', { cancelable: true });
    Object.defineProperty(event, 'key', { value });
    this.dispatchEvent(event);
    return event;
  }
}

test('keyboard input selects the actually focused cell before applying an action', () => {
  const scope = new InputScope(), actions = [];
  const unbind = bindInput(scope, (action) => actions.push(action));
  scope.key('4');
  assert.deepEqual(actions, [
    { type: 'SELECT_CELL', index: 2 }, { type: 'ENTER_DIGIT', digit: 4 },
  ]);
  assert.equal(scope.focuses, 1);
  unbind();
});

test('an old unbind cannot remove ownership of a newer binding', () => {
  const scope = new InputScope(), actions = [];
  const dispatch = (action) => actions.push(action);
  const old = bindInput(scope, dispatch);
  old();
  const current = bindInput(scope, dispatch);
  old();
  assert.equal(bindInput(scope, dispatch), current);
  scope.key('1');
  assert.equal(actions.filter((action) => action.type === 'ENTER_DIGIT').length, 1);
  current();
  const count = actions.length;
  scope.key('2');
  assert.equal(actions.length, count);
});