# Yeni Form Mobile — Progress

> **Son güncelleme:** 2026-08-21 — iOS App Store hazırlık (CTA gizle, TestFlight doküman); build yok  
> **Her tur:** [`IMPLEMENTATION-LOCK.md`](./mobile/IMPLEMENTATION-LOCK.md) + [`AI_WORKING_RULES.md`](./AI_WORKING_RULES.md)  
> **Web kaynak:** `projcet/Serenova-F-t` (`src/`)

## 2026-08-21 iOS App Store hazırlık

| Madde | Durum |
|-------|--------|
| `ios-app-store.md` + `ios-asc-forms.md` + dolu `ios-listing.tr.md` | ✅ App Privacy = Play CSV türleri; yaş anketi; tanıtım/copyright |
| iOS 3.1.3(f): web checkout CTA yok; Android CTA durur | ✅ kod |
| Plist: `audio`+`voip`, Bluetooth, tablet false, PHPicker, PrivacyInfo | ✅ |
| Daily plugin `enableScreenShare: false` | ℹ️ plugin yok (Expo 55 peer / 16 KB); plist + mevcut FGS plugin |
| `build:ios:store` / `submit:ios` script | ✅ komut; **onaysız build yok** |
| TestFlight IPA + 6.7" screenshot + ASC uygulama | ⬜ sen |

## 2026-08-21 Play Android 15 + OS bildirim sesi

| Madde | Durum |
|-------|--------|
| `expo-notifications` `BOOT_COMPLETED` / `RECEIVE_BOOT_COMPLETED` strip | ✅ plugin |
| `expo-audio` kaldırıldı (`mediaPlayback` FGS kaynağı) | ✅ |
| Bildirim sesi OS `default` (`yeniform-alerts-v3`); web wav yok | ✅ |
| Daily FGS `camera\|microphone` durur | ✅ dokunulmadı |
| `resizeableActivity=true` | ✅ plugin |
| Edge-to-edge Play tavsiyesi (Expo/AndroidX) | ℹ️ yayın engellemez |
| Onaylı yeni `play-store` AAB | ⬜ sen — `build:play:android` |

## 2026-08-21 Android Play tarama (Expo 56 + Play politika)

| Madde | Durum |
|-------|--------|
| SDK 56 = compile/target **API 36** (Play 31 Ağu 2026) | ✅ varsayılan |
| Daily FGS `camera\|microphone` + TR in-call bildirim | ✅ plugin + `useDailyCall` |
| Webrtc `MediaProjection` / `MEDIA_PROJECTION` AAB’den çıkarıldı | ✅ Play ekran paylaşımı formu olmasın |
| Kullanılmayan `MEDIA_PLAYBACK` FGS kaldırıldı (`expo-audio` yok + expo-video arka plan kapalı) | ✅ |
| Photo Picker; `READ_MEDIA_*` + `AD_ID` blocked | ✅ |
| Bildirim ikonu beyaz + şeffaf | ✅ |
| Listing tıbbi cihaz uyarısı + Health/FGS/UGC form şablonu | ✅ docs |
| Onaylı yeni `play-store` AAB (Daily FGS + Android 15 + OS ses) | ⬜ sen — `build:play:android` |
| Play Internal testers, listing, formlar, App signing SHA | ⬜ sen |

## 2026-08-20 Play test yolu

