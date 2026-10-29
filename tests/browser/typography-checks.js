import { createTypographyState } from './typography-state.js';
import { renderBoard } from '../../src/ui/board.js';
import { allChecksPass, layoutChecks } from './board-assertions.js';
import { typographyChecks } from './typography-assertions.js';

const root = document.querySelector('#typography-board');
const report = document.querySelector('#report');
const pad = document.querySelector('.number-pad');
let mode = 'playing';
for (let digit = 1; digit <= 9; digit++) {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = String(digit);
  button.setAttribute('aria-label', digit + ' 글꼴 비교 전용');
  pad.append(button);
}

function show(nextMode) {
  mode = nextMode;
  const state = createTypographyState(mode);
  renderBoard(root, state);
  // Renderer fixture only: this does not exercise completion detection in the store.
  for (const button of pad.children) button.disabled = mode === 'generating' || mode === 'completed';
  report.removeAttribute('data-result');
  report.textContent = mode + ': 실측 검사 버튼을 누르고 육안으로도 확인하세요.';
}

function pairFacts(clue, entry) {
  const a = getComputedStyle(clue.querySelector('.cell-digit'));
  const b = getComputedStyle(entry.querySelector('.cell-digit'));
  const x = getComputedStyle(clue), y = getComputedStyle(entry);
  return {
    clueDigit: clue.querySelector('.cell-digit').textContent, entryDigit: entry.querySelector('.cell-digit').textContent,
    clueFont: a.fontFamily, entryFont: b.fontFamily,
    clueSize: parseFloat(a.fontSize), entrySize: parseFloat(b.fontSize),
    clueLineHeight: parseFloat(a.lineHeight), entryLineHeight: parseFloat(b.lineHeight),
    clueWeight: Number(a.fontWeight), entryWeight: Number(b.fontWeight),
    clueAlign: x.placeItems, entryAlign: y.placeItems,
    clueBackground: x.backgroundColor, entryBackground: y.backgroundColor,
  };
}

async function measure() {
  await document.fonts.ready;
  const cells = [...root.children];
  const sample = cells[0].getBoundingClientRect();
  const facts = {
    viewport: innerWidth, scrollWidth: document.documentElement.scrollWidth,
    cellWidth: sample.width, cellHeight: sample.height,
    boxRightWidth: getComputedStyle(cells[2]).borderRightWidth,
    boxBottomWidth: getComputedStyle(cells[18]).borderBottomWidth,
  };
  const digits = [...root.querySelectorAll('.cell-digit')].filter(node => node.textContent);
  const notes = [...root.querySelectorAll('.cell-notes span')].filter(node => node.textContent);
  const visibleText = [...digits, ...notes, ...root.querySelectorAll('.cell-error:not([hidden])')];
  const fits = visibleText.every(node => {
    const box = node.closest('.sudoku-cell').getBoundingClientRect();
    const range = document.createRange();
    range.selectNodeContents(node);
    const text = range.getBoundingClientRect();
    return text.left >= box.left - 1 && text.right <= box.right + 1 && text.top >= box.top - 1 && text.bottom <= box.bottom + 1;
  });
  const pairs = [];
  if (mode !== 'generating') {
    for (let digit = 1; digit <= 9; digit++) {
      const entry = cells.find(cell => !cell.classList.contains('is-clue') && cell.querySelector('.cell-digit').textContent === String(digit));
      if (entry) pairs.push(pairFacts(cells[digit - 1], entry));
    }
  }
  const measurements = {
    mode, pairs, digitCount: digits.length, noteCount: notes.length, textWithinCells: fits,
    expectedLock: cells.length === 81 && cells.every(cell => cell.disabled === (mode === 'generating' || mode === 'completed'))
      && [...pad.children].every(button => button.disabled === (mode === 'generating' || mode === 'completed')),
  };
  const checks = { ...layoutChecks(facts), ...typographyChecks(measurements) };
  report.dataset.result = allChecksPass(checks) ? 'pass' : 'fail';
  report.textContent = JSON.stringify({ facts, measurements, checks, note: 'CSS 스택은 실제 렌더링 글꼴의 증거가 아닙니다. 개발 도구의 Rendered Fonts/Fonts에서 별도로 기록하세요.' }, null, 2);
}
document.querySelectorAll('[data-mode]').forEach(button => button.addEventListener('click', () => show(button.dataset.mode)));
document.querySelector('#measure').addEventListener('click', measure);
show('playing');
