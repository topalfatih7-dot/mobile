/**
 * LOCK: docs/mobile/domains/chat-model.md
 * UI-only → uiChat; production → chat_threads / chat_messages + realtime.
 */
import { isUiOnly } from '@/config/runtime';
import {
  getChatSnapshot,
  markChatThreadRead as uiMarkRead,
  recordChatConsent as uiConsent,
  sendChatMessage as uiSend,
  subscribeChatUi,
  type UiChatMessage,
  type UiChatThread,
} from '@/data/uiChat';
import { requireSupabase } from '@/services/supabase';
import { notifyMemberChatMessage, notifyWhatsAppEvent } from '@/services/memberNotifications';
import type { ChatContact } from '@/utils/chatContacts';
import {
  CONTACT_INFO_BLOCK_MESSAGE,
  detectExternalContactInfo,
} from '@/utils/contactInfoGuard';

export type ChatThread = UiChatThread;
export type ChatMessage = UiChatMessage;

let channelSequence = 0;

function rowToChatThread(row: Record<string, unknown>): ChatThread {
  const data = (row.data as Record<string, unknown>) || {};
  return {
    id: String(row.id),
    memberId: String(row.member_id || ''),
    staffId: String(row.staff_id || ''),
    staffRole: String(row.staff_role || 'coach') as ChatThread['staffRole'],
    lastMessageAt: row.last_message_at ? String(row.last_message_at) : null,
    memberName: String(data.memberName || ''),
    staffName: String(data.staffName || ''),
    lastPreview: String(data.lastPreview || ''),
    memberUnread: Number(data.memberUnread || 0),
    staffUnread: Number(data.staffUnread || 0),
    memberConsentAt: data.memberConsentAt ? String(data.memberConsentAt) : null,
    createdAt: String(row.created_at || new Date().toISOString()),
    data,
  };
}

function rowToChatMessage(row: Record<string, unknown>): ChatMessage {
  const data = (row.data as Record<string, unknown>) || {};
  return {
    id: String(row.id),
    threadId: String(row.thread_id || ''),
    senderType: String(row.sender_type || 'member') as ChatMessage['senderType'],
    senderId: row.sender_id != null ? String(row.sender_id) : null,
    text: String(data.text || ''),
    createdAt: String(row.created_at || ''),
  };
}

export function subscribeMemberChat(
  listener: () => void,
  memberId?: string,
): () => void {
  if (isUiOnly()) return subscribeChatUi(listener);

  const sb = requireSupabase();
  channelSequence += 1;
  const channel = sb
    .channel(`member-chat-${memberId || 'current'}-${channelSequence}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'chat_threads',
        ...(memberId ? { filter: `member_id=eq.${memberId}` } : {}),
      },
      () => listener(),
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'chat_messages' },
      () => listener(),
    )
    .subscribe();

  return () => {
    void sb.removeChannel(channel);
  };
}

/** Staff: chat_threads for staff_id + all chat_messages (RLS scoped). */
export function subscribeStaffClientChat(
  listener: () => void,
  staffId?: string,
): () => void {
  if (isUiOnly() || !staffId) return () => {};
  const sb = requireSupabase();
  channelSequence += 1;
  const channel = sb
    .channel(`staff-client-chat-${staffId}-${channelSequence}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'chat_threads',
        filter: `staff_id=eq.${staffId}`,
      },
      () => listener(),
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'chat_messages' },
      () => listener(),
    )
    .subscribe();
  return () => {
    void sb.removeChannel(channel);
  };
}

export async function fetchMemberChatThreads(
  memberId: string,
): Promise<ChatThread[]> {
  if (isUiOnly()) return getChatSnapshot([], '', memberId).threads;

  const sb = requireSupabase();
  const { data, error } = await sb
    .from('chat_threads')
    .select('*')
    .eq('member_id', memberId)
    .order('last_message_at', { ascending: false, nullsFirst: false });
  if (error) throw error;
  return (data || []).map((row) =>
    rowToChatThread(row as Record<string, unknown>),
  );
}

