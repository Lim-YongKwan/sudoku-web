import test from 'node:test';
import assert from 'node:assert/strict';
import { generatePuzzle, DIFFICULTY_BLANKS } from '../src/core/generator.js';
import { solveBoard, countSolutions } from '../src/core/solver.js';
import { isComplete } from '../src/core/board.js';
import { seededRandom } from './fixtures/boards.js';

const fast = { now: () => 0, yieldControl: async () => {} };

test('each difficulty succeeds with its exact blank count and unique clues for three fixed seeds', { timeout: 30000 }, async (t) => {
  for (const difficulty of ['easy', 'normal', 'hard']) {
    let successes = 0;
    for (const seed of [1, 42, 2026]) {
      const started = performance.now();
      // Keep all production budget and scheduler defaults for this measurement.
      const result = await generatePuzzle(difficulty, { rng: seededRandom(seed) });
      t.diagnostic(JSON.stringify({
        difficulty, seed, status: result.status, reason: result.reason ?? null,
        ...result.stats, measuredMs: Math.round((performance.now() - started) * 100) / 100,
      }));
      if (result.status !== 'success') {
        assert.equal(result.status, 'failed');
        assert.ok(['attempts-exhausted', 'node-budget', 'time-budget'].includes(result.reason));
        assert.equal(Object.hasOwn(result, 'puzzle'), false);
        continue;
      }
      successes++;
      assert.equal(result.difficulty, difficulty);
      assert.equal(result.blankCount, DIFFICULTY_BLANKS[difficulty]);
      assert.equal(result.puzzle.filter((digit) => digit === 0).length, result.blankCount);
      assert.equal(Object.hasOwn(result, 'solution'), false);
      assert.ok(result.stats.attempts <= 8 && result.stats.totalNodes <= 1000000);
      const snapshot = result.puzzle.slice();
      const solved = await solveBoard(Object.freeze(result.puzzle), fast);
      assert.equal(solved.status, 'solved');
      assert.equal(isComplete(solved.board, result.puzzle), true);
      const counted = await countSolutions(result.puzzle, fast);
      assert.equal(counted.status, 'complete');
      assert.equal(counted.count, 1);
      assert.deepEqual(result.puzzle, snapshot);
    }
    assert.ok(successes >= 1, difficulty + ' needs a successful seed with default budgets');
  }
});

test('generation is reproducible and separate calls do not share puzzle arrays', async () => {
  const a = await generatePuzzle('easy', { ...fast, rng: seededRandom(12) });
  const b = await generatePuzzle('easy', { ...fast, rng: seededRandom(12) });
  assert.equal(a.status, 'success');
  assert.deepEqual(a, b);
  assert.notEqual(a.puzzle, b.puzzle);
});

test('per-search exhaustion retries within maxAttempts instead of relaxing the target', async () => {
  const result = await generatePuzzle('hard', { ...fast, rng: seededRandom(1), maxAttempts: 2, maxNodesPerSearch: 1 });
  assert.deepEqual(result, { status: 'failed', reason: 'attempts-exhausted', stats: { attempts: 2, totalNodes: 2, elapsedMs: 0 } });
  assert.equal(Object.hasOwn(result, 'puzzle'), false);
});

test('global node budget stops all attempts without returning a partial puzzle', async () => {
  const result = await generatePuzzle('easy', { ...fast, rng: seededRandom(1), maxTotalNodes: 10 });
  assert.equal(result.status, 'failed');
  assert.equal(result.reason, 'node-budget');
  assert.equal(result.stats.totalNodes, 10);
  assert.equal(Object.hasOwn(result, 'puzzle'), false);
});

test('time budget includes scheduler waiting and cancellation has priority', async () => {
  let time = 0;
  const result = await generatePuzzle('easy', {
    rng: seededRandom(1), now: () => time, maxElapsedMs: 1,
    yieldControl: async () => { time = 2; },
  });
  assert.equal(result.status, 'failed');
  assert.equal(result.reason, 'time-budget');
  assert.equal(result.stats.elapsedMs, 2);
  const controller = new AbortController();
  time = 0;
  const cancelled = await generatePuzzle('easy', {
    rng: seededRandom(1), now: () => time, maxElapsedMs: 1, signal: controller.signal,
    yieldControl: async () => { time = 2; controller.abort(); },
  });
  assert.equal(cancelled.status, 'aborted');
  assert.equal(Object.hasOwn(cancelled, 'reason'), false);
  assert.equal(Object.hasOwn(cancelled, 'puzzle'), false);
});

