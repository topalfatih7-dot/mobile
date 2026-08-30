/**
 * Realtime sync — web `useRealtimeSync.js` parity.
 * Member: own members row + programs(member_id).
 * Staff: programs(staff_id) + assigned members + admin_staff.
 * Admin: no mobile panel — no admin realtime channels.
 */
import { useEffect, useRef } from 'react';

import { getActiveChatThreadId } from '@/services/activeChatThread';
import { rowToMember, rowToProgram } from '@/services/mappers';
import { supabase } from '@/services/supabase';
import { perfInc } from '@/utils/perfCounters';
import { normalizeStaffRole } from '@/utils/staffClients';

export type ProgramsRealtimeChange =
  | { type: 'delete'; id: string }
  | { type: 'upsert'; program: Record<string, unknown> };

export type MemberRealtimeChange = {
  member: Record<string, unknown>;
};

export type StaffRealtimeChange = {
  staff: Record<string, unknown>;
};

export type IncomingChatMessage = {
  threadId: string;
  senderType: string;
  text: string;
  channel?: 'client' | 'collab';
  senderId?: string | null;
};

type Opts = {
  role: string | null;
  userId: string | null;
  staffId?: string | null;
  staffRole?: string | null;
  /** Platform-level refresh (staff row) — NOT chat */
  onChange: () => void;
  onProgramsChange?: (change: ProgramsRealtimeChange) => void;
  /** Chat badges / inbox only — never full hydrate */
  onChatChange?: () => void;
  /** Member own-row UPDATE or staff client member UPDATE */
  onMemberChange?: (change: MemberRealtimeChange) => void;
  /** Staff own-row UPDATE — refreshAuth yerine direkt uygula */
  onStaffChange?: (change: StaffRealtimeChange) => void;
  /** Member support tickets badge */
  onTicketsChange?: () => void;
  /** Yeni gelen chat mesajı (kendi gönderisi ve açık thread hariç) — direkt bildirim */
  onIncomingChatMessage?: (msg: IncomingChatMessage) => void;
};

