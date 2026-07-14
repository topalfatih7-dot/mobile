# Yeni Form Mobile — Code Map

> Amaç: “Bu özellik hangi dosyada?” sorusuna tek bakışta cevap.  
> Durum: [`AI_MOBILE_PROGRESS.md`](./AI_MOBILE_PROGRESS.md) · Yol: [`ROADMAP.md`](./ROADMAP.md) · Parity: [`FEATURE_PARITY.md`](./FEATURE_PARITY.md) · Tasarım: [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md) · Mimari: [`ARCHITECTURE.md`](./ARCHITECTURE.md)

---

## 1. Giriş noktaları

| Ne | Dosya |
|----|--------|
| Root layout / font / provider | `app/_layout.tsx` (Outfit + Manrope) |
| Welcome | `app/index.tsx` |
| Global state | `src/context/AppContext.tsx` |
| Toast | `src/context/ToastContext.tsx` |
| Env / API URL | `src/config/env.ts` → `apiUrl()`, `env.siteUrl` |
| Tema (Lumina) | `src/constants/theme.ts` |
| Brand | `src/config/brand.ts` |
| UI kit | `src/components/ui/*`, `src/components/motion/*` |
| Supabase client | `src/services/supabaseClient.ts` |

---

## 2. Rota grupları (`app/`)

### Auth — `app/(auth)/`

| Rota | Dosya | Not |
|------|--------|-----|
| Login | `(auth)/login.tsx` | e-posta + Google |
| Register | `(auth)/register.tsx` | |
| Onboarding | `(auth)/onboarding.tsx` | sosyal / eksik profil |
| Callback (iş mantığı) | `(auth)/callback.tsx` | OAuth, `evt`, `verify=email\|phone`, reset |
| Deep-link forward | `app/auth/callback.tsx` | `yeniform://auth/callback` → `(auth)/callback` |
| Forgot / reset | `(auth)/forgot-password.tsx`, `reset-password.tsx` | |

Guard: `src/hooks/useAuthGuard.ts` → `useProtectedRoute('member'\|'staff'\|'admin')`

### Üye — `app/(app)/`

| Alan | Dosyalar |
|------|----------|
| Home | `(app)/index.tsx` |
| Programs | `(app)/programs.tsx`, `(app)/program/[id].tsx` |
| Messages (üye↔staff) | `(app)/messages/*` |
| Daha (more) | `(app)/more.tsx` — hub to schedule/calorie/calendar/library/health-test/profile |
| Schedule / calorie / calendar / library | `(app)/schedule|calorie|calendar|library.tsx` |
| Health test | `(app)/health-test/*` |
| Profile | `(app)/profile/*` — payments, settings, VerificationSection |
| Video call | `(app)/call/[type]/[sessionId].tsx` |

### Staff — `app/(staff)/`

| Alan | Dosyalar |
|------|----------|
| Özet / profil | `index`, `profile` (role kısayolları) |
| Danışanlar | `clients/index`, `clients/[id]/health`, `clients/[id]/program` |
| Programs / lists / library / payments | `programs`, `lists`, `library` (gate), `payments` |
| Mesajlar (3 sekme) | `messages/index.tsx` → Danışanlar / Admin / Ekip |
| Danışan sohbeti | `messages/[threadId].tsx` |
| Admin sohbeti | `messages/admin/[threadId].tsx` |
| Collab (koç↔diyetisyen) | `messages/collab/[threadId].tsx` |
| Force password | `StaffForcePasswordChange` component |
| Dashboard data | `src/hooks/useStaffDashboard.tsx` |

### Admin — `app/(admin)/`

| Alan | Dosyalar |
|------|----------|
| Hub | `(admin)/index.tsx` — web `adminNav` grid |
| Üye detay | `(admin)/members/[id].tsx` |
| Paneller | `plans`, `premium`, `applications`, `library`, `staff`, `blog`, `content`, `payments`, `sessions`, `support`, `analytics`, `activity`, `account` |
| Subscriptions | `subscriptions.tsx` → `payments` |
| Personel mesajları | `(admin)/messages/index.tsx`, `[threadId].tsx` |
| Dashboard data | `src/hooks/useAdminDashboard.ts` |

