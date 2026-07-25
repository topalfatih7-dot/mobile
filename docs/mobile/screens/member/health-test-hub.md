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

- title: **Sağlık Testleri**
- subtitle if needs consent (`!healthAck || !disclaimer`):  
  **Testlere başlamadan önce onayları işaretleyin**  
- else:  
  **Her kategoriyi ayrı ayrı tamamlayın — istediğiniz sırayla ilerleyebilirsiniz**

## Consent

Props to hub: `healthAck`, `disclaimer`.  
On save: `updateProfile({ healthAck, disclaimer })`  
Toast: **Onaylar kaydedildi. Testlere başlayabilirsiniz.**

Consent gate blocks section cards until saved (web shows consent form only until both checked).

## Hub layout (web parity)

1. `HealthTestProfilePrepBanner` — missing birthDate/weight/height/gender → profile
2. Overall progress card: `{completed} / {total} test` + `{percent}%` bar (`getOverallHealthTestProgress`)
3. When fully complete (+ consent): done banner + **`HealthRadarScores`** (`calculateRadarScores` or `user.healthAnalysis.radarScores`)
4. Section cards from `getHealthTestHubSections(gender, packageConfig, healthTest)`:
   - audience chip (Genel / Hareket / Beslenme)
   - status: Başla / Devam et / Tamamlandı
   - `{requiredAnswered} / {requiredTotal} soru` + percent bar
5. **No separate finish screen** — radar lives on hub

## Data shape (CRITICAL)

`members.data.healthTest` is **flat** — all question keys at top level (`wellbeing`, `injuries`, …).  
Do **not** nest under section id.

## Acceptance

- [ ] Consent gate before tests  
- [ ] Subtitles exact  
- [ ] Sections respect gender only (not package)  
- [ ] Flat healthTest readable from web-written records  
- [ ] Radar scores when fully complete  
