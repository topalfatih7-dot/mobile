/**
 * Kadro listesi — web `supabaseDb.hydrateOnce` parity.
 *
 * `staff` ham SELECT RLS ile admin / kendi kaydına daraltılmış
 * (20260715_staff_contact_field_hardening). Üye tarafı isimler
 * `staff_directory` (staff_public) üzerinden gelir.
 */
import { rowToStaff } from '@/services/mappers';
import { requireSupabase, supabase } from '@/services/supabase';

export type StaffRecord = Record<string, unknown> & {
  id: string;
  name?: string;
  role?: string;
  active?: boolean;
};

export function buildStaffById(
  staffList: StaffRecord[],
): Record<string, StaffRecord> {
  const map: Record<string, StaffRecord> = {};
  staffList.forEach((s) => {
    if (s?.id) map[String(s.id)] = s;
  });
  return map;
}

/**
 * Directory (herkese açık güvenli alanlar) + erişilebilen ham `staff` satırları.
 * Ham satır varsa üzerine yazar (admin / kendi kayıt).
 */
export async function fetchStaffDirectory(): Promise<{
  staffList: StaffRecord[];
  staffById: Record<string, StaffRecord>;
}> {
  if (!supabase) {
    return { staffList: [], staffById: {} };
  }

  const client = requireSupabase();
  const [staffRes, directoryRes] = await Promise.all([
    client.from('staff').select('*').order('created_at', { ascending: true }),
    client
      .from('staff_directory')
      .select('*')
      .order('created_at', { ascending: true }),
  ]);

  const byId = new Map<string, StaffRecord>();

  ;(directoryRes.data || []).forEach((row) => {
    const s = rowToStaff(row as Record<string, unknown>) as unknown as StaffRecord;
    byId.set(String(s.id), s);
  });
  ;(staffRes.data || []).forEach((row) => {
    const s = rowToStaff(row as Record<string, unknown>) as unknown as StaffRecord;
    byId.set(String(s.id), s);
  });

  const staffList = Array.from(byId.values());
  return { staffList, staffById: buildStaffById(staffList) };
}

/** Aktif kadro (profil uzman kartları, chat contacts). */
export async function fetchActiveStaffById(): Promise<Record<string, StaffRecord>> {
  const { staffById } = await fetchStaffDirectory();
  const active: Record<string, StaffRecord> = {};
  Object.entries(staffById).forEach(([id, s]) => {
    if (s.active !== false) active[id] = s;
  });
  return active;
}
