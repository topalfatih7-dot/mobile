import type { Session, SupabaseClient } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';

/**
 * Web `authSessionFromUrl.js` parity — Expo deep link / query / hash.
 * LOCK: docs/mobile/screens/public/auth-callback.md
 */

function mergeParams(
  search: Record<string, string | undefined>,
  url?: string | null,
): URLSearchParams {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(search)) {
    if (v != null && v !== '') params.set(k, String(v));
  }
  if (!url) return params;

  try {
    const parsed = Linking.parse(url);
    const q = parsed.queryParams || {};
    for (const [k, v] of Object.entries(q)) {
      if (v == null || params.has(k)) continue;
      const val = Array.isArray(v) ? v[0] : v;
      if (val != null && val !== '') params.set(k, String(val));
    }
    // Hash fragment: yeniform://auth/callback#access_token=…&refresh_token=…
    const hashIdx = url.indexOf('#');
    if (hashIdx >= 0) {
      const hashParams = new URLSearchParams(url.slice(hashIdx + 1));
      hashParams.forEach((value, key) => {
        if (!params.has(key)) params.set(key, value);
      });
    }
    // Bazı istemciler query’yi path sonrası bırakır
    const qIdx = url.indexOf('?');
    if (qIdx >= 0) {
      const end = hashIdx >= 0 ? hashIdx : url.length;
      const qs = url.slice(qIdx + 1, end);
      const fromQs = new URLSearchParams(qs);
      fromQs.forEach((value, key) => {
        if (!params.has(key)) params.set(key, value);
      });
    }
  } catch {
    /* ignore parse errors */
  }
  return params;
}

async function waitForSession(
  supabase: SupabaseClient,
  waitMs: number,
): Promise<Session | null> {
  const started = Date.now();
  while (Date.now() - started < waitMs) {
    const { data } = await supabase.auth.getSession();
    if (data.session?.user) return data.session;
    await new Promise((r) => setTimeout(r, 150));
  }
  const { data } = await supabase.auth.getSession();
  return data.session?.user ? data.session : null;
}

const inflightByCode = new Map<string, Promise<Session | null>>();

async function exchangeCodeSingleFlight(
  supabase: SupabaseClient,
  code: string,
  waitMs: number,
): Promise<Session | null> {
  const existing = inflightByCode.get(code);
  if (existing) return existing;

  const promise = (async () => {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data?.session) return data.session;
    return waitForSession(supabase, Math.min(waitMs, 3000));
  })();

  inflightByCode.set(code, promise);
  try {
    return await promise;
  } finally {
    inflightByCode.delete(code);
  }
}

export async function establishAuthSessionFromUrl(
  supabase: SupabaseClient,
  opts: {
    searchParams?: Record<string, string | undefined>;
    url?: string | null;
    waitMs?: number;
  } = {},
): Promise<Session | null> {
  const waitMs = opts.waitMs ?? 2500;
  const params = mergeParams(opts.searchParams || {}, opts.url);

  const token_hash = params.get('token_hash');
  const otpType = params.get('type');
  if (token_hash && otpType) {
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash,
      type: otpType as 'recovery' | 'email' | 'signup' | 'invite' | 'magiclink' | 'email_change',
    });
    if (!error && data?.session) return data.session;
  }

  const { data: pre } = await supabase.auth.getSession();
  if (pre.session?.user) return pre.session;

  const code = params.get('code');
  if (code) {
    const session = await exchangeCodeSingleFlight(supabase, code, waitMs);
    if (session?.user) return session;
  }

  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  if (accessToken && refreshToken) {
    const { data, error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (!error && data?.session) return data.session;
  }

  return waitForSession(supabase, waitMs);
}

export function isRecoveryCallback(params: {
  next?: string;
  verify?: string;
  type?: string;
}): boolean {
  return (
    params.next === 'reset-password' ||
    params.verify === 'recovery' ||
    params.type === 'recovery'
  );
}
