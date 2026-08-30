# Member — Dashboard (IMPLEMENTATION LOCK)

- **Expo:** `/(member)/dashboard`
- **Web:** `/dashboard` → `DashboardPage.jsx`
- **Priority:** P0

Bölüm sırası ve metinler web ile kilitli. Yeni KPI kartı / farklı slogan ekleme.

**Su takibi (2026-08-25 lock istisnası):** Grafik grid’in **ilk hücresi** kristal karaf (`WaterCarafeCard` full) — StatsCard 4/5’e eklenmez. Domain: [`water-tracking.md`](../../domains/water-tracking.md). Bardak sayacı yok.

---

## Early exit

`isFreeTrialExpired === true` → yalnızca `<FreeTrialExpiredGate />` (web bileşen davranışı). Dashboard içeriği **yok**.

## Data dependencies

`user`, `membership`, `membershipStatus`, `coachSessions`, `dietitianSessions`, `myPrograms`, `progress`, `premiumExpiresAt`, `premiumStartedAt`, `freeTrialExpiresAt`, `isFreeTrialExpired`, `posts`, `useDailyTip()`, `buildWeeklyAdherence(myPrograms, user.completedActivities, user)`.

`nextCoach` / `nextDietitian`: `status === 'scheduled' && date > now` first match.

`latestPosts`: published, sort createdAt desc, slice 0..3.

## Layout order (zorunlu)

0. **ActivationChecklist** (web `ActivationChecklist.jsx`) — kapatılmadıysa ve adımlar bitmediyse, welcome’dan önce. Ücretsizde `myPrograms=[]`. MOBILE DIFF: paket CTA `/(member)/profile/payments` (**Android**). **iOS:** “Paket seç” adımı yok.

**iOS MOBILE DIFF (2026-08-24):** Günün ipucu kartı sayfanın en üstünde (checklist’ten önce). Panel chrome zaten safe area verdiği için `paddingTop` ekstra inset almaz; kartlar arası `gap: spacing.lg`.

1. **Welcome banner**
   - Date: `format(today, 'd MMMM yyyy, EEEE', { locale: tr })`
   - H1: `{firstName}, bugün güzel bir gün` (`resolveFirstName`)
   - Sub: `Küçük adımlar, büyük değişim.`
   - CTA: **Bugünkü Programım** → `/calendar`
   - CTA: **Kişisel Sağlık Analizi** → `/health-test`
   - Photo: `PANEL_IMAGES.dashboardHero` (veya mobilde eşdeğer asset)

2. **YeniForm Sağlık Skoru** — `HealthScoreCard` + `useHealthAnalysisSync`
   - Incomplete: “Kişisel sağlık analizinizi tamamlayın” + **Analize git**
   - Complete: overall /100, 8 boyut mini-kartları, AI `summary`, opsiyonel skor trendi (`healthScoreHistory`)
   - `scoresOnly={isUnpaidMember}` — ücretsizde özet metin yok
   - StatsCard setine eklenmez; welcome ile günün ipucu arasında ayrı blok

3. **Günün ipucu**
   - Fetch bitene kadar kart **render edilmez**
   - Label: `Günün ipucu`
   - Body: `dailyTip`

4. **Deneme banner** — only `membership==='free' && freeTrialExpiresAt && !isFreeTrialExpired`
   - `Deneme süreniz: {hLeft} saat kaldı.`
   - Button: **Üye Ol** → membership

4b. **Yenileme kapalı banner** — `listCancelAtPeriodEndPackages(member).length > 0`
   - Title: `Yenileme kapalı`
   - Sub: `MEMBERSHIP_CANCEL_COPY.renewalOffBanner(date, planLabel)` (paketler boşlukla birleşir)
   - CTA: **Ödeme Yönetimi** → `/(member)/profile/payments` (**yalnız Android**). **iOS:** banner metni; CTA yok.

5. **Expiring banner** — `showExpiringBanner` (paid && (status expiring OR remainingDays 1..7))
   - Title: `Paket süreniz bitmek üzere` + optional `— {n} gün kaldı`
   - Sub (Android): `Kesintisiz devam için planınızı yenileyin. Son gün dahil erişiminiz sürer.`
   - Sub (iOS): `Son gün dahil erişiminiz sürer.`
   - CTA: **Yenile** → ödemeler (**yalnız Android**). **iOS:** CTA yok.

6. **Paid expired banner** — free && premiumStartedAt && !freeTrialExpiresAt && !isFreeTrialExpired
   - `Paket süreniz doldu`
   - `Ücretli özellikler kapandı. Devam etmek için bir plan seçip yenileyin.`
   - **Planı Yenile** (**Android** → ödemeler/checkout). **iOS:** buton yok.

7. **Upsell** — free && !showPaidExpiredBanner — **Android** `Planları İncele`. **iOS:** banner metni kalabilir; satın alma butonu yok.

8. MembershipBadge + link **Destek Alanı** → `/support`

9. **StatsCard** (4, doktor paketinde 5)
   - Aktif Plan → planLabel; sub free:`Sağlık testi` else `Koç & Diyetisyen destekli`; tap Android ödemeler / iOS profil
   - Sonraki Koç → date `d MMM` or `—`; sub title or `Planlanmadı`; tap `schedule?tab=coach`
   - Sonraki Diyetisyen → same; tap `schedule?tab=dietitian`
   - Sonraki Doktor — `showDoctorStat` (`packageIncludesDoctor` veya doctorSessionsTotal>0 veya `assignedDoctorId`)
   - Seri → `{user.streak ?? 0} gün` / `Kesintisiz gün`

10. Charts grid
   - **Su takibi** — kristal karaf (`WaterCarafeCard` full), web `DashboardPage` grid ilk hücre. Domain `water-tracking.md`.
   - Kilo Trendi — empty: `Kilo kayıtlarınız burada görünecek`
   - Antrenman Takibi — empty: `Antrenman verileriniz burada görünecek`
   - Öğün Takibi — empty: `Diyetisyen listeniz eklendikçe öğün verileri burada görünür`

11. Quick links (web’deki kalan Link grid — calendar, programs, library, messages, …) — **DashboardPage.jsx satır 252+ listesini birebir taşı**; yeni kısayol ekleme.

12. Latest blog cards (3) if any — paths via `blogPostPath`

13. Success story submit entry if web shows modal trigger — parity

## Side effects

`useStripePaymentReturn(refresh)` — mobile: IAP/deep link return refresh eşdeğeri.
`useHealthAnalysisSync` — test tamamsa `healthAnalysis` / `healthScoreHistory` üretir.

## Acceptance

- [ ] FreeTrialExpiredGate short-circuit  
- [ ] Banner koşulları birebir (deneme, yenileme kapalı, expiring, expired, upsell)  
- [ ] String’ler birebir  
- [ ] StatsCard 4 veya doktor kartıyla 5; HealthScoreCard ayrı blok
- [ ] ActivationChecklist + scoresOnly unpaid  
- [ ] HealthScoreCard welcome → tip arasında  
- [ ] firstName resolver parity  
- [ ] Su karafı grid ilk hücre; bardak sayacı yok
