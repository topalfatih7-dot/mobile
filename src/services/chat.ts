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

export async function loadMemberChat(
  contacts: ChatContact[],
  memberId: string,
  memberName: string,
): Promise<{ threads: ChatThread[]; messages: Record<string, ChatMessage[]> }> {
  if (isUiOnly()) {
    return getChatSnapshot(contacts, memberName, memberId);
  }

  const sb = requireSupabase();
  let threads = await fetchMemberChatThreads(memberId);

  // Ensure a thread per assigned contact (getOrCreate parity)
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
    }
  }

  const messages: Record<string, ChatMessage[]> = {};
  if (threads.length) {
    const ids = threads.map((t) => t.id);
    const { data: msgRows, error: msgErr } = await sb
      .from('chat_messages')
      .select('*')
      .in('thread_id', ids)
      .order('created_at', { ascending: true });
    if (msgErr) throw msgErr;
    for (const row of msgRows || []) {
      const m = rowToChatMessage(row as Record<string, unknown>);
      if (!messages[m.threadId]) messages[m.threadId] = [];
      messages[m.threadId].push(m);
    }
  }

  return { threads, messages };
}

export async function recordChatConsent(threadId: string): Promise<void> {
  if (isUiOnly()) {
    uiConsent(threadId);
    return;
  }
  const sb = requireSupabase();
  const iso = new Date().toISOString();
  const { data: row, error: readErr } = await sb
    .from('chat_threads')
    .select('data')
    .eq('id', threadId)
    .maybeSingle();
  if (readErr || !row) throw readErr || new Error('Sohbet bulunamadı.');
  const data = { ...((row?.data as object) || {}), memberConsentAt: iso };
  const { error: updateErr } = await sb
    .from('chat_threads')
    .update({ data })
    .eq('id', threadId);
  if (updateErr) throw updateErr;
}

export async function markChatThreadRead(threadId: string): Promise<void> {
  if (isUiOnly()) {
    uiMarkRead(threadId);
    return;
  }
  const sb = requireSupabase();
  const { data: row, error: readErr } = await sb
    .from('chat_threads')
    .select('data')
    .eq('id', threadId)
    .maybeSingle();
  if (readErr || !row) throw readErr || new Error('Sohbet bulunamadı.');
  const data = { ...((row?.data as object) || {}), memberUnread: 0 };
  const { error: updateErr } = await sb
    .from('chat_threads')
    .update({ data })
    .eq('id', threadId);
  if (updateErr) throw updateErr;
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

  const preview =
    trimmed.length > 120 ? `${trimmed.slice(0, 119)}…` : trimmed;
  const { data: row, error: threadReadErr } = await sb
    .from('chat_threads')
    .select('data')
    .eq('id', threadId)
    .maybeSingle();
  if (threadReadErr || !row) {
    return {
      success: false,
      error: threadReadErr?.message || 'Sohbet bulunamadı.',
    };
  }
  const prev = (row?.data as Record<string, unknown>) || {};
  const data = {
    ...prev,
    lastPreview: preview,
    staffUnread: Number(prev.staffUnread || 0) + 1,
  };
  const { error: updateErr } = await sb
    .from('chat_threads')
    .update({ last_message_at: new Date().toISOString(), data })
    .eq('id', threadId);
  if (updateErr) return { success: false, error: updateErr.message };

  return { success: true };
}
