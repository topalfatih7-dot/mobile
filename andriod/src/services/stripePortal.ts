/**
 * Stripe Customer Portal — web `stripePayment.js` parity.
 * Cancel: portal URL. Resume: API flag, no portal.
 */
import { Linking } from 'react-native';

import { MEMBERSHIP_CANCEL_COPY } from '@/data/membershipCancelCopy';
import { postJson } from '@/services/api';

export async function startStripePortal(opts: {
  intent?: 'manage' | 'cancel';
  mode?: 'at_period_end' | 'immediately';
  subscriptionId?: string;
} = {}): Promise<{ ok: true } | { ok: false; error: string }> {
  const { ok, json } = await postJson<{ url?: string; error?: string }>('/api/stripe-checkout', {
    action: 'create-portal-session',
    intent: opts.intent || 'manage',
    ...(opts.mode ? { mode: opts.mode } : {}),
    ...(opts.subscriptionId ? { subscriptionId: opts.subscriptionId } : {}),
  });
  if (!ok || !json?.url) {
    return { ok: false, error: json?.error || MEMBERSHIP_CANCEL_COPY.portalFail };
  }
  try {
    await Linking.openURL(json.url);
    return { ok: true };
  } catch {
    return { ok: false, error: MEMBERSHIP_CANCEL_COPY.portalFail };
  }
}

export async function resumeStripeSubscription(
  subscriptionId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { ok, json } = await postJson<{ ok?: boolean; error?: string }>('/api/stripe-checkout', {
    action: 'resume-subscription',
    subscriptionId,
  });
  if (!ok || json?.ok === false) {
    return { ok: false, error: json?.error || MEMBERSHIP_CANCEL_COPY.resumeFail };
  }
  return { ok: true };
}
