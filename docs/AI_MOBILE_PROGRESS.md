# Yeni Form Mobile — AI Progress Report

> **Tek durum kaynağı** — AI / yazılımcı kaldığı yerden buradan devam eder.  
> İndeks: [`docs/README.md`](./README.md) · Harita: [`CODEMAP.md`](./CODEMAP.md) · Mimari: [`ARCHITECTURE.md`](./ARCHITECTURE.md)
>
> **Son güncelleme:** 2026-07-14 (Tur I — Stripe Checkout + üyelik yükseltme)

---

## 0. 60 saniyede başla

1. Bu dosyayı oku (§5 sonraki iş, §8 runtime).
2. [`CODEMAP.md`](./CODEMAP.md) — ilgili dosyaları bul.
3. Web otorite: `../Serenova-F-t/Adsız/src/services/<aynı konu>.js` (blueprint klasörü yoksa sorun değil).
4. Expo **v56**: https://docs.expo.dev/versions/v56.0.0/
5. Bitince **bu dosyayı** güncelle (± CODEMAP gerekirse).

**Kural:** Belgelenmeyen davranışı uydurma.

---

## 1. Ürün ve yollar

| Öğe | Değer |
|-----|--------|
| Mobil repo | mac: `/Users/mac/Desktop/mobile` · win: OneDrive `mobile` |
| Web kaynak | `Serenova-F-t/Adsız` |
| Blueprint | `Serenova-F-t/docs/rn-migration/` (bazı makinelerde **yok**) |
| Expo | SDK **56** |
| Marka / scheme | Yeni Form · `yeniform://` |
| Backend | Aynı Supabase + `https://www.yeniform.com/api/*` |

---

## 2. Blueprint durumu

| Dosya | Durum | Not |
|-------|-------|-----|
| `00-INDEX` … `07-authentication` | ✅/🚧 web’de tanımlandı | Bu Mac’te klasör yoksa web `src` kullan |
| `08`–`20` ekran task list | ⬜ | Yok — ekran portunda web `pages/*` oku |

---

## 3. Tamamlanan turlar (özet)

| Tur | Konu | Durum |
|-----|------|-------|
| A | Auth foundation (toast, single-session, callback, onboarding, AsyncStorage 2.2.0) | ✅ |
| B | Google OAuth, hydrateShared, chat context, telegram client | ✅ |
| C | OAuth website-redirect kök neden + `redirectMisconfigured` + ops doc | ✅ |
| D | ExpoCrypto crash → Linking tabanlı OAuth | ✅ |
| E | Email/phone verification port + Ayarlar UI | ✅ |
| F | Presence + realtime (chat/member/programs/admin/collab) | ✅ |
| G | Admin↔staff + staff collab chat UI + DB | ✅ |
| H | Dokümantasyon paketi (README/CODEMAP/ARCHITECTURE/progress) | ✅ |
| I | Stripe Checkout port + Üyeliğim yükseltme + ücretli onboarding düzeltmesi | ✅ |

Detaylı satırlar için git history / önceki progress sürümleri.

---

## 4. AppContext — güncel yüzey

Dosya: `src/context/AppContext.tsx` (tam liste: CODEMAP §4)

**Auth / kullanıcı:** `session`, `sessionType`, `authUser`, `member`, `staff`, `user`, `loading`, `syncing`, `loggingOut`, `isAdmin|Staff|Member`

**Shared hydrate:** `staffDirectory`, `plans`, `posts`, `exerciseCount`, `testimonials`, `faqs`, `successStories`

**Üye dashboard:** `programs`, `conversations`, `chatMessages`, `chatUnreadCount`, `dailyGoal`, `notifications`, …

**Doğrulama:** `verificationStatus` + send/confirm/refresh e-posta & telefon

**İç chat:** `adminStaffThreads`, `staffCollabThreads`, `adminStaffMessages`, `staffCollabMessages` + load/send/mark

**Ödeme:** `startStripeCheckout(planId, flow?, durationMonths?)` → `stripePayment.ts` + WebBrowser

**Auth actions:** `login`, `loginWithGoogle`, `register`, `logout`, `refresh`

Mount: presence tracker + `subscribeRealtimeSync`.

### Bilinçli eksikler

- Ödeme geçmişi UI (web `PaymentManagementPage` / `platform.payments`)
- Admin tickets UI (web’de realtime var)
- Üye ekranlarının tam web parity’si (blueprint 08+)
- Tam onboarding sihirbazı (süre seçimi register flow’da şimdilik 1 ay)

---

## 5. Sonraki öncelik

| # | Madde | Not |
|---|--------|-----|
| 1 | **Ops (insan):** Supabase Redirect URLs + Telegram secret | `MOBILE_OAUTH_SETUP.md`, `MOBILE_TELEGRAM_SETUP.md` |
| 2 | Üye ekran derinliği | web `pages` (profil, program, seans, randevu) parity |
| 3 | Ödeme geçmişi | web `PaymentManagementPage` + payments hydrate |
| 4 | Admin tickets / başvurular | web tickets + applications realtime |
| 5 | Blueprint 08+ yazımı (opsiyonel) | task list netleşsin |

---

## 6. Ortam

```env
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
EXPO_PUBLIC_SITE_URL=https://www.yeniform.com
# EXPO_PUBLIC_ADMIN_EMAIL=
# EXPO_PUBLIC_TELEGRAM_NOTIFY_SECRET=
# EXPO_PUBLIC_PHONE_VERIFY_VIA_EMAIL=true
```

Şablon: `.env.example`

---

## 7. Kritik dosya kısayolları

| Konu | Mobil | Web |
|------|-------|-----|
| OAuth | `src/services/oauthAuth.ts` | `oauthAuth.js` |
| Doğrulama | `src/services/authVerification.ts` | `authVerification.js` |
| Üye chat | `src/services/db/chat.ts` | `chatDb.js` |
| Admin chat | `src/services/db/adminChat.ts` | `adminChatDb.js` |
| Collab | `src/services/db/staffCollabChat.ts` | `staffCollabChatDb.js` |
| Realtime | `src/services/realtimeSync.ts` | `hooks/useRealtimeSync.js` |
| Presence | `src/services/presenceService.ts` | `presenceService.js` |
| Callback | `app/(auth)/callback.tsx` | `AuthCallbackPage.jsx` |
| Stripe | `src/services/stripePayment.ts` | `stripePayment.js` + `/api/stripe-checkout` |

---

## 8. Runtime / tuzaklar

- AsyncStorage **2.2.0** (3.x Expo Go native-null).
- OAuth: allow-list yoksa Site URL; kod `redirectMisconfigured`.
- `expo-auth-session` OAuth yolunda **yok**; `expo-crypto` → `app.json` plugins’e **ekleme**.
- `npm start` = dev-client; Expo Go için `npm run start:go`.
- Admin mesaj linkleri: `/(admin)/messages` (grup çakışması).

---

## 9. Agent handoff checklist

```
[ ] docs/README.md + AI_MOBILE_PROGRESS.md okundu
[ ] CODEMAP’ten hedef dosyalar işaretlendi
[ ] Web Adsız/src/services karşılığı okundu
[ ] Expo v56 docs (ilgili API) kontrol edildi
[ ] .env mevcut / eksik key yok
[ ] Değişiklik sonrası progress (+ gerekirse CODEMAP) güncellendi
```

---

*Otorite sırası: (1) web `Adsız/src` + bu docs · (2) varsa `rn-migration` · (3) uydurma yok.*
