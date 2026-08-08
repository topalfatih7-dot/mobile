# Yeni Form Mobile — Progress

> **Son güncelleme:** 2026-08-08 — RevenueCat / telefon IAP tam iptal; web Stripe CTA  
> **Her tur:** [`IMPLEMENTATION-LOCK.md`](./mobile/IMPLEMENTATION-LOCK.md) + [`AI_WORKING_RULES.md`](./AI_WORKING_RULES.md)  
> **Web kaynak (zorunlu):** `/Users/mac/Desktop/Serenova-F-t/Adsız` (`donusum-programi`)

## 2026-08-08 RevenueCat / IAP iptal

| Madde | Durum |
|-------|--------|
| Web `api/revenuecat-webhook.js` silindi → Vercel Hobby **12/12** | ✅ |
| Stripe `ACTIVE_MOBILE_SUBSCRIPTION` guard kaldırıldı | ✅ |
| Mobil SDK/deps (`react-native-purchases*`, `iap.ts`, Paywall, CustomerCenter) | ✅ |
| `profile/payments` → Supabase status + web `/membership` CTA | ✅ |
| RC MCP: webhook silindi, offering/entitlement/51 ürün arşiv | ✅ |
| LOCK / skills / contracts MOBILE DIFF | ✅ |
| Mevcut `provider:revenuecat` üyelikler | dokunulmadı (süre bitene kadar) |

## 2026-08-07 üye egzersiz videosu (library / programs / calendar)

| Madde | Durum |
|-------|--------|
| `expo-video` kurulumu + `app.json` plugin | ✅ |
| `VideoPlayer` (muted/loop/auto, 16:9, poster webp, retry) | ✅ |
| `ExerciseDetailModal` ortalanmış kart + açıklama/set-rep | ✅ |
| Signed URL cache + press-in prefetch (`exerciseMedia`) | ✅ |
| Member library / programs / calendar bağlandı | ✅ |
| Staff/admin player | ⏸ ayrı sprint |
| Native rebuild (dev client) gerekir | 🔄 cihaz |

## 2026-08-06 sağlık testi 2 aşama + telefon

| Madde | Durum |
|-------|--------|
| Kayıt `PhoneField` + TR 10 hane cap (`onboarding.tsx`) | ✅ |
| `coreHealthTest.ts` + remaining/detailed/lock helpers | ✅ |
| `useHealthAnalysisSync` core manuel / detailed auto + `optionalCompletedAt` | ✅ |
| Hub 2 aşama UI + Analizi Başlat + kilit/retake | ✅ |
| `/(member)/health-test/core` route | ✅ |
| Section remaining mode + nav badge | ✅ |
| `HealthScoreCard` lock badge + staff health meta | ✅ |
| AI `POST /api/ai-health-analysis` (web parity) | ✅ |
| Docs/skill F04 + hub/core/section LOCK | ✅ |
| `npx tsc --noEmit` | ✅ |
| Elle QA: core→skor→opsiyonel→kilit→retake | 🔄 cihaz |

## 2026-08-06 elle QA kickoff

| Madde | Durum |
|-------|--------|
| Kütüphane docs arşivi (`docs/library-refs/`) — Expo 56 / RN 0.85 / RC / Daily / Supabase / Reanimated / Expo modules | ✅ |
| Elle test planı (`docs/qa/MANUAL_TEST_PLAN.md`) — T0–T10, bug formatı, flow eşlemesi | ✅ |
| Agent smoke (`docs/qa/RESULTS-2026-08-06.md`) — tsc/import/API/DB/web export + Metro | ✅ |
| IAP `setLogLevel` null crash fix | ⛔ IAP kaldırıldı (2026-08-08) |
| Kullanıcı elle UI T1+; FCM credential USER | 🔄 devam |

## 2026-08-06 full audit

Kapsamlı native audit + store hazırlık turu özeti:

