/**
 * Supabase PKCE + token_hash + implicit-hash oturum kurulumu.
 * Web `authSessionFromUrl.js` ile aynı iş mantığı; URL `window.location` yerine
 * Linking / deep-link string'inden okunur (docs/rn-migration/07 §6).
 */
import type { Session, SupabaseClient } from '@supabase/supabase-js';

function parseUrlParts(url: string) {
  const match = url.match(/^(?:[^?#]*)(?:\?([^#]*))?(?:#(.*))?$/);
  const query = match?.[1] || '';
  const hashRaw = match?.[2] || '';
  return {
    params: new URLSearchParams(query),
    hashParams: new URLSearchParams(hashRaw),
  };
}

function waitForDetectedSession(client: SupabaseClient, waitMs = 5000): Promise<Session | null> {
  return new Promise((resolve) => {
    let settled = false;
    let subscription: { unsubscribe: () => void } | null = null;

    const finish = (session: Session | null) => {
      if (settled) return;
      settled = true;
      subscription?.unsubscribe();
      resolve(session?.user ? session : null);
    };

    const { data } = client.auth.onAuthStateChange((event, session) => {
      if (session?.user && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
        finish(session);
      }
    });
    subscription = data?.subscription ?? null;

    void (async () => {
      const started = Date.now();
      while (!settled && Date.now() - started < waitMs) {
        const {
          data: { session },
        } = await client.auth.getSession();
        if (session?.user) {
          finish(session);
          return;
        }
        await new Promise((r) => setTimeout(r, 150));
      }
      if (!settled) {
        const {
          data: { session },
        } = await client.auth.getSession();
        finish(session);
      }
    })();
  });
}

/**
 * URL'deki her türlü Supabase auth parametresinden oturum kurar:
 *   1. token_hash + type  → verifyOtp
 *   2. code               → exchangeCodeForSession
 *   3. hash access_token  → setSession
 *   4. Bekle & dene       → mevcut oturum
 */
export async function establishAuthSessionFromUrl(
  client: SupabaseClient | null,
  url: string,
  { waitMs = 2500 }: { waitMs?: number } = {},
): Promise<Session | null> {
  if (!client || !url) return null;

  const { params, hashParams } = parseUrlParts(url);

  const token_hash = params.get('token_hash') || hashParams.get('token_hash');
  const otpType = params.get('type') || hashParams.get('type');
  if (token_hash && otpType) {
    const { data, error } = await client.auth.verifyOtp({
      token_hash,
      type: otpType as 'recovery' | 'email' | 'signup' | 'invite' | 'magiclink' | 'email_change',
    });
    if (!error && data?.session) return data.session;
  }

  const {
    data: { session: preExchange },
  } = await client.auth.getSession();
  if (preExchange?.user) return preExchange;

  const code = params.get('code');
  if (code) {
    const { data, error } = await client.auth.exchangeCodeForSession(code);
    if (!error && data?.session) return data.session;

    const autoSession = await waitForDetectedSession(client, Math.min(waitMs, 3000));
    if (autoSession?.user) return autoSession;
  }

  const accessToken = hashParams.get('access_token');
  const refreshToken = hashParams.get('refresh_token');
  if (accessToken && refreshToken) {
    const { data, error } = await client.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (!error && data?.session) return data.session;
  }

  const {
    data: { session: immediate },
  } = await client.auth.getSession();
  if (immediate?.user) return immediate;

  const started = Date.now();
  while (Date.now() - started < waitMs) {
    await new Promise((r) => setTimeout(r, 200));
    const {
      data: { session },
    } = await client.auth.getSession();
    if (session?.user) return session;
  }

  return null;
}

/** Deep-link query/hash parametrelerini oku. */
export function readAuthCallbackParams(url: string) {
  const { params, hashParams } = parseUrlParts(url);
  const get = (key: string) => params.get(key) || hashParams.get(key);
  return {
    next: get('next'),
    verify: get('verify'),
    evt: get('evt'),
    plan: get('plan'),
    flow: get('flow'),
    error: get('error') || get('error_description'),
  };
}
