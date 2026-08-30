# Member — Payment Management (IMPLEMENTATION LOCK)

- **Expo:** `/(member)/profile/payments` → **profil’e yönlendir**
- **Web:** üye paneli `/profile/payments` (paket kartları + Stripe Portal) ve `/plans` (satın alma)
- **Priority:** P1
- **Platform:** iOS

## MOBILE DIFF (required)

**MOBILE DIFF (2026-08-22) iOS ödeme yönetimi yok:** Ekran açılmaz (`router.replace` profil). Drawer + profil **Ödeme Yönetimi** gizli. Stripe Portal iptal/kart ileride. Satın alma CTA yok (3.1.3(f)).

**No** IAP / RevenueCat.

## Acceptance

- [ ] iOS: Ödeme Yönetimi nav/CTA yok; payments rotası profil’e gider
- [ ] No RevenueCat
