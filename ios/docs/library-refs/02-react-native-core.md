# 02 — React Native 0.85 + React 19.2

**RN docs:** https://reactnative.dev/docs/getting-started  
**React:** https://react.dev  

## Pin

- `react-native` **0.85.3**
- `react` / `react-dom` **19.2.3**
- `react-native-web` ^0.21.2 (web export smoke)

## Bu sürümde bilinen bağlam (SDK 56)

- Hermes **V1** default.
- New Architecture / Fabric: Reanimated 4 için zorunlu.
- Style: projede `shadow*` → `boxShadow` migrasyonu yapıldı (2026-08-06 audit); `pointerEvents` style uyumu.

## Sık kullanılan RN çekirdek (ürün UI)

`View`, `Text`, `Pressable`, `ScrollView`, `FlatList` / virtualized list, `TextInput`, `Modal`, `ActivityIndicator`, `KeyboardAvoidingView`, `Platform`, `StyleSheet`, `Alert`, `Linking` (native), `AppState`.

## React 19 notları (pratik)

- Compiler / memo politikası: repoda gereksiz `useMemo`/`useCallback` ekleme; mevcut pattern’e uy.
- Concurrent: `startTransition` vb. yalnızca mevcut kullanım veya net ihtiyaçta.

## Web export

Smoke: `npx expo export --platform web` — native-only modüller web’de stub/guard ile sarılı olmalı (IAP, Daily).
