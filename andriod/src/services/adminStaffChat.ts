/**
 * Web parity: Adsız `src/services/adminChatDb.js`
 */
import { requireSupabase, supabase } from '@/services/supabase';
import { notifyStaffAdminMessage } from '@/services/staffNotifications';

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
  data: Record<string, unknown>;
};

export type AdminStaffMessage = {
  id: string;
  threadId: string;
  senderType: string;
  senderId: string | null;
  text: string;
  createdAt: string;
};

function rowToAdminStaffThread(row: Record<string, unknown>): AdminStaffThread {
  const d = (row.data as Record<string, unknown>) || {};
  return {
    id: String(row.id),
    staffId: String(row.staff_id || ''),
    lastMessageAt: row.last_message_at ? String(row.last_message_at) : null,
    staffName: String(d.staffName || ''),
    staffRole: String(d.staffRole || ''),
    lastPreview: String(d.lastPreview || ''),
    adminUnread: Number(d.adminUnread || 0),
    staffUnread: Number(d.staffUnread || 0),
    createdAt: String(row.created_at || ''),
    data: d,
  };
}

function rowToAdminStaffMessage(row: Record<string, unknown>): AdminStaffMessage {
  const d = (row.data as Record<string, unknown>) || {};
  return {
    id: String(row.id),
    threadId: String(row.thread_id || ''),
    senderType: String(row.sender_type || ''),
    senderId: row.sender_id != null ? String(row.sender_id) : null,
    text: String(d.text || ''),
    createdAt: String(row.created_at || ''),
  };
}

export async function getOrCreateAdminStaffThread(staff: {
  id: string;
  name?: string;
  role?: string;
}): Promise<AdminStaffThread | null> {
  if (!staff?.id || !supabase) return null;
  const client = requireSupabase();
  const { data: existing } = await client
    .from('admin_staff_threads')
    .select('*')
    .eq('staff_id', staff.id)
    .maybeSingle();
  if (existing) return rowToAdminStaffThread(existing as Record<string, unknown>);

  const { data: row, error } = await client
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
  return rowToAdminStaffThread(row as Record<string, unknown>);
}

export async function ensureAdminStaffThreads(
  staffList: { id: string; name?: string; role?: string }[] = [],
): Promise<AdminStaffThread[]> {
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

export async function fetchAdminStaffMessages(
  threadId: string,
  limit = 200,
): Promise<AdminStaffMessage[]> {
  if (!supabase) return [];
  const client = requireSupabase();
  const { data, error } = await client
    .from('admin_staff_messages')
    .select('*')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true })
    .limit(limit);
  if (error) return [];
  return (data || []).map((r) => rowToAdminStaffMessage(r as Record<string, unknown>));
}

export async function sendAdminStaffMessage(opts: {
  thread: AdminStaffThread;
  senderType: 'admin' | 'staff';
  senderId: string | null;
  text: string;
}): Promise<{ success: boolean; error?: string; message?: AdminStaffMessage }> {
  const value = String(opts.text || '').trim();
  if (!value || !opts.thread?.id) return { success: false, error: 'Mesaj boş.' };
  if (!supabase) return { success: false, error: 'Bağlantı kurulamadı.' };

  const client = requireSupabase();
  const { data: msgRow, error: msgErr } = await client
    .from('admin_staff_messages')
    .insert({
      thread_id: opts.thread.id,
      sender_type: opts.senderType,
      sender_id: opts.senderId || null,
      data: { text: value },
    })
    .select()
    .single();
  if (msgErr) return { success: false, error: msgErr.message };

  const preview = value.length > 120 ? `${value.slice(0, 119)}…` : value;
  const data = { ...(opts.thread.data || {}) };
  data.lastPreview = preview;
  if (opts.senderType === 'admin') {
    data.staffUnread = Number(data.staffUnread || 0) + 1;
  } else {
    data.adminUnread = Number(data.adminUnread || 0) + 1;
  }
  await client
    .from('admin_staff_threads')
    .update({ last_message_at: new Date().toISOString(), data })
    .eq('id', opts.thread.id);

  if (opts.senderType === 'admin' && opts.thread.staffId) {
    void notifyStaffAdminMessage({
      staffId: opts.thread.staffId,
      preview,
      threadId: opts.thread.id,
    });
  }

  return {
    success: true,
    message: rowToAdminStaffMessage(msgRow as Record<string, unknown>),
  };
}

export async function markAdminStaffThreadRead(
  threadId: string,
  readerType: 'admin' | 'staff',
): Promise<void> {
  if (!supabase) return;
  const client = requireSupabase();
  const { data: row } = await client
    .from('admin_staff_threads')
    .select('*')
    .eq('id', threadId)
    .maybeSingle();
  if (!row) return;
  const data = { ...((row.data as object) || {}) } as Record<string, unknown>;
  if (readerType === 'admin') data.adminUnread = 0;
  if (readerType === 'staff') data.staffUnread = 0;
  await client.from('admin_staff_threads').update({ data }).eq('id', threadId);
}

let adminChatChannelSeq = 0;

export function parseAdminStaffMessageRow(
  row: Record<string, unknown>,
): AdminStaffMessage {
  return rowToAdminStaffMessage(row);
}

/** Badge / inbox: admin-staff threads only. */
export function subscribeAdminStaffChat(listener: () => void): () => void {
  if (!supabase) return () => {};
  const client = requireSupabase();
  adminChatChannelSeq += 1;
  const channel = client
    .channel(`admin-staff-chat-${adminChatChannelSeq}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'admin_staff_threads' },
      () => listener(),
    )
    .subscribe();
  return () => {
    void client.removeChannel(channel);
  };
}

export function subscribeAdminStaffMessages(
  threadId: string,
  listener: (row: Record<string, unknown>) => void,
): () => void {
  if (!threadId || !supabase) return () => {};
  const client = requireSupabase();
  adminChatChannelSeq += 1;
  const channel = client
    .channel(`admin-staff-msgs-${threadId}-${adminChatChannelSeq}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'admin_staff_messages',
        filter: `thread_id=eq.${threadId}`,
      },
      (payload) => {
        const row = payload.new as Record<string, unknown> | undefined;
        if (row) listener(row);
      },
    )
    .subscribe();
  return () => {
    void client.removeChannel(channel);
  };
}
