# P6 Store paket

## Kod / şablon

- [x] `ios-listing.tr.md`
- [x] `android-listing.tr.md`
- [x] `screenshot-checklist.md`
- [x] `android-play-store.md` + `android-play-forms.md`
- [x] Feature graphic 1024×500
- [x] Play ikon 512
- [x] Telefon screenshot 1080×2160 (`assets/store/play-phone/`)
- [x] Legal URL’ler (yeniform.com)
- [x] Hesap silme canlı: https://www.yeniform.com/hesap-silme

## Test yolu

Preview APK **yok**. Onaylı `play-store` AAB → Play Internal/Closed opt-in.

Kod (2026-08-21): Daily FGS camera+mic, Webrtc `MEDIA_PROJECTION` ve kullanılmayan `MEDIA_PLAYBACK` blocked, Photo Picker, API 36 (SDK 56). Eski versionCode **5** AAB bunları taşımaz — test için **yeni** AAB.

## Senin işin

- [x] Expo FCM V1 (`yeniform-aa5c1`) — 2026-08-20
- [x] Firebase EAS SHA (`com.yeniform.app`) — 2026-08-20
- [ ] Play uygulaması + Internal testers + opt-in
- [ ] Listing (tıbbi cihaz uyarısı) + Data safety CSV + Health form + FGS camera/mic + hesap silme URL
- [ ] Onaylı **yeni** `npm run build:play:android` (Daily FGS + izin temizliği) — Play’e yükle; eski sideload Yeni Form’u sil
- [ ] Play **App signing key** SHA → Firebase
- [ ] Smoke: login, web `/plans`, push, Daily **Home’da akış**, health/calendar — **IAP yok**

## Legal

| | URL |
|--|-----|
| Privacy | https://www.yeniform.com/legal/gizlilik-politikasi |
| Terms | https://www.yeniform.com/legal/uyelik-ve-abonelik-sozlesmesi |
| Destek | https://www.yeniform.com |
| Hesap silme | https://www.yeniform.com/hesap-silme |

Production Submit ayrı onay.
