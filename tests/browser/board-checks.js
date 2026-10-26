import { layoutChecks, allChecksPass } from './board-assertions.js';
import { uniquePuzzle } from '../fixtures/boards.js';
import { createDisplayState, showInitialBoard } from '../../src/main.js';
import { renderBoard } from '../../src/ui/board.js';

const root = document.querySelector('#fixture-board');
const report = document.querySelector('#fixture-report');
const status = document.querySelector('#fixture-status');
const state = createDisplayState(uniquePuzzle);
state.notes[2] = new Set([9, 1, 4]);
const snapshot = () => JSON.stringify({
  ...state, notes: state.notes.map((notes) => [...notes]),
});
const original = snapshot();

function layoutFacts() {
  const cell = root.children[0].getBoundingClientRect();
  const boxRight = getComputedStyle(root.children[2]);
  const boxBottom = getComputedStyle(root.children[18]);
  return {
    viewport: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    cellWidth: cell.width, cellHeight: cell.height,
    boxRightWidth: boxRight.borderRightWidth,
    boxBottomWidth: boxBottom.borderBottomWidth,
  };
}

function restore() {
  renderBoard(root, state);
  status.textContent = '고정 fixture 표시 · 실제 생성 퍼즐과 구분';
  status.dataset.state = 'ready';
  delete report.dataset.result;
  report.textContent = 'fixture 준비 완료\n' + JSON.stringify(layoutFacts(), null, 2);
}
restore();

document.querySelector('#rerender-check').addEventListener('click', () => {
  restore();
  const before = [...root.children];
  const cell = before[2];
  cell.focus();
  renderBoard(root, state);
  const facts = layoutFacts();
  const checks = {
    cells81: root.children.length === 81,
    sameNodes: before.every((node, index) => node === root.children[index]),
    focusPreserved: document.activeElement === cell,
    stateUnchanged: snapshot() === original,
    clueLabel: before[0].getAttribute('aria-label') === '1행 1열, 숫자 5, 고정 단서',
    blankNotesLabel: cell.getAttribute('aria-label') === '1행 3열, 빈칸, 입력 칸, 메모 1, 4, 9',
    oneTabStop: before.filter((node) => node.tabIndex === 0).length === 1,
    ...layoutChecks(facts),
  };
  report.textContent = JSON.stringify({ facts, checks }, null, 2);
  report.dataset.result = allChecksPass(checks) ? 'pass' : 'fail';
});

document.querySelector('#failure-check').addEventListener('click', async () => {
  await showInitialBoard({
    root, statusElement: status,
    generate: async () => ({ status: 'failed', reason: 'attempts-exhausted', stats: { attempts: 8, totalNodes: 0, elapsedMs: 0 } }),
  });
  const passed = status.dataset.state === 'error' && [...root.children].every((cell) => cell.disabled)
    && [...root.querySelectorAll('.cell-digit')].every((cell) => cell.textContent === '');
  report.textContent = '의도한 실패 결과 주입: ' + (passed ? 'PASS' : 'FAIL');
  report.dataset.result = passed ? 'pass' : 'fail';
});
document.querySelector('#restore-fixture').addEventListener('click', restore);