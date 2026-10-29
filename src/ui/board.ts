import type { GameState } from '../types.js';
interface RenderedCell { button: HTMLButtonElement; digit: HTMLSpanElement; markers: HTMLSpanElement[]; error: HTMLSpanElement }
import { assertBoard, findConflicts } from '../core/board.js';
import { assertLastInputIndex } from '../core/last-input.js';

const renderedBoards = new WeakMap<HTMLElement, RenderedCell[]>();

/** Read-only projection shared by DOM rendering and Node contract tests. */
export function getCellModels(state: GameState) {
  if (!state || typeof state !== 'object') throw new TypeError('Display state is required.');
  const { puzzle, values, notes, selectedIndex, status } = state;
  if (puzzle !== null) assertBoard(puzzle);
  if (values !== null) assertBoard(values);
  if ((puzzle === null) !== (values === null)) throw new TypeError('puzzle and values must be ready together.');
  if (!Array.isArray(notes) || notes.length !== 81) throw new TypeError('81 independent note sets are required.');
  for (let index = 0; index < 81; index++) {
    if (!(notes[index] instanceof Set)) throw new TypeError('Cell notes must be a Set.');
    for (const digit of notes[index]) {
      if (!Number.isInteger(digit) || digit < 1 || digit > 9) throw new TypeError('Notes must contain digits 1 to 9.');
    }
  }
  if (selectedIndex !== null && (!Number.isInteger(selectedIndex) || selectedIndex < 0 || selectedIndex > 80)) {
    throw new RangeError('selectedIndex must be null or an index from 0 to 80.');
  }
  if (!state.assistance || typeof state.assistance.showDigitStock !== 'boolean'
    || typeof state.assistance.highlightMatchingDigits !== 'boolean') throw new TypeError('Assistance requires two booleans.');
  assertLastInputIndex(state);
  const selectedDigit = status === 'playing' && state.assistance.highlightMatchingDigits
    && selectedIndex !== null && values !== null ? values[selectedIndex] : 0;
  const conflicts = values === null ? new Set() : findConflicts(values);
  // Keyboard access must survive a valid null selection without mutating state.
  const firstEmpty = values === null ? -1 : values.indexOf(0);
  const focusIndex = selectedIndex ?? (firstEmpty < 0 ? 0 : firstEmpty);
  return Array.from({ length: 81 }, (_, index) => {
    const row = Math.floor(index / 9), col = index % 9;
    const value = values?.[index] ?? 0;
    const fixed = (puzzle?.[index] ?? 0) !== 0;
    const cellNotes = value === 0 ? [...notes[index]].sort((a, b) => a - b) : [];
    const conflict = conflicts.has(index);
    const labels = [
      (row + 1) + '행 ' + (col + 1) + '열',
      value === 0 ? '빈칸' : '숫자 ' + value,
      fixed ? '고정 단서' : '입력 칸',
    ];
    if (cellNotes.length) labels.push('메모 ' + cellNotes.join(', '));
    if (conflict) labels.push('중복 오류');
    const recent = state.lastInputIndex === index;
    if (recent) labels.push('최근 입력');
    const matching = selectedDigit !== 0 && value === selectedDigit;
    if (matching) labels.push('선택한 숫자와 같음');
    return {
      index, value, fixed, conflict, recent, matching, notes: cellNotes, label: labels.join(', '),
      selected: selectedIndex === index,
      tabIndex: values !== null && status === 'playing' && focusIndex === index ? 0 : -1,
      disabled: values === null || status !== 'playing',
      boxRight: col === 2 || col === 5,
      boxBottom: row === 2 || row === 5,
    };
  });
}

/** Update persistent cells only. Never move focus or modify caller-owned state. */
export function renderBoard(root: HTMLElement, state: GameState): void {
  if (!root || typeof root.append !== 'function' || !root.ownerDocument) throw new TypeError('A board root element is required.');
  const models = getCellModels(state);
  let cells = renderedBoards.get(root);
  if (!cells) {
    if (root.children.length) throw new Error('The initial board mount must be empty.');
    cells = models.map(({ index }) => {
      const button = root.ownerDocument.createElement('button');
      button.type = 'button';
      button.dataset.index = String(index);
      button.className = 'sudoku-cell';
      const digit = root.ownerDocument.createElement('span');
      digit.className = 'cell-digit';
      digit.setAttribute('aria-hidden', 'true');
      const notes = root.ownerDocument.createElement('span');
      notes.className = 'cell-notes';
      notes.setAttribute('aria-hidden', 'true');
      const markers = Array.from({ length: 9 }, () => {
        const marker = root.ownerDocument.createElement('span');
        notes.append(marker);
        return marker;
      });
      const error = root.ownerDocument.createElement('span');
      error.className = 'cell-error';
      error.setAttribute('aria-hidden', 'true');
      error.textContent = '!';
      button.append(digit, notes, error);
      root.append(button);
      return { button, digit, markers, error };
    });
    renderedBoards.set(root, cells);
  }
  root.classList.add('sudoku-board');
  root.setAttribute('aria-busy', String(state.status === 'generating'));
  for (const model of models) {
    const { button, digit, markers, error } = cells[model.index];
    button.setAttribute('aria-label', model.label);
    button.setAttribute('aria-invalid', String(model.conflict));
    button.classList.toggle('is-clue', model.fixed);
    button.classList.toggle('is-empty', model.value === 0);
    button.classList.toggle('is-conflict', model.conflict);
    button.classList.toggle('is-selected', model.selected);
    button.classList.toggle('is-last-input', model.recent);
    button.classList.toggle('is-matching', model.matching);
    button.classList.toggle('box-right', model.boxRight);
    button.classList.toggle('box-bottom', model.boxBottom);
    button.tabIndex = model.tabIndex;
    button.disabled = model.disabled;
    digit.textContent = model.value === 0 ? '' : String(model.value);
    for (let note = 1; note <= 9; note++) markers[note - 1].textContent = model.notes.includes(note) ? String(note) : '';
    error.hidden = !model.conflict;
  }
}