/**
 * Realtime sync — web `useRealtimeSync.js` parity.
 * Member: own members row + programs(member_id).
 * Staff: programs(staff_id) + admin_staff + collab.
 * Shared: chat_messages (sound) + tickets (+ admin applications).
 */
import { useEffect } from 'react';

import { isUiOnly } from '@/config/runtime';
import { getActiveChatThreadId } from '@/services/activeChatThread';
import { playNotificationSoundThrottled } from '@/services/notificationSound';
import { rowToProgram } from '@/services/mappers';
import { supabase } from '@/services/supabase';

export type ProgramsRealtimeChange =
  | { type: 'delete'; id: string }
  | { type: 'upsert'; program: Record<string, unknown> };

type Opts = {
  role: string | null;
  userId: string | null;
  staffId?: string | null;
  onChange: () => void;
  onProgramsChange?: (change: ProgramsRealtimeChange) => void;
  /** Extra chat-related bump (badges) — same as onChange when omitted */
  onChatChange?: () => void;
};

export function usePlatformRealtime({
  role,
  userId,
  staffId,
  onChange,
  onProgramsChange,
  onChatChange,
}: Opts) {
  useEffect(() => {
    if (isUiOnly() || !supabase || !userId) return;
    if (role !== 'staff' && role !== 'admin' && role !== 'member') return;

    const client = supabase;
    const channels: { unsubscribe: () => void }[] = [];

    const bump = () => {
      onChange();
    };
    const bumpChat = () => {
      (onChatChange || onChange)();
    };

    const applyProgramPayload = (payload: {
      eventType?: string;
      new?: Record<string, unknown>;
      old?: Record<string, unknown>;
    }) => {
      if (!onProgramsChange) {
        bump();
        return;
      }
      if (payload.eventType === 'DELETE') {
        const id = payload.old?.id;
        if (id != null) onProgramsChange({ type: 'delete', id: String(id) });
        return;
      }
      if (payload.new) {
        onProgramsChange({
          type: 'upsert',
          program: rowToProgram(payload.new) as Record<string, unknown>,
        });
      }
    };

    // Incoming chat sound — skip own sends + open thread (web useIncomingChatSound)
    const chatCh = client
      .channel(`chat-messages-sync-${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        (payload) => {
          const row = payload.new as {
            thread_id?: string;
            sender_id?: string | null;
            sender_type?: string;
          };
          bumpChat();
          const senderId = row.sender_id != null ? String(row.sender_id) : null;
          if (senderId && senderId === String(userId)) return;
          // Staff sends with staff.id; member with userId — also skip when sender is staffId
          if (staffId && senderId && senderId === String(staffId)) return;
          const openId = getActiveChatThreadId();
          if (openId && String(row.thread_id) === openId) return;
          void playNotificationSoundThrottled();
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

    if (role === 'member') {
      const memberCh = client
        .channel(`member-${userId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'members',
            filter: `id=eq.${userId}`,
          },
          () => bump(),
        )
        .subscribe();
      channels.push(memberCh);

      const progCh = client
        .channel(`programs-member-${userId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'programs',
            filter: `member_id=eq.${userId}`,
          },
          (payload) => applyProgramPayload(payload as never),
        )
        .subscribe();
      channels.push(progCh);
    }

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
          (payload) => applyProgramPayload(payload as never),
        )
        .subscribe();
      channels.push(progCh);

      const adminStaffCh = client
        .channel(`admin-staff-sync-${staffId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'admin_staff_threads',
            filter: `staff_id=eq.${staffId}`,
          },
          () => bumpChat(),
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'admin_staff_messages' },
          () => bumpChat(),
        )
        .subscribe();
      channels.push(adminStaffCh);

      const collabCh = client
        .channel(`staff-collab-sync-${staffId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'staff_collab_threads' },
          () => bumpChat(),
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'staff_collab_messages' },
          () => bumpChat(),
        )
        .subscribe();
      channels.push(collabCh);
    }

    if (role === 'admin') {
      const adminStaffCh = client
        .channel(`admin-staff-all-${userId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'admin_staff_threads' },
          () => bumpChat(),
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'admin_staff_messages' },
          () => bumpChat(),
        )
        .subscribe();
      channels.push(adminStaffCh);

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
  }, [role, userId, staffId, onChange, onProgramsChange, onChatChange]);
}
