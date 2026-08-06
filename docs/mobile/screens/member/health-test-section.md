# Member — Health Test Section (IMPLEMENTATION LOCK)

- **Expo:** `/(member)/health-test/[sectionId]`
- **Web:** `/health-test/:sectionId` (mode=`remaining`)
- **Priority:** P1
- **Flow:** F04

---

## Purpose

2. aşama — opsiyonel kategori soruları. Core key’ler hariç (`getRemainingSectionQuestions`).

## Gates / redirects → hub

- `sectionId === 'core'` → `/(member)/health-test/core`
- Missing consent / profile / core incomplete
- `fullLock` or awaiting retake

## Flow

- `required: false` — boş bırakılabilir; yarım detail/follow-up engeller
- Resume: `getRemainingSectionResumeState`
- Autosave 700ms
- Finish toast:
  - all detailed → detaylı analiz hazırlanıyor (+ free/eko program sync)
  - section strict complete → tamamlandı
  - else → istediğiniz zaman devam

## Acceptance

- [ ] Core questions not re-asked  
- [ ] Optional free-text keys excluded from count  
- [ ] Lock blocks entry  
