# Member — Health Test Core (IMPLEMENTATION LOCK)

- **Expo:** `/(member)/health-test/core`
- **Web:** `/health-test/core`
- **Priority:** P1
- **Flow:** F04

---

## Purpose

1. aşama — **Genel Sağlık Testi**: 25 (erkek) / 26 (kadın) sabit soru, kategori UI yok.

## Gates / redirects → hub

- Missing consent or profile
- `fullLock` or awaiting retake (`canRetake` + core hâlâ dolu). Retake sonrası (`retakeAt`, cevaplar silinmiş) **redirect yok** — leftover `analysisStage: 'detailed'` tek başına kilit sayılmaz. [health-test-retake-lock.md](../../domains/health-test-retake-lock.md)
- Core already complete (`isCoreHealthTestComplete`)

## Flow

- Questions from `getCoreHealthTestQuestions(gender)` (`src/data/coreHealthTest.ts`)
- All treated as required in this flow
- Autosave 700ms → `updateHealthTestPartial`
- Resume: `getCoreHealthTestResumeIndex` — kaldığı yerden devam
- Şık işaretlemek ilerletmez; yalnız **İleri** / **Testi Bitir**
- Finish → hub; toast: **Genel Sağlık Testi tamamlandı. Analizi başlatmak için butona tıklayın.**

## Acceptance

- [ ] 25/26 questions by gender  
- [ ] Cannot re-enter when complete (until retake)  
- [ ] Lock redirects to hub  
