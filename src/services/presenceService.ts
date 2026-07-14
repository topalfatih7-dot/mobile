/**
 * Presence — web `presenceService.js` sözleşmesi (AppState ile RN uyarlaması).
 */
import { AppState, type AppStateStatus } from 'react-native';

import { supabase } from '@/services/supabaseClient';

export const OFFLINE_MS = 180_000;
export const HEARTBEAT_MS = 60_000;

export type PresenceInfo = {
  userId: string;
  email?: string | null;
  name?: string | null;
  role?: string | null;
};

export type OnlineStats = {
  onlineNow: number;
  totalMembers: number;
};

async function broadcastPresenceStats(stats: OnlineStats) {
  if (!supabase || !stats) return;
  const channel = supabase.channel('presence:stats', { config: { broadcast: { self: false } } });
  try {
    await channel.httpSend('stats', stats);
  } catch {
    /* non-critical */
  } finally {
    await supabase.removeChannel(channel);
  }
}

export async function fetchOnlineStats(): Promise<OnlineStats> {
  if (!supabase) return { onlineNow: 0, totalMembers: 0 };
  const { data, error } = await supabase.rpc('get_online_stats');
  if (error) return { onlineNow: 0, totalMembers: 0 };
  return {
    onlineNow: data?.online_now ?? 0,
    totalMembers: data?.total_members ?? 0,
  };
}

export async function fetchActiveUsers() {
  if (!supabase) return [];
  const { data, error } = await supabase.rpc('get_active_users');
  if (error) return [];
  return Array.isArray(data) ? data : [];
}

export async function pingPresence({
  userId,
  email,
  name,
  role,
  pagePath,
}: PresenceInfo & { pagePath?: string | null }) {
  if (!supabase || !userId) return null;
  const now = new Date().toISOString();
  const { data: existing } = await supabase
    .from('user_presence')
    .select('session_started_at, last_seen_at')
    .eq('user_id', userId)
    .maybeSingle();

  const wasOffline =
    !existing || Date.now() - new Date(existing.last_seen_at).getTime() > OFFLINE_MS;

  let error;
  if (!existing) {
    ;({ error } = await supabase.from('user_presence').insert({
      user_id: userId,
      email,
      name: name || email,
      role: role || 'member',
      session_started_at: now,
      last_seen_at: now,
      page_path: pagePath || null,
    }));
  } else if (wasOffline) {
    ;({ error } = await supabase
      .from('user_presence')
      .update({
        email,
        name: name || email,
        role: role || 'member',
        session_started_at: now,
        last_seen_at: now,
        page_path: pagePath || null,
      })
      .eq('user_id', userId));
  } else {
    ;({ error } = await supabase
      .from('user_presence')
      .update({
        email,
        name: name || email,
        role: role || 'member',
        last_seen_at: now,
        page_path: pagePath || null,
      })
      .eq('user_id', userId));
  }

  if (error) return null;

  const stats = await fetchOnlineStats();
  void broadcastPresenceStats(stats);
  return stats;
}

export async function clearPresence(userId: string | null | undefined) {
  if (!supabase || !userId) return;
  await supabase.from('user_presence').delete().eq('user_id', userId);
  const stats = await fetchOnlineStats();
  void broadcastPresenceStats(stats);
}

export function startPresenceTracker({
  resolvePresenceInfo,
  getPagePath,
}: {
  resolvePresenceInfo: () => Promise<PresenceInfo | null>;
  getPagePath?: () => string;
}) {
  if (!supabase) return () => {};

  let timer: ReturnType<typeof setInterval> | null = null;
  let stopped = false;
  let lastUserId: string | null = null;

  async function beat() {
    if (stopped) return;
    const info = await resolvePresenceInfo();
    if (!info?.userId) return;
    lastUserId = info.userId;
    await pingPresence({
      ...info,
      pagePath: getPagePath?.() || 'mobile',
    });
  }

  void beat();
  timer = setInterval(() => {
    void beat();
  }, HEARTBEAT_MS);

  const onAppState = (next: AppStateStatus) => {
    if (next === 'active') void beat();
  };
  const appSub = AppState.addEventListener('change', onAppState);

  return () => {
    stopped = true;
    if (timer) clearInterval(timer);
    appSub.remove();
    if (lastUserId) void clearPresence(lastUserId);
  };
}
