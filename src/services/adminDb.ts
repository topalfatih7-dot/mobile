/**
 * Admin mutations / reads — web supabaseDb admin surface (minimal port).
 */
import { isUiOnly } from '@/config/runtime';
import { rowToMember, type MemberRecord } from '@/services/mappers';
import { requireSupabase, supabase } from '@/services/supabase';
import { hydratePlatform } from '@/services/platformDb';

export { hydratePlatform };

export async function fetchAdminSessionSummaries(): Promise<
  {
    memberId: string;
    memberName: string;
    sessionType: string;
    startsAt?: string;
  }[]
> {
  if (isUiOnly() || !supabase) return [];
  const client = requireSupabase();
  const { data, error } = await client
    .from('members')
    .select('id, name, membership, membership_status, data');
  if (error || !data) return [];

  const out: {
    memberId: string;
    memberName: string;
    sessionType: string;
    startsAt?: string;
  }[] = [];

  for (const row of data) {
    const m = rowToMember(row as Record<string, unknown>);
    const name = String(m.name || m.email || 'Üye');
    (
      [
        ['coachSessions', 'Koç'],
        ['dietitianSessions', 'Diyetisyen'],
        ['doctorSessions', 'Doktor'],
      ] as const
    ).forEach(([key, label]) => {
      const sessions = (m[key] as { startsAt?: string; id?: string }[]) || [];
      sessions.forEach((s) => {
        out.push({
          memberId: String(m.id),
          memberName: name,
          sessionType: label,
          startsAt: s.startsAt,
        });
      });
    });
  }
  return out;
}

export async function adminSetMembershipStatus(
  memberId: string,
  status: string,
): Promise<{ success: boolean; member?: MemberRecord; error?: string }> {
  if (isUiOnly() || !supabase) {
    return { success: false, error: 'Demo modda kayıt yok.' };
  }
  const client = requireSupabase();
  const { data, error } = await client
    .from('members')
    .update({ membership_status: status, updated_at: new Date().toISOString() })
    .eq('id', memberId)
    .select('*')
    .maybeSingle();
  if (error || !data) return { success: false, error: error?.message || 'Güncellenemedi' };
  return { success: true, member: rowToMember(data as Record<string, unknown>) };
}
