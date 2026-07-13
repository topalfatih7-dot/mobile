/**
 * Korunan API istekleri için oturum token'ı ile header üretir.
 * Web `src/services/apiAuth.js` ile birebir aynı sözleşme (docs/rn-migration/07 §12).
 */
import { supabase } from './supabaseClient';

export async function getApiAuthHeaders(extra: Record<string, string> = {}) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...extra };
  if (!supabase) return headers;

  let { data } = await supabase.auth.getSession();
  if (!data?.session) {
    await supabase.auth.getUser();
    ({ data } = await supabase.auth.getSession());
  }
  const token = data?.session?.access_token;
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}
