/**
 * Supabase Realtime — web `subscribeRealtimeSync` (chat + admin-staff + collab + member/programs).
 */
import {
  rowToAdminStaffMessage,
  rowToAdminStaffThread,
  type AdminStaffMessage,
  type AdminStaffThread,
} from '@/services/db/adminChat';
import { rowToChatMessage, rowToChatThread, type DbChatMessage, type DbChatThread } from '@/services/db/chat';
import { rowToMember } from '@/services/db/mappers';
import { rowToProgram, type DbProgram } from '@/services/db/programs';
import {
  rowToStaffCollabMessage,
  rowToStaffCollabThread,
  type StaffCollabMessage,
  type StaffCollabThread,
} from '@/services/db/staffCollabChat';
import { supabase } from '@/services/supabaseClient';
import type { MemberProfile, SessionType } from '@/types/session';

export type RealtimeSession = {
  type: SessionType;
  memberId?: string | null;
  staffId?: string | null;
};

export type SubscribeRealtimeSyncOpts = {
  session: RealtimeSession;
  memberId?: string | null;
  staffId?: string | null;
  isChatMessageRelevant?: (threadId: string) => boolean;
  isAdminStaffMessageRelevant?: (threadId: string) => boolean;
  isStaffCollabMessageRelevant?: (threadId: string) => boolean;
  onMemberChange?: (member: MemberProfile) => void;
  onChatThreadChange?: (thread: DbChatThread) => void;
  onChatMessageChange?: (message: DbChatMessage) => void;
  onAdminStaffThreadChange?: (thread: AdminStaffThread) => void;
  onAdminStaffMessageChange?: (message: AdminStaffMessage) => void;
  onStaffCollabThreadChange?: (thread: StaffCollabThread) => void;
  onStaffCollabMessageChange?: (message: StaffCollabMessage) => void;
  onProgramsChange?: (
    event: { type: 'delete'; id: string } | { type: 'upsert'; program: DbProgram },
  ) => void;
};

