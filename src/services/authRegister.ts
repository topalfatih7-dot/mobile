/**
 * Free register path — contracts/api-auth signup + members upsert.
 * Paid → pending_registration + IAP (P0.2 IAP SDK sonraki dilim; UI hazır).
 */
import { isUiOnly } from '@/config/runtime';
import { isTurnstileEnabled } from '@/config/turnstile';
import { postJson } from '@/services/api';
import { requireSupabase, supabase } from '@/services/supabase';
import { sanitizeEmailInput } from '@/utils/email';

export type RegisterProfile = {
  name: string;
  email: string;
  phone: string;
  phoneCountry: string;
  gender: 'female' | 'male';
  password: string;
  membership: string;
  durationMonths: number;
};

export async function savePendingRegistrationMetadata(
  profile: RegisterProfile,
  membership: string,
  durationMonths: number,
) {
  if (isUiOnly() || !supabase) {
    return {
      success: false as const,
      error: 'Kayıt ve ödeme demo modda kapalı. Giriş ekranından demo hesapla devam edin.',
    };
  }
  const { error } = await requireSupabase().auth.updateUser({
    data: {
      pending_registration: {
        name: profile.name.trim(),
        phone: profile.phone,
        phoneCountry: profile.phoneCountry || '',
        gender: profile.gender,
        membership,
        durationMonths,
        fitnessLevel: 'beginner',
        savedAt: new Date().toISOString(),
      },
    },
  });
  if (error) return { success: false as const, error: error.message };
  return { success: true as const };
}

export async function registerFreeMember(
  profile: RegisterProfile,
  turnstileToken = '',
) {
  if (isUiOnly()) {
    return {
      success: false as const,
      error: 'Kayıt demo modda kapalı. Giriş ekranından demo hesapla devam edin.',
    };
  }

  if (isTurnstileEnabled() && !turnstileToken) {
    return { success: false as const, error: 'Bot doğrulamasını tamamlayın.' };
  }

  const email = sanitizeEmailInput(profile.email);
  const client = requireSupabase();

  // TEMP: captcha kapalı — API bot gate’ini atla, doğrudan auth + members
  if (!isTurnstileEnabled()) {
    const { data: signUpData, error: signUpError } = await client.auth.signUp({
      email,
      password: profile.password,
      options: { data: { name: profile.name.trim() } },
    });
    if (signUpError) {
      const msg = signUpError.message || '';
      if (/registered|already|exists/i.test(msg)) {
        const signIn = await client.auth.signInWithPassword({
          email,
          password: profile.password,
        });
        if (signIn.error) {
          return { success: false as const, error: 'Bu e-posta zaten kayıtlı.' };
        }
      } else {
        return { success: false as const, error: msg || 'Kayıt tamamlanamadı.' };
      }
    } else if (!signUpData.session) {
      const signIn = await client.auth.signInWithPassword({
        email,
        password: profile.password,
      });
      if (signIn.error) {
        return {
          success: false as const,
          error: signIn.error.message || 'Kayıt tamamlanamadı.',
        };
      }
    }
  } else {
    const { ok, json } = await postJson<{
      ok?: boolean;
      error?: string;
      session?: { access_token?: string; refresh_token?: string };
    }>(
      '/api/auth',
      {
        action: 'signup',
        email,
        password: profile.password,
        name: profile.name.trim(),
        turnstileToken: turnstileToken || '',
      },
      { auth: false },
    );

    if (!ok) {
      return {
        success: false as const,
        error: json?.error || 'Kayıt tamamlanamadı.',
      };
    }

    if (json.session?.access_token && json.session?.refresh_token) {
      await client.auth.setSession({
        access_token: json.session.access_token,
        refresh_token: json.session.refresh_token,
      });
    } else {
      const signIn = await client.auth.signInWithPassword({
        email,
        password: profile.password,
      });
      if (signIn.error) {
        return {
          success: false as const,
          error: signIn.error.message || 'Kayıt tamamlanamadı.',
        };
      }
    }
  }

  const { data: userData } = await client.auth.getUser();
  const user = userData.user;
  if (!user) return { success: false as const, error: 'Kayıt tamamlanamadı.' };

  const today = new Date().toISOString().slice(0, 10);
  const { error } = await client.from('members').upsert(
    {
      id: user.id,
      email,
      name: profile.name.trim(),
      phone: profile.phone,
      membership: 'free',
      membership_status: 'active',
      data: {
        phoneCountry: profile.phoneCountry || 'TR',
        gender: profile.gender,
        profileComplete: true,
        joinedAt: today,
        fitnessLevel: 'beginner',
        goals: [],
        nutritionPrefs: [],
        settings: { theme: 'light', language: 'tr', emailNotifs: true, pushNotifs: true },
      },
    },
    { onConflict: 'id' },
  );
  if (error) return { success: false as const, error: error.message || 'Kayıt tamamlanamadı.' };
  return { success: true as const };
}
