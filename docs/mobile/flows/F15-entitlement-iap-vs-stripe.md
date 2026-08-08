# F15 — Entitlement (web Stripe) — IAP kaldırıldı

## Rule

UI never trusts a store client. After login / web purchase return:

1. Read Supabase `members.membership` (+ expiry, packages)
2. Feature gates use server membership only
3. **No** RevenueCat restore / in-app purchase sync

## Scenarios

| Bought on | Opens app | Expected |
|-----------|-----------|----------|
| Web Stripe | Mobile login | Paid features on |
| Historical mobile IAP (legacy row) | Mobile login | Paid until expiry (no new IAP) |
| Refund/revoke (Stripe) | Either | Downgrade on Stripe webhook |

Acceptance: single source of truth = Supabase row.

Mobile CTA for new purchase: `/(member)/profile/payments` → web `/membership`.
