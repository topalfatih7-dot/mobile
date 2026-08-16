# Spesifikasyon tamamlandı

Bu klasör + `.cursor/skills/` seti, Expo mobil uygulamanın **uydurmadan** yazılması için hazır kabul edilir.

## Zorunlu okuma sırası (uygulayıcı AI)

1. `IMPLEMENTATION-LOCK.md`
2. `.cursor/skills/yeniform-mobile-router/SKILL.md`
3. İlgili domain skill
4. İlgili `screens/**` (IMPLEMENTATION LOCK)
5. `contracts/**` + `domains/**`
6. Kod

## Kapsam özeti

| Alan | Durum |
|------|--------|
| Skills (9) | tamam |
| Foundations 00–05 | tamam |
| Flows F01–F15 | tamam |
| Member LOCK screens | tamam (+ session-booker) |
| Staff LOCK screens | tamam |
| Admin LOCK screens | **MOBILE DIFF:** web-only (`/(auth)/admin-web`) |
| Public LOCK / WebView politikası | tamam; stories/corporate/team-apply **rota yok** |
| Health options tables | tamam |
| API contracts | auth, stripe, daily, AI, book-session, contact, env, mappers |
| Anti-hallucination | IMPLEMENTATION-LOCK |

## Bilinçli sapmalar (MOBILE DIFF)

- Paid purchase: web Stripe `/plans` — uygulama içi IAP/RevenueCat yok
- Sosyal giriş (Google/Apple) kapalı — yalnız e-posta/şifre
- Native Turnstile yok — mobil API secret bypass
- Kayıt: tek adım ücretsiz üyelik; paket web’de
- Admin paneli: web-only
- Public SKIP: stories / corporate / team-apply rotaları yok
- Push notifications (FCM dosyaları cihaz/build)

## Sonraki adım (kod)

Expo scaffold — yalnızca kullanıcı isterse; bu klasör yeterli kaynak.
