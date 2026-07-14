import type { User } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';

import { ADMIN_EMAIL } from '@/config/brand';
import { apiUrl } from '@/config/env';
import { clearAllAuthTokens, setRememberMe } from '@/services/authStorage';
import { memberToRow, rowToMember, rowToStaff } from '@/services/db/mappers';
import { formatPasswordAuthError } from '@/services/password';
import { supabase, syncAutoRefresh } from '@/services/supabaseClient';
import type {
  AppSession,
  AuthState,
  AuthUser,
  MemberProfile,
  StaffProfile,
  UserRole,
} from '@/types/session';
import { notifyTelegram } from '@/services/telegramNotify';
import { normalizeEmailAddress, sanitizeEmailInput } from '@/utils/emailAddress';

const today = () => new Date().toISOString().split('T')[0];
const nowISO = () => new Date().toISOString();

export const AUTH_EVENTS_REQUIRING_HYDRATE = [
  'INITIAL_SESSION',
  'SIGNED_IN',
  'SIGNED_OUT',
  'USER_UPDATED',
] as const;

export function findStaffMatch(user: User | null, staffList: StaffProfile[]): StaffProfile | null {
  if (!user) return null;
  const email = (user.email || '').toLowerCase();
  return (
    staffList.find((s) => (s.email || '').toLowerCase() === email) ||
    staffList.find((s) => s.id === user.id) ||
    null
  );
}

export function roleForUser(user: User | null, staffList: StaffProfile[]): UserRole {
  if (!user) return 'member';
  const email = (user.email || '').toLowerCase();
  if (email === ADMIN_EMAIL) return 'admin';
  if (findStaffMatch(user, staffList)) return 'staff';
  return 'member';
}

export async function getSession() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data?.session ?? null;
}

export async function getUser() {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) return null;
  return data.user;
}

export async function resolveAuthUser() {
  if (!supabase) return null;
  const session = await getSession();
  if (!session?.user) return null;

  const user = await getUser();
  if (!user) {
    await supabase.auth.signOut();
    await clearAllAuthTokens();
    return null;
  }
  return user;
}

export function onAuthChange(cb: (event: string) => void) {
  if (!supabase) return () => {};
  const { data } = supabase.auth.onAuthStateChange((event) => cb(event));
  return () => data.subscription.unsubscribe();
}

function toAuthUser(user: User): AuthUser {
  return {
    id: user.id,
    email: (user.email || '').toLowerCase(),
    name: user.user_metadata?.full_name || user.user_metadata?.name || '',
    identities: (user.identities || []).map((i) => ({ provider: i.provider })),
    app_metadata: user.app_metadata || {},
  };
}

async function fetchStaffList(): Promise<StaffProfile[]> {
  if (!supabase) return [];
  const { data } = await supabase.from('staff').select('*').order('created_at', { ascending: true });
  return (data || []).map(rowToStaff);
}

function buildSession(user: User, role: UserRole, staffMatch: StaffProfile | null): AppSession {
  const email = (user.email || '').toLowerCase();
  if (role === 'admin') return { type: 'admin', memberId: null, email };
  if (role === 'staff') return { type: 'staff', staffId: staffMatch?.id ?? null, email };
  return { type: 'member', memberId: user.id, email };
}

/** Oturum + rol + profil — mobil AppContext için auth durumu. */
export async function hydrateAuthState(): Promise<AuthState> {
  const empty: AuthState = { session: null, authUser: null, member: null, staff: null };
  const user = await resolveAuthUser();
  if (!user) return empty;

  const staffList = await fetchStaffList();
  const role = roleForUser(user, staffList);
  const authUser = toAuthUser(user);
  const staffMatch = findStaffMatch(user, staffList);
  const session = buildSession(user, role, staffMatch);

  if (role === 'admin') {
    return { session, authUser, member: null, staff: null };
  }

  if (role === 'staff') {
    return { session, authUser, member: null, staff: staffMatch };
  }

  if (!supabase) return empty;
  const { data: memberRow } = await supabase.from('members').select('*').eq('id', user.id).maybeSingle();
  return {
    session,
    authUser,
    member: rowToMember(memberRow),
    staff: null,
  };
}

async function addActivity(type: string, text: string, memberId: string | null = null) {
  if (!supabase) return;
  await supabase.from('activities').insert({
    member_id: memberId,
    data: { type, text, createdAt: nowISO() },
  });
}