| Madde | Durum |
|-------|--------|
| Sideload preview APK durduruldu; test = `play-store` AAB + Internal opt-in | ✅ kural + README + P6 |
| Onaysız / otomatik `eas build` yok | ✅ |
| Screenshot 1080×2160 + feature graphic + 512 ikon | ✅ `assets/store/` |
| Hesap silme URL canlı | ✅ `https://www.yeniform.com/hesap-silme` |
| FCM istemci dosyaları yerelde | ✅ gitignore |
| Expo FCM V1 + Firebase EAS SHA | ✅ V1 Expo’da; EAS SHA Firebase’de (Play App Signing SHA ⬜ ilk AAB sonrası) |
| Onaylı `build:play:android` → Play Internal/Closed | 🔄 [bf63eb60](https://expo.dev/accounts/yeniforms-team/projects/yeniform/builds/bf63eb60-1a06-4c46-95cc-fcf79fe93802) `1.0.1` / versionCode **6** (FGS camera+mic). Android 15 + OS ses + `expo-audio` yok = **yeni AAB** (versionCode 7+) |

## 2026-08-20 Hesap silme — mobil çıkış

| Madde | Durum |
|-------|--------|
| Web `/hesap-silme` hesabı siliyordu; mobil JWT + önbellek paneli açık tutuyordu | ✅ ön plan `members` missing → yerel signOut + landing |
| Timeout/ağ ile boş satır karışmasın (ödeme kartı stale kalsın) | ✅ `probeMemberRow` ok / missing / unavailable |
| Cold boot: JWT var, GoTrue user yok → hydrate null | ✅ `getUser(access_token)` (refresh yok) |

## 2026-08-20 Üyelik iptali

| Madde | Durum |
|-------|--------|
| Stripe paket stacking (`stripeSubscriptionId`); webhook yalnız o sub’u expire eder | ✅ |
| Portal: manage / dönem sonu / hemen (`proration none`); resume API | ✅ |
| Web + mobil Ödeme Yönetimi uyarı modalı; dashboard yenileme-kapalı banner | ✅ |
| Doktor: mailto `info@yeniform.com`; admin Dondur/İptal kaldırıldı | ✅ |
| Legal iptal/iade + sözleşme § (web) | ✅ |
| Stripe Dashboard: `customer.subscription.updated` event (Live+Test) | ⬜ ops |
| `paused`/`cancelled` satır | ✅ DB’de 0; SQL no-op |
| İki abonelik QA (biri kapanır, diğeri çekilir) | ⬜ |

## 2026-08-20 Doktor randevu kilidi

| Madde | Durum |
|-------|--------|
| `scheduled` doktor seansı paketi `consumed` yapmıyordu (web: yalnız completed/no_show) | ✅ |
| `packageIncludesDoctor` remaining kota ile kilitleniyordu | ✅ |
| Randevu listesi: seans varken kilit yok; katıl görünür | ✅ |

## 2026-08-20 Play Store UI / bildirim

| Madde | Durum |
|-------|--------|
| Giriş/kayıt yasal belgeler → `yeniform.com/legal/...` | ✅ |
| Habit: 09:00 günün ipucu, 14:00 su, 20:00 motivasyon | ✅ |
| Sağlık analizi soru kartı boşlukları | ✅ |
| Randevu / program filtre butonları (az rounded) | ✅ |
| Listing gizlilik/sözleşme kanonik `/legal/` | ✅ |
| Hesap silme sayfası (Play Submit öncesi) | ✅ web `/hesap-silme` + mobil profil handoff |
| Kullanıcı: Play app, testers, FCM V1, SHA, Internal AAB | ⬜ |

## 2026-08-19 Android Play Store hazırlık

| Madde | Durum |
|-------|--------|
| `eas.json` `play-store` AAB (`app-bundle`, preview env) | ✅ |
| `preview-store` APK tuzağı kapatıldı | ✅ |
| `AD_ID` blocked; Android 13+ Photo Picker | ✅ |
| Listing + feature graphic 1024×500 + form şablonu | ✅ |
| Kullanıcı: Play app, testers, SHA, screenshot, hesap silme URL, EAS build, Submit | ⬜ |

## 2026-08-17 Ürün kararları + tarama

| Madde | Durum |
|-------|--------|
| Ölü kod: HealthRadarScores, aiAnalysis, phone.ts, TurnstileWidget, qa-smoke.sh | ✅ silindi |
| Admin paneli `app/(admin)` | ✅ kaldırıldı; `/(auth)/admin-web` |
| SKIP public: stories / corporate / team-apply | ✅ rota yok |
| Kayıt: tek adım ücretsiz; Stepper/SocialAuthButtons | ✅ silindi |
| LOCK / COMPLETE / nav / inventory / QA drift | ✅ MOBILE DIFF |
| IAP/RevenueCat doc artıkları | ✅ web Stripe |
| FCM `google-services.json` / iOS plist | ✅ yerelde `com.yeniform.app`; gitignore; canlı push = EAS rebuild |
| `eko_diyet` / `eko_spor` kapı | ✅ `isPaidMembership` + DB `plans` katalog + kota/kalori web parity |

## 2026-08-16 Standalone preview (expo start yok)

| Madde | Durum |
|-------|--------|
| Preview = JS gömülü APK (`developmentClient: false`) | ✅ |
| `app.config.js` variant: Dev `.dev` / Preview `com.yeniform.app` | ✅ |
| `eas.json` preview `autoIncrement` + `buildType: apk` | ✅ |
| `google-services.json` yoksa FCM atlanır (build kırılmaz) | ✅ |
| Panel auth gate + ErrorBoundary | ✅ |
| Telefonda eski Yeni Form silinmeden imza çakışması | runbook README |

## 2026-08-15 Android preview hazırlık

| Madde | Durum |
|-------|--------|
| `google-services.json` (`com.yeniform.app`) yerelde; gitignore | ✅ |
| `app.json` `android.googleServicesFile` + `.easignore` upload | ✅ |
| `npx expo install --fix` + `expo-asset` | ✅ |
| `pickLabFile` + `memberRowRefresh` tsc | ✅ |
| EAS `build:preview:android` APK | ✅ [21be2b73](https://expo.dev/accounts/yeniform/projects/yeniform/builds/21be2b73-8a77-4516-9c06-e0345cb29797) |

## 2026-08-15 Preview “Oturum açılamadı”

| Madde | Durum |
|-------|--------|
| API 200 + token sonrası hata = `setSession`/hydrate (şifre değil) | ✅ |
| RN `signOut({ scope:'local' })` AsyncStorage yazımı yeni JWT’yi siliyor | ✅ kaldırıldı; `stopAutoRefresh` + setSession retry |
| Hydrate `setSession` session override; satır hatası login’i düşürmez | ✅ |
| `react-native-get-random-values` + `url-polyfill` boot | ✅ |

## 2026-08-15 Mobil giriş hâlâ düşüyor (doğrulama)

| Madde | Durum |
|-------|--------|
| Prod `/api/auth` 11:24 200 sonra oturum düşmesi — claim `refresh_token` rotation | ✅ web `ed22848f` production |
| Expo web `localhost:8081` CORS: OPTIONS var, POST yok → ağ hatası | 🔄 `_guards.js` (web deploy gerekir) |
| Login `signOut` → `SIGNED_OUT` hydrate yeni oturumu siliyor | ✅ AuthContext login lock |

## 2026-08-15 Giriş yapılamıyor (ödeme yönlendirmesi + tek-oturum)

| Madde | Durum |
|-------|--------|
| Kök neden: login claim fire-and-forget `refresh_token` grant istemci token’ını yakıyordu | ✅ |
| Ödeme CTA `refreshSession` geçersiz token’da SIGNED_OUT üretiyordu — kaldırıldı | ✅ |
| Web handoff: claim/auto-refresh skip; hash JWT stale session’dan önce | ✅ |
| Mobil login: local signOut + auth event race guard + try/catch | ✅ |

## 2026-08-15 Mobil → web login’li `/plans` paket akışı

| Madde | Durum |
|-------|--------|
| CTA: `/membership` yerine `/auth/callback?next=/plans&src=mobile` + hash JWT | ✅ |
| Web AuthCallback `next=/plans` allowlist; handoff’ta claim/refresh skip | ✅ |
| Hata: throw yok, oturum silinmez; token’sız `/plans` fallback | ✅ |
| App resume: yalnız `members` satırı (`applyRemoteMember`) | ✅ |
| LOCK / F15 / payments.md / copy / skills | ✅ |

## 2026-08-13 Üye mesajlaşma — atama kalkınca ghost “Koçunuz/Diyetisyeniniz”

| Madde | Durum |
|-------|--------|
| Web `getMemberChatContacts`: personel kadroda yoksa contact yok (`if (coach)`) | ✅ |
| Mobil fallback satır (“Koçunuz”) kaldırıldı | ✅ |
| `ensureMemberChatThreads` yalnız güncel contact rolleri döner | ✅ |
| Thread ekranı `activeContact` yoksa eski thread açılmaz | ✅ |
| Unread badge yalnız atanmış roller | ✅ |

## 2026-08-10 Performans derin mimari (üye + personel)

| Madde | Durum |
|-------|--------|
| `perfCounters` + realtime/chat/hydrate sayaçları | ✅ |
| Chat ≠ full `refreshData` (`onChatChange` + `ChatUnreadContext`) | ✅ |
| Realtime callback refs (channel churn yok) | ✅ |
| Badge unread summary (mesaj body yok) | ✅ |
| 8s chat polling kaldırıldı | ✅ |
| Boot çift `refreshAuth` kesildi | ✅ |
| Staff-scoped hydrate (assigned_* members + scoped programs) | ✅ |
| Staff tickets/activities/payments/posts hydrate atlandı | ✅ |
| Collab ensure parallel (N+1 yok) | ✅ |
| Staff members + staff-row realtime | ✅ |
| Member focus full refresh kaldırıldı (calendar/programs) | ✅ |
| `persistPatch` skipRemoteRead + health-test/toggle hafif yazma | ✅ |
| Calendar `dayMetaByDate` memo | ✅ |
| FlatList: üye programs, staff clients/messages/programs/lists | ✅ |
| Chat history pagination (`CHAT_MESSAGE_PAGE_SIZE`) | ✅ |
| StaffVideoPanel `now` tick; health-test initial deps; mark-read skip | ✅ |

## 2026-08-10 Staff panel web parity (RN uyarlama)

| Madde | Durum |
|-------|--------|
| Nav: Bildirimler + doctor collab; doctor Programlar kapalı | ✅ |
| Overview: KPI + StaffVideoPanel + join/toast/CTA | ✅ |
| Clients: Bilgiler sheet + role CTA (list route) | ✅ |
| Client health: StaffHealthBrief + yeniden analiz | ✅ |
| Profile: 3 tab (profil / çalışma / güvenlik) | ✅ |
| Messages: search + presence + ChatCollapsiblePrograms + doctor collab | ✅ |
| Notifications: LOCK + route + `staff_set_notifications` | ✅ |
| Payments: `staff_earnings` KPI + dönem geçmişi | ✅ |
| Coach builder: dayCarts wizard + SendModal + `createProgram`/`updateProgram` | ✅ |
| Dietitian: `clients/[id]/list` NutritionProgramBuilder + lists expand/edit | ✅ |
| Library: ExerciseDetailModal + VideoPlayer + category/pagination | ✅ |
| F10 force-password gate (`tempPasswordIssued`) | ✅ |

## 2026-08-09 Mobil giriş Turnstile bypass

| Madde | Durum |
|-------|--------|
| Kök neden: Aug 6 `YENIFORM_MOBILE_API_SECRET` + `x-yeniform-mobile-key` zorunlu; mobil header göndermiyordu; Vercel’de secret yoktu | ✅ bulundu |
| `postJson` / `getApiAuthHeaders` → `x-yeniform-mobile-key` | ✅ |
| Vercel `YENIFORM_MOBILE_API_SECRET` (prod+preview) + mobil `.env` | ✅ |
| Contract `api-auth.md` / `env-vars.md` güncellendi | ✅ |

## 2026-08-08 Randevu iptal / yeniden planla (24s + onay)

| Madde | Durum |
|-------|--------|
| `cancel_pending` / `admin_cancel_pending` + `staff_booked_slots` | ✅ |
| API: request/respond cancel, respond-admin-cancel, reschedule-session | ✅ |
| Web üye: booker Anladım + iptal talebi / &lt;24s gizleme | ✅ |
| Web personel iptal kuyruğu + personel iptali; admin kuyruk (yalnız web) | ✅ |
| Mobil üye schedule / SessionBooker / ActionsContext | ✅ |
| Mobil staff overview: gerçek seanslar + book/cancel pending | ✅ |
| LOCK / contracts / copy | ✅ |

## 2026-08-08 RevenueCat / IAP iptal

| Madde | Durum |
|-------|--------|
| Web `api/revenuecat-webhook.js` silindi → Vercel Hobby **12/12** | ✅ |
| Stripe `ACTIVE_MOBILE_SUBSCRIPTION` guard kaldırıldı | ✅ |
| Mobil SDK/deps (`react-native-purchases*`, `iap.ts`, Paywall, CustomerCenter) | ✅ |
| `profile/payments` → Supabase status + login’li web `/plans` CTA | ✅ |
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
| Staff library player | ✅ (2026-08-10) |
| Admin player | ⏸ ayrı sprint |
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
| FCM `app.json` (`android.googleServicesFile` + `expo-notifications` plugin) | ✅ Android + iOS dosyalar yerelde; `app.config.js` `googleServicesFile` |
| RevenueCat test key + Paywall / CustomerCenter | ⛔ IAP kaldırıldı (2026-08-08) |
| `shadow*` → `boxShadow` + `pointerEvents` style migrasyonu | ✅ |
| Library virtualization + admin members pagination | ✅ |
| Admin messages audit sekmeleri, applications staff create, content/blog/library CRUD | ✅ |
| Push permission prompt + camera/mic gate (video call) | ✅ |
| `npx tsc --noEmit` | ✅ 0 hata |
| `npx expo export --platform web` | ✅ bundle |
| EAS `whoami` | ✅ `yeniform` (Owner) + org `yeniforms-team` |
| EAS profiles (`development`, `preview`, `production`) + `projectId` | ✅ |

**Kalan USER blockers:**
1. ~~Android `google-services.json`~~ — yerelde var (`com.yeniform.app`); git’e girmez
2. ~~iOS `GoogleService-Info.plist`~~ — yerelde var (`com.yeniform.app`); git’e girmez
3. Cihazda EAS preview rebuild: `build:preview:android` / iOS: önce `eas device:create`

## Store yolu (üye)

| Faz | Durum | Gate doc |
|-----|-------|----------|
| P0 Hesaplar | 🔑 test key eklendi | `store/P0-handoff-checklist.md` |
| P1 Auth | ✅ kod | — |
| P2 IAP | ⛔ iptal — web membership CTA | `store/P2-live-gate.md` |
| P3 Push | ✅ kod + Android FCM dosyası; cihaz smoke | `store/P3-push-test-gate.md` |
| P4 Splash/EAS | ✅ projectId; Android preview APK bu tur | `store/P4-splash-eas-gate.md` |
| P5 Parity | ✅ messages presence/programs | `store/P5-parity-gate.md` |
| P6 Store | ✅ listing şablon | `store/P6-store-gate.md` |

EAS `projectId`: `460ad8b4-c94a-4933-885c-be703befe489` (owner: yeniforms-team; 2026-08-19 Android kota için kişisel `yeniform` hesabından bağlandı)

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

**Chat:** Admin messages audit native kaldırıldı (admin web-only, 2026-08-17). Staff ↔ admin mesajlar personel panelinde duruyor.

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
| Overview | OK | KPI + StaffVideoPanel + queues (2026-08-10) |
| Clients + Bilgiler | OK | sheet + role CTA |
| Clients health | OK | brief + yeniden analiz + notes |
| Profile | OK | 3 tab full editor |
| Notifications | OK | staff.data.notifications |
| Messages (member) | OK | search + presence + programs panel |
| Admin messages | OK | admin_staff_* |
| Collab messages | OK | coach/dietitian/doctor |
| Payments | OK | staff_earnings live |
| Programs / coach builder | OK | createProgram + SendModal |
| Lists / nutrition builder | OK | clients/[id]/list |
| Library | OK | VideoPlayer + filters |
| Video call | OK | join entry + call shell |
| F10 force password | OK | layout overlay |

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
| stories / corporate/* / team/apply | SKIP | **rota yok** (2026-08-17) |

## Bu turda kapatılan drift’ler

- Calorie: aktif gün kcal/makro özet kartı (web parity)
- Staff client health / profile / messages / collab DB
- Admin messages / plans / premium / content / AI costs
- Staff payments: canlı danışan satırları + Demo badge
- **Guest public blog posts hydrate + post createdAt**

## Kalan doğrulanmış GAP’ler (blocked — karar / env)

1. **FCM dosyaları:** `google-services.json` + `GoogleService-Info.plist` yerelde (`com.yeniform.app`); git’e girmez. `app.config.js` + `.easignore` EAS upload bağlı. Canlı push = onaylı preview rebuild.
2. **Push cihaz smoke:** yeni preview binary + `device_push_tokens`
3. **EAS preview iOS:** ad hoc — önce `eas device:create`, sonra onaylı `npm run build:preview:ios`. Runbook: [`mobile/store/ios-preview-build.md`](./mobile/store/ios-preview-build.md)
4. **Public `+not-found`:** inventory’de var, rota yok
5. **Payments history ledger:** Stripe ledger UI yok (status `members` paketleri)

## Sonraki

1. Android preview APK rebuild + üye login push smoke
2. iOS: `eas device:create` sonra `build:preview:ios`
3. Ödeme: native IAP yok — web `/plans` CTA
