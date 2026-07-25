/**
 * Hesap doğrulama — web `src/services/authVerification.js` parity.
 */
import { apiUrl, env } from '@/config/env';
import { DEFAULT_COUNTRY_ISO, digitsOnly, toE164 } from '@/data/countryCodes';
import { isUiOnly } from '@/config/runtime';
import { patchMemberFields, type MemberRecord } from '@/services/memberDb';
import { requireSupabase, supabase } from '@/services/supabase';

export type VerificationStatus = {
  email: string;
  phone: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  authPhone: string;
  canVerifyEmail: boolean;
  canVerifyPhone: boolean;
};

export type VerificationResult = {
  success: boolean;
  error?: string;
  message?: string;
  phone?: string;
  viaEmail?: boolean;
};

const nowISO = () => new Date().toISOString();

export function parsePhoneE164(phone: string, countryIso = DEFAULT_COUNTRY_ISO): string {
  const raw = String(phone || '').trim();
  if (!raw) return '';
  if (raw.startsWith('+')) return `+${digitsOnly(raw)}`;
  return toE164(countryIso, raw);
}

async function getAuthUser() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}

async function getAccessToken(): Promise<string | null> {
  if (!supabase) return null;
  try {
    const { data } = await supabase.auth.getSession();
    return data?.session?.access_token || null;
  } catch {
    return null;
  }
}

export async function getVerificationStatus(
  member: MemberRecord | null | undefined,
): Promise<VerificationStatus> {
  const authUser = await getAuthUser();
  const phoneVerified = Boolean(member?.phoneVerifiedAt);
  const authPhone = authUser?.phone || '';

  return {
    email: String(member?.email || authUser?.email || ''),
    phone: String(member?.phone || ''),
    emailVerified: Boolean(member?.emailVerifiedAt),
    phoneVerified,
    authPhone,
    canVerifyEmail: Boolean(member?.email || authUser?.email),
    canVerifyPhone: Boolean(member?.phone || authPhone),
  };
}

async function patchVerification(
  member: MemberRecord,
  patch: Record<string, unknown>,
): Promise<VerificationResult> {
  if (!member?.id) return { success: false, error: 'Oturum bulunamadı' };
  if (isUiOnly()) return { success: true };
  try {
    await patchMemberFields(member, patch);
    return { success: true };
  } catch (e) {
    return { success: false, error: String((e as Error)?.message || e) };
  }
}

export async function markEmailVerified(member: MemberRecord): Promise<VerificationResult> {
  if (!member?.id) return { success: false, error: 'Oturum bulunamadı' };
  return patchVerification(member, { emailVerifiedAt: nowISO() });
}

export async function markPhoneVerified(
  member: MemberRecord,
  phone?: string,
): Promise<VerificationResult> {
  if (!member?.id) return { success: false, error: 'Oturum bulunamadı' };
  return patchVerification(member, {
    phoneVerifiedAt: nowISO(),
    ...(phone ? { phone } : {}),
  });
}

export async function sendEmailVerification(): Promise<VerificationResult> {
  if (isUiOnly()) {
    return { success: true, message: 'Demo: doğrulama bağlantısı gönderildi (simüle).' };
  }

  const authUser = await getAuthUser();
  if (!authUser?.email) return { success: false, error: 'E-posta adresi bulunamadı.' };

  const token = await getAccessToken();
  if (!token) return { success: false, error: 'Oturum bulunamadı. Lütfen tekrar giriş yapın.' };

  try {
    const res = await fetch(apiUrl('/api/auth'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action: 'email-send' }),
    });
    const json = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      error?: string;
      message?: string;
    };
    if (!res.ok || !json?.ok) {
      return { success: false, error: json?.error || 'Doğrulama e-postası gönderilemedi.' };
    }
    return {
      success: true,
      message:
        json.message ||
        'E-postanıza doğrulama bağlantısı gönderildi. Bağlantıya bir kez tıklayın.',
    };
  } catch (e) {
    return { success: false, error: String((e as Error)?.message || e) };
  }
}

export async function confirmEmailVerification(
  code: string,
  member: MemberRecord,
): Promise<VerificationResult> {
  if (isUiOnly()) {
    await markEmailVerified(member);
    return { success: true };
  }

  const authUser = await getAuthUser();
  const email = authUser?.email;
  if (!email) return { success: false, error: 'E-posta bulunamadı.' };
  if (!code?.trim()) return { success: false, error: 'Doğrulama kodunu girin.' };

  const client = requireSupabase();
  const { error } = await client.auth.verifyOtp({
    email,
    token: code.trim(),
    type: 'email',
  });
  if (error) {
    return {
      success: false,
      error: 'Kod doğrulanamadı. E-postadaki bağlantıya tıklamayı deneyin.',
    };
  }

  return markEmailVerified(member);
}

