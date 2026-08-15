/**
 * Foreground membership refresh — LOCK F15 / payments.md.
 * Never throws. Null/error must not wipe AuthContext.
 */
import { rowToMember, type MemberRecord } from '@/services/mappers';
import { supabase } from '@/services/supabase';

const SELECT_TIMEOUT_MS = 8000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([
    promise.then((value) => value).catch(() => null),
    new Promise<null>((resolve) => {
      setTimeout(() => resolve(null), ms);
    }),
  ]);
}

export async function fetchMemberRowQuiet(
  userId: string | null | undefined,
): Promise<MemberRecord | null> {
  try {
    if (!supabase || !userId) return null;
    const result = await withTimeout(
      supabase.from('members').select('*').eq('id', userId).maybeSingle(),
      SELECT_TIMEOUT_MS,
    );
    if (!result || result.error || !result.data) return null;
    return rowToMember(result.data as Record<string, unknown>);
  } catch {
    return null;
  }
}
