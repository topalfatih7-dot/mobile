/**
 * Stripe Checkout — web `stripePayment.js` mobil karşılığı.
 * Web `window.location` yerine `expo-web-browser` açılır; başarı URL’si site origin’e
 * düşünce oturum kapanır ve üye hydrate yenilenir.
 */
import * as WebBrowser from 'expo-web-browser';

import { apiUrl, env } from '@/config/env';
import { getApiAuthHeaders } from '@/services/apiAuth';
import { isPaidMembership } from '@/data/membershipPlans';

WebBrowser.maybeCompleteAuthSession();

export type StripeCheckoutFlow = 'register' | 'change';

export type StripeCheckoutResult = {
  success: boolean;
  error?: string;
  /** Tarayıcı kapatıldı / iptal — ödeme tamamlanmış olabilir; refresh önerilir. */
  dismissed?: boolean;
  url?: string;
};

export async function createStripeCheckoutSession(
  planId: string,
  flow: StripeCheckoutFlow = 'register',
  durationMonths = 1,
  email: string | null = null,
): Promise<StripeCheckoutResult> {
  if (!isPaidMembership(planId)) {
    return { success: false, error: 'Geçersiz plan.' };
  }

  const headers = await getApiAuthHeaders();
  if (!headers.Authorization) {
    return { success: false, error: 'Oturum bulunamadı. Lütfen tekrar giriş yapın.' };
  }

  try {
    const res = await fetch(apiUrl('/api/stripe-checkout'), {
      method: 'POST',
      headers,
      body: JSON.stringify({
        planId,
        flow,
        durationMonths: planId === 'doktor' ? 1 : durationMonths,
        email: email || undefined,
      }),
    });
    const json = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
    if (!res.ok || !json?.url) {
      return { success: false, error: json?.error || 'Ödeme başlatılamadı.' };
    }
    return { success: true, url: json.url };
  } catch (e) {
    return { success: false, error: String((e as Error)?.message || e) };
  }
}

/**
 * Checkout oturumu oluşturup Stripe’ı tarayıcıda açar.
 * `redirectUri` = site URL — webhook sonrası web success/cancel sayfasına düşünce session biter.
 */
export async function startStripeCheckout(
  planId: string,
  flow: StripeCheckoutFlow = 'register',
  durationMonths = 1,
  email: string | null = null,
): Promise<StripeCheckoutResult> {
  const created = await createStripeCheckoutSession(planId, flow, durationMonths, email);
  if (!created.success || !created.url) return created;

  try {
    const result = await WebBrowser.openAuthSessionAsync(created.url, env.siteUrl);
    if (result.type === 'cancel' || result.type === 'dismiss') {
      return { success: true, dismissed: true, url: created.url };
    }
    return { success: true, url: created.url };
  } catch (e) {
    return { success: false, error: String((e as Error)?.message || e) };
  }
}
