import * as Linking from 'expo-linking';

import { AUTH_CLIENT_MOBILE } from '@/config/turnstile';
import { env } from '@/config/env';
import { isUiOnly } from '@/config/runtime';
import { postJson } from '@/services/api';
import { requireSupabase, supabase } from '@/services/supabase';
import { sanitizeEmailInput, isValidEmailAddress } from '@/utils/email';
import { isPasswordValid } from '@/utils/password';

export async function sendPasswordReset(emailRaw: string) {
  if (isUiOnly() || !supabase) {
    return {
      success: false as const,
      error: 'E-posta gönderimi demo modda kapalı. Yakında aktif olacak.',
    };
  }
  const email = sanitizeEmailInput(emailRaw);
  if (!isValidEmailAddress(email) || !email.includes('@')) {
    return { success: false as const, error: 'Geçerli bir e-posta girin' };
  }

  const redirectTo = Linking.createURL('auth/callback', {
    scheme: 'yeniform',
    queryParams: { next: 'reset-password' },
  });

  /* MOBILE DIFF: /api/auth password-reset — doğrudan Supabase CAPTCHA hatası vermez */
  const { ok, json } = await postJson<{ ok?: boolean; error?: string; message?: string }>(
    '/api/auth',
    {
      action: 'password-reset',
      email,
      client: AUTH_CLIENT_MOBILE,
      redirectTo,
      turnstileToken: '',
    },
    { auth: false },
  );

  if (!ok) {
    return {
      success: false as const,
      error: json?.error || 'Bağlantı gönderilemedi',
    };
  }
  return { success: true as const };
}

export async function updatePassword(password: string, confirm: string) {
  if (!isPasswordValid(password)) {
    return {
      success: false as const,
      error:
        'Şifre en az 8 karakter olmalı; büyük harf, küçük harf, rakam ve özel karakter içermelidir.',
    };
  }
  if (password !== confirm) {
    return { success: false as const, error: 'Şifreler eşleşmiyor — iki alanı da aynı yazın.' };
  }
  if (!supabase) return { success: false as const, error: 'Supabase yapılandırması eksik' };
  const { error } = await requireSupabase().auth.updateUser({ password });
  if (error) return { success: false as const, error: error.message };
  return { success: true as const };
}

/** Web fallback URL (e-posta istemcisi tarayıcı açarsa). */
export function webPasswordResetFallbackUrl() {
  return `${env.apiBaseUrl}/auth/callback?next=reset-password`;
}
