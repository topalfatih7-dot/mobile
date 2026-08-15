/**
 * Password login — docs/mobile/screens/public/login.md + contracts/api-auth.md
 * Production: POST /api/auth (MOBILE DIFF: client=yeniform-mobile, Turnstile yok).
 * Doğrudan signInWithPassword captcha_failed verir — kullanma.
 */
import type { Session, SupabaseClient } from '@supabase/supabase-js';

import { AUTH_CLIENT_MOBILE } from '@/config/turnstile';
import { postJson } from '@/services/api';
import { requireSupabase } from '@/services/supabase';
import { setRememberMe } from '@/services/authStorage';
import { sanitizeEmailInput, isValidEmailAddress } from '@/utils/email';

export type LoginValidation = {
  ok: boolean;
  fieldErrors: { email?: string; password?: string };
  formError?: string;
  email?: string;
};

export function validateLoginForm(email: string, password: string): LoginValidation {
  const clean = sanitizeEmailInput(email);
  const fieldErrors: { email?: string; password?: string } = {};
  if (!isValidEmailAddress(clean)) fieldErrors.email = 'Geçerli e-posta girin';
  if (password.length < 6) fieldErrors.password = 'En az 6 karakter';
  if (Object.keys(fieldErrors).length) {
    return {
      ok: false,
      fieldErrors,
      formError: fieldErrors.email || fieldErrors.password || 'Lütfen formu kontrol edin.',
    };
  }
  return { ok: true, fieldErrors: {}, email: clean };
}

function mapLoginError(status: number, apiError?: string): string {
  const msg = String(apiError || '').trim();
  const lower = msg.toLowerCase();
  if (status === 429) {
    return msg || 'Çok fazla deneme. Lütfen sonra tekrar deneyin.';
  }
  if (
    status === 403 ||
    /bot|captcha|turnstile|doğrulama/i.test(msg) ||
    lower.includes('captcha')
  ) {
    return msg || 'Giriş şu an tamamlanamadı. Lütfen tekrar deneyin.';
  }
  if (status === 0) {
    return msg || 'Giriş servisine ulaşılamadı. İnternet bağlantınızı kontrol edin.';
  }
  return msg || 'E-posta veya şifre hatalı.';
}

async function applyPasswordSession(
  client: SupabaseClient,
  tokens: { access_token: string; refresh_token: string },
): Promise<Session | null> {
  const first = await client.auth.setSession(tokens);
  if (first.data?.session?.user) return first.data.session;
  await new Promise((r) => setTimeout(r, 400));
  const retry = await client.auth.setSession(tokens);
  if (retry.data?.session?.user) return retry.data.session;
  return null;
}

export async function passwordLogin(opts: {
  email: string;
  password: string;
  remember: boolean;
  turnstileToken?: string;
}): Promise<{ success: true; session: Session } | { success: false; error: string }> {
  const v = validateLoginForm(opts.email, opts.password);
  if (!v.ok || !v.email) {
    return { success: false, error: v.formError || 'Lütfen formu kontrol edin.' };
  }

  const client = requireSupabase();

  try {
    const { ok, status, json } = await postJson<{
      ok?: boolean;
      session?: { access_token?: string; refresh_token?: string };
      error?: string;
    }>(
      '/api/auth',
      {
        action: 'password-login',
        email: v.email,
        password: opts.password,
        client: AUTH_CLIENT_MOBILE,
        turnstileToken: '',
      },
      { auth: false },
    );

    if (!ok || !json?.session?.access_token || !json?.session?.refresh_token) {
      return {
        success: false,
        error: mapLoginError(status, json?.error),
      };
    }

    /*
     * MOBILE DIFF: web login signOut({ scope: 'local' }) sonra setSession yapar
     * (sync localStorage). RN AsyncStorage’da aynı sıra setSession yazısını
     * silebiliyor → “Oturum açılamadı”. In-flight refresh için yalnız stopAutoRefresh.
     */
    try {
      client.auth.stopAutoRefresh();
    } catch {
      /* ignore */
    }

    const session = await applyPasswordSession(client, {
      access_token: json.session.access_token,
      refresh_token: json.session.refresh_token,
    });

    if (opts.remember) {
      try {
        client.auth.startAutoRefresh();
      } catch {
        /* ignore */
      }
    }

    if (!session?.user) {
      return { success: false, error: 'Oturum açılamadı. Lütfen tekrar deneyin.' };
    }

    await setRememberMe(opts.remember);
    return { success: true, session };
  } catch {
    return {
      success: false,
      error: 'Giriş servisine ulaşılamadı. İnternet bağlantınızı kontrol edin.',
    };
  }
}
