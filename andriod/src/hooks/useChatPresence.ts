/**
 * Web parity: Adsız `src/hooks/useChatPresence.js`
 */
import { useEffect, useMemo, useRef, useState } from 'react';

import { fetchPresenceForUsers } from '@/services/presence';
import { supabase } from '@/services/supabase';
import { useIntervalWhileActive } from '@/utils/appActivity';
import { isUserOnline } from '@/utils/presenceStatus';

export type ChatPresenceEntry = {
  lastSeenAt: string | null;
  online: boolean;
  role?: string | null;
};

const EMPTY_PRESENCE: Record<string, ChatPresenceEntry> = Object.freeze({});

export function useChatPresence(
  userIds: (string | null | undefined)[] = [],
  { includeAdmins = false }: { includeAdmins?: boolean } = {},
) {
  const [presenceMap, setPresenceMap] = useState<Record<string, ChatPresenceEntry>>(
    {},
  );

  const idsKey = useMemo(
    () =>
      [...new Set(userIds.filter(Boolean).map(String))]
        .sort()
        .join(','),
    [userIds],
  );

  const tracking = Boolean(supabase && (idsKey || includeAdmins));
  const loadRef = useRef<() => void>(() => {});

  useEffect(() => {
    const ids = idsKey ? idsKey.split(',') : [];
    if (!tracking || !supabase) return undefined;

    let active = true;

    const applyRows = (
      rows: { user_id?: string; last_seen_at?: string | null; role?: string | null }[],
    ) => {
      if (!active) return;
      setPresenceMap((prev) => {
        const next = { ...prev };
        rows.forEach((row) => {
          if (!row?.user_id) return;
          next[row.user_id] = {
            lastSeenAt: row.last_seen_at || null,
            online: isUserOnline(row.last_seen_at),
            role: row.role,
          };
        });
        return next;
      });
    };

    const load = async () => {
      const rows = await fetchPresenceForUsers(ids, { includeAdmins });
      applyRows(rows);
    };

    loadRef.current = () => {
      void load();
    };
    void load();

    // Unique topic per effect instance — Expo Router keeps list+thread mounted;
    // shared `chat-presence-${ids}` would reuse a subscribed channel and throw
    // "cannot add postgres_changes callbacks … after subscribe()".
    const topic = `chat-presence-${idsKey || 'admins'}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 9)}`;

    const channel = supabase
      .channel(topic)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_presence' },
        (payload) => {
          const row = (payload.new || payload.old) as {
            user_id?: string;
            last_seen_at?: string | null;
            role?: string | null;
          };
          if (!row?.user_id) return;
          const id = String(row.user_id);
          if (ids.includes(id) || (includeAdmins && row.role === 'admin')) {
            if (payload.eventType === 'DELETE') {
              setPresenceMap((prev) => {
                const next = { ...prev };
                delete next[id];
                return next;
              });
              return;
            }
            applyRows([row]);
          }
        },
      )
      .subscribe();

    return () => {
      active = false;
      loadRef.current = () => {};
      if (supabase) void supabase.removeChannel(channel);
    };
  }, [idsKey, includeAdmins, tracking]);

  // Layout+inbox may both mount; keep poll light (realtime handles most updates).
  // Pause while backgrounded — heartbeat writer already stops on AppState.
  useIntervalWhileActive(() => loadRef.current(), 60_000, tracking);

  const map = tracking ? presenceMap : EMPTY_PRESENCE;

  const isOnline = (userId?: string | null) => {
    if (!userId) return false;
    return map[userId]?.online ?? false;
  };

  const lastSeenAt = (userId?: string | null) =>
    (userId && map[userId]?.lastSeenAt) || null;

  const anyAdminOnline = useMemo(
    () => Object.values(map).some((p) => p.role === 'admin' && p.online),
    [map],
  );

  return { presenceMap: map, isOnline, lastSeenAt, anyAdminOnline };
}
