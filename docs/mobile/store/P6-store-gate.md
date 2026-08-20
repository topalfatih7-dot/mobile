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

## Senin işin

- [x] Expo FCM V1 (`yeniform-aa5c1`) — 2026-08-20
- [x] Firebase EAS SHA (`com.yeniform.app`) — 2026-08-20
- [ ] Play uygulaması + Internal testers + opt-in
- [ ] Listing + Data safety CSV + hesap silme URL yapıştır
- [x] Onaylı `npm run build:play:android` (kuyruk) — Play’e yükle; eski sideload Yeni Form’u sil
- [ ] Play **App signing key** SHA → Firebase
- [ ] Smoke: login, web `/plans`, push, Daily, health/calendar — **IAP yok**

## Legal

| | URL |
|--|-----|
| Privacy | https://www.yeniform.com/legal/gizlilik-politikasi |
| Terms | https://www.yeniform.com/legal/uyelik-ve-abonelik-sozlesmesi |
| Destek | https://www.yeniform.com |
| Hesap silme | https://www.yeniform.com/hesap-silme |

Production Submit ayrı onay.
