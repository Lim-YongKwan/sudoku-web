import { formatElapsed } from '../utils/time.js';

const labels = { easy: '쉬움', normal: '보통', hard: '어려움' };

/** Owns only controls/dialog listeners. Board input is owned by events.js. */
export function bindControls(scope, dispatch, newGame) {
  const select = scope.querySelector('[data-difficulty]');
  const restart = scope.querySelector('[data-new-game]');
  const timer = scope.querySelector('[data-elapsed]');
  const active = scope.querySelector('[data-active-difficulty]');
  const dialog = scope.querySelector('[data-completion-dialog]');
  const close = scope.querySelector('[data-close-dialog]');
  const result = scope.querySelector('[data-completion-time]');
  let disposed = false, completionOpen = false;
  const change = () => dispatch({ type: 'SET_DIFFICULTY', difficulty: select.value });
  const start = () => { void newGame(); };
  const dismiss = () => {
    if (disposed || !completionOpen) return;
    completionOpen = false;
    dispatch({ type: 'CLOSE_COMPLETION_DIALOG' });
    restart?.focus({ preventScroll: true });
  };
  const cancel = (event) => { event.preventDefault(); dismiss(); };
  const nativeClose = () => {
    // A delayed close event from an older dialog must not close a newly opened one.
    if (!dialog.open) dismiss();
  };
  select?.addEventListener('change', change);
  restart?.addEventListener('click', start);
  close?.addEventListener('click', dismiss);
  dialog?.addEventListener('cancel', cancel);
  dialog?.addEventListener('close', nativeClose);
  const renderElapsed = (seconds) => {
    const text = formatElapsed(seconds);
    if (timer && timer.textContent !== text) timer.textContent = text;
    if (result) result.textContent = text;
  };
  const render = (state, seconds) => {
    if (disposed) return;
    completionOpen = state.completionDialogOpen;
    if (select) select.value = state.selectedDifficulty;
    if (restart) restart.textContent = state.status === 'error' ? '다시 시도' : '새 게임';
    if (active) active.textContent = state.activeDifficulty ? labels[state.activeDifficulty] : '준비 중';
    renderElapsed(seconds);
    if (dialog) {
      if (state.completionDialogOpen && !dialog.open) {
        dialog.showModal();
        close?.focus();
      } else if (!state.completionDialogOpen && dialog.open) dialog.close();
    }
  };
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    select?.removeEventListener('change', change);
    restart?.removeEventListener('click', start);
    close?.removeEventListener('click', dismiss);
    dialog?.removeEventListener('cancel', cancel);
    dialog?.removeEventListener('close', nativeClose);
    if (dialog?.open) dialog.close();
  };
  return { render, renderElapsed, dispose };
}