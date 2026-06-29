import { supabase } from '@/services/supabaseClient';

export type DbChatThread = {
  id: string;
  memberId: string;
  staffId: string;
  staffRole: string;
  lastMessageAt: string | null;
  memberName: string;
  staffName: string;
  lastPreview: string;
  memberUnread: number;
  staffUnread: number;
  createdAt: string;
  data?: Record<string, unknown>;
};

export type DbChatMessage = {
  id: string;
  threadId: string;
  senderType: string;
  senderId: string | null;
  text: string;
  createdAt: string;
};

type ChatThreadRow = {
  id: string;
  member_id: string;
  staff_id: string;
  staff_role: string;
  last_message_at: string | null;
  created_at: string;
  data?: {
    memberName?: string;
    staffName?: string;
    lastPreview?: string;
    memberUnread?: number;
    staffUnread?: number;
    memberConsentAt?: string | null;
  } | null;
};

type ChatMessageRow = {
  id: string;
  thread_id: string;
  sender_type: string;
  sender_id: string | null;
  created_at: string;
  data?: { text?: string } | null;
};

const nowISO = () => new Date().toISOString();

export function rowToChatThread(row: ChatThreadRow): DbChatThread {
  const data = row.data || {};
  return {
    id: row.id,
    memberId: row.member_id,
    staffId: row.staff_id,
    staffRole: row.staff_role,
    lastMessageAt: row.last_message_at,
    memberName: data.memberName || '',
    staffName: data.staffName || '',
    lastPreview: data.lastPreview || '',
    memberUnread: Number(data.memberUnread || 0),
    staffUnread: Number(data.staffUnread || 0),
    createdAt: row.created_at,
    data,
  };
}

export function rowToChatMessage(row: ChatMessageRow): DbChatMessage {
  return {
    id: row.id,
    threadId: row.thread_id,
    senderType: row.sender_type,
    senderId: row.sender_id,
    text: row.data?.text || '',
    createdAt: row.created_at,
  };
}

export async function fetchStaffChatThreads(staffId: string): Promise<DbChatThread[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('chat_threads')
    .select('*')
    .eq('staff_id', staffId)
    .order('last_message_at', { ascending: false, nullsFirst: false });
  if (error) return [];
  return (data || []).map(rowToChatThread);
}

export async function fetchMemberChatThreads(memberId: string): Promise<DbChatThread[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('chat_threads')
    .select('*')
    .eq('member_id', memberId)
    .order('last_message_at', { ascending: false, nullsFirst: false });
  if (error) return [];
  return (data || []).map(rowToChatThread);
}

export async function fetchChatThreadById(threadId: string): Promise<DbChatThread | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from('chat_threads').select('*').eq('id', threadId).maybeSingle();
  if (error || !data) return null;
  return rowToChatThread(data);
}

export async function fetchChatMessages(threadId: string, limit = 200): Promise<DbChatMessage[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true })
    .limit(limit);
  if (error) return [];
  return (data || []).map(rowToChatMessage);
}

export async function sendChatMessage({
  thread,
  senderType,
  senderId,
  text,
}: {
  thread: DbChatThread;
  senderType: 'member' | 'staff';
  senderId: string | null;
  text: string;
}): Promise<{ success: boolean; error?: string; message?: DbChatMessage }> {
  if (!supabase) return { success: false, error: 'Supabase yapılandırılmadı.' };

  const value = String(text || '').trim();
  if (!value || !thread?.id) return { success: false, error: 'Mesaj boş.' };

  const { data: msgRow, error: msgErr } = await supabase
    .from('chat_messages')
    .insert({
      thread_id: thread.id,
      sender_type: senderType,
      sender_id: senderId || null,
      data: { text: value },
    })
    .select()
    .single();

  if (msgErr) return { success: false, error: msgErr.message };

  const preview = value.length > 120 ? `${value.slice(0, 119)}…` : value;
  const data = { ...(thread.data || {}) } as Record<string, unknown>;
  data.lastPreview = preview;
  if (senderType === 'member') {
    data.staffUnread = Number(data.staffUnread || 0) + 1;
  } else if (senderType === 'staff') {
    data.memberUnread = Number(data.memberUnread || 0) + 1;
  }

  await supabase
    .from('chat_threads')
    .update({
      last_message_at: nowISO(),
      data,
    })
    .eq('id', thread.id);

  return { success: true, message: rowToChatMessage(msgRow) };
}

export async function markChatThreadRead(
  threadId: string,
  readerType: 'member' | 'staff',
): Promise<DbChatThread | null> {
  if (!supabase) return null;
  const { data: row } = await supabase.from('chat_threads').select('*').eq('id', threadId).maybeSingle();
  if (!row) return null;

  const data = { ...(row.data || {}) } as Record<string, unknown>;
  if (readerType === 'member') data.memberUnread = 0;
  if (readerType === 'staff') data.staffUnread = 0;

  await supabase.from('chat_threads').update({ data }).eq('id', threadId);
  return rowToChatThread({ ...row, data });
}
