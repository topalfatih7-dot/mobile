/**
 * LOCK: docs/mobile/contracts/api-book-session.md
 */
import { postJson } from '@/services/api';
import { requireSupabase, supabase } from '@/services/supabase';
import type { MemberSession, SessionType } from '@/utils/sessionBooking';

type BookOk = { ok: true; session: MemberSession };
type BookFail = { ok: false; error: string };

export async function bookSessionApi(
  type: SessionType,
  startsAt: string,
  duration = 30,
): Promise<BookOk | BookFail> {

  const { ok, json } = await postJson<{
    ok?: boolean;
    error?: string;
    session?: MemberSession;
  }>('/api/auth', {
    action: 'book-session',
    type,
    startsAt,
    duration,
  });

  if (!ok || !json?.ok || !json.session) {
    return {
      ok: false,
      error: String(json?.error || 'Randevu oluşturulamadı.'),
    };
  }

  return { ok: true, session: json.session };
}

/**
 * Başka üyelerin dolu saatleri — web `getStaffBookedSlots` / RPC `staff_booked_slots`.
 */
export async function fetchBookedSlots(
  staffId: string,
  type: SessionType,
  fromISO: string,
  toISO: string,
): Promise<Set<number>> {
  if (!staffId || !supabase) return new Set();
  try {
    const client = requireSupabase();
    const { data, error } = await client.rpc('staff_booked_slots', {
      p_staff_id: staffId,
      p_type: type,
      p_from: fromISO,
      p_to: toISO,
    });
    if (error) return new Set();
    return new Set(
      (data || []).map((d: string) => new Date(d).getTime()).filter((n: number) => !Number.isNaN(n)),
    );
  } catch {
    return new Set();
  }
}
