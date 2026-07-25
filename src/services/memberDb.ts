import { isUiOnly } from '@/config/runtime';
import { requireSupabase, supabase } from '@/services/supabase';
import { memberToRow, rowToMember, type MemberRecord } from '@/services/mappers';

export type { MemberRecord };

export async function fetchMemberById(userId: string): Promise<MemberRecord | null> {
  if (isUiOnly() || !supabase) return null;
  const client = requireSupabase();
  const { data, error } = await client.from('members').select('*').eq('id', userId).maybeSingle();
  if (error || !data) return null;
  return rowToMember(data as Record<string, unknown>);
}

export async function updateMemberRemote(member: Record<string, unknown>) {
  if (isUiOnly() || !supabase) {
    throw new Error('Üye güncellemesi demo modda kapalı.');
  }
  const client = requireSupabase();
  const { data, error } = await client
    .from('members')
    .update(memberToRow(member))
    .eq('id', member.id as string)
    .select('id');
  if (error) throw error;
  if (!data || data.length === 0) {
    throw new Error('Üye güncellenemedi (yetki veya kayıt yok).');
  }
}

export async function patchMemberFields(
  current: MemberRecord,
  patch: Record<string, unknown>,
): Promise<MemberRecord> {
  const next = { ...current, ...patch };
  await updateMemberRemote(next);
  return rowToMember({
    id: next.id,
    email: next.email,
    name: next.name,
    phone: next.phone,
    membership: next.membership,
    membership_status: next.membershipStatus,
    assigned_coach_id: next.assignedCoachId,
    assigned_dietitian_id: next.assignedDietitianId,
    assigned_doctor_id: next.assignedDoctorId,
    role: next.role,
    data: Object.fromEntries(
      Object.entries(next).filter(
        ([k]) =>
          ![
            'id',
            'email',
            'name',
            'phone',
            'membership',
            'membershipStatus',
            'assignedCoachId',
            'assignedDietitianId',
            'assignedDoctorId',
            'role',
            'password',
          ].includes(k),
      ),
    ),
  });
}
