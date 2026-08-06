# Member — Health Test Hub (IMPLEMENTATION LOCK)

- **Expo:** `/(member)/health-test`
- **Web:** `/health-test` → `HealthTestPage.jsx` + `HealthTestHub`
- **Priority:** P1
- **Flow:** F04
- **Catalog:** `domains/health-test-catalog.md`

---

## Early exits

- No user → login  
- `isFreeTrialExpired` → `FreeTrialExpiredGate` only  

## Header

- title: **Kişisel Sağlık Analizi**
- subtitle if needs consent (`!healthAck || !disclaimer`):  
  **Analize başlamadan önce onayları işaretleyin**  
- else:  
  **Her kategoriyi ayrı ayrı tamamlayın — istediğiniz sırayla ilerleyebilirsiniz**

## Consent

Props to hub: `healthAck`, `disclaimer`.  
On save: `updateProfile({ healthAck, disclaimer })`  
Toast: **Onaylar kaydedildi. Analize başlayabilirsiniz.**

Consent gate blocks section cards until saved (web shows consent form only until both checked).

## Hub layout (web parity)

1. `HealthTestProfilePrepBanner` — missing birthDate/weight/height/gender → profile
2. Overall progress card: `{completed} / {total} kategori` + `{percent}%` bar (`getOverallHealthTestProgress`)
3. When fully complete (+ consent): done banner only  
   - Title: **Kişisel sağlık analizi kaydedildi**  
   - Sub: **Cevaplarınız profilinizde saklanır; panelde YeniForm Sağlık Skoru güncellenir. İstediğiniz kategoriyi tekrar açıp güncelleyebilirsiniz.**  
   - Skor gösterimi hub’da **yok** — panel `HealthScoreCard` (`useHealthAnalysisSync`)
4. Section cards from `getHealthTestHubSections(gender, packageConfig, healthTest)`:
   - audience chip (Genel / Hareket / Beslenme)
   - status: Başla / Devam et / Tamamlandı
   - `{requiredAnswered} / {requiredTotal} soru` + percent bar
5. **No separate finish screen** — finish route redirects to hub

## Scoring (web parity)

- 8 boyut: `general, nutrition, movement, sleep, stress, lifestyle, motivation, readiness` + `overallScore`
- Persist: `member.healthAnalysis` + `member.healthScoreHistory` (max 24)
- Engine: `healthScoreAnalysis.ts` / `useHealthAnalysisSync` — AI `task: health-score`, fallback deterministic
- Eski `radarScores` / `HealthRadarScores` **kullanılmaz**

## Data shape (CRITICAL)

`members.data.healthTest` is **flat** — all question keys at top level (`wellbeing`, `injuries`, …).  
Do **not** nest under section id.

## Acceptance

- [ ] Consent gate before tests  
- [ ] Subtitles exact  
- [ ] Sections respect gender only (not package)  
- [ ] Flat healthTest readable from web-written records  
- [ ] Done banner when fully complete; scores on dashboard card  