export function usePlatformRealtime({
  role,
  userId,
  staffId,
  staffRole,
  onChange,
  onProgramsChange,
  onChatChange,
  onMemberChange,
  onStaffChange,
  onTicketsChange,
  onIncomingChatMessage,
}: Opts) {
  const onChangeRef = useRef(onChange);
  const onProgramsChangeRef = useRef(onProgramsChange);
  const onChatChangeRef = useRef(onChatChange);
  const onMemberChangeRef = useRef(onMemberChange);
  const onStaffChangeRef = useRef(onStaffChange);
  const onTicketsChangeRef = useRef(onTicketsChange);
  const onIncomingChatMessageRef = useRef(onIncomingChatMessage);
  onChangeRef.current = onChange;
  onProgramsChangeRef.current = onProgramsChange;
  onChatChangeRef.current = onChatChange;
  onMemberChangeRef.current = onMemberChange;
  onStaffChangeRef.current = onStaffChange;
  onTicketsChangeRef.current = onTicketsChange;
  onIncomingChatMessageRef.current = onIncomingChatMessage;

  useEffect(() => {
    if (!supabase || !userId) return;
    if (role !== 'staff' && role !== 'admin' && role !== 'member') return;

    perfInc('realtime_subscribe');
    const client = supabase;
    const channels: { unsubscribe: () => void }[] = [];

    const bump = () => {
      onChangeRef.current();
    };
    const bumpChat = () => {
      const chat = onChatChangeRef.current;
      if (chat) chat();
      else onChangeRef.current();
    };

    const applyProgramPayload = (payload: {
      eventType?: string;
      new?: Record<string, unknown>;
      old?: Record<string, unknown>;
    }) => {
      const handler = onProgramsChangeRef.current;
      if (!handler) {
        bump();
        return;
      }
      if (payload.eventType === 'DELETE') {
        const id = payload.old?.id;
        if (id != null) handler({ type: 'delete', id: String(id) });
        return;
      }
      if (payload.new) {
        handler({
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
            data?: Record<string, unknown>;
          };
          bumpChat();
          const senderId = row.sender_id != null ? String(row.sender_id) : null;
          if (senderId && senderId === String(userId)) return;
          if (staffId && senderId && senderId === String(staffId)) return;
          const openId = getActiveChatThreadId();
          if (openId && String(row.thread_id) === openId) return;
          // Direkt bildirim: notifications zincirini (DB round-trip) beklemeden anında göster
          onIncomingChatMessageRef.current?.({
            threadId: String(row.thread_id || ''),
            senderType: String(row.sender_type || ''),
            text: String((row.data as { text?: string })?.text || ''),
            channel: 'client',
            senderId,
          });
        },
      )
      .subscribe();
    channels.push(chatCh);

    if (role === 'member') {
      const ticketsCh = client
        .channel(`tickets-sync-${userId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'tickets' },
          () => {
            perfInc('realtime_ticket');
            if (onTicketsChangeRef.current) onTicketsChangeRef.current();
          },
        )
        .subscribe();
      channels.push(ticketsCh);
    }
    // Staff: no tickets table usage — skip subscription

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
          (payload) => {
            perfInc('realtime_member');
            const row = payload.new as Record<string, unknown> | undefined;
            if (row && onMemberChangeRef.current) {
              onMemberChangeRef.current({
                member: rowToMember(row) as Record<string, unknown>,
              });
              return;
            }
            bump();
          },
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

      const assignmentCol =
        normalizeStaffRole(staffRole) === 'doctor'
          ? 'assigned_doctor_id'
          : normalizeStaffRole(staffRole) === 'dietitian'
            ? 'assigned_dietitian_id'
            : 'assigned_coach_id';

      const membersCh = client
        .channel(`staff-members-${staffId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'members',
            filter: `${assignmentCol}=eq.${staffId}`,
          },
          (payload) => {
            perfInc('realtime_member', 'member');
            const row = payload.new as Record<string, unknown> | undefined;
            if (row && onMemberChangeRef.current) {
              onMemberChangeRef.current({
                member: rowToMember(row) as Record<string, unknown>,
              });
            }
          },
        )
        .subscribe();
      channels.push(membersCh);

      // Staff notifications live on staff row — refreshAuth round-trip olmadan direkt uygula
      const staffRowCh = client
        .channel(`staff-row-${staffId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'staff',
            filter: `id=eq.${staffId}`,
          },
          (payload) => {
            const row = payload.new as Record<string, unknown> | undefined;
            if (row && onStaffChangeRef.current) {
              onStaffChangeRef.current({ staff: row });
            } else {
              bump();
            }
          },
        )
        .subscribe();
      channels.push(staffRowCh);

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

      const collabMsgCh = client
        .channel(`staff-collab-msgs-sync-${staffId}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'staff_collab_messages' },
          (payload) => {
            const row = payload.new as {
              thread_id?: string;
              sender_id?: string | null;
              sender_type?: string;
              data?: Record<string, unknown>;
            };
            bumpChat();
            const senderId = row.sender_id != null ? String(row.sender_id) : null;
            if (senderId && senderId === String(userId)) return;
            if (senderId && senderId === String(staffId)) return;
            const openId = getActiveChatThreadId();
            if (openId && String(row.thread_id) === openId) return;
            onIncomingChatMessageRef.current?.({
              threadId: String(row.thread_id || ''),
              senderType: String(row.sender_type || ''),
              text: String((row.data as { text?: string })?.text || ''),
              channel: 'collab',
              senderId,
            });
          },
        )
        .subscribe();
      channels.push(collabMsgCh);
    }

    return () => {
      perfInc('realtime_unsubscribe');
      channels.forEach((ch) => {
        try {
          client.removeChannel(ch as never);
        } catch {
          /* ignore */
        }
      });
    };
    // Refs hold latest handlers — only re-subscribe when identity keys change
  }, [role, userId, staffId, staffRole]);
}
