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
2. **Core complete:** banner **İlk aşama tamamlandı** (2. aşama bitince **Genel Sağlık Testi tamamlandı**). Analysis yoksa **Analizi Başlat** → `runSync({ stage: 'core' })`. Eksik kategori varsa **Kalan kategorilere git** → listedeki ilk `!progress.complete` kart. Kaydırma butonu 2. aşama bitince / kilitte / retake’te gizlenir.
3. **Analysis ready:** hub’da `HealthScoreCard` + kısa üye özeti (`memberBrief`)
4. **2. Aşama grid:** `getRemainingHubSections` — Başla / Devam et / Tamamlandı / Kilitli
5. **Lock:** 14 gün `fullLock` after `optionalCompletedAt` / detailed stage — sorular kapalı, skorlar görünür. `retakeAt` kilit başlangıcından sonraysa kilit **yok** (eski `analysisStage: 'detailed'` kalsa bile). Spec: [health-test-retake-lock.md](../../domains/health-test-retake-lock.md)
6. **Retake:** `canRetake` → “Testi Yeniden Çöz” → `healthTest: { retakeAt }` **+** `healthAnalysis.analysisStage = 'core'` (skorlar durur)
7. **No separate finish screen**

## MOBILE DIFF (2026-08-21) iOS

Ücretsiz + analiz hazır: **Plan seç ve uzman raporunu aç** pressable **yok** (3.1.3(f)). Metin: C-copy `Health unpaid pitch` iOS satırı. Android’de pressable durur.

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
- [ ] Retake resets answers + `analysisStage: 'core'`; core route opens after retake
