/**
 * DEV-only performance counters for hydrate / realtime / badge paths.
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

const counts: Record<string, number> = {};

function key(name: string, reason?: PerfReason) {
  return reason ? `${name}:${reason}` : name;
}

export function perfInc(name: string, reason?: PerfReason) {
  if (!__DEV__) return;
  const k = key(name, reason);
  counts[k] = (counts[k] || 0) + 1;
}
