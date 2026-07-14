/**
 * Koç ↔ Diyetisyen collab sohbet — web `staffCollabChatDb.js` sözleşmesi.
 */
import {
  isPaidMembership,
  packageIncludesCoach,
  packageIncludesDietitian,
  type PackageConfig,
} from '@/data/membershipPlans';
import { supabase } from '@/services/supabaseClient';
import { CONTACT_INFO_BLOCK_MESSAGE, detectExternalContactInfo } from '@/utils/contactInfoGuard';
import { normalizeStaffRole } from '@/utils/staffAccess';
import type { MemberProfile, StaffProfile } from '@/types/session';

const nowISO = () => new Date().toISOString();

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
  data?: Record<string, unknown>;
};

export type StaffCollabMessage = {
  id: string;
  threadId: string;
  senderType: string;
  senderId: string | null;
  text: string;
  createdAt: string;
};

type ThreadRow = {
  id: string;
  member_id: string;
  coach_id: string;
  dietitian_id: string;
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

export function rowToStaffCollabThread(row: ThreadRow): StaffCollabThread {
  const d = row.data || {};
  return {
    id: row.id,
    memberId: row.member_id,
    coachId: row.coach_id,
    dietitianId: row.dietitian_id,
    lastMessageAt: row.last_message_at,
    memberName: String(d.memberName || ''),
    coachName: String(d.coachName || ''),
    dietitianName: String(d.dietitianName || ''),
    lastPreview: String(d.lastPreview || ''),
    coachUnread: Number(d.coachUnread || 0),
    dietitianUnread: Number(d.dietitianUnread || 0),
    createdAt: row.created_at,
    data: d,
  };
}

export function rowToStaffCollabMessage(row: MessageRow): StaffCollabMessage {
  return {
    id: row.id,
    threadId: row.thread_id,
    senderType: row.sender_type,
    senderId: row.sender_id,
    text: row.data?.text || '',
    createdAt: row.created_at,
  };
}

function memberEligibleForCollab(member: MemberProfile) {
  if (!member?.assignedCoachId || !member?.assignedDietitianId) return false;
  if (!isPaidMembership(member.membership as string)) return false;
  const status = (member.membershipStatus as string) || 'active';
  if (status !== 'active' && status !== 'expiring') return false;
  const pkg = (member.packageConfig as PackageConfig) || {};
  return packageIncludesCoach(pkg) && packageIncludesDietitian(pkg);
}

export function getStaffCollabMembers(members: MemberProfile[] = [], staffUser: StaffProfile | null) {
  const role = normalizeStaffRole(staffUser?.role);
  if (role !== 'coach' && role !== 'dietitian') return [];
  if (!staffUser?.id) return [];
  const sid = String(staffUser.id);
  const key = role === 'coach' ? 'assignedCoachId' : 'assignedDietitianId';
  return members.filter((m) => memberEligibleForCollab(m) && String(m[key]) === sid);
}

export async function fetchStaffCollabThreadsForStaff(staffUser: StaffProfile | null) {
  if (!supabase || !staffUser?.id) return [];
  const role = normalizeStaffRole(staffUser.role);
  if (role !== 'coach' && role !== 'dietitian') return [];
  const column = role === 'coach' ? 'coach_id' : 'dietitian_id';
  const { data, error } = await supabase
    .from('staff_collab_threads')
    .select('*')
    .eq(column, staffUser.id)
    .order('last_message_at', { ascending: false, nullsFirst: false });
  if (error) return [];
  return (data || []).map(rowToStaffCollabThread);
}

export async function fetchAllStaffCollabThreads() {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('staff_collab_threads')
    .select('*')
    .order('last_message_at', { ascending: false, nullsFirst: false });
  if (error) return [];
  return (data || []).map(rowToStaffCollabThread);
}

export async function fetchStaffCollabMessages(threadId: string, limit = 200) {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('staff_collab_messages')
    .select('*')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true })
    .limit(limit);
  if (error) return [];
  return (data || []).map(rowToStaffCollabMessage);
}