| Madde | Durum |
|-------|--------|
| Docs cleanup (`docs/` kök kopyaları silindi; otorite `docs/mobile/`) | ✅ |
| FCM `app.json` (`android.googleServicesFile` + `expo-notifications` plugin) | ✅ config; `google-services.json` / `GoogleService-Info.plist` kullanıcı sağlar |
| RevenueCat test key + Paywall / CustomerCenter | ⛔ IAP kaldırıldı (2026-08-08) |
| `shadow*` → `boxShadow` + `pointerEvents` style migrasyonu | ✅ |
| Library virtualization + admin members pagination | ✅ |
| Admin messages audit sekmeleri, applications staff create, content/blog/library CRUD | ✅ |
| Push permission prompt + camera/mic gate (video call) | ✅ |
| `npx tsc --noEmit` | ✅ 0 hata |
| `npx expo export --platform web` | ✅ bundle |
| EAS `whoami` | ✅ `yeniform` / logged in |
| EAS profiles (`development`, `preview`, `production`) + `projectId` | ✅ |

**Kalan USER blockers:**
1. Proje köküne `google-services.json` + `GoogleService-Info.plist` koy (`SETUP_REQUIRED.md`)
2. ~~App Store / Play + RevenueCat ürün eşlemesi~~ — IAP iptal; web Stripe
3. Cihazda EAS preview: `npm run build:preview:ios` / `npm run build:preview:android`

## Store yolu (üye)

| Faz | Durum | Gate doc |
|-----|-------|----------|
| P0 Hesaplar | 🔑 test key eklendi | `store/P0-handoff-checklist.md` |
| P1 Auth | ✅ kod | — |
| P2 IAP | ⛔ iptal — web membership CTA | `store/P2-live-gate.md` |
| P3 Push | ✅ + yerel banner; FCM files USER | `store/P3-push-test-gate.md` |
| P4 Splash/EAS | ✅ projectId; preview build USER | `store/P4-splash-eas-gate.md` |
| P5 Parity | ✅ messages presence/programs | `store/P5-parity-gate.md` |
| P6 Store | ✅ listing şablon | `store/P6-store-gate.md` |

EAS `projectId`: `0799a1b3-4e0a-4d73-9961-918878977fbb` (owner: yeniform)

## Durum

| Faz | İçerik | Durum |
|-----|--------|-------|
| **0–P0.3** | Spec, auth, member hub | ✅ |
| **UI-only** | Demo kısa devre | ⬜ kapalı (`false`) |
| **P1 Member** | Schedule, health-test, messages, calorie, notifications, support, payments | ✅ |
| **P1 Call** | Daily token + native SDK / WebView fallback | ✅ |
| **Native SDK** | Daily RN, expo-notifications, expo-audio, camera (RC kaldırıldı) | ✅ |
| **Nav chrome** | PanelTopBar + PanelDrawer (3 rol) | ✅ |
| **Staff/Admin DB** | platformDb + gerçek sohbet / premium / plans | ✅ |
| **Public** | Landing/membership/blog native; about/team/legal WebView; SKIP stubs | ✅ |
| **Web parity taraması** | Faz A–D checklist | ✅ 2026-07-26 |
| **Smoke re-scan** | tsc + 77 app import resolve + `expo export --platform web` + Supabase tablo/count | ✅ 2026-07-26 |
| RevenueCat keys / paywall | ⛔ kaldırıldı — 2026-08-08 |
| Push tokens | `device_push_tokens` + Expo Push | ✅ kod; cihaz smoke bekliyor |
| Messages presence | `user_presence` + program panel | ✅ 2026-08-06 |

## Smoke sonuçları (2026-07-26)

| Kontrol | Sonuç |
|---------|-------|
| `npx tsc --noEmit` | ✅ |
| App `@/` import resolve (77 dosya) | ✅ |
| `expo export --platform web` | ✅ bundle |
| DEMO stub app ekranlarında | ✅ yalnız staff payments Demo badge (LOCK) |
| DB tabloları (chat/collab/admin_staff/site_content/plans…) | ✅ |
| Counts: members 9, staff 5, plans 6, exercises 1599, threads canlı | ✅ |
| Anon `posts` / `plans` / `site_content` REST | ✅ |
| 6 sağlık kategorisi (`…DIETITIAN` spread → `nutrition`) | ✅ |

**Bu turda kapatılan bug:** Guest (oturumsuz) public blog `useData().posts` boşalıyordu — `DataContext` artık anon published posts çekiyor; `rowToPost` `createdAt` ekledi.

