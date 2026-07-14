/**
 * Admin ↔ Staff sohbet — web `adminChatDb.js` sözleşmesi.
 */
import { supabase } from '@/services/supabaseClient';
import type { StaffProfile } from '@/types/session';

const nowISO = () => new Date().toISOString();

export type AdminStaffThread = {
  id: string;
  staffId: string;
  lastMessageAt: string | null;
  staffName: string;
  staffRole: string;
  lastPreview: string;
  adminUnread: number;
  staffUnread: number;
  createdAt: string;
  data?: Record<string, unknown>;
};

export type AdminStaffMessage = {
  id: string;
  threadId: string;
  senderType: string;
  senderId: string | null;
  text: string;
  createdAt: string;
};

type ThreadRow = {
  id: string;
  staff_id: string;
  last_message_at: string | null;
  created_at: string;
  data?: Record<string, unknown> | null;
};

type MessageRow = {
  id: string;
  thread_id: string;
  sender_type: string;
  sender_id: string | null;
  created_at: string;
  data?: { text?: string } | null;
};

export function rowToAdminStaffThread(row: ThreadRow): AdminStaffThread {
  const d = row.data || {};
  return {
    id: row.id,
    staffId: row.staff_id,
    lastMessageAt: row.last_message_at,
    staffName: String(d.staffName || ''),
    staffRole: String(d.staffRole || ''),
    lastPreview: String(d.lastPreview || ''),
    adminUnread: Number(d.adminUnread || 0),
    staffUnread: Number(d.staffUnread || 0),
    createdAt: row.created_at,
    data: d,
  };
}

export function rowToAdminStaffMessage(row: MessageRow): AdminStaffMessage {
  return {
    id: row.id,
    threadId: row.thread_id,
    senderType: row.sender_type,
    senderId: row.sender_id,
    text: row.data?.text || '',
    createdAt: row.created_at,
  };
}

export async function fetchAdminStaffThreads(): Promise<AdminStaffThread[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('admin_staff_threads')
    .select('*')
    .order('last_message_at', { ascending: false, nullsFirst: false });
  if (error) return [];
  return (data || []).map(rowToAdminStaffThread);
}

export async function fetchAdminStaffThreadsForStaff(staffId: string): Promise<AdminStaffThread[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('admin_staff_threads')
    .select('*')
    .eq('staff_id', staffId)
    .order('last_message_at', { ascending: false, nullsFirst: false });
  if (error) return [];
  return (data || []).map(rowToAdminStaffThread);
}

export async function fetchAdminStaffMessages(threadId: string, limit = 200): Promise<AdminStaffMessage[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('admin_staff_messages')
    .select('*')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true })
    .limit(limit);
  if (error) return [];
  return (data || []).map(rowToAdminStaffMessage);
}

export async function getOrCreateAdminStaffThread(staff: StaffProfile | null | undefined) {
  if (!supabase || !staff?.id) return null;

  const { data: existing } = await supabase
    .from('admin_staff_threads')
    .select('*')
    .eq('staff_id', staff.id)
    .maybeSingle();

  if (existing) return rowToAdminStaffThread(existing);

  const { data: row, error } = await supabase
    .from('admin_staff_threads')
    .insert({
      staff_id: staff.id,
      data: {
        staffName: staff.name || 'Personel',
        staffRole: staff.role || '',
        adminUnread: 0,
        staffUnread: 0,
      },
    })
    .select()
    .single();

  if (error || !row) return null;
  return rowToAdminStaffThread(row);
}

export async function ensureAdminStaffThreads(staffList: StaffProfile[] = []) {
  const threads: AdminStaffThread[] = [];
  for (const staff of staffList) {
    const thread = await getOrCreateAdminStaffThread(staff);
    if (thread) threads.push(thread);
  }
  return threads.sort((a, b) => {
    const aTime = new Date(a.lastMessageAt || a.createdAt || 0).getTime();
    const bTime = new Date(b.lastMessageAt || b.createdAt || 0).getTime();
    return bTime - aTime;
  });
}

export async function sendAdminStaffMessage({
  thread,
  senderType,
  senderId,
  text,
}: {
  thread: AdminStaffThread;
  senderType: 'admin' | 'staff';
  senderId?: string | null;
  text: string;
}) {
  if (!supabase) return { success: false as const, error: 'Supabase yapılandırılmadı.' };
  const value = String(text || '').trim();
  if (!value || !thread?.id) return { success: false as const, error: 'Mesaj boş.' };

  const { data: msgRow, error: msgErr } = await supabase
    .from('admin_staff_messages')
    .insert({
      thread_id: thread.id,
      sender_type: senderType,
      sender_id: senderId || null,
      data: { text: value },
    })
    .select()
    .single();

  if (msgErr || !msgRow) return { success: false as const, error: msgErr?.message || 'Gönderilemedi.' };

  const preview = value.length > 120 ? `${value.slice(0, 119)}…` : value;
  const data = { ...(thread.data || {}) };
  data.lastPreview = preview;
  if (senderType === 'admin') {
    data.staffUnread = Number(data.staffUnread || 0) + 1;
  } else {
    data.adminUnread = Number(data.adminUnread || 0) + 1;
  }

  const stamped = nowISO();
  await supabase
    .from('admin_staff_threads')
    .update({ last_message_at: stamped, data })
    .eq('id', thread.id);

  return {
    success: true as const,
    message: rowToAdminStaffMessage(msgRow),
    thread: rowToAdminStaffThread({
      id: thread.id,
      staff_id: thread.staffId,
      last_message_at: stamped,
      created_at: thread.createdAt,
      data,
    }),
  };
}

export async function markAdminStaffThreadRead(threadId: string, readerType: 'admin' | 'staff') {
  if (!supabase) return null;
  const { data: row } = await supabase.from('admin_staff_threads').select('*').eq('id', threadId).maybeSingle();
  if (!row) return null;
  const data = { ...(row.data || {}) };
  if (readerType === 'admin') data.adminUnread = 0;
  if (readerType === 'staff') data.staffUnread = 0;
  await supabase.from('admin_staff_threads').update({ data }).eq('id', threadId);
  return rowToAdminStaffThread({ ...row, data });
}

export async function hydrateAdminStaffThreads(
  sessionType: string | null | undefined,
  staffList: StaffProfile[],
  staffUser: StaffProfile | null,
) {
  if (!sessionType) return [];
  if (sessionType === 'admin') return ensureAdminStaffThreads(staffList);
  if (sessionType === 'staff' && staffUser?.id) {
    const thread = await getOrCreateAdminStaffThread(staffUser);
    return thread ? [thread] : [];
  }
  return [];
}
