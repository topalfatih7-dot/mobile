/**
 * Foreground membership refresh — LOCK F15 / payments.md / F17.
 * Timeout/error must not wipe AuthContext. Confirmed missing row may (F17).
 */
import { rowToMember, type MemberRecord } from '@/services/mappers';
import { supabase } from '@/services/supabase';

const SELECT_TIMEOUT_MS = 8000;

export type MemberRowProbe =
  | { status: 'ok'; member: MemberRecord }
  | { status: 'missing' }
  | { status: 'unavailable' };

function withTimeout<T>(promise: PromiseLike<T>, ms: number): Promise<T | null> {
  return Promise.race([
    Promise.resolve(promise)
      .then((value) => value)
      .catch(() => null),
    new Promise<null>((resolve) => {
      setTimeout(() => resolve(null), ms);
    }),
  ]);
}

export async function probeMemberRow(
  userId: string | null | undefined,
): Promise<MemberRowProbe> {
  try {
    if (!supabase || !userId) return { status: 'unavailable' };
    const result = await withTimeout(
      supabase.from('members').select('*').eq('id', userId).maybeSingle(),
      SELECT_TIMEOUT_MS,
    );
    if (!result) return { status: 'unavailable' };
    if (result.error) return { status: 'unavailable' };
    if (!result.data) return { status: 'missing' };
    return { status: 'ok', member: rowToMember(result.data as Record<string, unknown>) };
  } catch {
    return { status: 'unavailable' };
  }
}

export async function fetchMemberRowQuiet(
  userId: string | null | undefined,
): Promise<MemberRecord | null> {
  const probe = await probeMemberRow(userId);
  return probe.status === 'ok' ? probe.member : null;
}