/** Badge-only: threads + unread totals — no message bodies. */
export async function fetchMemberChatUnreadSummary(
  memberId: string,
): Promise<{ threads: ChatThread[]; unreadTotal: number }> {
  const threads = await fetchMemberChatThreads(memberId);
  const unreadTotal = threads.reduce(
    (sum, t) => sum + Number(t.memberUnread || 0),
    0,
  );
  return { threads, unreadTotal };
}

/** Badge-only for staff client chat. */
export async function fetchStaffChatUnreadSummary(
  staffId: string,
): Promise<{ threads: ChatThread[]; unreadTotal: number }> {
  const threads = await fetchStaffChatThreads(staffId);
  const unreadTotal = threads.reduce(
    (sum, t) => sum + Number(t.staffUnread || 0),
    0,
  );
  return { threads, unreadTotal };
}

export const CHAT_MESSAGE_PAGE_SIZE = 80;

/** Paginated thread messages (newest page first via before cursor). */
export async function fetchThreadMessagesPage(
  threadId: string,
  opts?: { limit?: number; before?: string | null },
): Promise<ChatMessage[]> {
  if (isUiOnly() || !threadId) return [];
  const sb = requireSupabase();
  const limit = opts?.limit ?? CHAT_MESSAGE_PAGE_SIZE;
  let q = sb
    .from('chat_messages')
    .select('*')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (opts?.before) {
    q = q.lt('created_at', opts.before);
  }
  const { data, error } = await q;
  if (error) throw error;
  return (data || [])
    .map((r) => rowToChatMessage(r as Record<string, unknown>))
    .reverse();
}

/** Ensure threads for contacts — no message bodies (inbox / badge). */
export async function ensureMemberChatThreads(
  contacts: ChatContact[],
  memberId: string,
  memberName: string,
): Promise<ChatThread[]> {
  if (isUiOnly()) {
    return getChatSnapshot(contacts, memberName, memberId).threads;
  }

  const sb = requireSupabase();
  let threads = await fetchMemberChatThreads(memberId);

  for (const c of contacts) {
    if (threads.some((t) => t.staffRole === c.staffRole)) continue;
    const seed = {
      member_id: memberId,
      staff_id: c.staffId,
      staff_role: c.staffRole,
      data: {
        memberName: memberName || 'Üye',
        staffName: c.name || '',
        memberUnread: 0,
        staffUnread: 0,
      },
    };
    const { data: created, error: insErr } = await sb
      .from('chat_threads')
      .insert(seed)
      .select('*')
      .maybeSingle();
    if (!insErr && created) {
      threads = [...threads, rowToChatThread(created as Record<string, unknown>)];
      continue;
    }
    threads = await fetchMemberChatThreads(memberId);
    if (!threads.some((t) => t.staffRole === c.staffRole) && insErr) {
      throw new Error(insErr.message || 'Sohbet oluşturulamadı.');
    }
  }
  // Web ensureMemberChatThreads: yalnız güncel contact rolleri (eski atama thread'leri inbox'ta yok)
  const roles = new Set(contacts.map((c) => c.staffRole));
  return threads.filter((t) => roles.has(t.staffRole));
}

export async function loadMemberChat(
  contacts: ChatContact[],
  memberId: string,
  memberName: string,
): Promise<{ threads: ChatThread[]; messages: Record<string, ChatMessage[]> }> {
  if (isUiOnly()) {
    return getChatSnapshot(contacts, memberName, memberId);
  }

  const threads = await ensureMemberChatThreads(contacts, memberId, memberName);
  const messages: Record<string, ChatMessage[]> = {};
  await Promise.all(
    threads.map(async (t) => {
      messages[t.id] = await fetchThreadMessagesPage(t.id, {
        limit: CHAT_MESSAGE_PAGE_SIZE,
      });
    }),
  );

  return { threads, messages };
}

/**
 * Web chatDb.recordChatConsent parity — hata fırlatmaz (local consent asıl kapı).
 */
