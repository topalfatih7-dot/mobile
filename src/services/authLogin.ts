/**
 * Password login — docs/mobile/screens/public/login.md + contracts/api-auth.md
 * Production: her zaman POST /api/auth (Supabase CAPTCHA + Turnstile).
 * Doğrudan signInWithPassword captcha_failed verir — kullanma.
 */
import { isTurnstileEnabled } from '@/config/turnstile';
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
    return msg || 'Bot doğrulamasını tamamlayın ve tekrar deneyin.';
  }
  if (status === 0) {
    return msg || 'Giriş servisine ulaşılamadı. İnternet bağlantınızı kontrol edin.';
  }
  return msg || 'E-posta veya şifre hatalı.';
}

export async function passwordLogin(opts: {
  email: string;
  password: string;
  remember: boolean;
  turnstileToken: string;
}): Promise<{ success: true } | { success: false; error: string }> {
  const v = validateLoginForm(opts.email, opts.password);
  if (!v.ok || !v.email) {
    return { success: false, error: v.formError || 'Lütfen formu kontrol edin.' };
  }

  if (isTurnstileEnabled() && !opts.turnstileToken) {
    return { success: false, error: 'Bot doğrulamasını tamamlayın.' };
  }

  const client = requireSupabase();

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
      turnstileToken: opts.turnstileToken || '',
    },
    { auth: false },
  );

  if (!ok || !json?.session?.access_token || !json?.session?.refresh_token) {
    return {
      success: false,
      error: mapLoginError(status, json?.error),
    };
  }

  const { error } = await client.auth.setSession({
    access_token: json.session.access_token,
    refresh_token: json.session.refresh_token,
  });
  if (error) {
    return { success: false, error: 'Oturum açılamadı. Lütfen tekrar deneyin.' };
  }

  await setRememberMe(opts.remember);
  return { success: true };
}
