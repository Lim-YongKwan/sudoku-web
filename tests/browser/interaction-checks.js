import { uniquePuzzle, uniqueSolution } from '../fixtures/boards.js';
import { createInitialState } from '../../src/core/game-state.js';
import { mountGame } from '../../src/main.js';
import { bindInput } from '../../src/ui/events.js';

const root = document.querySelector('#interaction-board');
const scope = document.querySelector('#input-scope');
const statusElement = document.querySelector('#interaction-status');
const report = document.querySelector('#interaction-report');
let app, unsubscribe;

function showReport() {
  const state = app.store.getState();
  report.textContent = JSON.stringify({
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
document.querySelector('#load-input').addEventListener('click', () => load());
document.querySelector('#load-complete').addEventListener('click', () => load(true));
document.querySelector('#load-failure').addEventListener('click', () => load(false, true));
window.addEventListener('pagehide', () => { unsubscribe?.(); app?.dispose(); }, { once: true });
load();