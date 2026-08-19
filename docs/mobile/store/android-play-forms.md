# Google Play — politika form şablonu (sen doldurursun)

Kaynak: gizlilik / KVKK / sağlık metinleri (`appendices/D-legal-slugs.md`). Uydurma veri türü yok.

## Data safety (özet)

Reklam SDK’sı yok. `AD_ID` bloklu.

| Veri | Toplanır | Paylaşılır | Amaç |
|------|----------|------------|------|
| E-posta, ad, hesap | Evet (Supabase Auth / members) | Hayır (barındırma) | Hesap |
| Sağlık (test, program, öğün) | Evet | Hayır | Uygulama işlevi |
| Foto (profil, kalori, belge) | Evet | Hayır | Uygulama işlevi |
| Mesaj içeriği | Evet | Hayır (atanmış uzman / sistem) | Mesajlaşma |
| Cihaz push token | Evet | Expo Push | Bildirim |
| Ödeme kartı | **Uygulamada yok** | Stripe **web** | Satın alma web’de |
| Konum, rehber, reklam ID | Hayır | — | — |

Şifreleme: transit (HTTPS). Hesap silme: Play’e **web URL** (aşağı).

## Content rating (IARC)

Anket: sağlık/fitness, kullanıcı üretimi mesaj, şiddet/kumar yok. Beklenen ~12+ / PEGI eşdeğeri — anket sonucu geçerli.

## Hedef kitle

18+ (sağlık koçluğu). Çocuklara yönelik değil. Families Policy’ye girme.

## Ads

Hayır.

## Financial features

Uygulama içi ödeme yok. Abonelik **web Stripe**. Play ürünü oluşturma.

## Health

Sağlık ve Fitness. Tıbbi cihaz değil. Sorumluluk reddi web’de: `/saglik-sorumluluk-reddi`.

## Foreground services

- Camera / Microphone: Daily görüntülü seans
- Media playback: egzersiz videosu

## Photos and videos

Android 13+: sistem seçici. Amaç: profil, kalori foto, sağlık belgesi. Fotoğraf galerisinin tamamına sürekli erişim yok.

## Government / News

Hayır.

## App access (inceleme)

Üye test hesabı ver. Giriş: e-posta/şifre (Google/Apple kapalı).

## Hesap silme (zorunlu)

Play: “URL to account deletion” veya uygulama içi yol.

Mobilde silme ekranı **yok** (spec yok). Web’de hesap/üye silme sayfası yoksa Submit öncesi web’e eklet.

Aday (sayfa gerçekten varsa): destek / KVKK talebi — `https://www.yeniform.com` veya gizlilik sayfasındaki silme talimatı. **Çalışmayan URL yapıştırma.**

## Privacy policy URL

https://www.yeniform.com/gizlilik-politikasi
