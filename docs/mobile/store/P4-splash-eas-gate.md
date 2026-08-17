# P4 Splash + EAS — test kapısı

## Kod (bu faz)

- [x] Splash: `assets/splash-icon.png` + brand `#2d8fc4`
- [x] Icon: mevcut `assets/icon.png`
- [x] Fontlar: Inter + Plus Jakarta (`app/_layout.tsx`)
- [x] `extra.eas.projectId` = `0799a1b3-4e0a-4d73-9961-918878977fbb` (owner: `yeniform`)
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

İlk iOS build’de Apple credentials / provisioning onayın gerekir.

## Smoke

1. Soğuk açılış → native splash (mavi + logo) → süslü JS boot (~1.5–2s) → panel veya welcome
2. Fontlar Inter / Plus Jakarta
3. Üye login → `device_push_tokens` satırı (projectId ile token) — FCM dosyası yoksa atlanır
4. Ödeme: native IAP yok — `/(member)/profile/payments` web `/plans` CTA
5. Daily join native path (cihaz)

## Sonraki

P5 üye parity (`member_p5_parity`) — build kurulduktan / smoke sonrası.
