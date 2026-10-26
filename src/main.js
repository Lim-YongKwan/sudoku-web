import { createGameStore } from './core/game-state.js';
import { bindInput } from './ui/events.js';
import { bindControls } from './ui/controls.js';
import { getElapsedSeconds } from './utils/time.js';
import { generatePuzzle } from './core/generator.js';
import { assertBoard, isValidBoard, isComplete, findConflicts } from './core/board.js';
import { renderBoard } from './ui/board.js';

/** Display-only snapshot using the planned GameState fields; no store yet. */
export function createDisplayState(puzzle = null) {
  if (puzzle !== null) assertBoard(puzzle);
  return {
    status: puzzle === null ? 'generating' : 'playing',
    puzzle: puzzle === null ? null : puzzle.slice(),
    values: puzzle === null ? null : puzzle.slice(),
    notes: Array.from({ length: 81 }, () => new Set()),
    selectedIndex: puzzle === null || !puzzle.includes(0) ? null : puzzle.findIndex((digit) => digit === 0),
    noteMode: false, selectedDifficulty: 'easy', activeDifficulty: 'easy',
    requestId: 1, timer: { startedAtMs: null, stoppedAtMs: null },
    completionDialogOpen: false, error: null,
  };
}

export async function showInitialBoard({ root, statusElement, generate = generatePuzzle, signal }) {
  const loading = createDisplayState();
  renderBoard(root, loading);
  statusElement.dataset.state = 'loading';
  statusElement.textContent = '퍼즐을 준비하고 있습니다.';
  try {
    const result = await generate('easy', { signal });
    if (signal?.aborted || result.status === 'aborted') return;
    if (result.status !== 'success') {
      renderBoard(root, { ...loading, status: 'error' });
      statusElement.dataset.state = 'error';
      statusElement.textContent = '퍼즐을 만들지 못했습니다. 페이지를 새로고침해 다시 시도해 주세요.';
      return;
    }
    assertBoard(result.puzzle);
    if (result.difficulty !== 'easy' || result.blankCount !== 35
      || result.puzzle.filter((digit) => digit === 0).length !== 35 || !isValidBoard(result.puzzle)) {
      throw new Error('The generated puzzle does not match the easy display contract.');
    }
    renderBoard(root, createDisplayState(result.puzzle));
    statusElement.dataset.state = 'ready';
    statusElement.textContent = '퍼즐 준비 완료 · 쉬움';
  } catch (error) {
    if (signal?.aborted) return;
    console.error('퍼즐 초기화 실패:', error);
    renderBoard(root, { ...loading, status: 'error' });
    statusElement.dataset.state = 'error';
    statusElement.textContent = '퍼즐을 만들지 못했습니다. 페이지를 새로고침해 다시 시도해 주세요.';
  }
}

/** Own only this initialization's signal; restart after an aborted BFCache return. */
export function bindInitialBoardLifecycle(target, start) {
  let controller;
  const begin = () => {
    controller = new AbortController();
    void start(controller.signal);
  };
  const onHide = () => controller.abort();
  const onShow = (event) => {
    if (event.persisted && controller.signal.aborted) begin();
  };
  target.addEventListener('pagehide', onHide);
  target.addEventListener('pageshow', onShow);
  begin();
  return () => {
    controller.abort();
    target.removeEventListener('pagehide', onHide);
    target.removeEventListener('pageshow', onShow);
  };
}

/** Effect coordinator: no DOM, injectable clock, generator and scheduler. */
export function createGameSession({
  initialState, generate = generatePuzzle, now = () => performance.now(),
  schedule = (fn, delay) => setInterval(fn, delay), cancel = (id) => clearInterval(id),
  onState = () => {}, onElapsed = () => {}, reportError = (error) => console.error('퍼즐 생성 실패:', error),
} = {}) {
  const store = createGameStore(initialState);
  let disposed = false, controller, tick = null;
  const elapsed = () => getElapsedSeconds(store.getState().timer, now());
  const stopTick = () => { if (tick !== null) { cancel(tick); tick = null; } };
  const refreshTime = () => { if (!disposed) onElapsed(elapsed()); };
  const refresh = (state) => {
    if (state.status !== 'playing') stopTick();
    else if (tick === null) tick = schedule(refreshTime, 250);
    onState(state, elapsed());
  };
  const unsubscribe = store.subscribe(refresh);
  const dispatch = (action) => {
    if (disposed) return store.getState();
    store.dispatch(action);
    const state = store.getState();
    if ((action.type === 'ENTER_DIGIT' || action.type === 'CLEAR_CELL') && state.status === 'playing'
      && isComplete(state.values, state.puzzle)) {
      store.dispatch({ type: 'GAME_COMPLETED', nowMs: now() });
    }
    return store.getState();
  };
  async function newGame() {
    if (disposed) return;
    controller?.abort();
    stopTick();
    const current = new AbortController();
    controller = current;
    const requestId = store.getState().requestId + 1;
    const difficulty = store.getState().selectedDifficulty;
    dispatch({ type: 'NEW_GAME_REQUESTED', requestId, difficulty });
    const isCurrent = () => !disposed && !current.signal.aborted
      && store.getState().requestId === requestId && store.getState().status === 'generating';
    try {
      const result = await generate(difficulty, { signal: current.signal });
      // Gate before validating payloads: a stale malformed response is irrelevant.
      if (!isCurrent() || result.status === 'aborted') return;
      if (result.status === 'success') {
        if (result.difficulty !== difficulty) throw new Error('Unexpected generated difficulty.');
        dispatch({ type: 'GENERATION_SUCCEEDED', requestId, difficulty, puzzle: result.puzzle, nowMs: now() });
      } else {
        dispatch({ type: 'GENERATION_FAILED', requestId, code: result.reason ?? 'generation-failed',
          message: '퍼즐을 만들지 못했습니다. 다시 시도해 주세요.' });
      }
    } catch (error) {
      if (!isCurrent()) return;
      reportError(error);
      dispatch({ type: 'GENERATION_FAILED', requestId, code: 'unexpected',
        message: '퍼즐을 만들지 못했습니다. 다시 시도해 주세요.' });
    }
  }
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    controller?.abort();
    stopTick();
    unsubscribe();
  };
  const start = () => {
    if (disposed) return Promise.resolve();
    if (['playing', 'completed'].includes(store.getState().status)) {
      refresh(store.getState());
      return Promise.resolve();
    }
    return newGame();
  };
  return { store, dispatch, newGame, start, refreshTime, dispose };
}