export async function login(
  email: string,
  password: string,
  remember = true,
): Promise<{ success: true; role: UserRole } | { success: false; error: string }> {
  if (!supabase) return { success: false, error: 'Supabase yapılandırması eksik.' };

  await setRememberMe(remember);
  if (!remember) await clearAllAuthTokens();
  syncAutoRefresh(remember);

  const { data, error } = await supabase.auth.signInWithPassword({
    email: sanitizeEmailInput(email),
    password,
  });

  if (error) return { success: false, error: 'E-posta veya şifre hatalı.' };

  const staffList = await fetchStaffList();
  const role = roleForUser(data.user, staffList);
  const displayName =
    data.user.user_metadata?.name || data.user.user_metadata?.full_name || data.user.email || 'Kullanıcı';

  await addActivity(
    'login',
    role === 'admin'
      ? `${displayName} (Admin) giriş yaptı`
      : role === 'staff'
        ? `${displayName} (Personel) giriş yaptı`
        : `${displayName} giriş yaptı`,
    role === 'member' ? data.user.id : null,
  );

  const telegramEvent =
    role === 'admin' ? 'admin_login' : role === 'staff' ? 'staff_login' : 'member_login';
  void notifyTelegram(telegramEvent, { name: displayName, email: data.user.email, role });

  return { success: true, role };
}

export async function logout(): Promise<void> {
  if (!supabase) return;

  const user = await getUser();
  if (user) {
    const staffList = await fetchStaffList();
    const role = roleForUser(user, staffList);
    const displayName = user.user_metadata?.name || user.email || 'Kullanıcı';
    await addActivity(
      'logout',
      role === 'admin'
        ? `${displayName} (Admin) çıkış yaptı`
        : role === 'staff'
          ? `${displayName} (Personel) çıkış yaptı`
          : `${displayName} çıkış yaptı`,
      role === 'member' ? user.id : null,
    );
    const telegramEvent =
      role === 'admin' ? 'admin_logout' : role === 'staff' ? 'staff_logout' : 'member_logout';
    void notifyTelegram(telegramEvent, { name: displayName, email: user.email, role });
  }

  await supabase.auth.signOut();
  await clearAllAuthTokens();
  syncAutoRefresh(false);
}

export type RegisterProfile = {
  name: string;
  email: string;
  password: string;
  phone?: string;
};

async function unlockSignupSession(email: string, password: string) {
  try {
    const res = await fetch(apiUrl('/api/auth'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'unlock-signup', email, password }),
    });
    const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
    if (res.ok && data.ok) return { success: true as const };
    if (res.status === 503) {
      return { success: false as const, error: data.error, unlockUnavailable: true as const };
    }
  } catch {
    /* ağ hatası */
  }
  return { success: false as const };
}

async function signInAfterSignup(email: string, password: string) {
  if (!supabase) return { success: false as const, error: 'Supabase yapılandırması eksik.' };
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (!error) return { success: true as const };

  if (/not confirmed|confirm/i.test(error.message)) {
    const unlocked = await unlockSignupSession(email, password);
    if (unlocked.success) {
      const retry = await supabase.auth.signInWithPassword({ email, password });
      if (!retry.error) return { success: true as const };
      return { success: false as const, error: retry.error.message };
    }
  }

  return {
    success: false as const,
    error: 'Kayıt oluşturuldu ancak oturum açılamadı. Lütfen giriş yapmayı deneyin.',
  };
}

