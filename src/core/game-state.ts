import type { Action, GameState, GameStore, Listener } from '../types.js';
import { assertBoard, isValidBoard, isComplete } from './board.js';
import { assertLastInputIndex } from './last-input.js';
import { DIFFICULTY_BLANKS } from './generator.js';

const emptyNotes = () => Array.from({ length: 81 }, () => new Set<number>());
const emptyTimer = () => ({ startedAtMs: null, stoppedAtMs: null });

export function createInitialState(): GameState {
  return {
    status: 'idle', puzzle: null, values: null, notes: emptyNotes(),
    selectedIndex: null, lastInputIndex: null, noteMode: false, selectedDifficulty: 'easy',
    activeDifficulty: null, requestId: 0, timer: emptyTimer(),
    completionDialogOpen: false, error: null,
    assistance: { showDigitStock: false, highlightMatchingDigits: false },
  };
}

function integer(value: number, name: string, max: number): void {
  if (typeof value !== 'number') throw new TypeError(name + ' must be a number.');
  if (!Number.isSafeInteger(value) || value < 0 || value > max) throw new RangeError(name + ' out of range.');
}
function difficulty(value: string): void {
  if (typeof value !== 'string') throw new TypeError('difficulty must be a string.');
  if (!Object.hasOwn(DIFFICULTY_BLANKS, value)) throw new RangeError('Unknown difficulty.');
}
function time(value: number): void {
  if (typeof value !== 'number') throw new TypeError('nowMs must be a number.');
  if (!Number.isFinite(value) || value < 0) throw new RangeError('nowMs must be finite and nonnegative.');
}
function validateAction(action: Action): void {
  if (!action || typeof action.type !== 'string') throw new TypeError('Action type is required.');
  switch (action.type) {
    case 'SET_ASSISTANCE':
      if (!['showDigitStock', 'highlightMatchingDigits'].includes(action.option) || typeof action.enabled !== 'boolean') {
        throw new TypeError('Assistance requires a known option and boolean enabled.');
      }
      break;
    case 'SET_DIFFICULTY': difficulty(action.difficulty); break;
    case 'NEW_GAME_REQUESTED':
      integer(action.requestId, 'requestId', Number.MAX_SAFE_INTEGER); difficulty(action.difficulty); break;
    case 'GENERATION_SUCCEEDED':
      integer(action.requestId, 'requestId', Number.MAX_SAFE_INTEGER);
      difficulty(action.difficulty); assertBoard(action.puzzle); time(action.nowMs);
      if (!isValidBoard(action.puzzle) || action.puzzle.filter((n) => n === 0).length !== DIFFICULTY_BLANKS[action.difficulty]) {
        throw new RangeError('Generated puzzle does not match the difficulty contract.');
      }
      break;
    case 'GENERATION_FAILED':
      integer(action.requestId, 'requestId', Number.MAX_SAFE_INTEGER);
      if (typeof action.code !== 'string' || typeof action.message !== 'string') throw new TypeError('Failure code/message must be strings.');
      break;
    case 'SELECT_CELL': integer(action.index, 'index', 80); break;
    case 'MOVE_SELECTION':
      if (!['up', 'down', 'left', 'right'].includes(action.direction)) throw new RangeError('Unknown direction.');
      break;
    case 'ENTER_DIGIT':
      integer(action.digit, 'digit', 9);
      if (action.digit === 0) throw new RangeError('digit must be 1 to 9.');
      break;
    case 'GAME_COMPLETED': time(action.nowMs); break;
    case 'CLEAR_CELL': case 'TOGGLE_NOTE_MODE': case 'CLOSE_COMPLETION_DIALOG': break;
    default: throw new TypeError('Unknown action type.');
  }
}

