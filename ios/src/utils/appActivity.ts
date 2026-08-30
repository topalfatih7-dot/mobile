/**
 * Foreground-only timers and keyed cooldowns.
 * Does not change product intervals — only pauses work while backgrounded / unfocused.
 */
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

export const MEMBER_PROBE_COOLDOWN_MS = 15_000;
export const CHAT_UNREAD_FOREGROUND_COOLDOWN_MS = 10_000;

const keyedLastRun = new Map<string, number>();

/** True if `minMs` has elapsed since the last successful run for `key`. */
export function shouldRunKeyed(key: string, minMs: number): boolean {
  const now = Date.now();
  const last = keyedLastRun.get(key) ?? 0;
  if (now - last < minMs) return false;
  keyedLastRun.set(key, now);
  return true;
}

type IntervalOpts = {
  /** Pause while this screen is not focused (expo-router). */
  requireFocus?: boolean;
};

/**
 * `setInterval` only while AppState is `active` (and optionally while focused).
 * Resume from background ticks once immediately, then restarts the interval.
 * Unmount always clears the timer.
 */
export function useIntervalWhileActive(
  callback: () => void,
  delayMs: number,
  enabled: boolean = true,
  opts?: IntervalOpts,
) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;
  const requireFocus = Boolean(opts?.requireFocus);
  const [focused, setFocused] = useState(!requireFocus);

  useFocusEffect(
    useCallback(() => {
      if (!requireFocus) return undefined;
      setFocused(true);
      return () => setFocused(false);
    }, [requireFocus]),
  );

  useEffect(() => {
    if (!enabled || (requireFocus && !focused)) return undefined;

    let timer: ReturnType<typeof setInterval> | null = null;

    const stop = () => {
      if (timer == null) return;
      clearInterval(timer);
      timer = null;
    };

    const canRun = () =>
      AppState.currentState === 'active' && (!requireFocus || focused);

    const start = (tickNow: boolean) => {
      stop();
      if (!canRun()) return;
      if (tickNow) callbackRef.current();
      timer = setInterval(() => callbackRef.current(), delayMs);
    };

    // Focused clocks: tick now so Join-now / window labels are not stale.
    // Presence poll: no mount tick — caller already loads once.
    start(requireFocus);

    const onChange = (state: AppStateStatus) => {
      if (state === 'active') start(true);
      else stop();
    };
    const sub = AppState.addEventListener('change', onChange);

    return () => {
      stop();
      sub.remove();
    };
  }, [delayMs, enabled, focused, requireFocus]);
}
