/**
 * Staff mutations — web supabaseDb staff surface.
 */
import { staffProfileDataPayload, normalizeStaffProfile } from '@/data/staffProfile';
import { fetchMemberById, updateMemberRemote } from '@/services/memberDb';
import { requireSupabase, supabase } from '@/services/supabase';

export { createProgram, updateProgram, hydratePlatform } from '@/services/platformDb';
export { getStaffClients } from '@/utils/staffClients';

/** Personelin kendi profilini güncellemesi — RPC staff_update_self_profile */
export async function updateStaffSelfProfile(
  id: string,
  patch: Record<string, unknown>,
): Promise<{ success: boolean; error?: string; id?: string }> {
  if (!supabase) {
    return { success: false, error: 'Bağlantı kurulamadı.' };
  }
  const client = requireSupabase();
  const merged = normalizeStaffProfile(patch);
  const { data: staffId, error } = await client.rpc('staff_update_self_profile', {
    p_name: String(merged.name || '').trim(),
    p_data: staffProfileDataPayload(merged),
  });
  if (error) return { success: false, error: error.message };
  if (id && staffId && id !== staffId) {
    return { success: false, error: 'Yetkisiz profil güncellemesi.' };
  }
  return { success: true, id: staffId ? String(staffId) : id };
}

/**
 * Web StaffShell parity: clear `staff.data.tempPasswordIssued` after force-password.
 * Direct `.from('staff').update` (not staff_update_self_profile — payload omits the flag).
 */
export async function clearStaffTempPasswordIssued(
  staffId: string,
): Promise<{ success: boolean; error?: string }> {
  if (!staffId) return { success: false, error: 'Personel bulunamadı.' };
  if (!supabase) {
    return { success: false, error: 'Bağlantı kurulamadı.' };
  }
  const client = requireSupabase();
  const { data: row, error: fetchError } = await client
    .from('staff')
    .select('data')
    .eq('id', staffId)
    .maybeSingle();
  if (fetchError) return { success: false, error: fetchError.message };
  const current =
    row?.data && typeof row.data === 'object' && !Array.isArray(row.data)
      ? (row.data as Record<string, unknown>)
      : {};
  const { error } = await client
    .from('staff')
    .update({ data: { ...current, tempPasswordIssued: false } })
    .eq('id', staffId);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

/** Staff/admin: üye alanlarını patch’le (klinik not vb.) */
export async function staffPatchMember(
  memberId: string,
  patch: Record<string, unknown>,
): Promise<{ success: boolean; error?: string }> {
  if (!memberId) return { success: false, error: 'Üye bulunamadı.' };
  if (!supabase) {
    return { success: false, error: 'Bağlantı kurulamadı.' };
  }
  try {
    const current = await fetchMemberById(memberId);
    if (!current) return { success: false, error: 'Üye bulunamadı.' };
    await updateMemberRemote({ ...current, ...patch, id: memberId });
    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Güncellenemedi',
    };
  }
}