export async function recordChatConsent(threadId: string): Promise<boolean> {
  if (isUiOnly()) {
    uiConsent(threadId);
    return true;
  }
  if (!threadId) return false;
  try {
    const sb = requireSupabase();
    const iso = new Date().toISOString();
    const { data: row, error: readErr } = await sb
      .from('chat_threads')
      .select('data')
      .eq('id', threadId)
      .maybeSingle();
    if (readErr || !row) return false;
    const prev =
      row.data && typeof row.data === 'object'
        ? (row.data as Record<string, unknown>)
        : {};
    const data = { ...prev, memberConsentAt: iso };
    const { error: updateErr } = await sb
      .from('chat_threads')
      .update({ data })
      .eq('id', threadId);
    return !updateErr;
  } catch {
    return false;
  }
}

export async function markChatThreadRead(threadId: string): Promise<boolean> {
  if (isUiOnly()) {
    uiMarkRead(threadId);
    return true;
  }
  const sb = requireSupabase();
  const { data: row, error: readErr } = await sb
    .from('chat_threads')
    .select('data')
    .eq('id', threadId)
    .maybeSingle();
  if (readErr || !row) throw readErr || new Error('Sohbet bulunamadı.');
  const prev =
    row.data && typeof row.data === 'object'
      ? (row.data as Record<string, unknown>)
      : {};
  if (Number(prev.memberUnread || 0) === 0) return true;
  const data = { ...prev, memberUnread: 0 };
  const { error: updateErr } = await sb
    .from('chat_threads')
    .update({ data })
    .eq('id', threadId);
  if (updateErr) throw updateErr;
  return true;
}

export async function sendChatMessage(
  threadId: string,
  memberId: string,
  text: string,
): Promise<{ success: true } | { success: false; error: string }> {
  const trimmed = text.trim();
  if (!trimmed) return { success: false, error: 'Mesaj boş.' };
  if (detectExternalContactInfo(trimmed)) {
    return { success: false, error: CONTACT_INFO_BLOCK_MESSAGE };
  }

  if (isUiOnly()) {
    return uiSend(threadId, memberId, text);
  }

  const sb = requireSupabase();
  const { error: insErr } = await sb.from('chat_messages').insert({
    thread_id: threadId,
    sender_type: 'member',
    sender_id: memberId,
    data: { text: trimmed },
  });
  if (insErr) {
    return {
      success: false,
      error: insErr.message.includes('CONTACT_INFO_BLOCKED')
        ? CONTACT_INFO_BLOCK_MESSAGE
        : insErr.message || 'Mesaj gönderilemedi.',
    };
  }

  // Web chatDb.js: mesaj insert başarılıysa thread meta güncellemesi best-effort
  // (update hatası send'i düşürmez — aksi halde UI "gönderilemedi" gösterir ama satır DB'de kalır)
  const preview =
    trimmed.length > 120 ? `${trimmed.slice(0, 119)}…` : trimmed;
  try {
    const { data: row } = await sb
      .from('chat_threads')
      .select('data')
      .eq('id', threadId)
      .maybeSingle();
    if (row) {
      const prev = (row.data as Record<string, unknown>) || {};
      const data = {
        ...prev,
        lastPreview: preview,
        staffUnread: Number(prev.staffUnread || 0) + 1,
      };
      await sb
        .from('chat_threads')
        .update({ last_message_at: new Date().toISOString(), data })
        .eq('id', threadId);
    }
  } catch {
    /* ignore meta update */
  }

  void notifyWhatsAppEvent('new_chat_message', {
    threadId,
    senderType: 'member',
    memberId,
  });

  return { success: true };
}

/** Staff: threads for assigned clients (by staff_id). */
export async function fetchStaffChatThreads(staffId: string): Promise<ChatThread[]> {
  if (isUiOnly() || !staffId) return [];
  const sb = requireSupabase();
  const { data, error } = await sb
    .from('chat_threads')
    .select('*')
    .eq('staff_id', staffId)
    .order('last_message_at', { ascending: false, nullsFirst: false });
  if (error) throw error;
  return (data || []).map((row) => rowToChatThread(row as Record<string, unknown>));
}

