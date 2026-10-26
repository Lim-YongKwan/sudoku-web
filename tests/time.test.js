import test from 'node:test';
import assert from 'node:assert/strict';
import { getElapsedSeconds, formatElapsed } from '../src/utils/time.js';

test('elapsed time floors milliseconds, resets before start and clamps negative differences', () => {
  assert.equal(getElapsedSeconds({ startedAtMs: null, stoppedAtMs: null }, 50000), 0);
  for (const [end, seconds] of [[100, 0], [1099, 0], [1100, 1], [60100, 60], [0, 0]]) {
    assert.equal(getElapsedSeconds({ startedAtMs: 100, stoppedAtMs: null }, end), seconds);
  }
});
test('completion freezes elapsed time independently of later ticks', () => {
  assert.equal(getElapsedSeconds({ startedAtMs: 100, stoppedAtMs: 65100 }, 999999), 65);
});
test('time formatting retains minutes beyond 99', () => {
  for (const [seconds, text] of [[0,'00:00'],[9,'00:09'],[60,'01:00'],[5999,'99:59'],[6000,'100:00']]) {
    assert.equal(formatElapsed(seconds), text);
  }
});
test('invalid clock and display values are rejected', () => {
  for (const value of [NaN, Infinity, -1]) {
    assert.throws(() => getElapsedSeconds({ startedAtMs: null, stoppedAtMs: null }, value), RangeError);
    assert.throws(() => formatElapsed(value), RangeError);
  }
  assert.throws(() => formatElapsed('1'), TypeError);
  assert.throws(() => formatElapsed(1.2), RangeError);
  assert.throws(() => getElapsedSeconds({ startedAtMs: Infinity, stoppedAtMs: null }, 1), RangeError);
});