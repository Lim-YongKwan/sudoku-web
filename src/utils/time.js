function finite(value, name) {
  if (typeof value !== 'number') throw new TypeError(name + ' must be a number.');
  if (!Number.isFinite(value) || value < 0) throw new RangeError(name + ' must be finite and nonnegative.');
}

export function getElapsedSeconds(timer, nowMs) {
  finite(nowMs, 'nowMs');
  if (timer.startedAtMs === null) return 0;
  finite(timer.startedAtMs, 'startedAtMs');
  if (timer.stoppedAtMs !== null) finite(timer.stoppedAtMs, 'stoppedAtMs');
  const end = timer.stoppedAtMs ?? nowMs;
  return Math.floor(Math.max(0, end - timer.startedAtMs) / 1000);
}

export function formatElapsed(seconds) {
  finite(seconds, 'seconds');
  if (!Number.isSafeInteger(seconds)) throw new RangeError('seconds must be a safe integer.');
  return String(Math.floor(seconds / 60)).padStart(2, '0') + ':' + String(seconds % 60).padStart(2, '0');
}