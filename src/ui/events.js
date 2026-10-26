const bindings = new WeakMap();

/** Pure keyboard policy: only board buttons own game keys. */
export function keyAction(event, onBoard, inForm = false) {
  if (!onBoard || inForm || event.defaultPrevented || event.isComposing
    || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return null;
  const direction = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' }[event.key];
  if (direction) return { type: 'MOVE_SELECTION', direction };
  if (/^[1-9]$/.test(event.key)) return { type: 'ENTER_DIGIT', digit: Number(event.key) };
  if (event.key === 'Backspace' || event.key === 'Delete') return { type: 'CLEAR_CELL' };
  return null;
}

/** Delegated click handles mouse, native touch clicks and button keyboard activation once. */
export function bindInput(root, dispatch) {
  if (bindings.has(root)) return bindings.get(root);
  const cellFrom = (target) => target?.closest?.('.sudoku-cell[data-index]');
  const formFrom = (target) => Boolean(target?.closest?.('input, select, textarea, [contenteditable]:not([contenteditable="false"]), [role="textbox"]'));
  const focusSelected = () => root.querySelector('.sudoku-cell[tabindex="0"]')?.focus({ preventScroll: true });
  const onClick = (event) => {
    const cell = cellFrom(event.target);
    if (cell && root.contains(cell)) {
      if (!cell.disabled) dispatch({ type: 'SELECT_CELL', index: Number(cell.dataset.index) });
      focusSelected();
      return;
    }
    const control = event.target?.closest?.('[data-digit], [data-input-action]');
    if (!control || !root.contains(control) || control.disabled) return;
    if (control.hasAttribute('data-digit')) dispatch({ type: 'ENTER_DIGIT', digit: Number(control.dataset.digit) });
    else if (control.dataset.inputAction === 'clear') dispatch({ type: 'CLEAR_CELL' });
    else if (control.dataset.inputAction === 'notes') dispatch({ type: 'TOGGLE_NOTE_MODE' });
    focusSelected();
  };
  const onKey = (event) => {
    const cell = cellFrom(event.target);
    const action = keyAction(event, Boolean(cell && root.contains(cell) && !cell.disabled), formFrom(event.target));
    if (!action) return;
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