async function ensureAuthForSignup(profile: RegisterProfile) {
  if (!supabase) return { success: false as const, error: 'Supabase yapılandırması eksik.' };

  const email = normalizeEmailAddress(profile.email);
  if (!email) {
    return {
      success: false as const,
      error: 'Geçerli bir e-posta adresi girin (ör. ad@site.com). Boşluk veya geçersiz karakter olmamalı.',
    };
  }

  if (profile.phone) {
    const { data: phoneTaken, error: phoneErr } = await supabase.rpc('phone_in_use', {
      p_phone: profile.phone,
    });
    if (!phoneErr && phoneTaken) {
      return {
        success: false as const,
        error: 'Bu telefon numarası zaten kayıtlı. Lütfen farklı bir numara kullanın.',
      };
    }
  }

  try {
    await supabase.auth.signOut();
  } catch {
    /* oturum yoksa yoksay */
  }

  // Primary: /api/auth signup (service-role RPC) — docs/rn-migration/07 §3
  try {
    const signupRes = await fetch(apiUrl('/api/auth'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'signup',
        email,
        password: profile.password,
        name: profile.name || '',
      }),
    });
    const signupData = (await signupRes.json().catch(() => ({}))) as {
      ok?: boolean;
      error?: string;
    };

    if (signupRes.ok && signupData.ok) {
      const signIn = await signInAfterSignup(email, profile.password);
      if (signIn.success) return { success: true as const };
      return {
        success: false as const,
        error: signIn.error || 'Kayıt oluştu ancak giriş yapılamadı. Lütfen giriş sayfasından deneyin.',
      };
    }
    if (signupData.error === 'already_registered' || signupRes.status === 409) {
      const signIn = await signInAfterSignup(email, profile.password);
      if (signIn.success) return { success: true as const };
      return {
        success: false as const,
        error: signIn.error || 'Bu e-posta adresi zaten kayıtlı. Lütfen giriş yapın.',
      };
    }
    if (signupData.error) {
      return { success: false as const, error: formatPasswordAuthError(signupData.error) };
    }
  } catch {
    /* API yoksa klasik signUp’a düş */
  }

  const redirectTo = Linking.createURL('/(auth)/callback');
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password: profile.password,
    options: { data: { name: profile.name }, emailRedirectTo: redirectTo },
  });

  if (signUpError) {
    if (/validate email|invalid format|invalid email/i.test(signUpError.message)) {
      return { success: false as const, error: 'Geçerli bir e-posta adresi girin.' };
    }
    if (/registered|already|exists/i.test(signUpError.message)) {
      const signIn = await signInAfterSignup(email, profile.password);
      if (signIn.success) return { success: true as const };
      return {
        success: false as const,
        error: signIn.error || 'Bu e-posta zaten kayıtlı. Lütfen giriş yapın.',
      };
    }
    if (/known to be weak|pwned|hibp|leaked|easy to guess/i.test(signUpError.message)) {
      return { success: false as const, error: formatPasswordAuthError(signUpError.message) };
    }
    return { success: false as const, error: formatPasswordAuthError(signUpError.message) };
  }

  if (!signUpData?.session) {
    const signIn = await signInAfterSignup(email, profile.password);
    if (!signIn.success) return signIn;
  }

  return { success: true as const };
}

async function buildAndPersistMember(profile: RegisterProfile): Promise<
  { success: true; member: MemberProfile } | { success: false; error: string }
> {
  const user = await getUser();
  if (!user || !supabase) return { success: false, error: 'Oturum oluşturulamadı.' };

  const member: MemberProfile & Record<string, unknown> = {
    id: user.id,
    email: normalizeEmailAddress(user.email) || normalizeEmailAddress(profile.email) || sanitizeEmailInput(user.email),
    name: profile.name.trim(),
    phone: profile.phone?.trim() || '',
    membership: 'free',
    membershipStatus: 'active',
    profileComplete: Boolean(profile.phone?.trim()),
    freeTrialExpiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    joinedAt: today(),
    lastActiveAt: today(),
    streak: 0,
    notifications: [
      {
        id: `n-${Date.now()}`,
        type: 'reminder',
        title: 'Yeni Form’a hoş geldiniz!',
        message: 'Profiliniz hazır. Günlük görevlerinizi tamamlayarak serinizi büyütmeye başlayın.',
        read: false,
        createdAt: nowISO(),
      },
    ],
    tasks: [
      { id: `t1-${Date.now()}`, type: 'checkin', title: 'Günlük check-in', done: false, due: 'Bugün' },
      {
        id: `t2-${Date.now()}`,
        type: 'workout',
        title: 'Program takviminden bugünkü hareketi tamamla',
        done: false,
        due: 'Bugün',
      },
    ],
    progress: { weight: [], workouts: [], mood: [] },
    settings: { theme: 'light', language: 'tr', emailNotifs: true, pushNotifs: true, reminderNotifs: true },
  };

  const { error } = await supabase.from('members').upsert(memberToRow(member), { onConflict: 'id' });
  if (error) return { success: false, error: error.message };

  await addActivity('signup', `${member.name} yeni kayıt (Ücretsiz)`, member.id);
  void notifyTelegram('member_signup', { name: member.name, email: member.email, role: 'member' });
  return { success: true, member };
}

export async function register(profile: RegisterProfile) {
  const auth = await ensureAuthForSignup(profile);
  if (!auth.success) return auth;

  const existing = await hydrateAuthState();
  if (existing.member) return { success: true as const, role: 'member' as const };

  const persisted = await buildAndPersistMember(profile);
  if (!persisted.success) return persisted;
  return { success: true as const, role: 'member' as const };
}