### Public — `app/(public)/`

| Alan | Dosyalar |
|------|----------|
| Landing | `index.tsx` — Yeni Form hero + CTA |
| Marketing | `membership`, `about`, `stories` |
| Blog | `blog/index`, `blog/[id]` |
| Team | `team/index` (role chips), `team/[id]`, `team/apply` |
| Corporate | `corporate/index`, `corporate/apply` |
| Legal | `legal/[slug]` + `src/data/legalDocuments.ts` |

---

## 3. Servisler (`src/services/`)

### Auth / oturum

| Dosya | Web karşılığı (yaklaşık) | Ne yapar |
|-------|--------------------------|----------|
| `supabaseAuth.ts` | `supabaseDb` auth parçası | login, register, hydrate, routeForRole |
| `oauthAuth.ts` | `oauthAuth.js` | Google OAuth — **expo-linking** (crypto yok) |
| `authSessionFromUrl.ts` | aynı isim | deep link / hash session |
| `authStorage.ts` | `authStorage.js` | remember-me |
| `authVerification.ts` | `authVerification.js` | e-posta/telefon doğrulama |
| `apiAuth.ts` | `apiAuth.js` | Bearer header |
| `singleSession.ts` | `singleSession.js` | tek cihaz oturumu |
| `password.ts` | `password.js` | şifre kuralları |

### Data / hydrate

| Dosya | Ne yapar |
|-------|----------|
| `hydrateShared.ts` | staff, plans, posts, content bundle |
| `memberDashboard.ts` | üye home view-model |
| `memberProfile.ts` | profil stats / plan UI |
| `staffDashboard.ts` | staff inbox mapping |
| `notifications.ts` | üye bildirim parse |
| `pushNotifications.ts` | Expo push + settings |
| `telegramNotify.ts` | `/api/telegram-notify` client |
| `stripePayment.ts` | `/api/stripe-checkout` + WebBrowser (web `stripePayment.js`) |
| `videoCallSession.ts` | seans zamanlama |

### Realtime / presence

| Dosya | Web karşılığı | Ne yapar |
|-------|---------------|----------|
| `presenceService.ts` | `presenceService.js` | `user_presence` heartbeat (AppState) |
| `realtimeSync.ts` | `useRealtimeSync.js` | postgres_changes abonelikleri |

**Realtime tablolar:** `chat_threads`, `chat_messages`, `admin_staff_threads`, `admin_staff_messages`, `staff_collab_threads`, `staff_collab_messages`, `members` (filtre), `programs` (filtre)

### DB katmanı (`src/services/db/`)

| Dosya | Tablo / konu | Web |
|-------|--------------|-----|
| `chat.ts` | `chat_threads` / `chat_messages` | `chatDb.js` |
| `adminChat.ts` | `admin_staff_*` | `adminChatDb.js` |
| `staffCollabChat.ts` | `staff_collab_*` | `staffCollabChatDb.js` |
| `members.ts` | `members` upsert/patch | `supabaseDb` member mutations |
| `programs.ts` | `programs` (+ create/update) | `createProgram` |
| `staff.ts` | `staff` | staff |
| `mappers.ts` | row ↔ profile | `rowToMember` vb. |
| `support.ts` | `tickets` (+ admin reply/status) | tickets |
| `exercises.ts` | `exercises` CRUD | library |
| `payments.ts` | `payments` (member/staff/admin) | payments |
| `plans.ts` | `plans` get/upsert | `getPlans`/`upsertPlan` |
| `blog.ts` | `posts` CRUD | `addPost`/`editPost`/`removePost` |
| `content.ts` | `site_content` CRUD | content |
| `applications.ts` | staff/corporate apps + resolve | applications |
| `activities.ts` | `activities` log | activities |
| `sessions.ts` | booking + admin session summaries | sessions |

---

## 4. AppContext yüzeyi (özet)

Dosya: `src/context/AppContext.tsx`

### State / türetilmiş

