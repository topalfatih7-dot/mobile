/**
 * Vercel API — docs/mobile/contracts/*
 */
import { apiUrl as buildUrl, env } from '@/config/env';
import { supabase } from '@/services/supabase';

export function apiUrl(path: string): string {
  return buildUrl(path);
}

/** Sunucu Turnstile bypass — `api/auth.js` `isVerifiedMobileClient` */
function withMobileApiKey(headers: Record<string, string>): Record<string, string> {
  const secret = env.mobileApiSecret;
  if (secret) headers['x-yeniform-mobile-key'] = secret;
  return headers;
}

const STALE_TOKEN_S = 60;
const AUTH_EXPIRED_COPY = 'Oturumunuzun süresi doldu. Lütfen tekrar giriş yapın.';
let refreshInFlight: Promise<string | null> | null = null;

/**
 * API Bearer token. Stale JWT → silent refreshSession.
 * LOCK: webCheckoutHandoff.sessionForHandoff must not call refreshSession.
 */
async function accessTokenForApi(): Promise<string | null> {
  const client = supabase;
  if (!client) return null;
  const { data } = await client.auth.getSession();
  const session = data.session;
  if (!session?.access_token) return null;

  const now = Math.floor(Date.now() / 1000);
  const expiresAt = Number(session.expires_at) || 0;
  const isStale = !expiresAt || expiresAt - now < STALE_TOKEN_S;
  if (!isStale) return session.access_token;

  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const { data: refreshed, error } = await client.auth.refreshSession();
        if (error || !refreshed.session?.access_token) return session.access_token;
        return refreshed.session.access_token;
      } catch {
        return session.access_token;
      } finally {
        refreshInFlight = null;
      }
    })();
  }
  return refreshInFlight;
}

/**
 * /api/auth 401: JWT expire olmamış olsa da GoTrue oturumu düşmüş olabilir
 * (tek cihaz `signOut(others)`). `refreshSession` bu durumda yerel oturumu
 * silmez — access token hâlâ “valid”. `getUser()` `session_not_found` → SIGNED_OUT.
 * LOCK: sessionForHandoff bu fonksiyonu çağırmaz.
 */
async function recoverAccessTokenAfter401(): Promise<string | null> {
  const client = supabase;
  if (!client) return null;
  try {
    await client.auth.getUser();
  } catch {
    /* session_not_found → client yerel oturumu kapatır */
  }
  return accessTokenForApi();
}

export async function getApiAuthHeaders(extra: Record<string, string> = {}) {
  const headers = withMobileApiKey({ 'Content-Type': 'application/json', ...extra });
  if (!supabase) return headers;
  const token = await accessTokenForApi();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export async function postJson<T = unknown>(
  path: string,
  body: Record<string, unknown>,
  opts?: { auth?: boolean; timeoutMs?: number },
): Promise<{ ok: boolean; status: number; json: T & { error?: string; ok?: boolean } }> {
  const timeoutMs = opts?.timeoutMs;
  const payload = JSON.stringify(body);

  const send = async (headers: Record<string, string>) => {
    const controller = timeoutMs && timeoutMs > 0 ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
    try {
      const res = await fetch(apiUrl(path), {
        method: 'POST',
        headers,
        body: payload,
        ...(controller ? { signal: controller.signal } : {}),
      });
      const json = (await res.json().catch(() => ({}))) as T & { error?: string; ok?: boolean };
      return { res, json };
    } finally {
      if (timer) clearTimeout(timer);
    }
  };

  try {
    let headers =
      opts?.auth === false
        ? withMobileApiKey({ 'Content-Type': 'application/json' })
        : await getApiAuthHeaders();
    let { res, json } = await send(headers);

    if (res.status === 401 && opts?.auth !== false) {
      const recovered = await recoverAccessTokenAfter401();
      if (recovered) {
        headers = withMobileApiKey({
          'Content-Type': 'application/json',
          Authorization: `Bearer ${recovered}`,
        });
        ({ res, json } = await send(headers));
      }
      if (res.status === 401) {
        return {
          ok: false,
          status: 401,
          json: {
            ...json,
            error: AUTH_EXPIRED_COPY,
          },
        };
      }
    }

    return { ok: res.ok, status: res.status, json };
  } catch (err) {
    const aborted = err instanceof Error && err.name === 'AbortError';
    return {
      ok: false,
      status: 0,
      json: {
        error: aborted
          ? 'İstek zaman aşımına uğradı. Lütfen tekrar deneyin.'
          : 'Giriş servisine ulaşılamadı. Sayfayı yenileyip tekrar deneyin.',
      } as T & {
        error?: string;
      },
    };
  }
}
