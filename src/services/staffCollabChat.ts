/**
 * Web parity: Adsız `src/services/staffCollabChatDb.js`
 * Coach ↔ dietitian (+ optional doctor) collab threads.
 */
import {
  isPaidMembership,
  packageIncludesCoach,
  packageIncludesDietitian,
  packageIncludesDoctor,
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
  doctorId: string | null;
  lastMessageAt: string | null;
  memberName: string;
  coachName: string;
  dietitianName: string;
  doctorName: string;
  lastPreview: string;
  coachUnread: number;
  dietitianUnread: number;
  doctorUnread: number;
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

export type CollabSenderType = 'coach' | 'dietitian' | 'doctor';

function nowISO() {
  return new Date().toISOString();
}

function isCollabRole(role: string): role is CollabSenderType {
  return role === 'coach' || role === 'dietitian' || role === 'doctor';
}

function rowToStaffCollabThread(row: Record<string, unknown>): StaffCollabThread {
  const d = (row.data as Record<string, unknown>) || {};
  return {
    id: String(row.id),
    memberId: String(row.member_id || ''),
    coachId: String(row.coach_id || ''),
    dietitianId: String(row.dietitian_id || ''),
    doctorId: row.doctor_id != null ? String(row.doctor_id) : null,
    lastMessageAt: row.last_message_at ? String(row.last_message_at) : null,
    memberName: String(d.memberName || ''),
    coachName: String(d.coachName || ''),
    dietitianName: String(d.dietitianName || ''),
    doctorName: String(d.doctorName || ''),
    lastPreview: String(d.lastPreview || ''),
    coachUnread: Number(d.coachUnread || 0),
    dietitianUnread: Number(d.dietitianUnread || 0),
    doctorUnread: Number(d.doctorUnread || 0),
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

/** Collab thread için koç+diyet zorunlu; doktor opsiyonel üçüncü taraf */
export function memberEligibleForCollab(member: Record<string, unknown>): boolean {
  if (!member?.assignedCoachId || !member?.assignedDietitianId) return false;
  if (!isPaidMembership(String(member.membership || ''))) return false;
  const status = String(member.membershipStatus || 'active');
  if (status !== 'active' && status !== 'expiring') return false;
  const pkg = (member.packageConfig as Record<string, unknown>) || {};
  return packageIncludesCoach(pkg) && packageIncludesDietitian(pkg);
}

function memberHasDoctorInCollab(member: Record<string, unknown>): boolean {
  if (!member?.assignedDoctorId) return false;
  const pkg = (member.packageConfig as Record<string, unknown>) || {};
  return (
    packageIncludesDoctor(pkg) ||
    (Number(pkg.doctorSessionsTotal) || 0) > 0 ||
    (Number(pkg.doctorMeetingsPerMonth) || 0) > 0
  );
}

export function getStaffCollabMembers(
  members: Record<string, unknown>[] = [],
  staffUser: Record<string, unknown> | null,
) {
  const role = normalizeStaffRole(staffUser?.role as string);
  if (!isCollabRole(role)) return [];
  const sid = String(staffUser?.id || '');
  if (role === 'doctor') {
    return members.filter(
      (m) =>
        memberEligibleForCollab(m) &&
        memberHasDoctorInCollab(m) &&
        String(m.assignedDoctorId || '') === sid,
    );
  }
  const key = role === 'coach' ? 'assignedCoachId' : 'assignedDietitianId';
  return members.filter((m) => memberEligibleForCollab(m) && String(m[key] || '') === sid);
}

/** Inbox peer label — web `buildStaffCollabInbox` */
export function collabPeerName(
  thread: StaffCollabThread | null | undefined,
  role: string | null | undefined,
): string {
  const r = normalizeStaffRole(role);
  if (r === 'coach') {
    return [thread?.dietitianName, thread?.doctorName].filter(Boolean).join(' · ') || 'Ekip';
  }
  if (r === 'dietitian') {
    return [thread?.coachName, thread?.doctorName].filter(Boolean).join(' · ') || 'Ekip';
  }
  if (r === 'doctor') {
    return (
      [thread?.coachName, thread?.dietitianName].filter(Boolean).join(' · ') || 'Koç & Diyetisyen'
    );
  }
  return 'Ekip';
}

export async function fetchStaffCollabThreadsForStaff(
  staffUser: Record<string, unknown>,
): Promise<StaffCollabThread[]> {
  if (isUiOnly() || !supabase || !staffUser?.id) return [];
  const role = normalizeStaffRole(staffUser.role as string);
  if (!isCollabRole(role)) return [];
  const column =
    role === 'coach' ? 'coach_id' : role === 'doctor' ? 'doctor_id' : 'dietitian_id';
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
  const doctorId = memberHasDoctorInCollab(member) ? member.assignedDoctorId : null;
  const coach = staffList.find((s) => String(s.id) === String(coachId));
  const dietitian = staffList.find((s) => String(s.id) === String(dietitianId));
  const doctor = doctorId
    ? staffList.find((s) => String(s.id) === String(doctorId))
    : null;

  const { data: existing } = await client
    .from('staff_collab_threads')
    .select('*')
    .eq('member_id', member.id)
    .maybeSingle();

  if (existing) {
    const row = existing as Record<string, unknown>;
    const needsDoctor =
      doctorId && String(row.doctor_id || '') !== String(doctorId);
    if (needsDoctor) {
      const prevData = (row.data as Record<string, unknown>) || {};
      const data = {
        ...prevData,
        doctorName: (doctor?.name as string) || 'Doktor',
        doctorUnread: Number(prevData.doctorUnread || 0),
      };
      const { data: updated } = await client
        .from('staff_collab_threads')
        .update({ doctor_id: doctorId, data })
        .eq('id', row.id)
        .select()
        .single();
      if (updated) return rowToStaffCollabThread(updated as Record<string, unknown>);
    }
    return rowToStaffCollabThread(row);
  }

  const { data: inserted, error } = await client
    .from('staff_collab_threads')
    .insert({
      member_id: member.id,
      coach_id: coachId,
      dietitian_id: dietitianId,
      doctor_id: doctorId,
      data: {
        memberName: member.name || 'Danışan',
        coachName: coach?.name || 'Koç',
        dietitianName: dietitian?.name || 'Diyetisyen',
        doctorName: doctor?.name || '',
        coachUnread: 0,
        dietitianUnread: 0,
        doctorUnread: 0,
        lastPreview: '',
      },
    })
    .select()
    .single();
  if (error || !inserted) return null;
  return rowToStaffCollabThread(inserted as Record<string, unknown>);
}

export async function ensureStaffCollabThreads(
  staffUser: Record<string, unknown>,
  members: Record<string, unknown>[] = [],
  staffList: Record<string, unknown>[] = [],
): Promise<StaffCollabThread[]> {
  const clients = getStaffCollabMembers(members, staffUser);
  if (!clients.length) return [];

  // Bulk-fetch existing threads, then create missing in parallel (avoid N+1)
  let existing: StaffCollabThread[] = [];
  try {
    existing = await fetchStaffCollabThreadsForStaff(staffUser);
  } catch {
    existing = [];
  }
  const byMember = new Map(existing.map((t) => [String(t.memberId), t]));
  const missing = clients.filter((m) => !byMember.has(String(m.id)));

  if (missing.length) {
    const created = await Promise.all(
      missing.map((member) => getOrCreateStaffCollabThread(member, staffList)),
    );
    for (const thread of created) {
      if (thread) byMember.set(String(thread.memberId), thread);
    }
  }

  return Array.from(byMember.values()).sort((a, b) => {
    const aTime = new Date(a.lastMessageAt || a.createdAt || 0).getTime();
    const bTime = new Date(b.lastMessageAt || b.createdAt || 0).getTime();
    return bTime - aTime;
  });
}

export async function sendStaffCollabMessage(opts: {
  thread: StaffCollabThread;
  senderType: CollabSenderType;
  senderId: string | null;
  text: string;
}): Promise<{ success: boolean; error?: string; message?: StaffCollabMessage }> {
  const value = String(opts.text || '').trim();
  if (!value || !opts.thread?.id) return { success: false, error: 'Mesaj boş.' };
  if (!isCollabRole(opts.senderType)) {
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
    if (opts.thread.doctorId) data.doctorUnread = Number(data.doctorUnread || 0) + 1;
  } else if (opts.senderType === 'dietitian') {
    data.coachUnread = Number(data.coachUnread || 0) + 1;
    if (opts.thread.doctorId) data.doctorUnread = Number(data.doctorUnread || 0) + 1;
  } else {
    data.coachUnread = Number(data.coachUnread || 0) + 1;
    data.dietitianUnread = Number(data.dietitianUnread || 0) + 1;
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
  readerType: CollabSenderType,
): Promise<StaffCollabThread | null> {
  if (isUiOnly() || !supabase || !threadId) return null;
  const client = requireSupabase();
  const { data: row } = await client
    .from('staff_collab_threads')
    .select('*')
    .eq('id', threadId)
    .maybeSingle();
  if (!row) return null;
  const prev = { ...((row.data as Record<string, unknown>) || {}) };
  const unreadKey =
    readerType === 'coach'
      ? 'coachUnread'
      : readerType === 'dietitian'
        ? 'dietitianUnread'
        : 'doctorUnread';
  // Already read — skip UPDATE to avoid realtime → reload feedback loops
  if (Number(prev[unreadKey] || 0) === 0) {
    return rowToStaffCollabThread(row as Record<string, unknown>);
  }
  const data = { ...prev, [unreadKey]: 0 };
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
  if (r === 'doctor') return thread.doctorUnread;
  return 0;
}

let collabChannelSeq = 0;

export function subscribeStaffCollabChat(
  listener: () => void,
  staffUser?: { id?: string; role?: string } | null,
): () => void {
  if (isUiOnly() || !supabase || !staffUser?.id) return () => {};
  const role = normalizeStaffRole(staffUser.role);
  if (!isCollabRole(role)) return () => {};
  const column =
    role === 'coach' ? 'coach_id' : role === 'doctor' ? 'doctor_id' : 'dietitian_id';
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
