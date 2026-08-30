# 01 — Expo Router (~56.2)

**Docs:** https://docs.expo.dev/versions/v56.0.0/sdk/router/  
**Paket:** `expo-router` ~56.2.11  
**Entry:** `package.json` → `"main": "expo-router/entry"`

## Bu projede kullanım

```
app/
  index.tsx              → rol redirect
  (public)/ …            → misafir / pazarlama
  (auth)/ …              → login, onboarding, reset
  (member)/ …            → üye panel (PanelTopBar + Drawer)
  (staff)/ …
  (admin)/ …
  auth/callback.tsx      → OAuth / deep link
```

Nav chrome: bottom tab **yok** — hamburger drawer (web `PanelMobileMenu` parity). Spec: `docs/mobile/03-navigation.md`.

## SDK 56 dikkat

- Router artık React Navigation paketini app bağımlılığı olarak taşımaz.
- Kodda `import … from '@react-navigation/…'` varsa kırılır → Expo Router API / codemod.
- Stack, Link, native tabs, split view: v56 router alt sayfaları.

## Deep links (ürün)

| Scheme pattern | Hedef |
|----------------|-------|
| `yeniform://auth/callback` | Auth callback |
| `yeniform://reset-password` | Reset |
| `yeniform://call/:type/:id` | Video call |
| `yeniform://messages/:role` | Member chat |
| `yeniform://staff/messages/:memberId` | Staff chat |

Paket: `expo-linking` + app scheme `app.json`.

## Test ipuçları

1. Soğuk açılış → `app/index` doğru role yönlendiriyor mu?
2. Korunan route’a oturumsuz → login + `from` geri dönüş.
3. Admin member URL’sine → `/admin` redirect.
4. Üye ama `members` satırı yok → onboarding.
5. Deep link (dev client): `npx uri-scheme open "yeniform://…" --ios|android`.

## İlgili Expo paketleri

- `expo-linking` — URL parse / open
- `expo-web-browser` — OAuth / dış tarayıcı
- `react-native-screens` / `safe-area-context` — native stack prerequisites