export function reduceGame(state: GameState, action: Action): GameState {
  validateAction(action);
  switch (action.type) {
    case 'SET_DIFFICULTY':
      return state.selectedDifficulty === action.difficulty ? state : { ...state, selectedDifficulty: action.difficulty };
    case 'NEW_GAME_REQUESTED':
      if (action.requestId <= state.requestId) return state;
      return {
        ...createInitialState(), status: 'generating', requestId: action.requestId,
        selectedDifficulty: state.selectedDifficulty, activeDifficulty: action.difficulty,
      };
    case 'GENERATION_SUCCEEDED':
      if (state.status !== 'generating' || action.requestId !== state.requestId || action.difficulty !== state.activeDifficulty) return state;
      return {
        ...state, status: 'playing', puzzle: action.puzzle.slice(), values: action.puzzle.slice(),
        selectedIndex: action.puzzle.indexOf(0), lastInputIndex: null, notes: emptyNotes(), noteMode: false,
        timer: { startedAtMs: action.nowMs, stoppedAtMs: null }, error: null,
      };
    case 'GENERATION_FAILED':
      if (state.status !== 'generating' || action.requestId !== state.requestId) return state;
      return {
        ...state, status: 'error', puzzle: null, values: null, lastInputIndex: null, timer: emptyTimer(),
        error: { code: action.code, message: action.message },
      };
    case 'GAME_COMPLETED':
      if (state.status !== 'playing' || !state.values || !state.puzzle || !isComplete(state.values, state.puzzle)) return state;
      if (state.timer.startedAtMs === null || action.nowMs < state.timer.startedAtMs) throw new RangeError('Completion time cannot precede start.');
      return { ...state, status: 'completed', lastInputIndex: null, timer: { ...state.timer, stoppedAtMs: action.nowMs }, completionDialogOpen: true };
    case 'CLOSE_COMPLETION_DIALOG':
      return state.status === 'completed' && state.completionDialogOpen ? { ...state, completionDialogOpen: false } : state;
  }
  if (state.status !== 'playing') return state;
  if (!state.puzzle || !state.values) throw new TypeError('Playing state requires puzzle and values.');
  if (action.type === 'SET_ASSISTANCE') {
    return state.assistance[action.option] === action.enabled ? state
      : { ...state, assistance: { ...state.assistance, [action.option]: action.enabled } };
  }
  if (action.type === 'SELECT_CELL') return state.selectedIndex === action.index ? state : { ...state, selectedIndex: action.index };
  if (action.type === 'MOVE_SELECTION') {
    if (state.selectedIndex === null) return { ...state, selectedIndex: state.puzzle.indexOf(0) };
    const index = state.selectedIndex, row = Math.floor(index / 9), col = index % 9;
    const next = {
      up: row === 0 ? index : index - 9, down: row === 8 ? index : index + 9,
      left: col === 0 ? index : index - 1, right: col === 8 ? index : index + 1,
    }[action.direction];
    return next === index ? state : { ...state, selectedIndex: next };
  }
  if (action.type === 'TOGGLE_NOTE_MODE') return { ...state, noteMode: !state.noteMode };
  const index = state.selectedIndex;
  if (index === null || state.puzzle[index] !== 0) return state;
  const notes = state.notes.slice();
  if (action.type === 'ENTER_DIGIT' && state.noteMode) {
    if (state.values[index] !== 0) return state;
    const cellNotes = new Set(notes[index]);
    if (cellNotes.has(action.digit)) cellNotes.delete(action.digit);
    else cellNotes.add(action.digit);
    notes[index] = cellNotes;
    return { ...state, notes };
  }
  if (action.type !== 'CLEAR_CELL' && action.type !== 'ENTER_DIGIT') return state;
  const digit = action.type === 'CLEAR_CELL' ? 0 : action.digit;
  if (state.values[index] === digit && state.notes[index].size === 0) return state;
  const values = state.values.slice();
  values[index] = digit; notes[index] = new Set<number>();
  const lastInputIndex = state.values[index] === digit ? state.lastInputIndex
    : digit !== 0 ? index : state.lastInputIndex === index ? null : state.lastInputIndex;
  return { ...state, values, notes, lastInputIndex };
}

/** getState returns a read-only view by contract; subscribers must never mutate it. */
export function createGameStore(initialState: GameState = createInitialState()): GameStore {
  if (!initialState || !Array.isArray(initialState.notes) || initialState.notes.length !== 81) throw new TypeError('Invalid initial state.');
  if (!initialState.assistance || typeof initialState.assistance.showDigitStock !== 'boolean'
    || typeof initialState.assistance.highlightMatchingDigits !== 'boolean') {
    throw new TypeError('Initial assistance requires two booleans.');
  }
  for (let index = 0; index < 81; index++) {
    const notes = initialState.notes[index];
    if (!Object.hasOwn(initialState.notes, index) || !(notes instanceof Set)) throw new TypeError('Initial notes must be dense Sets.');
    for (const digit of notes) {
      if (!Number.isInteger(digit) || digit < 1 || digit > 9) throw new TypeError('Initial notes must contain digits 1 to 9.');
    }
  }
  if (initialState.puzzle !== null) assertBoard(initialState.puzzle);
  if (initialState.values !== null) assertBoard(initialState.values);
  assertLastInputIndex(initialState);
  let state: GameState = {
    ...initialState, assistance: { ...initialState.assistance }, puzzle: initialState.puzzle?.slice() ?? null, values: initialState.values?.slice() ?? null,
    notes: initialState.notes.map((notes) => new Set(notes)), timer: { ...initialState.timer },
    error: initialState.error ? { ...initialState.error } : null,
  };
  const listeners = new Map<object, Listener>();
  const pending: Action[] = [];
  let dispatching = false;
  const store: GameStore = {
    getState: () => state,
    dispatch(action) {
      // Queue subscriber dispatches so every observer sees each transition in order.
      pending.push(action);
      if (dispatching) return state;
      dispatching = true;
      try {
        while (pending.length) {
          const action = pending.shift();
          if (action === undefined) throw new TypeError('Action type is required.');
          const next = reduceGame(state, action);
          if (next === state) continue;
          state = next;
          for (const [token, listener] of [...listeners]) if (listeners.has(token)) listener(state);
        }
      } catch (error) { pending.length = 0; throw error; }
      finally { dispatching = false; }
      return state;
    },
    subscribe(listener) {
      if (typeof listener !== 'function') throw new TypeError('Listener must be a function.');
      const token = {};
      listeners.set(token, listener);
      return () => { listeners.delete(token); };
    },
  };
  return store;
}