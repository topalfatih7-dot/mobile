# P6 Store paket

## Kod / şablon

- [x] `ios-listing.tr.md` (dolu — tıbbi uyarı + IAP yok + tanıtım/copyright)
- [x] `ios-app-store.md` + `ios-asc-forms.md` (App Privacy = Play CSV; yaş anketi; inceleme notu)
- [x] `android-listing.tr.md`
- [x] `screenshot-checklist.md`
- [x] `android-play-store.md` + `android-play-forms.md`
- [x] Feature graphic 1024×500
- [x] Play ikon 512
- [x] Telefon screenshot 1080×2160 (`assets/store/play-phone/`)
- [ ] iPhone 6.7" screenshot 1290×2796 — sen, TestFlight IPA
- [x] Legal URL’ler (yeniform.com)
- [x] Hesap silme canlı: https://www.yeniform.com/hesap-silme

## Test yolu

Preview APK **yok**. Android: onaylı `play-store` AAB → Play Internal/Closed opt-in.  
iOS: onaylı `npm run build:ios:store` → TestFlight Internal (`ios-app-store.md`). Ad hoc UDID: `ios-preview-build.md`. **Onaysız eas build yok.**

Kod (2026-08-21): Daily FGS camera+mic, Webrtc `MEDIA_PROJECTION` ve `expo-audio`/`MEDIA_PLAYBACK` yok, `BOOT_COMPLETED` yok, OS bildirim sesi, Photo Picker, API 36 (SDK 56). Eski versionCode **5–6** AAB bunları taşımaz — test için **yeni** AAB.

## Senin işin

- [x] Expo FCM V1 (`yeniform-aa5c1`) — 2026-08-20
- [x] Firebase EAS SHA (`com.yeniform.app`) — 2026-08-20
- [ ] Play uygulaması + Internal testers + opt-in
- [ ] Listing (tıbbi cihaz uyarısı) + Data safety CSV + Health form + FGS camera/mic + hesap silme URL
- [ ] Onaylı **yeni** `npm run build:play:android` (Android 15 + OS bildirim sesi) — Play’e yükle; eski sideload Yeni Form’u sil
- [ ] Play **App signing key** SHA → Firebase
- [ ] Smoke: login, web `/plans`, push, Daily **Home’da akış**, health/calendar — **IAP yok**
- [ ] Apple Developer + ASC uygulama `com.yeniform.app` (Push; IAP yok)
- [ ] EAS APNs `.p8` (ilk `build:ios:store`)
- [ ] Onaylı `npm run build:ios:store` → TestFlight Internal
- [ ] iOS smoke: satın alma CTA yok, paket kartı + Portal, push, Daily, hesap silme
- [ ] iPhone 6.7" screenshot + ASC listing / App Privacy / inceleme notu (`ios-asc-forms.md`)

## Legal

| | URL |
|--|-----|
| Privacy | https://www.yeniform.com/legal/gizlilik-politikasi |
| Terms | https://www.yeniform.com/legal/uyelik-ve-abonelik-sozlesmesi |
| Destek | https://www.yeniform.com |
| Hesap silme | https://www.yeniform.com/hesap-silme |

**Onaysız `eas build` / Submit yok.** TestFlight: [`ios-app-store.md`](ios-app-store.md). Play AAB: [`android-play-store.md`](android-play-store.md).