export async function loadStaffClientThread(
  memberId: string,
  staffId: string,
  staffRole: string,
  memberName: string,
  staffName: string,
): Promise<{ thread: ChatThread | null; messages: ChatMessage[] }> {
  if (isUiOnly()) {
    return { thread: null, messages: [] };
  }
  const sb = requireSupabase();
  let { data: row } = await sb
    .from('chat_threads')
    .select('*')
    .eq('member_id', memberId)
    .eq('staff_role', staffRole)
    .maybeSingle();

  if (!row) {
    const { data: created } = await sb
      .from('chat_threads')
      .insert({
        member_id: memberId,
        staff_id: staffId,
        staff_role: staffRole,
        data: {
          memberName: memberName || 'Üye',
          staffName: staffName || '',
          memberUnread: 0,
          staffUnread: 0,
        },
      })
      .select('*')
      .maybeSingle();
    row = created;
  }

  if (!row) return { thread: null, messages: [] };
  const thread = rowToChatThread(row as Record<string, unknown>);
  const messages = await fetchThreadMessagesPage(thread.id, {
    limit: CHAT_MESSAGE_PAGE_SIZE,
  });
  return { thread, messages };
}

export async function sendStaffChatMessage(
  threadId: string,
  staffId: string,
  text: string,
): Promise<{ success: true } | { success: false; error: string }> {
  const trimmed = text.trim();
  if (!trimmed) return { success: false, error: 'Mesaj boş.' };
  if (detectExternalContactInfo(trimmed)) {
    return { success: false, error: CONTACT_INFO_BLOCK_MESSAGE };
  }
  if (isUiOnly()) return { success: false, error: 'Demo modda mesaj yok.' };

  const sb = requireSupabase();
  const { error: insErr } = await sb.from('chat_messages').insert({
    thread_id: threadId,
    sender_type: 'staff',
    sender_id: staffId,
    data: { text: trimmed },
  });
  if (insErr) {
    return {
      success: false,
      error: insErr.message.includes('CONTACT_INFO_BLOCKED')
        ? CONTACT_INFO_BLOCK_MESSAGE
        : insErr.message || 'Mesaj gönderilemedi.',
    };
  }

  const preview = trimmed.length > 120 ? `${trimmed.slice(0, 119)}…` : trimmed;
  let memberId = '';
  let staffRole = '';
  try {
    const { data: row } = await sb
      .from('chat_threads')
      .select('member_id, staff_role, data')
      .eq('id', threadId)
      .maybeSingle();
    if (row) {
      memberId = String((row as { member_id?: string }).member_id || '');
      staffRole = String((row as { staff_role?: string }).staff_role || '');
      const prev = (row.data as Record<string, unknown>) || {};
      const data = {
        ...prev,
        lastPreview: preview,
        memberUnread: Number(prev.memberUnread || 0) + 1,
      };
      await sb
        .from('chat_threads')
        .update({ last_message_at: new Date().toISOString(), data })
        .eq('id', threadId);
    }
  } catch {
    /* ignore meta update */
  }

  // Web parity: staff → member bell + push (chatDb.notifyMemberChatMessage)
  if (memberId) {
    void notifyMemberChatMessage({
      memberId,
      preview,
      threadId,
      staffRole,
    });
  }

  return { success: true };
}

export async function markStaffChatThreadRead(threadId: string): Promise<void> {
  if (isUiOnly()) return;
  const sb = requireSupabase();
  const { data: row } = await sb
    .from('chat_threads')
    .select('data')
    .eq('id', threadId)
    .maybeSingle();
  if (!row) return;
  const prev =
    row.data && typeof row.data === 'object'
      ? (row.data as Record<string, unknown>)
      : {};
  if (Number(prev.staffUnread || 0) === 0) return;
  const data = { ...prev, staffUnread: 0 };
  await sb.from('chat_threads').update({ data }).eq('id', threadId);
}
