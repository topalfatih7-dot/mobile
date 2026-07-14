/**
 * E-posta / telefon doğrulama — web `authVerification.js` sözleşmesi
 * (docs/rn-migration/07 + AI_MOBILE_PROGRESS §5.2).
 */
import { apiUrl, env } from '@/config/env';
import { DEFAULT_COUNTRY_ISO, digitsOnly, toE164 } from '@/data/countryCodes';
import { getApiAuthHeaders } from '@/services/apiAuth';
import { fetchMemberById, saveMemberPatch } from '@/services/db/members';
import { getUser } from '@/services/supabaseAuth';
import { supabase } from '@/services/supabaseClient';
import type { MemberProfile } from '@/types/session';

const nowISO = () => new Date().toISOString();

function phoneVerifyViaEmail() {
  return process.env.EXPO_PUBLIC_PHONE_VERIFY_VIA_EMAIL === 'true';
}

export function parsePhoneE164(phone: string, countryIso = DEFAULT_COUNTRY_ISO) {
  const raw = String(phone || '').trim();
  if (!raw) return '';
  if (raw.startsWith('+')) return `+${digitsOnly(raw)}`;
  return toE164(countryIso, raw);
}

export type VerificationStatus = {
  email: string;
  phone: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  authPhone: string;
  canVerifyEmail: boolean;
  canVerifyPhone: boolean;
};

export async function getVerificationStatus(
  member: MemberProfile | null | undefined,
): Promise<VerificationStatus> {
  const authUser = await getUser();
  const phoneVerified = Boolean(member?.phoneVerifiedAt);
  const authPhone = authUser?.phone || '';

  return {
    email: member?.email || authUser?.email || '',
    phone: (member?.phone as string) || '',
    // Profil doğrulaması yalnızca members.data.emailVerifiedAt ile takip edilir.
    emailVerified: Boolean(member?.emailVerifiedAt),
    phoneVerified,
    authPhone,
    canVerifyEmail: Boolean(member?.email || authUser?.email),
    canVerifyPhone: Boolean(member?.phone || authPhone),
  };
}

export async function patchMemberVerification(
  userId: string,
  patch: Record<string, unknown>,
): Promise<{ success: true } | { success: false; error: string }> {
  const member = await fetchMemberById(userId);
  if (!member) return { success: false, error: 'Üye kaydı bulunamadı' };
  const res = await saveMemberPatch(member, patch);
  if (!res.success) return res;
  return { success: true };
}

async function patchVerification(
  member: MemberProfile | null | undefined,
  patch: Record<string, unknown>,
) {
  if (!member?.id) return { success: false as const, error: 'Oturum bulunamadı' };
  if (member.membership !== undefined) {
    const res = await saveMemberPatch(member, patch);
    if (!res.success) return res;
    return { success: true as const, member: res.member };
  }
  const res = await patchMemberVerification(member.id, patch);
  if (!res.success) return res;
  return { success: true as const };
}

export async function markEmailVerified(
  member: MemberProfile | { id: string; email?: string } | null | undefined,
) {
  if (!member?.id) return { success: false as const, error: 'Oturum bulunamadı' };
  const res = await patchVerification(member as MemberProfile, { emailVerifiedAt: nowISO() });
  if (res?.success === false) return res;
  return { success: true as const };
}

export async function markPhoneVerified(
  member: MemberProfile | null | undefined,
  phone?: string,
) {
  if (!member?.id) return { success: false as const, error: 'Oturum bulunamadı' };
  const res = await patchVerification(member, {
    phoneVerifiedAt: nowISO(),
    ...(phone ? { phone } : {}),
    pendingPhoneVerify: null,
  });
  if (res?.success === false) return res;
  return { success: true as const };
}

export async function sendEmailVerification() {
  const authUser = await getUser();
  if (!authUser?.email) return { success: false as const, error: 'E-posta adresi bulunamadı.' };

  const headers = await getApiAuthHeaders();
  if (!headers.Authorization) {
    return { success: false as const, error: 'Oturum bulunamadı. Lütfen tekrar giriş yapın.' };
  }

  try {
    const res = await fetch(apiUrl('/api/auth'), {
      method: 'POST',
      headers,
      body: JSON.stringify({ action: 'email-send' }),
    });
    const json = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; message?: string };
    if (!res.ok || !json?.ok) {
      return { success: false as const, error: json?.error || 'Doğrulama e-postası gönderilemedi.' };
    }
    return {
      success: true as const,
      message: json.message || 'E-postanıza doğrulama bağlantısı gönderildi. Bağlantıya bir kez tıklayın.',
    };
  } catch (e) {
    return { success: false as const, error: String((e as Error)?.message || e) };
  }
}

/** E-posta bağlantısındaki evt jetonu ile profil doğrulamasını tamamlar. */
export async function confirmEmailVerificationByEvt(evt: string) {
  if (!evt?.trim()) return { success: false as const, error: 'Doğrulama jetonu eksik.' };

  const headers = await getApiAuthHeaders();

  try {
    const res = await fetch(apiUrl('/api/auth'), {
      method: 'POST',
      headers,
      body: JSON.stringify({ action: 'email-confirm', evt: evt.trim() }),
    });
    const json = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
    if (!res.ok || !json?.ok) {
      return { success: false as const, error: json?.error || 'Doğrulama tamamlanamadı.' };
    }
    return { success: true as const };
  } catch (e) {
    return { success: false as const, error: String((e as Error)?.message || e) };
  }
}