test('generator stops on an already-aborted signal and on abort between removals', async () => {
  const controller = new AbortController();
  controller.abort();
  const result = await generatePuzzle('hard', { signal: controller.signal });
  assert.equal(result.status, 'aborted');
  assert.equal(result.stats.attempts, 0);
  const next = new AbortController();
  let yields = 0;
  const running = await generatePuzzle('hard', {
    ...fast, rng: seededRandom(1), signal: next.signal,
    yieldControl: async () => { if (++yields === 3) next.abort(); },
  });
  assert.equal(running.status, 'aborted');
  assert.ok(running.stats.totalNodes > 0);
});

test('generator rejects unsupported difficulty, malformed hooks and invalid budget ranges', async () => {
  for (const difficulty of ['expert', '', null, {}, ['easy'], 'toString']) {
    await assert.rejects(generatePuzzle(difficulty), RangeError);
  }
  for (const name of ['maxAttempts', 'maxTotalNodes', 'maxNodesPerSearch', 'maxElapsedMs', 'yieldEveryNodes']) {
    for (const value of [0, -1, NaN, Infinity, '1', null]) {
      await assert.rejects(generatePuzzle('easy', { [name]: value }), RangeError);
    }
  }
  for (const name of ['maxAttempts', 'maxTotalNodes', 'maxNodesPerSearch', 'yieldEveryNodes']) {
    await assert.rejects(generatePuzzle('easy', { [name]: 1.5 }), RangeError);
  }
  await assert.rejects(generatePuzzle('easy', null), RangeError);
  await assert.rejects(generatePuzzle('easy', { rng: () => 1, ...fast }), RangeError);
  await assert.rejects(generatePuzzle('easy', { now: () => Infinity }), RangeError);
});
test('a bounded uniqueness search can be rejected while later removals still succeed', async () => {
  // Seed 1 creates a full grid in exactly 82 nodes. Some later removals
  // need more than that; they must be restored without discarding prior clues.
  const result = await generatePuzzle('hard', {
    ...fast, rng: seededRandom(1), maxNodesPerSearch: 82, maxAttempts: 1,
  });
  assert.equal(result.status, 'success');
  assert.equal(result.blankCount, 50);
  const counted = await countSolutions(result.puzzle, fast);
  assert.equal(counted.status, 'complete');
  assert.equal(counted.count, 1);
  assert.equal(isComplete((await solveBoard(result.puzzle, fast)).board, result.puzzle), true);
});

test('the global node counter spans completion and multiple uniqueness searches', async () => {
  const result = await generatePuzzle('hard', { ...fast, rng: seededRandom(1), maxTotalNodes: 100 });
  assert.equal(result.status, 'failed');
  assert.equal(result.reason, 'node-budget');
  assert.equal(result.stats.attempts, 1);
  assert.equal(result.stats.totalNodes, 100);
});

test('global time wins over simultaneous node and attempt exhaustion', async () => {
  let time = 0, yields = 0;
  const result = await generatePuzzle('hard', {
    rng: seededRandom(1), now: () => time,
    maxAttempts: 1, maxTotalNodes: 1, maxNodesPerSearch: 1,
    maxElapsedMs: 1, yieldEveryNodes: 1,
    yieldControl: async () => { if (++yields === 2) time = 1; },
  });
  assert.equal(result.status, 'failed');
  assert.equal(result.reason, 'time-budget');
  assert.equal(result.stats.totalNodes, 1);
});
test('generation honors inherited cancellation and clock hooks like solver options', async () => {
  const controller = new AbortController();
  controller.abort();
  const inherited = Object.create({ signal: controller.signal, now: () => 0, yieldControl: async () => {} });
  inherited.rng = seededRandom(1);
  const result = await generatePuzzle('easy', inherited);
  assert.equal(result.status, 'aborted');
  assert.equal(result.stats.attempts, 0);

  let time = 0;
  const timedOptions = Object.create({
    now: () => time,
    yieldControl: async () => { time = 2; },
  });
  timedOptions.maxElapsedMs = 1;
  const timed = await generatePuzzle('easy', timedOptions);
  assert.equal(timed.status, 'failed');
  assert.equal(timed.reason, 'time-budget');
  assert.equal(timed.stats.attempts, 0);
});
test('individual search timeouts retry without becoming a global timeout', async () => {
  let time = 0;
  const result = await generatePuzzle('easy', {
    rng: seededRandom(1), now: () => time += 100, yieldControl: async () => {},
    maxAttempts: 2, maxElapsedMs: 100000,
  });
  assert.equal(result.status, 'failed');
  assert.equal(result.reason, 'attempts-exhausted');
  assert.equal(result.stats.attempts, 2);
  assert.ok(result.stats.totalNodes > 0);
  assert.ok(result.stats.elapsedMs < 100000);
  assert.equal(Object.hasOwn(result, 'puzzle'), false);
});