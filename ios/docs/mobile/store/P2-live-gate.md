# P2 — IAP canlı kapısı — KALDIRILDI

**Durum:** 2026-08-08 — mobil IAP / RevenueCat iptal.

Yeni satın alma yolu: web Stripe → login’li `/plans` (mobil CTA: `/auth/callback?next=/plans&src=mobile`).  
Mobil: `/(member)/profile/payments` plan/status + web CTA.

Eski RC webhook / sandbox purchase checklist artık geçerli değil.
