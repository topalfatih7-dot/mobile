# Membership & Payments — Reference

## Quotas (PACKAGE_BY_PLAN)

| Plan | Coach/mo | Dietitian/mo | Doctor |
|------|----------|--------------|--------|
| eko (eski) | 0 | 0 | 0 |
| eko_diyet | 0 | 1 | 0 |
| eko_spor | 1 | 0 | 0 |
| diyet | 0 | 2 | 0 |
| spor | 2 | 0 | 0 |
| doktor | 0 | 0 | `doctorSessionsTotal: 1`, `billingType: one_time` |
| vip | 2 | 2 | 0 |

## Pricing (monthly TRY — verify `membershipPlans.js` / DB `plans`)

| Plan | 1 ay | 3 ay | 6 ay |
|------|------|------|------|
| eko | 1299 | 2999 | 3999 |
| eko_diyet | 1299 | 2999 | 3999 |
| eko_spor | 1299 | 2999 | 3999 |
| diyet | 2499 | 6499 | 9999 |
| spor | 2499 | 6499 | 9999 |
| doktor | 1500 one-time | — | — |
| vip | 4999 | 12999 | 19999 |

## Key web files

- `src/data/membershipPlans.js`
- `src/services/stripePayment.js`, `api/stripe-checkout.js`, `api/_stripePortal.js`, `api/stripe-webhook.js`
- `src/data/membershipCancelCopy.js`
- `src/services/premiumMembership.js`
- `src/services/supabaseDb.js` → `changeMemberPlan`, `adminUpdatePremiumMembership`, `registerWithPlan`
- Mobil handoff: `src/services/webCheckoutHandoff.ts` → web `/auth/callback?next=/plans&src=mobile`

## IAP SKU naming — KALDIRILDI

Eski `yf_{plan}_{months}m` şeması artık kullanılmaz (mobil IAP iptal 2026-08-08).
