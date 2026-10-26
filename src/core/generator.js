import { isComplete } from './board.js';
import { runSearch } from './solver.js';
import { hooks, monotonicClock, optionObject, positive, shuffled, yieldTask } from '../utils/search-runtime.js';

export const DIFFICULTY_BLANKS = Object.freeze({ easy: 35, normal: 45, hard: 50 });

export async function generatePuzzle(difficulty, options = {}) {
  if (typeof difficulty !== 'string' || !Object.hasOwn(DIFFICULTY_BLANKS, difficulty)) throw new RangeError('Unknown difficulty.');
  optionObject(options);
  const injected = hooks(options);
  if (injected.rng === undefined) injected.rng = Math.random;
  const maxAttempts = positive((options.maxAttempts === undefined ? 8 : options.maxAttempts), 'maxAttempts', true);
  const maxTotalNodes = positive((options.maxTotalNodes === undefined ? 1000000 : options.maxTotalNodes), 'maxTotalNodes', true);
  const maxNodesPerSearch = positive((options.maxNodesPerSearch === undefined ? 100000 : options.maxNodesPerSearch), 'maxNodesPerSearch', true);
  const maxElapsedMs = positive((options.maxElapsedMs === undefined ? 5000 : options.maxElapsedMs), 'maxElapsedMs');
  const yieldEveryNodes = positive((options.yieldEveryNodes === undefined ? 128 : options.yieldEveryNodes), 'yieldEveryNodes', true);
  const now = monotonicClock(injected.now);
  const startedAt = now();
  const shared = { now, startedAt, maxElapsedMs, maxNodes: maxTotalNodes, nodes: 0 };
  let attempts = 0, elapsedMs = 0;

  function stopReason() {
    elapsedMs = now() - startedAt;
    if (injected.signal?.aborted) return 'aborted';
    if (elapsedMs >= maxElapsedMs) return 'time-budget';
    if (shared.nodes >= maxTotalNodes) return 'node-budget';
    return null;
  }
  const stats = () => ({ attempts, totalNodes: shared.nodes, elapsedMs });
  const failure = (reason) => reason === 'aborted'
    ? { status: 'aborted', stats: stats() }
    : { status: 'failed', reason, stats: stats() };
  async function boundary() {
    let reason = stopReason();
    if (reason) return reason;
    await yieldTask(injected.yieldControl);
    return stopReason();
  }
  function searchOptions() {
    return {
      ...injected,
      maxNodes: maxNodesPerSearch,
      maxElapsedMs: Math.min(2000, maxElapsedMs - elapsedMs),
      yieldEveryNodes,
    };
  }

  while (attempts < maxAttempts) {
    let reason = await boundary();
    if (reason) return failure(reason);
    attempts++;
    const completed = await runSearch(Array(81).fill(0), searchOptions(), shared, false);
    reason = stopReason();
    if (reason) return failure(reason);
    if (completed.status !== 'solved') continue;
    const solution = completed.board;
    const puzzle = solution.slice();
    let blankCount = 0;
    let unique = false;
    for (const index of shuffled(Array.from({ length: 81 }, (_, i) => i), injected.rng)) {
      reason = await boundary();
      if (reason) return failure(reason);
      const saved = puzzle[index];
      puzzle[index] = 0;
      const checked = await runSearch(puzzle, searchOptions(), shared, true);
      reason = stopReason();
      if (reason) return failure(reason);
      unique = checked.status === 'complete' && checked.count === 1;
      if (!unique) {
        puzzle[index] = saved;
        continue;
      }
      blankCount++;
      if (blankCount === DIFFICULTY_BLANKS[difficulty]) {
        // The final accepted removal itself is the exhaustive uniqueness proof.
        if (!isComplete(solution, puzzle) || puzzle.filter((digit) => digit === 0).length !== blankCount) {
          throw new Error('Generated board violates its contract.');
        }
        reason = stopReason();
        if (reason) return failure(reason);
        return { status: 'success', puzzle, difficulty, blankCount, stats: stats() };
      }
    }
  }
  return failure(stopReason() ?? 'attempts-exhausted');
}