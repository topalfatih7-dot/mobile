# Domain — Health Test Catalog

Self-contained question list extracted for mobile handoff.

**Source of truth (code):**  
- [`src/data/coreHealthTest.ts`](../../../src/data/coreHealthTest.ts) — 1. aşama (25/26)  
- [`src/data/healthTestSections.ts`](../../../src/data/healthTestSections.ts)  
- [`src/data/healthTestDietitianSections.ts`](../../../src/data/healthTestDietitianSections.ts)  
- Engine: [`src/data/healthTest.ts`](../../../src/data/healthTest.ts) — **flat** `members.data.healthTest` (+ `optionalCompletedAt` / `retakeAt`)

**Full option tables (LOCK):** [health-test-options.md](health-test-options.md) — do not invent values/labels. Prefer reading the TS source files above for `detail` / `followUps` / `softWarning` / `exclusive`.

**Question types:** `emoji | single | multi | text | time | scale | file`

**Engine extras:** `detail`, `followUps[]` (conditional), `softWarning`, `footerNote`, `infoNote` / `infoNoteWhen`, exclusive multi options (`exclusive: true`).

**Scores (YeniForm Sağlık Skoru — 2 aşama):** Core complete → manuel Analizi Başlat (`analysisStage: 'core'`). Tüm opsiyonel tamam → otomatik detailed + `optionalCompletedAt` + 14 gün kilit. Hub + panel `HealthScoreCard`. Engine: `src/services/healthScoreAnalysis.ts`. AI: `POST /api/ai-health-analysis`; fallback deterministic.

**Lab uploads:** Private bucket `health-lab-results`, path `{userId}/{ts}-{rand}.{ext}`, via `uploadHealthLabResult`.

**Sections (6 + cinsiyet):** `general` (Genel Sağlık), `medical` (Tıbbi Geçmiş), `nutrition` (Beslenme Profili), `physical` (Hareket Profili), `lifestyle` (Günlük Yaşam), plus `women` / `men` (Size Özel Sorular, gender-only). No package gating. Legacy `diet_*` sections removed — replaced by single `nutrition`.

## Notes

- Full option lists live in the TS ports of web source — do not invent.
- Analysis: `normalizeHealthTestForAnalysis` + `resolveHealthScoreAnalysis` / `computeFallbackHealthScores` use the full flat answer set.
- Legacy `radarScores` / `HealthRadarScores` are obsolete — do not use for new UI.
