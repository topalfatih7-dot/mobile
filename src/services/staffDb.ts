/**
 * Staff mutations — web supabaseDb staff surface.
 */
import { isUiOnly } from '@/config/runtime';
import { fetchMemberById, updateMemberRemote } from '@/services/memberDb';
import { requireSupabase, supabase } from '@/services/supabase';

export { createProgram, hydratePlatform } from '@/services/platformDb';
export { getStaffClients } from '@/utils/staffClients';

/** Personelin kendi profilini güncellemesi — RPC staff_update_self_profile */
export async function updateStaffSelfProfile(
  id: string,
  patch: Record<string, unknown>,
): Promise<{ success: boolean; error?: string; id?: string }> {
  if (isUiOnly() || !supabase) {
    return { success: false, error: 'Demo modda kayıt yok.' };
  }
  const client = requireSupabase();
  const availability =
    patch.availability && typeof patch.availability === 'object'
      ? patch.availability
      : {};
  const { data: staffId, error } = await client.rpc('staff_update_self_profile', {
    p_name: String(patch.name || '').trim(),
    p_data: {
      phone: patch.phone || '',
      title: patch.title || '',
      specialty: patch.specialty || '',
      specialties: Array.isArray(patch.specialties) ? patch.specialties : [],
      bio: patch.bio || '',
      photo: patch.photo || null,
      city: patch.city || '',
      district: patch.district || '',
      gender: patch.gender || '',
      availability,
      workDays: Array.isArray(patch.workDays) ? patch.workDays : [],
      workStart: patch.workStart || '09:00',
      workEnd: patch.workEnd || '17:00',
    },
  });
  if (error) return { success: false, error: error.message };
  if (id && staffId && id !== staffId) {
    return { success: false, error: 'Yetkisiz profil güncellemesi.' };
  }
  return { success: true, id: staffId ? String(staffId) : id };
}

/** Staff/admin: üye alanlarını patch’le (klinik not vb.) */
export async function staffPatchMember(
  memberId: string,
  patch: Record<string, unknown>,
): Promise<{ success: boolean; error?: string }> {
  if (!memberId) return { success: false, error: 'Üye bulunamadı.' };
  if (isUiOnly() || !supabase) {
    return { success: false, error: 'Demo modda kayıt yok.' };
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
