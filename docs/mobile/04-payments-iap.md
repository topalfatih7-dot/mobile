# 04 — Payments / IAP — KALDIRILDI

**Durum:** 2026-08-08 — uygulama içi IAP ve RevenueCat **iptal**.

## Yeni model (MOBILE DIFF)

| Katman | Yol |
|--------|-----|
| Satın alma | Web Stripe Checkout → `/plans` (JWT handoff) |
| İptal / kart | Native uyarı + Stripe Customer Portal (`contracts/api-stripe.md`) |
| Mobil UI | `/(member)/profile/payments` — paket kartları + Portal + web satın alma CTA |
| Entitlement | Supabase `members` (Stripe webhook / admin premium atama) |
| Webhook | `api/stripe-webhook.js` (web). `api/revenuecat-webhook.js` **silindi** |

## Kaldırılanlar

- `react-native-purchases` / `-ui`
- `src/services/iap.ts`, PaywallModal, CustomerCenterButton
- `EXPO_PUBLIC_REVENUECAT_API_KEY_*`
- RevenueCat dashboard webhook + ürünler (arşiv)

## Geçmiş

Eski IAP product id şeması (`yf_{plan}_{1|3|6}m`) ve RC webhook contract artık uygulanmaz.  
Stripe contract: [`contracts/api-stripe.md`](contracts/api-stripe.md).