export function routeForRole(role: UserRole): '/(app)' | '/(admin)' | '/(staff)' {
  if (role === 'admin') return '/(admin)';
  if (role === 'staff') return '/(staff)';
  return '/(app)';
}

export async function requestPasswordReset(email: string) {
  if (!supabase) return { success: false as const, error: 'Supabase yapılandırılmadı.' };
  const clean = normalizeEmailAddress(email);
  if (!clean) return { success: false as const, error: 'Geçerli bir e-posta girin.' };

  const redirectTo = Linking.createURL('/(auth)/callback?next=reset-password');
  const { error } = await supabase.auth.resetPasswordForEmail(clean, { redirectTo });
  if (error) return { success: false as const, error: error.message };
  return { success: true as const };
}

/**
 * Stripe öncesi profil + plan bilgisini auth metadata'da saklar (webhook üye/plan günceller).
 * Web `savePendingRegistrationMetadata`.
 */
export async function savePendingRegistrationMetadata(
  profile: { name?: string; phone?: string; phoneCountry?: string; gender?: string; fitnessLevel?: string },
  membership: string,
  durationMonths = 1,
) {
  if (!supabase) return { success: false as const, error: 'Supabase yapılandırılmadı.' };
  const user = await getUser();
  if (!user) return { success: false as const, error: 'Oturum bulunamadı. Lütfen tekrar giriş yapın.' };

  const { error } = await supabase.auth.updateUser({
    data: {
      pending_registration: {
        name: (profile.name || '').trim(),
        phone: profile.phone || '',
        phoneCountry: profile.phoneCountry || '',
        gender: profile.gender || '',
        membership: membership || 'free',
        durationMonths: Number(durationMonths) || 1,
        fitnessLevel: profile.fitnessLevel || 'beginner',
        savedAt: new Date().toISOString(),
      },
    },
  });
  if (error) return { success: false as const, error: error.message };
  return { success: true as const };
}

/**
 * OAuth / eksik profil tamamlaması — ProfileCompletionGate sonrası.
 * Web `completeOAuthMember` çekirdeği (name+phone+joinedAt); tam sihirbaz 08'de.
 */
export async function completeMemberProfile(profile: {
  name: string;
  phone: string;
  membership?: string;
}) {
  const user = await getUser();
  if (!user || !supabase) return { success: false as const, error: 'Oturum bulunamadı. Lütfen tekrar giriş yapın.' };

  const email = normalizeEmailAddress(user.email);
  if (!email) {
    return { success: false as const, error: 'E-posta adresi alınamadı. Lütfen farklı bir giriş yöntemi deneyin.' };
  }

  const name = profile.name.trim();
  if (!name) return { success: false as const, error: 'Ad soyad bilgisi gerekli.' };
  const phone = profile.phone.trim();
  if (!phone) return { success: false as const, error: 'Telefon numarası zorunludur.' };

  const { data: phoneTaken, error: phoneErr } = await supabase.rpc('phone_in_use', { p_phone: phone });
  if (!phoneErr && phoneTaken) {
    const { data: existing } = await supabase.from('members').select('id').eq('phone', phone).maybeSingle();
    if (existing?.id && existing.id !== user.id) {
      return {
        success: false as const,
        error: 'Bu telefon numarası zaten kayıtlı. Lütfen farklı bir numara kullanın.',
      };
    }
  }

  const member: MemberProfile & Record<string, unknown> = {
    id: user.id,
    email,
    name,
    phone,
    membership: profile.membership || 'free',
    membershipStatus: 'active',
    profileComplete: true,
    freeTrialExpiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    joinedAt: today(),
    lastActiveAt: today(),
    streak: 0,
    notifications: [
      {
        id: `n-${Date.now()}`,
        type: 'reminder',
        title: 'Yeni Form’a hoş geldiniz!',
        message: 'Profiliniz hazır. Günlük görevlerinizi tamamlayarak serinizi büyütmeye başlayın.',
        read: false,
        createdAt: nowISO(),
      },
    ],
    tasks: [
      { id: `t1-${Date.now()}`, type: 'checkin', title: 'Günlük check-in', done: false, due: 'Bugün' },
    ],
    progress: { weight: [], workouts: [], mood: [] },
    settings: { theme: 'light', language: 'tr', emailNotifs: true, pushNotifs: true, reminderNotifs: true },
  };

  const { error } = await supabase.from('members').upsert(memberToRow(member), { onConflict: 'id' });
  if (error) return { success: false as const, error: error.message };
  return { success: true as const, member };
}