- Auth: `session`, `sessionType`, `authUser`, `member`, `staff`, `user`, `loading`, `syncing`, `loggingOut`
- Shared: `staffDirectory`, `plans`, `posts`, `exerciseCount`, `testimonials`, `faqs`, `successStories`
- Üye UI: `programs`, `conversations`, `chatUnreadCount`, `chatMessages`, `dailyGoal`, `notifications`, …
- Doğrulama: `verificationStatus`
- İç chat: `adminStaffThreads`, `staffCollabThreads`, `adminStaffMessages`, `staffCollabMessages`

### Actions (gruplar)

| Grup | Metodlar |
|------|----------|
| Auth | `login`, `loginWithGoogle`, `register`, `logout`, `refresh` |
| Profil | `updateProfile`, `updateSettings`, `toggleTask`, `toggleProgramEntry` |
| Üye chat | `loadChatMessages`, `sendChatMessage`, `markChatThreadRead` |
| Doğrulama | `sendEmailVerification`, `confirmEmailVerification`, `sendPhoneVerification`, `confirmPhoneVerification`, `refreshVerification` |
| Ödeme | `startStripeCheckout(planId, flow?, durationMonths?)` |
| Admin↔staff | `loadAdminStaffMessages`, `sendAdminStaffChat`, `markAdminStaffRead` |
| Collab | `loadStaffCollabMessages`, `sendStaffCollabChat`, `markStaffCollabRead` |
| Bildirim | `markNotificationRead`, `markAllNotificationsRead` |

Mount’ta: auth hydrate + `startPresenceTracker` + `subscribeRealtimeSync`.

---

## 5. UI bileşenleri (önemli)

| Bileşen | Yol |
|---------|-----|
| Google butonları | `src/components/auth/SocialAuthButtons.tsx` |
| Doğrulama paneli | `src/components/profile/VerificationSection.tsx` |
| Sohbet satırı | `src/components/messages/ConversationRow.tsx` (`href` prop) |
| Deep link | `src/components/auth/AuthDeepLinkHandler.tsx` |
| Push bootstrap | `src/components/notifications/PushBootstrap.tsx` |

---

## 6. Yardımcılar / data

| Dosya | Ne |
|-------|-----|
| `src/data/countryCodes.ts` | E.164 telefon |
| `src/data/membershipPlans.ts` | plan label, paid, package includes |
| `src/utils/staffAccess.ts` | `normalizeStaffRole`, danışan filtre |
| `src/utils/contactInfoGuard.ts` | collab mesajlarında dış iletişim engeli |
| `src/utils/memberProfile.ts` | `hasRegisteredMember`, social user |

---

## 7. “Şunu ekleyeceğim” → nereye bak

| İstek | Önce oku (web) | Sonra değiştir (mobil) |
|-------|----------------|-------------------------|
| Yeni auth davranışı | `Adsız/src/services/auth*.js`, `oauthAuth.js` | `supabaseAuth` / `oauthAuth` / `(auth)/*` |
| Yeni üye ekranı | web `pages/*` (+ blueprint 08 varsa) | `app/(app)/…` + AppContext action |
| Stripe / ödeme | `stripePayment.js`, web checkout | `src/services/stripePayment.ts`, `profile/membership`, onboarding paid path |
| Ticket / destek admin | web tickets + realtime | `realtimeSync` + admin UI (eksik) |
| Yeni realtime tablo | `useRealtimeSync.js` | `realtimeSync.ts` + AppContext handler |
| Yeni chat türü | ilgili `*ChatDb.js` | `src/services/db/*` + rota + AppContext |
| Env değişkeni | web `VITE_*` | `.env.example` + `src/config/env.ts` |

---

## 8. Bilinen tuzaklar

1. **ExpoCrypto:** OAuth’da `expo-auth-session` kullanma; `oauthAuth.ts` Linking tabanlı. `expo-crypto`’yu `app.json` plugins’e ekleme.
2. **AsyncStorage:** `2.2.0` — 3.x Expo Go’da native null.
3. **OAuth redirect:** Supabase allow-list’te `yeniform://**`, `exp://**` yoksa Site URL’e düşer → `redirectMisconfigured`.
4. **Blueprint klasörü:** Bazı makinelerde `rn-migration` yok — web `src/services` ile devam et.
5. **Rota çakışması:** `(app)`, `(staff)`, `(admin)` hepsinde `messages` var; admin linklerinde `/(admin)/messages` kullan.
