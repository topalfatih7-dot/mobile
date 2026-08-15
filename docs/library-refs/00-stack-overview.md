# 00 — Stack Overview (Yeni Form Mobile)

## Sürüm matrisi

| Katman | Sürüm | Resmi docs |
|--------|-------|------------|
| Expo SDK | ~56.0.12 | https://docs.expo.dev/versions/v56.0.0/ |
| React Native | 0.85.3 | https://reactnative.dev/docs/getting-started |
| React | 19.2.3 | https://react.dev |
| Expo Router | ~56.2.11 | https://docs.expo.dev/versions/v56.0.0/sdk/router/ |
| TypeScript | ~6.0.3 | — |
| Hermes | V1 (SDK 56 default) | Expo changelog |
| Min iOS | **16.4** | SDK 56 breaking |
| Android | API 24+ | Expo |

## Expo SDK 56 — bu proje için kritik kırılımlar

Kaynak özeti (reopt handbook + Expo SDK 56 notes, May–Jun 2026):

1. **Expo Router ≠ React Navigation paket bağımlılığı**  
   App kodunda `@react-navigation/*` import’ları kırılabilir. Codemod:  
   `npx expo-codemod sdk-56-expo-router-react-navigation-replace <src>`  
   `expo-doctor` hem router hem react-navigation uyarısı verebilir.

2. **`expo/fetch` = default `globalThis.fetch`**  
   Regresyon izolasyonu: `EXPO_PUBLIC_USE_RN_FETCH=1`.

3. **`@expo/vector-icons` artık implicit değil** — `package.json`’da açık bağımlılık var ✅.

4. **Reanimated 4.x → New Architecture (Fabric) zorunlu** + ayrı `react-native-worklets` paketi.

5. **Expo Go store dağıtımı SDK 56 için QA standardı değil** → **development build / EAS Go** kullan. Bu proje zaten `expo-dev-client` kullanıyor (`npm start` = `--dev-client`).

6. **Node:** resmi notlar 20.19.4+ / bazı kaynaklar 22.x; yerel ortamı `node -v` ile doğrula.

## Native-only paketler (Expo Go’da çalışmaz / kısıtlı)

| Paket | Neden |
|-------|--------|
| `@daily-co/react-native-daily-js` + webrtc | Native WebRTC |
| `expo-notifications` (production push) | FCM/APNs credential + native build |
| `expo-secure-store` biometric opsiyonları | Dev client / release; Expo Go FaceID key eksik olabilir |

## Proje runtime bayrakları

- `UI_ONLY_MODE` = **false** (`src/config/runtime.ts`) → gerçek Supabase/API.
- Env isimleri: `docs/mobile/contracts/env-vars.md`.
- Ödeme: mobilde IAP yok; web Stripe login’li `/plans` CTA — LOCK §3 (2026-08-15).

## Bağımlılık envanteri (runtime)

```
@daily-co/react-native-daily-js ^0.86.0
@daily-co/react-native-webrtc ^124.0.6-daily.2
@expo-google-fonts/inter ^0.4.2
@expo-google-fonts/plus-jakarta-sans ^0.4.2
@expo/dom-webview ~56.0.6
@expo/vector-icons ^15.0.3
@react-native-async-storage/async-storage 2.2.0
@supabase/supabase-js ^2.110.7
date-fns ^4.4.0
expo ~56.0.12
expo-audio ~56.0.13
expo-camera ~56.0.8
expo-constants ~56.0.18
expo-dev-client ~56.0.24
expo-device ~56.0.4
expo-font ~56.0.7
expo-image ~56.0.11
expo-image-picker ~56.0.21
expo-linear-gradient ~56.0.4
expo-linking ~56.0.14
expo-notifications ~56.0.21
expo-router ~56.2.11
expo-secure-store ~56.0.4
expo-splash-screen ~56.0.10
expo-status-bar ~56.0.4
expo-web-browser ~56.0.5
react / react-dom 19.2.3
react-native 0.85.3
react-native-gesture-handler ~2.31.1
react-native-get-random-values ^1.11.0
react-native-reanimated 4.3.1
react-native-safe-area-context ~5.7.0
react-native-screens 4.25.2
react-native-svg 15.15.4
react-native-web ^0.21.2
react-native-webview 13.16.1
react-native-worklets 0.8.3
```

## Not: expo-audio vs expo-video

SDK 56’da `expo-av` kaldırıldı. Bildirim sesi **`expo-audio`**; egzersiz videosu şu an WebView + signed URL. İleride native player gerekirse `expo-video` değerlendir.

## Setup blockers (native)

`SETUP_REQUIRED.md`:
- `google-services.json` (Android FCM)
- `GoogleService-Info.plist` (iOS)
- Store ürün ID’leri + RC eşlemesi
