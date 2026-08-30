/**
 * Auth user still exists? Explicit JWT — does not refresh/rotate the session.
 * LOCK: payments.md handoff must not call refreshSession().
 */
import { supabase } from '@/services/supabase';

export type AuthUserProbe = 'alive' | 'gone' | 'unavailable';

export function isAuthUserGoneError(error: {
  code?: string;
  message?: string;
  status?: number;
} | null): boolean {
  if (!error) return false;
  const code = String(error.code || '').toLowerCase();
  const msg = String(error.message || '').toLowerCase();
  if (code === 'user_not_found' || code === 'user_banned') return true;
  if (msg.includes('does not exist')) return true;
  if (msg.includes('user not found')) return true;
  return false;
}

/** Uses the given access token only — never refreshSession. */
export async function probeAuthUser(accessToken: string | undefined): Promise<AuthUserProbe> {
  if (!supabase || !accessToken) return 'unavailable';
  try {
    const { data, error } = await supabase.auth.getUser(accessToken);
    if (data?.user && !error) return 'alive';
    if (isAuthUserGoneError(error)) return 'gone';
    return 'unavailable';
  } catch (err) {
    if (isAuthUserGoneError(err as { message?: string; code?: string })) return 'gone';
    return 'unavailable';
  }
}
