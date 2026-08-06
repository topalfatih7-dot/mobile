/**
 * Web parity: Adsız `src/services/staffCollabChatDb.js`
 */
import {
  isPaidMembership,
  packageIncludesCoach,
  packageIncludesDietitian,
} from '@/data/membershipPlans';
import { isUiOnly } from '@/config/runtime';
import {
  CONTACT_INFO_BLOCK_MESSAGE,
  detectExternalContactInfo,
} from '@/utils/contactInfoGuard';
import { normalizeStaffRole } from '@/utils/staffClients';
import { requireSupabase, supabase } from '@/services/supabase';

export type StaffCollabThread = {
  id: string;
  memberId: string;
  coachId: string;
  dietitianId: string;
  lastMessageAt: string | null;
  memberName: string;
  coachName: string;
  dietitianName: string;
  lastPreview: string;
  coachUnread: number;
  dietitianUnread: number;
  createdAt: string;
  data: Record<string, unknown>;
};

export type StaffCollabMessage = {
  id: string;
  threadId: string;
  senderType: string;
  senderId: string | null;
  text: string;
  createdAt: string;
};

function nowISO() {
  return new Date().toISOString();
}

function rowToStaffCollabThread(row: Record<string, unknown>): StaffCollabThread {
  const d = (row.data as Record<string, unknown>) || {};
  return {
    id: String(row.id),
    memberId: String(row.member_id || ''),
    coachId: String(row.coach_id || ''),
    dietitianId: String(row.dietitian_id || ''),
    lastMessageAt: row.last_message_at ? String(row.last_message_at) : null,
    memberName: String(d.memberName || ''),
    coachName: String(d.coachName || ''),
    dietitianName: String(d.dietitianName || ''),
    lastPreview: String(d.lastPreview || ''),
    coachUnread: Number(d.coachUnread || 0),
    dietitianUnread: Number(d.dietitianUnread || 0),
    createdAt: String(row.created_at || ''),
    data: d,
  };
}

function rowToStaffCollabMessage(row: Record<string, unknown>): StaffCollabMessage {
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

export function memberEligibleForCollab(member: Record<string, unknown>): boolean {
  if (!member?.assignedCoachId || !member?.assignedDietitianId) return false;
  if (!isPaidMembership(String(member.membership || ''))) return false;
  const status = String(member.membershipStatus || 'active');
  if (status !== 'active' && status !== 'expiring') return false;
  const pkg = (member.packageConfig as Record<string, unknown>) || {};
  return packageIncludesCoach(pkg) && packageIncludesDietitian(pkg);
}

export function getStaffCollabMembers(
  members: Record<string, unknown>[] = [],
  staffUser: Record<string, unknown> | null,
) {
  const role = normalizeStaffRole(staffUser?.role as string);
  if (role !== 'coach' && role !== 'dietitian') return [];
  const sid = String(staffUser?.id || '');
  const key = role === 'coach' ? 'assignedCoachId' : 'assignedDietitianId';
  return members.filter((m) => memberEligibleForCollab(m) && String(m[key] || '') === sid);
}

export async function fetchStaffCollabThreadsForStaff(
  staffUser: Record<string, unknown>,
): Promise<StaffCollabThread[]> {
  if (isUiOnly() || !supabase || !staffUser?.id) return [];
  const role = normalizeStaffRole(staffUser.role as string);
  if (role !== 'coach' && role !== 'dietitian') return [];
  const column = role === 'coach' ? 'coach_id' : 'dietitian_id';
  const client = requireSupabase();
  const { data, error } = await client
    .from('staff_collab_threads')
    .select('*')
    .eq(column, staffUser.id)
    .order('last_message_at', { ascending: false, nullsFirst: false });
  if (error) return [];
  return (data || []).map((r) => rowToStaffCollabThread(r as Record<string, unknown>));
}

export async function fetchStaffCollabMessages(
  threadId: string,
  limit = 200,
): Promise<StaffCollabMessage[]> {
  if (isUiOnly() || !supabase || !threadId) return [];
  const client = requireSupabase();
  const { data, error } = await client
    .from('staff_collab_messages')
    .select('*')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true })
    .limit(limit);
  if (error) return [];
  return (data || []).map((r) => rowToStaffCollabMessage(r as Record<string, unknown>));
}

export async function getOrCreateStaffCollabThread(
  member: Record<string, unknown>,
  staffList: Record<string, unknown>[] = [],
): Promise<StaffCollabThread | null> {
  if (isUiOnly() || !supabase || !memberEligibleForCollab(member)) return null;
  const client = requireSupabase();
  const coachId = member.assignedCoachId;
  const dietitianId = member.assignedDietitianId;
  const coach = staffList.find((s) => String(s.id) === String(coachId));
  const dietitian = staffList.find((s) => String(s.id) === String(dietitianId));

  const { data: existing } = await client
    .from('staff_collab_threads')
    .select('*')
    .eq('member_id', member.id)
    .maybeSingle();
  if (existing) return rowToStaffCollabThread(existing as Record<string, unknown>);

  const { data: row, error } = await client
    .from('staff_collab_threads')
    .insert({
      member_id: member.id,
      coach_id: coachId,
      dietitian_id: dietitianId,
      data: {
        memberName: member.name || 'Danışan',
        coachName: coach?.name || 'Koç',
        dietitianName: dietitian?.name || 'Diyetisyen',
        coachUnread: 0,
        dietitianUnread: 0,
        lastPreview: '',
      },
    })
    .select()
    .single();
  if (error || !row) return null;
  return rowToStaffCollabThread(row as Record<string, unknown>);
}

