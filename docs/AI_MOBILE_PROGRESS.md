# Yeni Form Mobile — Progress

> **Son güncelleme:** 2026-08-06 — Member store P3–P6 kod iskeleti + messages presence/program panel  
> **Her tur:** [`IMPLEMENTATION-LOCK.md`](./mobile/IMPLEMENTATION-LOCK.md) + [`AI_WORKING_RULES.md`](./AI_WORKING_RULES.md)  
> **Web kaynak (zorunlu):** `/Users/mac/Desktop/Serenova-F-t/Adsız` (`donusum-programi`)

## Store yolu (üye)

| Faz | Durum | Gate doc |
|-----|-------|----------|
| P0 Hesaplar | ⬜ sen (RC keys) | `store/P0-handoff-checklist.md` |
| P1 Auth | ✅ kod | — |
| P2 IAP | ✅ iskelet (keys boş) | `store/P2-live-gate.md` |
| P3 Push | ✅ + yerel banner | `store/P3-push-test-gate.md` |
| P4 Splash/EAS | ✅ projectId bağlı | `store/P4-splash-eas-gate.md` |
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
| **Native SDK** | RevenueCat, Daily RN, expo-notifications, expo-av, camera | ✅ |
| **Nav chrome** | PanelTopBar + PanelDrawer (3 rol) | ✅ |
| **Staff/Admin DB** | platformDb + gerçek sohbet / premium / plans | ✅ |
| **Public** | Landing/membership/blog native; about/team/legal WebView; SKIP stubs | ✅ |
| **Web parity taraması** | Faz A–D checklist | ✅ 2026-07-26 |
| **Smoke re-scan** | tsc + 77 app import resolve + `expo export --platform web` + Supabase tablo/count | ✅ 2026-07-26 |
| RevenueCat keys | iOS/Android public SDK | ⬜ GAP (env boş) |
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

1. **RevenueCat keys:** `EXPO_PUBLIC_REVENUECAT_API_KEY_IOS` / `_ANDROID` boş — sandbox IAP
2. **Push cihaz smoke:** native build + `device_push_tokens` satırı + arka plan banner
3. **Library equipment filter:** mobil eski spec; web UI yok — otorite: web only (yapılmadı)
4. **Payments history ledger:** RC tam ledger yok
5. **EAS preview build:** credentials ile `npm run build:preview:*` (sen)
7. **Admin applications approve:** status güncellenir; web’deki tam `addStaff` + temp password yolu mobil kısmi
8. **Admin premium Eko AI sync:** paket persist OK; AppContext Eko program tetikleme mobil GAP
9. **Admin content CRUD / library CRUD:** list OK; create/update/delete UI sonraki

## Sonraki

1. Kontrat GAP’leri kullanıcı kararıyla kapat
2. RevenueCat anahtarları + cihaz IAP smoke
3. Admin content/library full CRUD (web parity)
4. Applications approve → staff hesap oluşturma (web `addStaff`)