/** Connect the session to the persistent board, controls and native completion dialog. */
export function mountGame({ root, scope, statusElement, initialState, generate = generatePuzzle,
  now = () => performance.now(), signal, schedule, cancel, visibilityTarget = globalThis.document }) {
  let controls, previousStatus = null;
  const session = createGameSession({
    initialState, generate, now, schedule, cancel,
    onElapsed: (seconds) => controls?.renderElapsed(seconds),
    onState: (state, seconds) => {
      renderBoard(root, state);
      const conflicts = state.values ? findConflicts(state.values) : new Set();
      const conflictMessage = scope.querySelector('[data-conflicts]');
      if (conflictMessage) conflictMessage.textContent = conflicts.size
        ? '중복된 숫자가 있는 ' + conflicts.size + '개 칸을 확인해 주세요. 느낌표로 표시했습니다.' : '';
      for (const control of scope.querySelectorAll('[data-digit], [data-input-action]')) {
        control.disabled = state.status !== 'playing';
        if (control.dataset.inputAction === 'notes') control.setAttribute('aria-pressed', String(state.noteMode));
      }
      statusElement.dataset.state = ['playing', 'completed'].includes(state.status) ? 'ready'
        : state.status === 'error' ? 'error' : 'loading';
      statusElement.textContent = {
        idle: '퍼즐을 준비하고 있습니다.', generating: '퍼즐을 준비하고 있습니다.',
        playing: state.noteMode ? '메모 모드 · 빈칸에서 후보 숫자를 선택하세요.' : '퍼즐 준비 완료 · 숫자를 입력해 보세요.',
        completed: '퍼즐을 완성했습니다. 보드는 읽기 전용입니다.',
        error: state.error?.message ?? '퍼즐을 만들지 못했습니다.',
      }[state.status];
      if (state.status === 'completed' && previousStatus === 'playing' && !scope.querySelector('[data-completion-dialog]')) {
        statusElement.tabIndex = -1;
        statusElement.focus({ preventScroll: true });
      }
      previousStatus = state.status;
      controls.render(state, seconds);
    },
  });
  controls = bindControls(scope, session.dispatch, session.newGame);
  const unbind = bindInput(scope, session.dispatch);
  const onVisibility = () => { if (!visibilityTarget.hidden) session.refreshTime(); };
  visibilityTarget?.addEventListener('visibilitychange', onVisibility);
  let disposed = false;
  function dispose() {
    if (disposed) return;
    disposed = true;
    session.dispose();
    unbind();
    controls.dispose();
    visibilityTarget?.removeEventListener('visibilitychange', onVisibility);
    signal?.removeEventListener('abort', dispose);
  }
  signal?.addEventListener('abort', dispose, { once: true });
  if (signal?.aborted) dispose();
  const ready = session.start();
  return { ...session, ready, dispose };
}
if (typeof document !== 'undefined') {
  const root = document.querySelector('[data-game-board]');
  if (root) {
    const statusElement = document.querySelector('#module-status');
    if (!statusElement) throw new Error('상태 안내 영역이 필요합니다.');
    let game, cachedState;
    const scope = document.querySelector('[data-game-input]');
    window.addEventListener('pagehide', () => {
      cachedState = game?.store.getState();
      game?.dispose();
    });
    bindInitialBoardLifecycle(window, (signal) => {
      game?.dispose();
      const initialState = ['playing', 'completed'].includes(cachedState?.status) ? cachedState : undefined;
      game = mountGame({ root, scope, statusElement, initialState, signal });
      return game.ready;
    });
  }
}