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
- subtitle:
  - needs consent: **Analize başlamadan önce onayları işaretleyin**
  - needs profile: **Boy, kilo ve yaş bilgilerinizi tamamlayın**
  - core incomplete: **1. aşama: Genel Sağlık Testini tamamlayın**
  - unpaid + analiz hazır: **Opsiyonel kategorilerle analizi derinleştirin — uzman raporu paketle açılır**
  - else: **İsterseniz opsiyonel kategorilerle analizi derinleştirin**

## Consent

Props to hub: `healthAck`, `disclaimer`.  
On save: `updateProfile({ healthAck, disclaimer })`  
Toast: **Onaylar kaydedildi. Analize başlayabilirsiniz.**

Consent gate blocks core/optional until saved.

## Profile gate

`HealthProfileGateForm` — birthDate / weight / height (+ gender if missing).  
Hard block until `hasCompleteAnalysisProfile`.

## Hub layout (2 aşama — web parity)

1. **Core incomplete:** “1. Aşama — Genel Sağlık Testi” progress + CTA → `/(member)/health-test/core`
2. **Core complete, no analysis:** “Genel Sağlık Testi tamamlandı” + **Analizi Başlat** → `runSync({ stage: 'core' })`
3. **Analysis ready:** hub’da `HealthScoreCard` + kısa üye özeti (`memberBrief`)
4. **2. Aşama grid:** `getRemainingHubSections` — Başla / Devam et / Tamamlandı / Kilitli
5. **Lock:** 14 gün `fullLock` after `optionalCompletedAt` / detailed stage — sorular kapalı, skorlar görünür
6. **Retake:** `canRetake` → “Testi Yeniden Çöz” → `healthTest: { retakeAt }`
7. **No separate finish screen**

## Scoring

- 8 boyut + `overallScore` + `analysisStage: 'core' | 'detailed'`
- Persist: `member.healthAnalysis` + `member.healthScoreHistory` (max 24)
- Engine: `healthScoreAnalysis.ts` / `useHealthAnalysisSync`
- AI: `POST /api/ai-health-analysis` (+ stage); fallback deterministic

## Data shape (CRITICAL)

`members.data.healthTest` is **flat**. Meta: `optionalCompletedAt`, `retakeAt`.

## Acceptance

- [ ] Consent + profile gate before core  
- [ ] Core-only UI until stage 1 done  
- [ ] Manual **Analizi Başlat** for core scores  
- [ ] Optional grid excludes core keys  
- [ ] Detailed auto-analysis + 14-day lock  
- [ ] Retake resets answers  
