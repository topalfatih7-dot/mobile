/**
 * Tek aktif oturum — yeni girişte diğer cihaz oturumları kapatılır.
 * Web `src/services/singleSession.js` portu (docs/rn-migration/07 §5).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

import { apiUrl } from '@/config/env';

import { getApiAuthHeaders } from './apiAuth';
import { clearAllAuthTokens } from './authStorage';
import { supabase } from './supabaseClient';

export const SESSION_REVOKED_KEY = 'nf-session-revoked';
export const SESSION_REVOKED_MESSAGE =
  'Hesabınız başka bir cihazdan açıldı. Güvenlik için bu oturum sonlandırıldı.';

/** Yeni giriş — sunucuda aktif oturumu işaretle, diğerlerini kapat. */
export async function registerActiveSession() {
  if (!supabase) return { ok: false as const };

  try {
    const res = await fetch(apiUrl('/api/auth'), {
      method: 'POST',
      headers: await getApiAuthHeaders(),
      body: JSON.stringify({ action: 'claim-active-session' }),
    });
    const json = (await res.json().catch(() => ({}))) as { ok?: boolean; sessionId?: string };
    return { ok: Boolean(json.ok), sessionId: json.sessionId || null };
  } catch {
    return { ok: false as const };
  }
}

/** Mevcut oturum hâlâ geçerli mi? false → başka yerden giriş yapılmış. */
export async function verifyActiveSession() {
  if (!supabase) return true;

  let { data } = await supabase.auth.getSession();
  if (!data?.session?.access_token) {
    await supabase.auth.getUser();
    ({ data } = await supabase.auth.getSession());
  }
  if (!data?.session?.access_token) return true;

  try {
    const res = await fetch(apiUrl('/api/auth'), {
      method: 'POST',
      headers: await getApiAuthHeaders(),
      body: JSON.stringify({ action: 'verify-active-session' }),
    });
    const json = (await res.json().catch(() => ({}))) as { ok?: boolean; valid?: boolean };
    if (!json.ok) return true;
    return json.valid !== false;
  } catch {
    return true;
  }
}

let verifyInFlight: Promise<boolean> | null = null;

/** Geçersiz oturumda çıkış yap ve login mesajı bırak. */
export async function verifyActiveSessionOrSignOut() {
  if (!supabase) return true;
  if (verifyInFlight) return verifyInFlight;

  verifyInFlight = (async () => {
    const valid = await verifyActiveSession();
    if (valid) return true;

    try {
      await AsyncStorage.setItem(SESSION_REVOKED_KEY, '1');
    } catch {
      /* ignore */
    }

    await supabase.auth.signOut();
    await clearAllAuthTokens();
    return false;
  })();

  try {
    return await verifyInFlight;
  } finally {
    verifyInFlight = null;
  }
}

export async function consumeSessionRevokedMessage() {
  try {
    const flag = await AsyncStorage.getItem(SESSION_REVOKED_KEY);
    if (flag !== '1') return null;
    await AsyncStorage.removeItem(SESSION_REVOKED_KEY);
    return SESSION_REVOKED_MESSAGE;
  } catch {
    return null;
  }
}
