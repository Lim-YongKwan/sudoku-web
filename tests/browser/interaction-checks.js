import { uniquePuzzle, uniqueSolution } from '../fixtures/boards.js';
import { createInitialState } from '../../src/core/game-state.js';
import { mountGame } from '../../src/main.js';
import { bindInput } from '../../src/ui/events.js';
import { lastInputChecks } from './last-input-assertions.js';
import { matchingChecks } from './matching-assertions.js';

const root = document.querySelector('#interaction-board');
const scope = document.querySelector('#input-scope');
const statusElement = document.querySelector('#interaction-status');
const report = document.querySelector('#interaction-report');
let app, unsubscribe;

function showReport() {
  const state = app.store.getState();
  const cells = [...root.children].map(cell => {
    const digit = cell.querySelector('.cell-digit');
    const style = getComputedStyle(digit);
    const rect = digit.getBoundingClientRect();
    return { matching: cell.classList.contains('is-matching'), index: Number(cell.dataset.index), recent: cell.classList.contains('is-last-input'),
      fixed: cell.classList.contains('is-clue'), disabled: cell.disabled, digit: digit.textContent,
      label: cell.getAttribute('aria-label'),
      underline: style.textDecorationLine.split(' ').includes('underline'),
      thickness: Number.parseFloat(style.textDecorationThickness),
      visible: style.visibility === 'visible' && style.display !== 'none' && rect.width > 0 && rect.height > 0 };
  });
  const matchingToggle = scope.querySelector('[data-highlight-matching-digits]');
  const selectedDigit = state.status === 'playing' && state.assistance.highlightMatchingDigits
    && state.selectedIndex !== null ? state.values?.[state.selectedIndex] ?? 0 : 0;
  const expectedIndices = selectedDigit ? state.values.flatMap((digit, index) => digit === selectedDigit ? [index] : []) : [];
  const checks = {
    ...lastInputChecks({ expectedIndex: state.lastInputIndex, cells,
      viewport: window.innerWidth, scrollWidth: document.documentElement.scrollWidth }),
    ...matchingChecks({ expectedIndices, cells, toggle: {
      count: scope.querySelectorAll('[data-highlight-matching-digits]').length,
      checked: matchingToggle?.checked, disabled: matchingToggle?.disabled,
      labeled: (matchingToggle?.labels?.length ?? 0) > 0,
      enabled: state.assistance.highlightMatchingDigits, playing: state.status === 'playing',
    } }),
  };
  report.dataset.result = Object.values(checks).every(Boolean) ? 'pass' : 'fail';
  report.textContent = JSON.stringify({
    checks,
    assistance: state.assistance,
    matchingIndices: [...root.querySelectorAll('.is-matching')].map(cell => Number(cell.dataset.index)),
    lastInputIndex: state.lastInputIndex,
    recentCells: [...root.querySelectorAll('.is-last-input')].map((cell) => ({ index: Number(cell.dataset.index), label: cell.getAttribute('aria-label') })),
    status: state.status, selectedIndex: state.selectedIndex, noteMode: state.noteMode,
    values: state.values, notes: state.notes.map((notes) => [...notes]),
    noteSetsIndependent: new Set(state.notes).size === 81,
    timer: state.timer, completionDialogOpen: state.completionDialogOpen,
    tabStops: [...root.children].filter((cell) => cell.tabIndex === 0).length,
  }, null, 2);
}
function load(nearComplete = false, fail = false) {
  unsubscribe?.();
  app?.dispose();
  const initial = {
    ...createInitialState(), status: 'playing', puzzle: uniquePuzzle.slice(),
    values: (nearComplete ? uniqueSolution : uniquePuzzle).slice(),
    selectedIndex: 2, activeDifficulty: 'easy', requestId: 1,
    timer: { startedAtMs: 0, stoppedAtMs: null },
  };
  if (nearComplete) initial.values[2] = 0;
  app = mountGame({
    root, scope, statusElement, initialState: fail ? undefined : initial,
    generate: async () => ({ status: 'failed', reason: 'attempts-exhausted' }),
  });
  // Rebinding the same scope must not double-register handlers.
  bindInput(scope, app.dispatch);
  unsubscribe = app.store.subscribe(showReport);
  showReport();
  void app.ready.then(showReport);
}
document.querySelector('#refresh-report').addEventListener('click', showReport);
window.addEventListener('resize', showReport);
document.querySelector('#load-input').addEventListener('click', () => load());
document.querySelector('#load-complete').addEventListener('click', () => load(true));
document.querySelector('#load-failure').addEventListener('click', () => load(false, true));
window.addEventListener('pagehide', () => { unsubscribe?.(); app?.dispose(); }, { once: true });
load();