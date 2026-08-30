# P4 Splash + EAS — test kapısı

## Kod (bu faz)

- [x] Splash: `assets/splash-icon.png` + brand `#2d8fc4`
- [x] Icon: mevcut `assets/icon.png`
- [x] Fontlar: Inter + Plus Jakarta (`app/_layout.tsx`)
- [x] `extra.eas.projectId` = `460ad8b4-c94a-4933-885c-be703befe489` (owner: `yeniforms-team`)
- [x] `expo-dev-client` + scripts (`start` / `build:*`)
- [x] iOS privacy strings (kamera / mikrofon / galeri)
- [x] Android `POST_NOTIFICATIONS`
- [x] `eas.json`: development / development-device / preview / production

### MOBILE DIFF (2026-08-17) — JS branded boot

- Native Expo splash **değişmez**: `splash-icon.png` + `#2d8fc4` (mağaza soğuk açılış).
- Native splash gizlendikten sonra JS **`BrandedBootScreen`**: mesh + marka animasyonu, ~1.5–2s minimum, **her soğuk açılış** (giriş yapmış kullanıcı dahil).
- JS runtime başına bir kez (`coldBoot` modül bayrağı) — ekran geçişlerinde tekrar yok.
- Overlay `LoadingScreen` (yavaş işlem maskesi) aynı kalır.

## Build (sen — credentials)

```bash
# Fiziksel cihaz + push için:
npm run build:dev:android   # veya
npm run build:dev:ios

# Internal store-like:
npm run build:preview:android
npm run build:preview:ios
```

iOS preview: ücretli Apple Developer + **önce** cihaz kaydı (`eas device:create`), **sonra** build. Yalnızca o anki kayıtlı iPhone’lar kurar. Adımlar: [`ios-preview-build.md`](ios-preview-build.md). Kullanıcı onayından önce build alma.

## Smoke

1. Soğuk açılış → native splash (mavi + logo) → süslü JS boot (~1.5–2s) → panel veya welcome
2. Fontlar Inter / Plus Jakarta
3. Üye login → `device_push_tokens` satırı (projectId ile token) — FCM dosyası yoksa atlanır
4. Ödeme: native IAP yok. Android: `/(member)/profile/payments` web `/plans` CTA. iOS: satın alma CTA yok.
5. Daily join native path (cihaz)

## Sonraki

P5 üye parity (`member_p5_parity`) — build kurulduktan / smoke sonrası.
