# Domain — Health Test Catalog

Self-contained question list extracted for mobile handoff.

**Source of truth (code):**  
- [`src/data/healthTestSections.ts`](../../../src/data/healthTestSections.ts)  
- [`src/data/healthTestDietitianSections.ts`](../../../src/data/healthTestDietitianSections.ts)  
- Engine: [`src/data/healthTest.ts`](../../../src/data/healthTest.ts) — **flat** `members.data.healthTest`

**Full option tables (LOCK):** [health-test-options.md](health-test-options.md) — do not invent values/labels. Prefer reading the TS source files above for `detail` / `followUps` / `softWarning` / `exclusive`.

**Question types:** `emoji | single | multi | text | time | scale | file`

**Engine extras:** `detail`, `followUps[]` (conditional), `softWarning`, `footerNote`, `infoNote` / `infoNoteWhen`, exclusive multi options (`exclusive: true`).

**360 scores:** After all applicable sections complete, hub shows `HealthRadarScores` via `calculateRadarScores` (client-side) or stored `healthAnalysis.radarScores`.

**Lab uploads:** Private bucket `health-lab-results`, path `{userId}/{ts}-{rand}.{ext}`, via `uploadHealthLabResult`.

**Sections:** `general`, `medical`, `physical`, `lifestyle`, diet_* (all members), `women` / `men` / `diet_women` (gender-only). No package gating.

## Notes

- Full option lists live in the TS ports of web source — do not invent.
- Analysis: `normalizeHealthTestForAnalysis` + `calculateRadarScores` use the full flat answer set.
