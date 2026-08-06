/**
 * Free register path — contracts/api-auth signup + members upsert.
 * Paid → pending_registration + IAP (P2).
 * MOBILE DIFF: client=yeniform-mobile; Turnstile yok.
 */
import { isUiOnly } from '@/config/runtime';
import { AUTH_CLIENT_MOBILE } from '@/config/turnstile';
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

export async function registerFreeMember(profile: RegisterProfile, _turnstileToken = '') {
  if (isUiOnly()) {
    return {
      success: false as const,
      error: 'Kayıt demo modda kapalı. Giriş ekranından demo hesapla devam edin.',
    };
  }

  const email = sanitizeEmailInput(profile.email);
  const client = requireSupabase();

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
      phone: profile.phone,
      client: AUTH_CLIENT_MOBILE,
      turnstileToken: '',
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
    /* Signup sonrası session yoksa mobile login ile aç */
    const login = await postJson<{
      ok?: boolean;
      error?: string;
      session?: { access_token?: string; refresh_token?: string };
    }>(
      '/api/auth',
      {
        action: 'password-login',
        email,
        password: profile.password,
        client: AUTH_CLIENT_MOBILE,
        turnstileToken: '',
      },
      { auth: false },
    );
    if (!login.ok || !login.json.session?.access_token || !login.json.session?.refresh_token) {
      return {
        success: false as const,
        error: login.json?.error || 'Kayıt tamamlanamadı.',
      };
    }
    await client.auth.setSession({
      access_token: login.json.session.access_token,
      refresh_token: login.json.session.refresh_token,
    });
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
