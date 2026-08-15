/**
 * DEV-only performance counters for hydrate / realtime / badge paths.
 * Log via `dumpPerfCounters()` after a scenario (boot, 10 chat msgs, etc.).
 */

export type PerfReason =
  | 'boot'
  | 'chat'
  | 'ticket'
  | 'member'
  | 'focus'
  | 'write'
  | 'manual'
  | 'unknown';

type CounterMap = Record<string, number>;

const counts: CounterMap = {};

function key(name: string, reason?: PerfReason) {
  return reason ? `${name}:${reason}` : name;
}

export function perfInc(name: string, reason?: PerfReason) {
  if (!__DEV__) return;
  const k = key(name, reason);
  counts[k] = (counts[k] || 0) + 1;
}

export function perfGet(name: string, reason?: PerfReason): number {
  return counts[key(name, reason)] || 0;
}

export function dumpPerfCounters(label = 'perf'): CounterMap {
  if (!__DEV__) return {};
  // eslint-disable-next-line no-console
  console.log(`[${label}]`, { ...counts });
  return { ...counts };
}

export function resetPerfCounters() {
  if (!__DEV__) return;
  for (const k of Object.keys(counts)) delete counts[k];
}
