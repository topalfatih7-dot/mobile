# 04 — Payments / IAP — KALDIRILDI

**Durum:** 2026-08-08 — uygulama içi IAP ve RevenueCat **iptal**.  
**Platform:** iOS.

## Yeni model (MOBILE DIFF)

| Katman | Yol |
|--------|-----|
| Satın alma | **Yok** — App Store 3.1.3(f); `canOfferWebPurchase()` false; kilit ekranlarında Paketleri gör / satın alın yok |
| İptal / kart | Ödeme yönetimi yok (2026-08-22; ileride) |
| Mobil UI | `/(member)/profile/payments` yok — rota profil’e gider |
| Entitlement | Supabase `members` (Stripe webhook / admin premium atama) |

## Kaldırılanlar

- `react-native-purchases` / `-ui`
- `src/services/iap.ts`, PaywallModal, CustomerCenterButton
- `EXPO_PUBLIC_REVENUECAT_API_KEY_*`
- RevenueCat dashboard webhook + ürünler (arşiv)

Stripe contract (web): [`contracts/api-stripe.md`](contracts/api-stripe.md).