**Chat audit (2026-07-26) kapatılanlar:**
- Staff→member `notifyMemberChatMessage` (bell + push RPC)
- Member/staff/admin/collab realtime + 8s poll yedek
- Drawer unread badge’ler (staff/admin) gerçek sayaç
- Bildirim sesi: kendi mesaj + açık thread mute
- Consent once-ever (`AsyncStorage` web parity)
- Inbox unread-first sıralama

**Chat kalan GAP:** Admin messages audit + collab oversight sekmeleri (LOCK’da var, mobil henüz yok).

## Parity matrisi (2026-07-26)

### Faz A — Üye

| Ekran | Durum | Not |
|-------|-------|-----|
| Dashboard | OK | HealthScoreCard + blog native |
| Health hub/section | OK | 6 kategori katalog; skor panoda |
| Calendar | OK | meal/workout complete |
| Programs | OK | |
| Schedule | OK | book/reschedule/cancel + join window |
| Messages | OK | realtime; presence = blocked GAP |
| Notifications | OK | |
| Support | OK | tickets + FAQ + realtime |
| Library | OK | equipment filter = blocked GAP |
| Calorie | OK | summary macros; VITE flags = blocked GAP |
| Profile + payments | OK | IAP; RC keys = blocked GAP |
| Call | OK | Daily join window |
| Blog (public from panel) | OK | native list/detail |

### Faz B — Staff

| Ekran | Durum | Not |
|-------|-------|-----|
| Clients health | OK | gerçek healthTest + notes |
| Profile | OK | availability RPC persist |
| Payments | OK | Demo badge (LOCK mock); live clients rows |
| Messages (member) | OK | DB threads |
| Admin messages | OK | admin_staff_* |
| Collab messages | OK | staff_collab_* inbox + thread |
| Library / program builder | OK | DEMO_EXERCISES silent fallback kaldırıldı (UI_ONLY hariç) |
| Overview / lists / programs | OK | useData |

### Faz C — Admin

| Ekran | Durum | Not |
|-------|-------|-----|
| Messages | OK | admin↔staff realtime DB |
| Activity / sessions / subscriptions | OK | platform + session summaries |
| Plans | OK | upsertPlan persist |
| Applications | OK | status resolve (approve staff hesap = kısmi) |
| Premium | OK | adminUpdatePremiumMembership persist |
| Content | OK | site_content list (CRUD UI sonraki) |
| AI costs | OK | ai-usage-report API |
| Members / member-health / blog / support | OK | wiring |
| Library | OK | DB list; full CRUD = kısmi |

### Faz D — Auth + Public

| Ekran | Durum | Not |
|-------|-------|-----|
| Login / onboarding / OAuth / reset | OK | smoke; Turnstile production |
| Landing / membership | OK | native |
| Blog | OK | native + **guest hydrate fix** |
| About / team / legal | OK | WebView kasıtlı (LOCK) |
| stories / corporate/* / team/apply | SKIP | dokunulmadı |

## Bu turda kapatılan drift’ler

- Calorie: aktif gün kcal/makro özet kartı (web parity)
- Staff client health / profile / messages / collab DB
- Admin messages / plans / premium / content / AI costs
- Staff payments: canlı danışan satırları + Demo badge
- **Guest public blog posts hydrate + post createdAt**

## Kalan doğrulanmış GAP’ler (blocked — karar / env)

1. **FCM native files:** `google-services.json` / `GoogleService-Info.plist` yok — `SETUP_REQUIRED.md`
2. **Push cihaz smoke:** native preview build + `device_push_tokens` satırı + arka plan banner
3. **App Store / Play ürünleri:** store ürün ID’leri + RevenueCat dashboard eşlemesi
4. **EAS preview build:** `npm run build:preview:ios` / `npm run build:preview:android` (cihaz)
5. **Library equipment filter:** mobil eski spec; web UI yok — otorite: web only (yapılmadı)
6. **Payments history ledger:** RC tam ledger yok

## Sonraki

1. `google-services.json` + `GoogleService-Info.plist` yerleştir
2. EAS preview iOS/Android → cihaz smoke (push + IAP)
3. Store ürünleri + RevenueCat dashboard eşlemesi
