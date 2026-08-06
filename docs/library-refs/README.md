# Kütüphane Dokümantasyon Arşivi

> **Kaynak tarih:** 2026-08-06  
> **Stack:** Expo SDK **56.0.12** · React Native **0.85.3** · React **19.2.3** · TypeScript **6.0.3**  
> **Resmi Expo index:** https://docs.expo.dev/versions/v56.0.0/  
> **Otorite kuralı:** Canlı doküman URL’leri birincil; bu klasör ajan/QA için özet + pinlenmiş kararlar.

## Dosya haritası

| Dosya | Konu |
|-------|------|
| [00-stack-overview.md](./00-stack-overview.md) | Sürüm matrisi, SDK 56 kırılım noktaları, proje kısıtları |
| [01-expo-router.md](./01-expo-router.md) | Expo Router ~56.2 — navigasyon, deep link |
| [02-react-native-core.md](./02-react-native-core.md) | RN 0.85 / React 19.2 çekirdek |
| [03-reanimated-gesture.md](./03-reanimated-gesture.md) | Reanimated 4.3 + Worklets + Gesture Handler |
| [04-supabase.md](./04-supabase.md) | `@supabase/supabase-js` auth/data/realtime/storage |
| [05-revenuecat.md](./05-revenuecat.md) | Purchases + Purchases UI (paywall / customer center) |
| [06-daily-video.md](./06-daily-video.md) | `@daily-co/react-native-daily-js` + WebRTC |
| [07-expo-native-modules.md](./07-expo-native-modules.md) | Camera, Notifications, ImagePicker, SecureStore, AV, Linking… |
| [08-ui-media-web.md](./08-ui-media-web.md) | Image, SVG, WebView, fonts, gradient, splash |
| [09-storage-utils.md](./09-storage-utils.md) | AsyncStorage, date-fns, get-random-values |

## Nasıl kullanılır?

1. Kod yazmadan önce ilgili dosyayı oku.
2. Şüphede resmi URL’yi `WebFetch` / tarayıcı ile doğrula (sürüm pin: **v56.0.0**).
3. Ürün davranışı için **önce** `docs/mobile/` + web parity; kütüphane docs yalnızca API/kısıt için.

## package.json bağımlılık listesi (pin)

Tüm runtime bağımlılıklar `package.json` ile senkron; özet: [00-stack-overview.md](./00-stack-overview.md).
