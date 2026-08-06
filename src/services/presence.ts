/**
 * Web parity: Adsız `src/services/presenceService.js`
 * Heartbeat → user_presence; chat peers read user_presence_public.
 */
import { AppState, type AppStateStatus } from 'react-native';

import { isUiOnly } from '@/config/runtime';
import { requireSupabase, supabase } from '@/services/supabase';

export const OFFLINE_MS = 180_000;
export const HEARTBEAT_MS = 60_000;

type PresenceRow = {
  user_id: string;
  last_seen_at: string | null;
  role?: string | null;
};

const presenceBeatCache = new Map<string, { lastSeenMs: number }>();

async function hasAuthSession() {
  if (!supabase) return false;
  const { data } = await supabase.auth.getSession();
  return Boolean(data?.session?.access_token);
}

export async function fetchPresenceForUsers(
  userIds: string[] = [],
  { includeAdmins = false }: { includeAdmins?: boolean } = {},
): Promise<PresenceRow[]> {
  if (!supabase || isUiOnly()) return [];
  const ids = [...new Set(userIds.filter(Boolean).map(String))];
  const rows: PresenceRow[] = [];

  if (ids.length) {
    const { data, error } = await supabase
      .from('user_presence_public')
      .select('user_id, last_seen_at, role')
      .in('user_id', ids);
    if (!error && data) rows.push(...(data as PresenceRow[]));
  }

  if (includeAdmins) {
    const { data, error } = await supabase
      .from('user_presence_public')
      .select('user_id, last_seen_at, role')
      .eq('role', 'admin');
    if (!error && data) rows.push(...(data as PresenceRow[]));
  }

  const seen = new Set<string>();
  return rows.filter((r) => {
    if (!r?.user_id || seen.has(r.user_id)) return false;
    seen.add(r.user_id);
    return true;
  });
}

export async function pingPresence(opts: {
  userId: string;
  email?: string | null;
  name?: string | null;
  role?: string | null;
  pagePath?: string | null;
}) {
  if (!opts.userId || !supabase || isUiOnly()) return null;
  if (!(await hasAuthSession())) return null;

  const now = new Date().toISOString();
  const cached = presenceBeatCache.get(opts.userId);
  const wasOffline = !cached || Date.now() - cached.lastSeenMs > OFFLINE_MS;

  const row: Record<string, unknown> = {
    user_id: opts.userId,
    email: opts.email || null,
    name: opts.name || opts.email || null,
    role: opts.role || 'member',
    last_seen_at: now,
    page_path: opts.pagePath || null,
  };
  if (wasOffline) row.session_started_at = now;

  const { error } = await requireSupabase()
    .from('user_presence')
    .upsert(row, { onConflict: 'user_id' });

  if (error) {
    if (
      error.code === 'PGRST301' ||
      /JWT|401|not authenticated/i.test(error.message || '')
    ) {
      presenceBeatCache.delete(opts.userId);
    }
    return null;
  }

  presenceBeatCache.set(opts.userId, { lastSeenMs: Date.now() });
  return true;
}

export async function clearPresence(userId: string) {
  if (!userId || !supabase || isUiOnly()) return;
  presenceBeatCache.delete(userId);
  if (!(await hasAuthSession())) return;
  await supabase.from('user_presence').delete().eq('user_id', userId);
}

export type PresenceInfo = {
  userId: string;
  email?: string | null;
  name?: string | null;
  role?: string | null;
};

/**
 * App açıkken 60s heartbeat; arka plana geçince dur; logout’ta clear.
 */
export function startPresenceTracker(opts: {
  resolvePresenceInfo: () => Promise<PresenceInfo | null>;
  getPagePath?: () => string;
}) {
  if (!supabase || isUiOnly()) return () => {};

  let timer: ReturnType<typeof setInterval> | null = null;
  let stopped = false;
  let lastUserId: string | null = null;

  async function beat() {
    if (stopped) return;
    if (AppState.currentState !== 'active') return;
    const info = await opts.resolvePresenceInfo();
    if (!info?.userId) return;
    lastUserId = info.userId;
    await pingPresence({
      ...info,
      pagePath: opts.getPagePath?.() || null,
    });
  }

  const startTimer = () => {
    if (timer != null) return;
    void beat();
    timer = setInterval(() => void beat(), HEARTBEAT_MS);
  };

  const stopTimer = () => {
    if (timer == null) return;
    clearInterval(timer);
    timer = null;
  };

  startTimer();

  const onAppState = (state: AppStateStatus) => {
    if (state === 'active') {
      startTimer();
      void beat();
      return;
    }
    stopTimer();
  };
  const sub = AppState.addEventListener('change', onAppState);

  return () => {
    stopped = true;
    stopTimer();
    sub.remove();
    if (lastUserId) void clearPresence(lastUserId);
  };
}
