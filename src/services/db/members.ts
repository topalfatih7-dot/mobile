import { memberToRow, rowToMember } from '@/services/db/mappers';
import { parseMemberNotifications, type AppNotification } from '@/services/notifications';
import { supabase } from '@/services/supabaseClient';
import type { MemberProfile } from '@/types/session';

export async function saveMemberPatch(
  member: MemberProfile,
  patch: Record<string, unknown>,
): Promise<{ success: true; member: MemberProfile } | { success: false; error: string }> {
  if (!supabase) return { success: false, error: 'Supabase yapılandırılmadı.' };

  const updated: MemberProfile & Record<string, unknown> = {
    ...member,
    ...patch,
    lastActiveAt: new Date().toISOString().slice(0, 10),
  };

  if (patch.weight != null && String(patch.weight) !== String(member.weight)) {
    const w = parseFloat(String(patch.weight));
    if (!Number.isNaN(w) && w > 0) {
      const progress = { ...(member.progress as Record<string, unknown> | undefined) };
      const weightHistory = [...((progress.weight as { date: string; value: number }[]) || [])];
      const todayStr = new Date().toISOString().slice(0, 10);
      const last = weightHistory[weightHistory.length - 1];
      if (!last || last.date !== todayStr || last.value !== w) {
        weightHistory.push({ date: todayStr, value: w });
        if (weightHistory.length > 120) weightHistory.splice(0, weightHistory.length - 120);
      }
      updated.progress = { ...progress, weight: weightHistory };
    }
  }

  const { error } = await supabase.from('members').upsert(memberToRow(updated), { onConflict: 'id' });
  if (error) return { success: false, error: error.message };

  return { success: true, member: updated };
}

export async function fetchMemberById(memberId: string): Promise<MemberProfile | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from('members').select('*').eq('id', memberId).maybeSingle();
  if (error || !data) return null;
  return rowToMember(data);
}

export async function fetchAllMembers(): Promise<MemberProfile[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .order('updated_at', { ascending: false });
  if (error) return [];
  return (data || []).map((row) => rowToMember(row)).filter(Boolean) as MemberProfile[];
}

export async function fetchAdminOverview(): Promise<{
  stats: import('@/services/staffDashboard').AdminStats;
  members: import('@/services/staffDashboard').AdminMemberRow[];
}> {
  if (!supabase) {
    return {
      stats: { memberCount: 0, staffCount: 0, threadCount: 0, programCount: 0, paidMemberCount: 0 },
      members: [],
    };
  }

  const [membersRes, staffRes, threadsRes, programsRes] = await Promise.all([
    supabase.from('members').select('id, email, name, membership, membership_status'),
    supabase.from('staff').select('id', { count: 'exact', head: true }),
    supabase.from('chat_threads').select('id', { count: 'exact', head: true }),
    supabase.from('programs').select('id', { count: 'exact', head: true }),
  ]);

  const memberRows = membersRes.data || [];
  const paidMemberCount = memberRows.filter(
    (row) => row.membership && row.membership !== 'free',
  ).length;

  return {
    stats: {
      memberCount: memberRows.length,
      staffCount: staffRes.count || 0,
      threadCount: threadsRes.count || 0,
      programCount: programsRes.count || 0,
      paidMemberCount,
    },
    members: memberRows.slice(0, 30).map((row) => ({
      id: row.id,
      name: row.name || '—',
      email: row.email || '',
      membership: row.membership || 'free',
      membershipStatus: row.membership_status || 'active',
    })),
  };
}

export async function markNotificationRead(
  member: MemberProfile,
  notificationId: string,
): Promise<{ success: true; member: MemberProfile } | { success: false; error: string }> {
  const notifications = parseMemberNotifications(member.notifications).map((item) =>
    item.id === notificationId ? { ...item, read: true } : item,
  );
  return saveMemberPatch(member, { notifications });
}

export async function markAllNotificationsRead(
  member: MemberProfile,
): Promise<{ success: true; member: MemberProfile } | { success: false; error: string }> {
  const notifications = parseMemberNotifications(member.notifications).map((item) => ({
    ...item,
    read: true,
  }));
  return saveMemberPatch(member, { notifications });
}
