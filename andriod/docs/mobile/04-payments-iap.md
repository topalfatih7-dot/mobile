# 04 — Payments / IAP — KALDIRILDI

**Durum:** 2026-08-08 — uygulama içi IAP ve RevenueCat **iptal**.  
**Platform:** Android.

## Yeni model (MOBILE DIFF)

| Katman | Yol |
|--------|-----|
| Satın alma | Web Stripe Checkout → `/plans` (JWT handoff) |
| İptal / kart | Native uyarı + Stripe Customer Portal |
| Mobil UI | `/(member)/profile/payments` |
| Entitlement | Supabase `members` (Stripe webhook / admin premium atama) |
| Webhook | `api/stripe-webhook.js` (web). `api/revenuecat-webhook.js` **silindi** |

## Kaldırılanlar

- `react-native-purchases` / `-ui`
- `src/services/iap.ts`, PaywallModal, CustomerCenterButton
- `EXPO_PUBLIC_REVENUECAT_API_KEY_*`
- RevenueCat dashboard webhook + ürünler (arşiv)

Stripe contract: [`contracts/api-stripe.md`](contracts/api-stripe.md).