export async function ensureStaffCollabThreads(
  staffUser: Record<string, unknown>,
  members: Record<string, unknown>[] = [],
  staffList: Record<string, unknown>[] = [],
): Promise<StaffCollabThread[]> {
  const clients = getStaffCollabMembers(members, staffUser);
  const threads: StaffCollabThread[] = [];
  for (const member of clients) {
    const thread = await getOrCreateStaffCollabThread(member, staffList);
    if (thread) threads.push(thread);
  }
  return threads.sort((a, b) => {
    const aTime = new Date(a.lastMessageAt || a.createdAt || 0).getTime();
    const bTime = new Date(b.lastMessageAt || b.createdAt || 0).getTime();
    return bTime - aTime;
  });
}

export async function sendStaffCollabMessage(opts: {
  thread: StaffCollabThread;
  senderType: 'coach' | 'dietitian';
  senderId: string | null;
  text: string;
}): Promise<{ success: boolean; error?: string; message?: StaffCollabMessage }> {
  const value = String(opts.text || '').trim();
  if (!value || !opts.thread?.id) return { success: false, error: 'Mesaj boş.' };
  if (opts.senderType !== 'coach' && opts.senderType !== 'dietitian') {
    return { success: false, error: 'Geçersiz gönderici.' };
  }
  if (detectExternalContactInfo(value)) {
    return { success: false, error: CONTACT_INFO_BLOCK_MESSAGE };
  }
  if (isUiOnly() || !supabase) {
    return { success: false, error: 'Demo modda kayıt yok.' };
  }

  const client = requireSupabase();
  const { data: msgRow, error: msgErr } = await client
    .from('staff_collab_messages')
    .insert({
      thread_id: opts.thread.id,
      sender_type: opts.senderType,
      sender_id: opts.senderId || null,
      data: { text: value },
    })
    .select()
    .single();

  if (msgErr) {
    const isContactBlock = msgErr.message?.includes('CONTACT_INFO_BLOCKED');
    return {
      success: false,
      error: isContactBlock ? CONTACT_INFO_BLOCK_MESSAGE : msgErr.message,
    };
  }

  const preview = value.length > 120 ? `${value.slice(0, 119)}…` : value;
  const data = { ...(opts.thread.data || {}) };
  data.lastPreview = preview;
  if (opts.senderType === 'coach') {
    data.dietitianUnread = Number(data.dietitianUnread || 0) + 1;
  } else {
    data.coachUnread = Number(data.coachUnread || 0) + 1;
  }

  await client
    .from('staff_collab_threads')
    .update({ last_message_at: nowISO(), data })
    .eq('id', opts.thread.id);

  return {
    success: true,
    message: rowToStaffCollabMessage(msgRow as Record<string, unknown>),
  };
}

export async function markStaffCollabThreadRead(
  threadId: string,
  readerType: 'coach' | 'dietitian',
): Promise<StaffCollabThread | null> {
  if (isUiOnly() || !supabase || !threadId) return null;
  const client = requireSupabase();
  const { data: row } = await client
    .from('staff_collab_threads')
    .select('*')
    .eq('id', threadId)
    .maybeSingle();
  if (!row) return null;
  const data = { ...((row.data as Record<string, unknown>) || {}) };
  if (readerType === 'coach') data.coachUnread = 0;
  if (readerType === 'dietitian') data.dietitianUnread = 0;
  await client.from('staff_collab_threads').update({ data }).eq('id', threadId);
  return rowToStaffCollabThread({ ...(row as Record<string, unknown>), data });
}

export function collabUnreadForStaff(
  thread: StaffCollabThread,
  role: string | null | undefined,
): number {
  const r = normalizeStaffRole(role);
  if (r === 'coach') return thread.coachUnread;
  if (r === 'dietitian') return thread.dietitianUnread;
  return 0;
}

let collabChannelSeq = 0;

export function subscribeStaffCollabChat(
  listener: () => void,
  staffUser?: { id?: string; role?: string } | null,
): () => void {
  if (isUiOnly() || !supabase || !staffUser?.id) return () => {};
  const role = normalizeStaffRole(staffUser.role);
  if (role !== 'coach' && role !== 'dietitian') return () => {};
  const column = role === 'coach' ? 'coach_id' : 'dietitian_id';
  const client = requireSupabase();
  collabChannelSeq += 1;
  const channel = client
    .channel(`staff-collab-${staffUser.id}-${collabChannelSeq}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'staff_collab_threads',
        filter: `${column}=eq.${staffUser.id}`,
      },
      () => listener(),
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'staff_collab_messages' },
      () => listener(),
    )
    .subscribe();
  return () => {
    void client.removeChannel(channel);
  };
}
