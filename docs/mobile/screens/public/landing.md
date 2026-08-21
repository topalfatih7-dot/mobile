# Public — Landing (IMPLEMENTATION LOCK)

- **Expo:** `/(public)/index` or skip to login
- **Web:** `LandingPage.jsx`
- **Priority:** P2

## Decision (locked)

**Native summary + CTA** (not full marketing clone required for MVP):
1. BrandLogo + tagline from `BRAND.tagline`: **Herkes için çevrimiçi koçluk ve wellness**
2. Primary CTA → onboarding (ücretsiz kayıt) / login
3. **Android:** “Planları İncele” → `/(public)/membership` (web). **iOS:** bu buton yok (3.1.3(f)).
4. Optional WebView to `https://www.yeniform.com` for full marketing (pazarlama; checkout CTA değil)

Do **not** invent new hero headlines that overpower brand name **Yeni Form**.

Sections if native-full: pricing cards from plans, trust, FAQ from site_content — data only from hydrate.

## Acceptance

- [ ] Brand first
- [ ] CTAs: giriş + kayıt; Android’de Planları İncele; iOS’ta Planları İncele yok
