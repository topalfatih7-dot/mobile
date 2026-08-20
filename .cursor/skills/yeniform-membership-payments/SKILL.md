---
name: yeniform-membership-payments
description: >-
  Handles Yeni Form membership plans, entitlements, and Stripe web checkout.
  Mobile has no in-app IAP — purchase/manage via web CTA. Use when working on
  paket, üyelik, plan kilidi, entitlement, Stripe, premium expiry, or payment webhooks.
---

# Yeni Form Membership & Payments

## Locked model

- **Mobile:** No App Store / Play IAP. Payments screen shows packages + Stripe Portal cancel/manage; new purchase CTA is logged-in web `/plans` via `/auth/callback?next=/plans&src=mobile`.
- **Web:** Stripe Checkout + Customer Portal (`api/stripe-checkout.js`) + `api/stripe-webhook.js`.
- **Source of truth:** Supabase `members.membership`, `membership_status`, `activePackages` (per `stripeSubscriptionId`).
- **Cancel:** Our warning UI → Portal confirm. Resume: `{ action: 'resume-subscription' }`. Stacking: independent billing. Doktor: mailto `info@yeniform.com`. Admin pause/cancel removed.
- **Removed:** RevenueCat SDK, `api/revenuecat-webhook.js`, mobil satın alma / restore / Customer Center.

## Plan IDs

`free` | `eko` (eski) | `eko_diyet` | `eko_spor` | `diyet` | `spor` | `doktor` | `vip`  
Durations: 1 / 3 / 6 months (`doktor` = one-time). Satış: `eko_diyet` / `eko_spor` (eski tek `eko` kapalı).

## Gate helpers (parity with web)

From `src/data/membershipPlans.js` — copy into mobile:

- `hasManualCalorieAccess` / `hasPhotoCalorieAccess` — DB `plans.entitlements`, yoksa legacy set
- Kütüphane: ücretli + program-scoped; tam katalog `hasFullLibraryAccess` (web)
- Package quotas: `PACKAGE_BY_PLAN` / `getDefaultPackageForPlan` (katalog entitlements öncelikli)

## When coding or documenting

1. Read `docs/mobile/screens/member/payments.md` and `domains/membership-entitlements.md`.
2. Never unlock paid features client-only; server/RLS + membership row must agree.
3. Do not re-add RevenueCat / `react-native-purchases` without an explicit new MOBILE DIFF.
4. Expiry → downgrade to `free` (parity `syncMembershipExpiryStatus`).
5. Historical `provider: revenuecat` package rows may still exist — leave until natural expiry.

## Related

[reference.md](reference.md) · Supabase skill for RLS