export async function refreshEmailVerification(
  member: MemberRecord | null | undefined,
): Promise<VerificationResult> {
  if (!member?.id) return { success: false, error: 'Oturum bulunamadı.' };
  if (isUiOnly()) {
    return member.emailVerifiedAt
      ? { success: true }
      : {
          success: false,
          error: 'Henüz doğrulanmadı. E-postadaki bağlantıya tıklayıp onay sayfasını tamamlayın.',
        };
  }

  const client = requireSupabase();
  const { data, error } = await client
    .from('members')
    .select('data')
    .eq('id', member.id)
    .maybeSingle();

  if (error || !data) {
    return { success: false, error: 'Profil yüklenemedi.' };
  }

  const payload = (data.data && typeof data.data === 'object' ? data.data : {}) as Record<
    string,
    unknown
  >;
  if (payload.emailVerifiedAt) {
    return { success: true };
  }

  return {
    success: false,
    error: 'Henüz doğrulanmadı. E-postadaki bağlantıya tıklayıp onay sayfasını tamamlayın.',
  };
}

export async function sendPhoneVerification(
  phone: string,
  countryIso = DEFAULT_COUNTRY_ISO,
  member: MemberRecord | null = null,
): Promise<VerificationResult> {
  if (!env.phoneVerifyEnabled) {
    return { success: false, error: 'Telefon doğrulama şu an kapalı.' };
  }

  const e164 = parsePhoneE164(phone, countryIso);
  if (!e164 || e164.length < 10) {
    return { success: false, error: 'Geçerli bir telefon numarası girin.' };
  }

  if (isUiOnly()) {
    return {
      success: true,
      phone: e164,
      viaEmail: env.phoneVerifyViaEmail,
      message: env.phoneVerifyViaEmail
        ? 'Demo: e-posta doğrulama bağlantısı gönderildi (simüle).'
        : 'Demo: SMS doğrulama kodu gönderildi (simüle).',
    };
  }

  const authUser = await getAuthUser();
  if (!authUser?.email) return { success: false, error: 'Oturum bulunamadı.' };

  const useEmailFallback = env.phoneVerifyViaEmail;
  const isSmsProviderError = (msg = '') =>
    /provider|twilio|messagebird|sms|sending|not enabled|disabled|unsupported|could not be found/i.test(
      msg,
    );

  const client = requireSupabase();

  if (!useEmailFallback) {
    const { error } = await client.auth.updateUser({ phone: e164 });
    if (!error) {
      return {
        success: true,
        phone: e164,
        viaEmail: false,
        message: 'SMS doğrulama kodu gönderildi.',
      };
    }
    if (!isSmsProviderError(error.message)) {
      return { success: false, error: error.message };
    }
  }

  if (member?.id) {
    await patchVerification(member, {
      pendingPhoneVerify: { phone, e164, viaEmail: true, sentAt: nowISO() },
    });
  }

  const redirectTo = `${env.apiBaseUrl}/auth/callback?verify=phone`;
  const { error: emailErr } = await client.auth.signInWithOtp({
    email: authUser.email,
    options: { shouldCreateUser: false, emailRedirectTo: redirectTo },
  });
  if (emailErr) {
    return {
      success: false,
      error: emailErr.message || 'Doğrulama bağlantısı gönderilemedi.',
    };
  }

  return {
    success: true,
    phone: e164,
    viaEmail: true,
    message:
      'SMS yapılandırılmadığı için e-postanıza doğrulama bağlantısı gönderildi. Bağlantıya tıklayın.',
  };
}

export async function confirmPhoneVerification(
  code: string,
  phone: string,
  member: MemberRecord,
  countryIso = DEFAULT_COUNTRY_ISO,
  viaEmail = false,
): Promise<VerificationResult> {
  if (!env.phoneVerifyEnabled) {
    return { success: false, error: 'Telefon doğrulama şu an kapalı.' };
  }
  if (!code?.trim()) return { success: false, error: 'Doğrulama kodunu girin.' };

  if (isUiOnly()) {
    return markPhoneVerified(member, phone);
  }

  const client = requireSupabase();
  const pending = member?.pendingPhoneVerify as
    | { viaEmail?: boolean; phone?: string }
    | null
    | undefined;

  if (viaEmail || pending?.viaEmail) {
    const authUser = await getAuthUser();
    const email = authUser?.email;
    if (!email) return { success: false, error: 'E-posta bulunamadı.' };

    const { error } = await client.auth.verifyOtp({
      email,
      token: code.trim(),
      type: 'email',
    });
    if (error) return { success: false, error: error.message };

    const verifiedPhone = pending?.phone || phone;
    await patchVerification(member, { pendingPhoneVerify: null });
    return markPhoneVerified(member, verifiedPhone);
  }

  const e164 = parsePhoneE164(phone, countryIso);
  if (!e164) return { success: false, error: 'Telefon numarası gerekli.' };

  const { error } = await client.auth.verifyOtp({
    phone: e164,
    token: code.trim(),
    type: 'phone_change',
  });
  if (error) return { success: false, error: error.message };

  return markPhoneVerified(member, phone);
}
