# Yeni Form Mobile — Roadmap (Lumina + full parity)

> Tek yapılacaklar listesi. Her faz bitince checkbox + `FEATURE_PARITY.md` + `AI_MOBILE_PROGRESS.md` güncelle.  
> **Son güncelleme:** 2026-07-14 (Tur N/O/P depth)

---

## Faz 0 — Dokümantasyon

- [x] `docs/FEATURE_PARITY.md` — web × mobil matrix
- [x] `docs/ROADMAP.md` — bu dosya
- [x] `docs/DESIGN_SYSTEM.md` — Lumina token + motion + kit
- [x] `docs/README.md`, `AI_MOBILE_PROGRESS.md`, `CODEMAP.md`, `AGENTS.md` güncelle

**Kabul:** AI handoff yalnız bu dokümanlarla devam edebilir; eksik ekranlar listelenmiş.

---

## Faz 1 — Tasarım sistemi + auth/welcome

| Madde | Dosya / alan | Kabul |
|-------|--------------|--------|
| Lumina tokens | `src/constants/theme.ts` | Teal/champagne/coral; Inter yok |
| Brand config | `src/config/brand.ts` | Marka adı aynı; tema ref Lumina |
| Fonts | `app/_layout.tsx` + `@expo-google-fonts/outfit` + `manrope` | Outfit display, Manrope body |
| UI kit | `src/components/ui/*`, `src/components/motion/*` | Screen, Button, Input, Chip, EmptyState, Skeleton, PressableScale, AppHeader |
| Welcome reskin | `app/index.tsx`, `src/components/welcome/*` | Lumina; davranış aynı |
| Auth reskin | `(auth)/*`, `AuthScaffold` | Login/register/onboarding/forgot/reset görsel yenile; OAuth/session aynı |

- [x] Tema + fontlar
- [x] UI kit
- [x] Welcome
- [x] Auth surfaces

---

## Faz 2 — Üye (member)

| Madde | Rota (Expo) | Web kaynak | Kabul |
|-------|-------------|------------|--------|
| Shell Lumina + More tab | `app/(app)/_layout.tsx` | `memberNav.js` | Floating tab; More’da kalan nav |
| Dashboard reskin | `(app)/index.tsx` | `DashboardPage` | Lumina + live AppContext |
| Programs / detail | mevcut | `ProgramsPage` | Lumina |
| Messages | mevcut | `MessagesPage` | Lumina |
| Profile cluster | `profile/*` | `ProfilePage` | Lumina |
| Randevular | `(app)/schedule.tsx` | `AppointmentsPage` | tab coach/dietitian/doctor |
| Kalori AI | `(app)/calorie.tsx` | `CalorieCalculatorPage` | text (+ foto erişim kuralı web) |
| Sağlık testi | `(app)/health-test/*` | `HealthTest*` | sections + finish |
| Takvim | `(app)/calendar.tsx` | `CalendarPage` | seans görünümü |
| Kütüphane | `(app)/library.tsx` | `ExerciseLibraryPage` | liste + detay |
| Ödeme geçmişi | `profile/payments.tsx` | `PaymentManagementPage` | member audience |
| Video | mevcut call | `VideoCallPage` | browser join korunur |

- [x] Shell + More
- [x] Mevcut ekran reskin (Lumina token’lar)
- [x] schedule, calorie, health-test, calendar, library, payments

---

## Faz 3 — Staff

| Madde | Rota | Kabul |
|-------|------|--------|
| Lumina tabs + role nav | `(staff)/_layout.tsx` | `staffNavForRole` parity |
| Overview / clients / messages / profile reskin | mevcut | Lumina |
| Client health | `clients/[id]/health.tsx` | web health profile |
| Client program | `clients/[id]/program.tsx` | assign/view |
| Programs | `programs.tsx` | coach/doctor |
| Lists | `lists.tsx` | dietitian |
| Library | `library.tsx` | gate + library |
| Payments | `payments.tsx` | staff audience |

- [x] Role-conditional nav (profil kısayolları + library/programs gate)
- [x] Client health/program
- [x] programs / lists / library / payments
- [x] Reskin mevcut (teal tab bar)
- [x] **Tur N depth:** nutrition lists, library exercises, client payments, program assign/note, healthTest answers

---

## Faz 4 — Admin

| Madde | Rota | Kabul |
|-------|------|--------|
| Hub + nav list | `(admin)/_layout` + index | 16 item web sırası erişilebilir |
| Members / messages reskin | mevcut | Lumina |
| plans, premium, applications, library, staff | yeni route’lar | CRUD/liste web parity (mobil UX) |
| blog, content | yeni | CMS liste/düzen |
| payments (+ subscriptions → payments) | yeni | admin audience |
| sessions, support, analytics, activity, account | yeni | liste + temel aksiyon |

- [x] Admin nav hub
- [x] Eksik paneller (liste / EmptyState iskeletleri)
- [x] subscriptions redirect
- [x] **Tur O depth:** `plans`/`blog`/`content`/`applications` services + exercises/support extend; plans/blog/content/library/applications/support/premium/payments/sessions/activity canlı liste + modal CRUD

---

## Faz 5 — Public (in-app)

| Madde | Rota | Kabul |
|-------|------|--------|
| Public group | `app/(public)/` | auth’sız erişim |
| Landing | `index` veya ayrı | marka hero Lumina |
| membership, about, stories | yeni | hydrate plans/stories |
| blog + post | yeni | posts |
| team list + profile | yeni | staff_directory |
| team/corporate apply | yeni | application API |
| legal/:slug | yeni | legal data |

- [x] `(public)` routes
- [x] Tüm public sayfalar
- [x] FEATURE_PARITY public satırları 🟡→rota var (SEO ⏭)
- [x] **Tur P depth:** apply RPC submit, full legal text, membership free/paid CTA

---

## Faz sonrası

- [x] FEATURE_PARITY sayaçları güncel
- [x] AI_MOBILE_PROGRESS Tur J–P notları
- [x] CODEMAP yeni rotalar

### Kalan derinlik (sonraki turlar)

- [x] Üye randevu booking + kalori foto erişim kuralları (**Tur M**)
- [x] Sağlık testi cevaplarının member profiline yazılması (**Tur M**)
- [x] Egzersiz video imzalı URL oynatıcı (**Tur M**)
- [ ] Admin premium atama RPC (`adminUpdatePremiumMembership`) — liste var, RPC derinliği opsiyonel
- [ ] Stripe Customer Portal (web’de yoksa uydurma yok)
- [ ] Stripe Customer Portal
- [ ] Ops: Supabase Redirect URLs + Telegram
