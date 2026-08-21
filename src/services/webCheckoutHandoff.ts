/**
 * Logged-in web handoff (JWT hash). Never throws; never wipes app session.
 * LOCK: payments.md (/plans) · profile.md (/hesap-silme)
 * iOS 3.1.3(f): checkout handoff kapalı (`canOfferWebPurchase`).
 */
import { Linking, Platform } from 'react-native';

import { env } from '@/config/env';
import { isUiOnly } from '@/config/runtime';
import { supabase } from '@/services/supabase';

export const WEB_CHECKOUT_COPY = {
  demo: 'Satın alma demo modda kapalı. Giriş ekranından demo hesapla devam edin.',
  noSession: 'Oturum bulunamadı. Lütfen tekrar giriş yapın.',
  browserFail: 'Web sayfası açılamadı.',
  loginFallback: 'Tarayıcıda giriş yapmanız gerekebilir.',
  iosUnavailable: 'Üyelik bu uygulamada satılmaz.',
} as const;

/** App Store 3.1.3(f) — iOS’ta web checkout / membership satın alma CTA yok. */
export function canOfferWebPurchase(): boolean {
  return Platform.OS !== 'ios';
}

export type WebCheckoutHandoffResult =
  | { ok: true }
  | { ok: false; error: string; fallback?: 'plans-login' };

const MAX_HANDOFF_URL_LEN = 1800;
const ALLOWED_NEXT = new Set(['/plans', '/hesap-silme']);

async function openBrowser(url: string): Promise<WebCheckoutHandoffResult> {
  try {
    await Linking.openURL(url);
    return { ok: true };
  } catch {
    return { ok: false, error: WEB_CHECKOUT_COPY.browserFail };
  }
}

async function sessionForHandoff() {
  if (!supabase) return null;
  /*
   * refreshSession() çağırma — geçersiz/paylaşılan refresh token SIGNED_OUT üretir
   * (ödeme CTA sonrası uygulama içi giriş düşer). LOCK: hata oturumu silmez.
   * Hesap silme sonrası çıkış: DataContext ön plan `members` missing (F17).
   */
  try {
    const { data } = await supabase.auth.getSession();
    const existing = data?.session;
    if (existing?.access_token && existing?.refresh_token) return existing;
  } catch {
    /* keep null */
  }
  return null;
}

function buildHandoffUrl(
  accessToken: string,
  refreshToken: string,
  expiresIn: number,
  nextPath: string,
): string {
  const hash = new URLSearchParams({
    access_token: accessToken,
    refresh_token: refreshToken,
    token_type: 'bearer',
    expires_in: String(Math.max(0, Math.floor(expiresIn))),
  });
  return `${env.apiBaseUrl}/auth/callback?next=${encodeURIComponent(nextPath)}&src=mobile#${hash.toString()}`;
}

function expiresInSeconds(session: {
  expires_in?: number;
  expires_at?: number;
}): number {
  if (typeof session.expires_in === 'number' && Number.isFinite(session.expires_in)) {
    return session.expires_in;
  }
  if (typeof session.expires_at === 'number' && Number.isFinite(session.expires_at)) {
    return Math.max(0, session.expires_at - Math.floor(Date.now() / 1000));
  }
  return 3600;
}

/** Opens a locked web path with the current app session. Never throws. */
export async function openWebHandoff(
  nextPath: string = '/plans',
): Promise<WebCheckoutHandoffResult> {
  const next = ALLOWED_NEXT.has(nextPath) ? nextPath : '/plans';
  try {
    if (isUiOnly() || !supabase) {
      return { ok: false, error: WEB_CHECKOUT_COPY.demo };
    }

    const session = await sessionForHandoff();
    if (!session?.access_token || !session?.refresh_token) {
      return { ok: false, error: WEB_CHECKOUT_COPY.noSession };
    }

    const url = buildHandoffUrl(
      session.access_token,
      session.refresh_token,
      expiresInSeconds(session),
      next,
    );

    if (url.length > MAX_HANDOFF_URL_LEN) {
      const opened = await openBrowser(`${env.apiBaseUrl}${next}`);
      if (!opened.ok) return opened;
      return {
        ok: false,
        error: WEB_CHECKOUT_COPY.loginFallback,
        fallback: 'plans-login',
      };
    }

    return openBrowser(url);
  } catch {
    return { ok: false, error: WEB_CHECKOUT_COPY.browserFail };
  }
}

/** Opens web /plans with the current app session. Never throws. iOS: no-op error. */
export async function openWebCheckoutHandoff(): Promise<WebCheckoutHandoffResult> {
  if (!canOfferWebPurchase()) {
    return { ok: false, error: WEB_CHECKOUT_COPY.iosUnavailable };
  }
  return openWebHandoff('/plans');
}

export async function openWebAccountDeleteHandoff(): Promise<WebCheckoutHandoffResult> {
  return openWebHandoff('/hesap-silme');
}
