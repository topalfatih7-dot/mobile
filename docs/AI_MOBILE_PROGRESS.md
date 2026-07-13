# Yeni Form Mobile — AI Progress Report

> **Amaç:** Bu dosya, Cursor / diğer AI agent’ların kaldığı yerden devam etmesi için tek durum kaynağıdır.
> Web blueprint: `../Serenova-F-t/docs/rn-migration/` (kaynak: `Serenova-F-t`).
> **Kural (blueprint 00-INDEX):** Belgelenmeyen davranışı uydurma. `UNKNOWN` / ⬜ dokümanlarda tahmin etme; sor veya önce dokümanı tamamla.
>
> **Son güncelleme:** 2026-07-13 (Google OAuth website-redirect kök neden + Telegram ops checklist)

---

## 1. Ürün ve yollar

| Öğe | Değer |
|-----|--------|
| Mobil repo | `c:\Users\opas2\OneDrive\Desktop\mobile` |
| Web kaynak (doğruluk) | `c:\Users\opas2\OneDrive\Desktop\Serenova-F-t` |
| Blueprint | `Serenova-F-t/docs/rn-migration/` |
| Expo | SDK **56** — kod yazmadan önce https://docs.expo.dev/versions/v56.0.0/ |
| Marka | Yeni Form (`yeniform`) |
| Backend | Aynı Supabase + `https://www.yeniform.com/api/*` |

---

## 2. Blueprint durumu (web `docs/rn-migration/`)

| Dosya | Durum | Not |
|-------|-------|-----|
| `00-INDEX.md` | 🚧 | Okuma sırası + kurallar |
| `01-architecture-overview.md` | ✅ | Stack, provider ağacı, env |
| `02`–`03` | ⬜ | Yok |
| `04-state-management.md` | ✅ | AppContext API yüzeyi |
| `05-navigation-graph.md` | ✅ | 63 rota, guard’lar |
| `06-api-analysis.md` | 🚧 | HTTP endpoints ✅; service derin okuma pending |
| `07-authentication.md` | ✅ | Login/OAuth/single-session |
| `08`–`20` | ⬜ | Ekran/task list yok |

---

## 3. Bu oturumda tamamlananlar

### Tur A — Auth foundation (önceki)
Toast, single-session, apiAuth, callback, onboarding gate, StaffForcePasswordChange, AsyncStorage 2.2.0, welcome UI fix.

### Tur B — P0 (OAuth + hydrate + chat + telegram client)

| Madde | Durum |
|-------|-------|
| Google OAuth + SocialAuthButtons | ✅ |
| hydrateShared + chat context | ✅ |
| telegramNotify client | ✅ |

### Tur C — Google → website redirect (kök neden + düzeltme)

| Bulgu | Detay |
|-------|--------|
| Kök neden | Supabase Redirect URLs yalnızca web (`https://www.yeniform.com/auth/callback`…). Mobil `yeniform://` / `exp://` yok → Site URL fallback |
| Kod | `oauthAuth.ts`: `makeRedirectUri`, website-redirect tespiti → `redirectMisconfigured` + Dashboard alert |
| Rota | `app/auth/callback.tsx` |
| Ops doküman | `docs/MOBILE_OAUTH_SETUP.md` |
| Kullanıcı aksiyonu | Dashboard’a `yeniform://**`, `exp://**`, `yeniform://auth/callback` ekle |

### Telegram — ops

| Madde | Durum |
|-------|--------|
| İstemci kodu | ✅ `telegramNotify.ts` |
| Lokal web secret | `.env` içinde `VITE_TELEGRAM_NOTIFY_SECRET=""` (boş) — değer Vercel’de |
| Kullanıcı aksiyonu | Vercel’den secret → `EXPO_PUBLIC_TELEGRAM_NOTIFY_SECRET` (`docs/MOBILE_TELEGRAM_SETUP.md`) |
| Bot token | Yalnızca Vercel; mobilde yok |

---

## 4. AppContext — güncel yüzey (özet)

**State (ek):** `staffDirectory`, `plans`, `posts`, `exerciseCount`, `testimonials`, `faqs`, `successStories`, `chatMessages`, `loggingOut`

**Actions (ek):** `loginWithGoogle`, `loadChatMessages`, `sendChatMessage`, `markChatThreadRead`

Hâlâ eksik (doc 04): admin/collab chat, realtime, verification, Stripe…

---

## 5. Sonraki öncelik (P0 kalan / P1)

1. **Ops (kullanıcı):** Supabase Redirect URLs + Telegram secret (yukarıdaki dokümanlar)
2. Email/phone verification (`authVerification.js` port)
3. Realtime sync
4. Admin↔staff + collab chat
5. Blueprint `08`/üye ekranları

---

## 6. Ortam

```env
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
EXPO_PUBLIC_SITE_URL=https://www.yeniform.com
# EXPO_PUBLIC_TELEGRAM_NOTIFY_SECRET=   # = Vercel VITE_TELEGRAM_NOTIFY_SECRET
```

OAuth Redirect URLs: `docs/MOBILE_OAUTH_SETUP.md`  
Telegram: `docs/MOBILE_TELEGRAM_SETUP.md`

---

## 7. Agent handoff

1. Bu dosyayı oku.
2. `Serenova-F-t/docs/rn-migration/{00,01,04,05,06,07}` oku.
3. Expo v56 docs.
4. OAuth/Telegram ops kullanıcıda; kod tarafı hazır → §5 madde 2+.
5. Bitince bu dosyayı güncelle.

---

## 8. Runtime notları

- AsyncStorage **2.2.0** (3.x Expo Go’da native-null).
- Welcome: oklarla sonsuz wrap.
- Google OAuth: allow-list yoksa Site URL’e düşer; kod artık `redirectMisconfigured` gösterir.

---

*Otorite: `docs/rn-migration/` + bu dosya. `AI_PROJE_REHBERI.md` yalnızca çapraz referans.*
