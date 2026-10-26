/** Browser-safe cooperative search support; no Node or DOM imports. */
export const defaultYield = () => new Promise((resolve) => setTimeout(resolve, 0));

export function positive(value, name, integer = false) {
  if (!Number.isFinite(value) || value <= 0 || (integer && !Number.isSafeInteger(value))) {
    throw new RangeError(name + ' must be a positive ' + (integer ? 'safe integer.' : 'finite number.'));
  }
  return value;
}

export function optionObject(options) {
  if (options === null || typeof options !== 'object' || Array.isArray(options)) throw new RangeError('Options must be an object.');
  if (Object.hasOwn(options, 'sharedBudget')) throw new RangeError('sharedBudget is internal.');
}

export function hooks(options) {
  const now = options.now === undefined ? (() => performance.now()) : options.now;
  const yieldControl = options.yieldControl === undefined ? defaultYield : options.yieldControl;
  const rng = options.rng;
  if (typeof now !== 'function' || typeof yieldControl !== 'function' || (rng !== undefined && typeof rng !== 'function')) {
    throw new RangeError('Search hooks must be functions.');
  }
  const signal = options.signal;
  if (signal !== undefined && (signal === null || typeof signal.aborted !== 'boolean'
    || typeof signal.addEventListener !== 'function')) throw new RangeError('signal must be an AbortSignal.');
  return { now, yieldControl, rng, signal };
}

export function monotonicClock(now) {
  let previous = -Infinity;
  return () => {
    const value = now();
    if (!Number.isFinite(value) || value < previous) throw new RangeError('now must return finite monotonic values.');
    previous = value;
    return value;
  };
}

export function shuffled(values, rng) {
  const result = values.slice();
  if (!rng) return result;
  for (let i = result.length - 1; i > 0; i--) {
    const value = rng();
    if (!Number.isFinite(value) || value < 0 || value >= 1) throw new RangeError('rng must return a finite value in [0, 1).');
    const j = Math.floor(value * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export async function yieldTask(yieldControl) {
  const pending = yieldControl();
  if (!pending || typeof pending.then !== 'function') throw new RangeError('yieldControl must return a Promise.');
  await pending;
}

/** shared is only passed internally by the generator, never via public options. */
export function searchRuntime(options, shared) {
  optionObject(options);
  const injected = hooks(options);
  const maxNodes = positive((options.maxNodes === undefined ? 100000 : options.maxNodes), 'maxNodes', true);
  const maxElapsedMs = positive((options.maxElapsedMs === undefined ? 2000 : options.maxElapsedMs), 'maxElapsedMs');
  const yieldEveryNodes = positive((options.yieldEveryNodes === undefined ? 128 : options.yieldEveryNodes), 'yieldEveryNodes', true);
  const now = shared?.now ?? monotonicClock(injected.now);
  const startedAt = now();
  let nodes = 0;
  let elapsedMs = 0;

  function check(entering = false) {
    const time = now();
    elapsedMs = time - startedAt;
    if (injected.signal?.aborted) return 'aborted';
    if ((shared && time - shared.startedAt >= shared.maxElapsedMs) || elapsedMs >= maxElapsedMs) return 'time-budget';
    if (entering && ((shared && shared.nodes >= shared.maxNodes) || nodes >= maxNodes)) return 'node-budget';
    return null;
  }
  return {
    rng: injected.rng,
    check,
    async enter() {
      let reason = check(true);
      if (reason) return reason;
      nodes++;
      if (shared) shared.nodes++;
      // Generator searches share the same cadence instead of resetting it per removal.
      if ((shared?.nodes ?? nodes) % yieldEveryNodes === 0) {
        await yieldTask(injected.yieldControl);
        reason = check();
      }
      return reason;
    },
    stats: () => ({ nodes, elapsedMs }),
  };
}