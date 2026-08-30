# 03 — Reanimated 4.3 + Gesture Handler + Worklets

## Paketler

| Paket | Sürüm | Docs |
|-------|-------|------|
| `react-native-reanimated` | 4.3.1 | https://docs.swmansion.com/react-native-reanimated/docs/fundamentals/getting-started/ |
| `react-native-worklets` | 0.8.3 | https://docs.swmansion.com/react-native-worklets/ |
| `react-native-gesture-handler` | ~2.31.1 | https://docs.expo.dev/versions/v56.0.0/sdk/gesture-handler/ |
| `react-native-screens` | 4.25.2 | Expo third-party |
| `react-native-safe-area-context` | ~5.7.0 | Expo third-party |

## Reanimated 4 kuralları

1. **Yalnız New Architecture (Fabric).** Old arch → Reanimated 3 (bakım yok).
2. **`react-native-worklets` ayrı zorunlu** bağımlılık (Reanimated’den ayrıldı).
3. Expo’da prebuild/dev-client sonrası native rebuild gerekir.
4. Community CLI’de Babel’de `react-native-worklets/plugin` **son** plugin olmalı; Expo template genelde dahil.
5. Metro cache sorununda: `npx expo start --dev-client -- --reset-cache`.

## Projede kullanım alanı

- Auth / welcome slide fade-slide
- PanelDrawer 250ms slide-in + overlay
- Intro / mesh atmosfer motion (LOCK: izinli Reanimated fade/slide)

Yasak: LOCK dışı “showy” animasyon / yeni tema.

## Gesture Handler

Root’ta `GestureHandlerRootView` (Expo Router layout’ta genelde sağlanır). Drawer swipe / pressable gesture ile çakışmada `simultaneousHandlers` / `activeOffsetX` kontrol et.