export async function getOrCreateStaffCollabThread(
  member: MemberProfile,
  staffList: StaffProfile[] = [],
) {
  if (!supabase || !memberEligibleForCollab(member)) return null;

  const coachId = member.assignedCoachId as string;
  const dietitianId = member.assignedDietitianId as string;
  const coach = staffList.find((s) => String(s.id) === String(coachId));
  const dietitian = staffList.find((s) => String(s.id) === String(dietitianId));

  const { data: existing } = await supabase
    .from('staff_collab_threads')
    .select('*')
    .eq('member_id', member.id)
    .maybeSingle();

  if (existing) return rowToStaffCollabThread(existing);

  const { data: row, error } = await supabase
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
  return rowToStaffCollabThread(row);
}

export async function ensureStaffCollabThreads(
  staffUser: StaffProfile | null,
  members: MemberProfile[] = [],
  staffList: StaffProfile[] = [],
) {
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

export async function sendStaffCollabMessage({
  thread,
  senderType,
  senderId,
  text,
}: {
  thread: StaffCollabThread;
  senderType: 'coach' | 'dietitian';
  senderId?: string | null;
  text: string;
}) {
  if (!supabase) return { success: false as const, error: 'Supabase yapılandırılmadı.' };
  const value = String(text || '').trim();
  if (!value || !thread?.id) return { success: false as const, error: 'Mesaj boş.' };
  if (senderType !== 'coach' && senderType !== 'dietitian') {
    return { success: false as const, error: 'Geçersiz gönderici.' };
  }

  const guard = detectExternalContactInfo(value);
  if (guard.blocked) {
    return { success: false as const, error: CONTACT_INFO_BLOCK_MESSAGE, blockedReason: guard.reason };
  }

  const { data: msgRow, error: msgErr } = await supabase
    .from('staff_collab_messages')
    .insert({
      thread_id: thread.id,
      sender_type: senderType,
      sender_id: senderId || null,
      data: { text: value },
    })
    .select()
    .single();

  if (msgErr || !msgRow) {
    const isContactBlock = msgErr?.message?.includes('CONTACT_INFO_BLOCKED');
    return {
      success: false as const,
      error: isContactBlock ? CONTACT_INFO_BLOCK_MESSAGE : msgErr?.message || 'Gönderilemedi.',
    };
  }

  const preview = value.length > 120 ? `${value.slice(0, 119)}…` : value;
  const data = { ...(thread.data || {}) };
  data.lastPreview = preview;
  if (senderType === 'coach') {
    data.dietitianUnread = Number(data.dietitianUnread || 0) + 1;
  } else {
    data.coachUnread = Number(data.coachUnread || 0) + 1;
  }

  const stamped = nowISO();
  await supabase
    .from('staff_collab_threads')
    .update({ last_message_at: stamped, data })
    .eq('id', thread.id);

  return {
    success: true as const,
    message: rowToStaffCollabMessage(msgRow),
    thread: rowToStaffCollabThread({
      id: thread.id,
      member_id: thread.memberId,
      coach_id: thread.coachId,
      dietitian_id: thread.dietitianId,
      last_message_at: stamped,
      created_at: thread.createdAt,
      data,
    }),
  };
}

export async function markStaffCollabThreadRead(threadId: string, readerType: 'coach' | 'dietitian') {
  if (!supabase) return null;
  const { data: row } = await supabase.from('staff_collab_threads').select('*').eq('id', threadId).maybeSingle();
  if (!row) return null;
  const data = { ...(row.data || {}) };
  if (readerType === 'coach') data.coachUnread = 0;
  if (readerType === 'dietitian') data.dietitianUnread = 0;
  await supabase.from('staff_collab_threads').update({ data }).eq('id', threadId);
  return rowToStaffCollabThread({ ...row, data });
}

export async function hydrateStaffCollabThreads(
  sessionType: string | null | undefined,
  members: MemberProfile[],
  staffList: StaffProfile[],
  staffUser: StaffProfile | null,
) {
  if (!sessionType) return [];
  if (sessionType === 'admin') return fetchAllStaffCollabThreads();
  if (sessionType === 'staff' && staffUser?.id) {
    return ensureStaffCollabThreads(staffUser, members, staffList);
  }
  return [];
}
