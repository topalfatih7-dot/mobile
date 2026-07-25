/**
 * Realtime sync — web useRealtimeSync.js parity (staff/admin focused).
 */
import { useEffect } from 'react';

import { isUiOnly } from '@/config/runtime';
import { playNotificationSoundThrottled } from '@/services/notificationSound';
import { supabase } from '@/services/supabase';

type Opts = {
  role: string | null;
  userId: string | null;
  staffId?: string | null;
  onChange: () => void;
  /** Aktif chat thread id — o thread için ses susturulur */
  muteThreadId?: string | null;
};

export function usePlatformRealtime({
  role,
  userId,
  staffId,
  onChange,
  muteThreadId,
}: Opts) {
  useEffect(() => {
    if (isUiOnly() || !supabase || !userId) return;
    if (role !== 'staff' && role !== 'admin' && role !== 'member') return;

    const client = supabase;
    const channels: { unsubscribe: () => void }[] = [];

    const bump = () => {
      onChange();
    };

    const chatCh = client
      .channel(`chat-messages-sync-${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        (payload) => {
          const row = payload.new as { thread_id?: string };
          if (muteThreadId && String(row.thread_id) === String(muteThreadId)) {
            bump();
            return;
          }
          void playNotificationSoundThrottled();
          bump();
        },
      )
      .subscribe();
    channels.push(chatCh);

    const ticketsCh = client
      .channel(`tickets-sync-${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tickets' },
        () => bump(),
      )
      .subscribe();
    channels.push(ticketsCh);

    if (role === 'staff' && staffId) {
      const progCh = client
        .channel(`programs-staff-${staffId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'programs',
            filter: `staff_id=eq.${staffId}`,
          },
          () => bump(),
        )
        .subscribe();
      channels.push(progCh);
    }

    if (role === 'admin') {
      (['staff_applications', 'corporate_applications', 'contact_inquiries'] as const).forEach(
        (table) => {
          const ch = client
            .channel(`apps-sync-${table}`)
            .on(
              'postgres_changes',
              { event: '*', schema: 'public', table },
              () => bump(),
            )
            .subscribe();
          channels.push(ch);
        },
      );
    }

    return () => {
      channels.forEach((ch) => {
        try {
          client.removeChannel(ch as never);
        } catch {
          /* ignore */
        }
      });
    };
  }, [role, userId, staffId, onChange, muteThreadId]);
}