export function subscribeRealtimeSync(opts: SubscribeRealtimeSyncOpts) {
  if (!supabase || !opts.session) return () => {};

  const {
    session,
    memberId,
    staffId,
    isChatMessageRelevant,
    isAdminStaffMessageRelevant,
    isStaffCollabMessageRelevant,
    onMemberChange,
    onChatThreadChange,
    onChatMessageChange,
    onAdminStaffThreadChange,
    onAdminStaffMessageChange,
    onStaffCollabThreadChange,
    onStaffCollabMessageChange,
    onProgramsChange,
  } = opts;

  const channels: ReturnType<NonNullable<typeof supabase>['channel']>[] = [];

  const chatThreadChannel = supabase
    .channel('chat-threads-sync')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_threads' }, (payload) => {
      if (!payload.new && payload.eventType === 'DELETE') return;
      if (payload.new) {
        const thread = rowToChatThread(payload.new as Parameters<typeof rowToChatThread>[0]);
        if (session.type === 'member' && thread.memberId !== memberId) return;
        if (session.type === 'staff' && String(thread.staffId) !== String(staffId)) return;
        onChatThreadChange?.(thread);
      }
    })
    .subscribe();
  channels.push(chatThreadChannel);

  const chatMessageChannel = supabase
    .channel('chat-messages-sync')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, (payload) => {
      if (!payload.new) return;
      const threadId = (payload.new as { thread_id?: string }).thread_id;
      if (!threadId) return;
      if (isChatMessageRelevant && !isChatMessageRelevant(threadId)) return;
      onChatMessageChange?.(rowToChatMessage(payload.new as Parameters<typeof rowToChatMessage>[0]));
    })
    .subscribe();
  channels.push(chatMessageChannel);

  const adminStaffThreadChannel = supabase
    .channel('admin-staff-threads-sync')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'admin_staff_threads' }, (payload) => {
      if (!payload.new && payload.eventType === 'DELETE') return;
      if (payload.new) {
        const thread = rowToAdminStaffThread(payload.new as Parameters<typeof rowToAdminStaffThread>[0]);
        if (session.type === 'staff' && String(thread.staffId) !== String(staffId)) return;
        onAdminStaffThreadChange?.(thread);
      }
    })
    .subscribe();
  channels.push(adminStaffThreadChannel);

  const adminStaffMessageChannel = supabase
    .channel('admin-staff-messages-sync')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'admin_staff_messages' }, (payload) => {
      if (!payload.new) return;
      const threadId = (payload.new as { thread_id?: string }).thread_id;
      if (!threadId) return;
      if (isAdminStaffMessageRelevant && !isAdminStaffMessageRelevant(threadId)) return;
      onAdminStaffMessageChange?.(
        rowToAdminStaffMessage(payload.new as Parameters<typeof rowToAdminStaffMessage>[0]),
      );
    })
    .subscribe();
  channels.push(adminStaffMessageChannel);

  const staffCollabThreadChannel = supabase
    .channel('staff-collab-threads-sync')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'staff_collab_threads' }, (payload) => {
      if (!payload.new && payload.eventType === 'DELETE') return;
      if (payload.new) {
        const thread = rowToStaffCollabThread(payload.new as Parameters<typeof rowToStaffCollabThread>[0]);
        if (session.type === 'staff') {
          const sid = String(staffId);
          if (String(thread.coachId) !== sid && String(thread.dietitianId) !== sid) return;
        }
        onStaffCollabThreadChange?.(thread);
      }
    })
    .subscribe();
  channels.push(staffCollabThreadChannel);

  const staffCollabMessageChannel = supabase
    .channel('staff-collab-messages-sync')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'staff_collab_messages' }, (payload) => {
      if (!payload.new) return;
      const threadId = (payload.new as { thread_id?: string }).thread_id;
      if (!threadId) return;
      if (isStaffCollabMessageRelevant && !isStaffCollabMessageRelevant(threadId)) return;
      onStaffCollabMessageChange?.(
        rowToStaffCollabMessage(payload.new as Parameters<typeof rowToStaffCollabMessage>[0]),
      );
    })
    .subscribe();
  channels.push(staffCollabMessageChannel);

  if (session.type === 'member' && memberId) {
    const memberChannel = supabase
      .channel(`member-${memberId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'members', filter: `id=eq.${memberId}` },
        (payload) => {
          if (payload.new) {
            const mapped = rowToMember(payload.new as Parameters<typeof rowToMember>[0]);
            if (mapped) onMemberChange?.(mapped);
          }
        },
      )
      .subscribe();
    channels.push(memberChannel);

    const programsChannel = supabase
      .channel(`programs-member-${memberId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'programs', filter: `member_id=eq.${memberId}` },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            onProgramsChange?.({ type: 'delete', id: (payload.old as { id?: string })?.id || '' });
            return;
          }
          if (payload.new) {
            onProgramsChange?.({
              type: 'upsert',
              program: rowToProgram(payload.new as Parameters<typeof rowToProgram>[0]),
            });
          }
        },
      )
      .subscribe();
    channels.push(programsChannel);
  }

  if (session.type === 'staff' && staffId) {
    const staffProgramsChannel = supabase
      .channel(`programs-staff-${staffId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'programs', filter: `staff_id=eq.${staffId}` },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            onProgramsChange?.({ type: 'delete', id: (payload.old as { id?: string })?.id || '' });
            return;
          }
          if (payload.new) {
            onProgramsChange?.({
              type: 'upsert',
              program: rowToProgram(payload.new as Parameters<typeof rowToProgram>[0]),
            });
          }
        },
      )
      .subscribe();
    channels.push(staffProgramsChannel);
  }

  return () => {
    channels.forEach((ch) => {
      void supabase!.removeChannel(ch);
    });
  };
}
