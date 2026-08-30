# P6 Store paket — Android

## Kod / şablon

- [x] `android-listing.tr.md`
- [x] `screenshot-checklist.md`
- [x] `android-play-store.md` + `android-play-forms.md`
- [x] `play-data-safety.csv`
- [x] Feature graphic 1024×500
- [x] Play ikon 512
- [x] Telefon screenshot 1080×2160 (`assets/store/play-phone/`)
- [x] Legal URL’ler (yeniform.com)
- [x] Hesap silme canlı: https://www.yeniform.com/hesap-silme

## Test yolu

Preview APK **yok**. Android: onaylı `play-store` AAB → Play Internal/Closed opt-in. **Onaysız eas build yok.** iOS IPA bu klasörden üretilmez.

Kod: Daily FGS camera+mic, Webrtc `MEDIA_PROJECTION` ve `expo-audio`/`MEDIA_PLAYBACK` yok, `BOOT_COMPLETED` yok, OS bildirim sesi, Photo Picker, API 36 (SDK 56).

## Senin işin

- [x] Expo FCM V1 (`yeniform-aa5c1`) — 2026-08-20
- [x] Firebase EAS SHA (`com.yeniform.app`) — 2026-08-20
- [ ] Play uygulaması + Internal testers + opt-in
- [ ] Listing (tıbbi cihaz uyarısı) + Data safety CSV + Health form + FGS camera/mic + hesap silme URL
- [ ] Onaylı **yeni** `npm run build:play:android` — Play’e yükle
- [ ] Play **App signing key** SHA → Firebase
- [ ] Smoke: login, web `/plans`, push, Daily **Home’da akış**, health/calendar — **IAP yok**

## Legal

yeniform.com gizlilik / kullanım / hesap silme.
