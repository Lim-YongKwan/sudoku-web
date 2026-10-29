import type { Action, Direction } from '../types.js';
const bindings = new WeakMap<HTMLElement, () => void>();

/** Pure keyboard policy: only board buttons own game keys. */
export function keyAction(event: Pick<KeyboardEvent, 'key' | 'defaultPrevented' | 'isComposing' | 'ctrlKey' | 'metaKey' | 'altKey' | 'shiftKey'>, onBoard: boolean, inForm = false): Action | null {
  if (!onBoard || inForm || event.defaultPrevented || event.isComposing
    || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return null;
  const directions: Partial<Record<string, Direction>> = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' };
  const direction = directions[event.key];
  if (direction) return { type: 'MOVE_SELECTION', direction };
  if (/^[1-9]$/.test(event.key)) return { type: 'ENTER_DIGIT', digit: Number(event.key) };
  if (event.key === 'Backspace' || event.key === 'Delete') return { type: 'CLEAR_CELL' };
  return null;
}

/** Delegated click handles mouse, native touch clicks and button keyboard activation once. */
export function bindInput(root: HTMLElement, dispatch: (action: Action) => void): () => void {
  const existing = bindings.get(root);
  if (existing) return existing;
  const cellFrom = (target: EventTarget | null) => closestButton(target, '.sudoku-cell[data-index]');
  const formFrom = (target: EventTarget | null) => Boolean(closest(target, 'input, select, textarea, [contenteditable]:not([contenteditable="false"]), [role="textbox"]'));
  const focusSelected = () => root.querySelector<HTMLButtonElement>('.sudoku-cell[tabindex="0"]')?.focus({ preventScroll: true });
  const onClick = (event: MouseEvent) => {
    const cell = cellFrom(event.target);
    if (cell && root.contains(cell)) {
      if (!cell.disabled) dispatch({ type: 'SELECT_CELL', index: Number(cell.dataset.index) });
      focusSelected();
      return;
    }
    const control = closestButton(event.target, '[data-digit], [data-input-action]');
    if (!control || !root.contains(control) || control.disabled) return;
    if (control.hasAttribute('data-digit')) dispatch({ type: 'ENTER_DIGIT', digit: Number(control.dataset.digit) });
    else if (control.dataset.inputAction === 'clear') dispatch({ type: 'CLEAR_CELL' });
    else if (control.dataset.inputAction === 'notes') dispatch({ type: 'TOGGLE_NOTE_MODE' });
    focusSelected();
  };
  const onKey = (event: KeyboardEvent) => {
    const cell = cellFrom(event.target);
    const action = keyAction(event, Boolean(cell && root.contains(cell) && !cell.disabled), formFrom(event.target));
    if (!action || !cell) return;
    event.preventDefault();
    dispatch({ type: 'SELECT_CELL', index: Number(cell.dataset.index) });
    dispatch(action);
    focusSelected();
  };
  root.addEventListener('click', onClick);
  root.addEventListener('keydown', onKey);
  let bound = true;
  const unbind = () => {
    if (!bound) return;
    bound = false;
    root.removeEventListener('click', onClick);
    root.removeEventListener('keydown', onKey);
    if (bindings.get(root) === unbind) bindings.delete(root);
  };
  bindings.set(root, unbind);
  return unbind;
}
/** Structural guard also supports EventTarget doubles; no global Element dependency. */
function closest(target: EventTarget | null, selector: string): unknown {
  if (target && 'closest' in target && typeof target.closest === 'function') return target.closest(selector);
  return null;
}
function closestButton(target: EventTarget | null, selector: string): HTMLButtonElement | null {
  const node = closest(target, selector);
  if (!node || typeof node !== 'object' || !('disabled' in node) || typeof node.disabled !== 'boolean'
    || !('dataset' in node) || !node.dataset || typeof node.dataset !== 'object') return null;
  // Owned selectors resolve buttons; checked properties are the event router's required boundary.
  return node as HTMLButtonElement;
}
