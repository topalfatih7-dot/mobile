/**
 * Self-servis randevu — web `supabaseDb.bookStaffSession` / `getStaffBookedSlots`.
 */
import { apiUrl } from '@/config/env';
import { getApiAuthHeaders } from '@/services/apiAuth';
import { supabase } from '@/services/supabaseClient';

export type BookingSessionType = 'coach' | 'dietitian' | 'doctor';

export async function getStaffBookedSlots(
  staffId: string,
  type: BookingSessionType,
  fromISO: string,
  toISO: string,
): Promise<string[]> {
  if (!supabase || !staffId) return [];
  const { data, error } = await supabase.rpc('staff_booked_slots', {
    p_staff_id: staffId,
    p_type: type,
    p_from: fromISO,
    p_to: toISO,
  });
  if (error) return [];
  return (data || []).map((d: string | Date) => new Date(d).toISOString());
}

export async function bookStaffSession(
  type: BookingSessionType,
  startsAtISO: string,
  duration = 30,
): Promise<{ success: boolean; error?: string; session?: Record<string, unknown> }> {
  try {
    const res = await fetch(apiUrl('/api/auth'), {
      method: 'POST',
      headers: await getApiAuthHeaders(),
      body: JSON.stringify({
        action: 'book-session',
        type,
        startsAt: startsAtISO,
        duration,
      }),
    });
    const json = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      error?: string;
      session?: Record<string, unknown>;
    };
    if (!json.ok) return { success: false, error: json.error || 'Randevu oluşturulamadı.' };
    return { success: true, session: json.session };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export function sessionKey(type: BookingSessionType): 'coachSessions' | 'dietitianSessions' | 'doctorSessions' {
  if (type === 'dietitian') return 'dietitianSessions';
  if (type === 'doctor') return 'doctorSessions';
  return 'coachSessions';
}

export type AdminSessionSummary = {
  id?: string;
  date?: string;
  status?: string;
  time?: string;
  memberName: string;
  sessionType: string;
  [key: string]: unknown;
};

type MemberSessionRow = {
  id: string;
  name?: string | null;
  membership?: string | null;
  membership_status?: string | null;
  data?: Record<string, unknown> | null;
};

/** Web `fetchAdminSessionSummaries`. */
export async function fetchAdminSessionSummaries(): Promise<AdminSessionSummary[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('members')
    .select('id, name, membership, membership_status, data');
  if (error || !data) return [];

  const paid = new Set(['eko', 'diyet', 'spor', 'doktor', 'kurucu', 'vip', 'gumus', 'altin', 'platinum', 'premium']);

  return (data as MemberSessionRow[]).flatMap((row) => {
    if (!paid.has(String(row.membership || '')) || row.membership_status !== 'active') return [];
    const d = row.data || {};
    const name = row.name || '';
    const map = (sessions: unknown[], sessionType: string) =>
      (Array.isArray(sessions) ? sessions : []).map((s) => ({
        ...(typeof s === 'object' && s ? s : {}),
        memberName: name,
        sessionType,
      })) as AdminSessionSummary[];
    return [
      ...map(d.coachSessions as unknown[], 'Koç'),
      ...map(d.dietitianSessions as unknown[], 'Diyetisyen'),
      ...map(d.doctorSessions as unknown[], 'Doktor'),
    ];
  });
}
