---
name: yeniform-membership-payments
description: >-
  Handles Yeni Form membership plans, entitlements, and Stripe web checkout.
  Mobile has no in-app IAP — purchase/manage via web CTA. Use when working on
  paket, üyelik, plan kilidi, entitlement, Stripe, premium expiry, or payment webhooks.
---

# Yeni Form Membership & Payments

## Locked model

- **Mobile:** No App Store / Play IAP. Payments screen shows Supabase plan/status + CTA to logged-in web `/plans` via `/auth/callback?next=/plans&src=mobile` (same JWT hash; web Stripe).
- **Web:** Stripe Checkout + `api/stripe-webhook.js` (web repo).
- **Source of truth:** Supabase `members.membership`, `membership_status`, package/expiry in `members.data`.
- **Removed:** RevenueCat SDK, `api/revenuecat-webhook.js`, mobil satın alma / restore / Customer Center.

## Plan IDs

`free` | `eko` | `diyet` | `spor` | `doktor` | `vip`  
Durations: 1 / 3 / 6 months (`doktor` = one-time).

## Gate helpers (parity with web)

From `src/data/membershipPlans.js` — copy into mobile:

- `hasManualCalorieAccess` — not free/doktor/kurucu
- `hasPhotoCalorieAccess` — diyet, spor, vip (+ legacy platinum/premium)
- `hasFullVideoAccess` — spor, vip (+ legacy)
- Package quotas: `PACKAGE_BY_PLAN` / `getDefaultPackageForPlan`

## When coding or documenting

1. Read `docs/mobile/screens/member/payments.md` and `domains/membership-entitlements.md`.
2. Never unlock paid features client-only; server/RLS + membership row must agree.
3. Do not re-add RevenueCat / `react-native-purchases` without an explicit new MOBILE DIFF.
4. Expiry → downgrade to `free` (parity `syncMembershipExpiryStatus`).
5. Historical `provider: revenuecat` package rows may still exist — leave until natural expiry.

## Related

[reference.md](reference.md) · Supabase skill for RLS