export async function confirmEmailVerification(
  code: string,
  member: MemberProfile | null | undefined,
) {
  if (!supabase) return { success: false as const, error: 'Supabase yapılandırılmadı.' };
  const authUser = await getUser();
  const email = authUser?.email;
  if (!email) return { success: false as const, error: 'E-posta bulunamadı.' };
  if (!code?.trim()) return { success: false as const, error: 'Doğrulama kodunu girin.' };

  const { error } = await supabase.auth.verifyOtp({
    email,
    token: code.trim(),
    type: 'email',
  });
  if (error) {
    return {
      success: false as const,
      error: 'Kod doğrulanamadı. E-postadaki bağlantıya tıklamayı deneyin.',
    };
  }

  return markEmailVerified(member);
}

export async function refreshEmailVerification(member: MemberProfile | null | undefined) {
  if (!supabase) return { success: false as const, error: 'Supabase yapılandırılmadı.' };
  if (!member?.id) return { success: false as const, error: 'Oturum bulunamadı.' };

  const { data, error } = await supabase
    .from('members')
    .select('data')
    .eq('id', member.id)
    .maybeSingle();

  if (error || !data) {
    return { success: false as const, error: 'Profil yüklenemedi.' };
  }

  const payload = data.data as Record<string, unknown> | null;
  if (payload?.emailVerifiedAt) {
    return { success: true as const };
  }

  return {
    success: false as const,
    error: 'Henüz doğrulanmadı. E-postadaki bağlantıya tıklayıp onay sayfasını tamamlayın.',
  };
}

export async function sendPhoneVerification(
  phone: string,
  countryIso = DEFAULT_COUNTRY_ISO,
  member: MemberProfile | null = null,
) {
  if (!supabase) return { success: false as const, error: 'Supabase yapılandırılmadı.' };

  const e164 = parsePhoneE164(phone, countryIso);
  if (!e164 || e164.length < 10) {
    return { success: false as const, error: 'Geçerli bir telefon numarası girin.' };
  }

  const authUser = await getUser();
  if (!authUser?.email) return { success: false as const, error: 'Oturum bulunamadı.' };

  const useEmailFallback = phoneVerifyViaEmail();
  const isSmsProviderError = (msg = '') =>
    /provider|twilio|messagebird|sms|sending|not enabled|disabled|unsupported|could not be found/i.test(
      msg,
    );

  if (!useEmailFallback) {
    const { error } = await supabase.auth.updateUser({ phone: e164 });
    if (!error) {
      return {
        success: true as const,
        phone: e164,
        viaEmail: false as const,
        message: 'SMS doğrulama kodu gönderildi.',
      };
    }
    if (!isSmsProviderError(error.message)) {
      return { success: false as const, error: error.message };
    }
  }

  if (member?.id) {
    await patchVerification(member, {
      pendingPhoneVerify: { phone, e164, viaEmail: true, sentAt: nowISO() },
    });
  }

  // E-posta linkleri tarayıcıda açılır → web callback (SITE_URL)
  const redirectTo = `${env.siteUrl}/auth/callback?verify=phone`;
  const { error: emailErr } = await supabase.auth.signInWithOtp({
    email: authUser.email,
    options: { shouldCreateUser: false, emailRedirectTo: redirectTo },
  });
  if (emailErr) {
    return {
      success: false as const,
      error: emailErr.message || 'Doğrulama bağlantısı gönderilemedi.',
    };
  }

  return {
    success: true as const,
    phone: e164,
    viaEmail: true as const,
    message:
      'SMS yapılandırılmadığı için e-postanıza doğrulama bağlantısı gönderildi. Bağlantıya tıklayın.',
  };
}

export async function confirmPhoneVerification(
  code: string,
  phone: string,
  member: MemberProfile | null | undefined,
  countryIso = DEFAULT_COUNTRY_ISO,
  viaEmail = false,
) {
  if (!supabase) return { success: false as const, error: 'Supabase yapılandırılmadı.' };
  if (!code?.trim()) return { success: false as const, error: 'Doğrulama kodunu girin.' };

  const pending = member?.pendingPhoneVerify as
    | { phone?: string; viaEmail?: boolean }
    | null
    | undefined;

  if (viaEmail || pending?.viaEmail) {
    const authUser = await getUser();
    const email = authUser?.email;
    if (!email) return { success: false as const, error: 'E-posta bulunamadı.' };

    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code.trim(),
      type: 'email',
    });
    if (error) return { success: false as const, error: error.message };

    const verifiedPhone = pending?.phone || phone;
    await patchVerification(member, { pendingPhoneVerify: null });
    return markPhoneVerified(member, verifiedPhone);
  }

  const e164 = parsePhoneE164(phone, countryIso);
  if (!e164) return { success: false as const, error: 'Telefon numarası gerekli.' };

  const { error } = await supabase.auth.verifyOtp({
    phone: e164,
    token: code.trim(),
    type: 'phone_change',
  });
  if (error) return { success: false as const, error: error.message };

  return markPhoneVerified(member, phone);
}
