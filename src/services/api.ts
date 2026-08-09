/**
 * Vercel API — docs/mobile/contracts/*
 * UI_ONLY_MODE: uzak istek yok.
 */
import { isUiOnly } from '@/config/runtime';
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

export async function getApiAuthHeaders(extra: Record<string, string> = {}) {
  const headers = withMobileApiKey({ 'Content-Type': 'application/json', ...extra });
  if (isUiOnly() || !supabase) return headers;
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export async function postJson<T = unknown>(
  path: string,
  body: Record<string, unknown>,
  opts?: { auth?: boolean },
): Promise<{ ok: boolean; status: number; json: T & { error?: string; ok?: boolean } }> {
  if (isUiOnly()) {
    return {
      ok: false,
      status: 0,
      json: {
        error: 'Bu özellik demo modda kapalı.',
      } as T & { error?: string },
    };
  }

  const headers =
    opts?.auth === false
      ? withMobileApiKey({ 'Content-Type': 'application/json' })
      : await getApiAuthHeaders();
  try {
    const res = await fetch(apiUrl(path), {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    const json = (await res.json().catch(() => ({}))) as T & { error?: string; ok?: boolean };
    return { ok: res.ok, status: res.status, json };
  } catch {
    return {
      ok: false,
      status: 0,
      json: { error: 'Giriş servisine ulaşılamadı. Sayfayı yenileyip tekrar deneyin.' } as T & {
        error?: string;
      },
    };
  }
}
