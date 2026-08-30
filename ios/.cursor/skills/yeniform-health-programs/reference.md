# Health / Programs — Reference

## Key files

- `src/data/healthTest.js`, `healthTestSections.js`, `healthTestDietitianSections.js`
- `src/pages/HealthTestPage.jsx`, `HealthTestSectionPage.jsx`, `HealthTestFinishPage.jsx`
- `src/pages/CalendarPage.jsx`, `ProgramsPage.jsx`, `CalorieCalculatorPage.jsx`
- Water: `docs/mobile/domains/water-tracking.md` — port web `src/components/water/*`
- `src/utils/programSchedule.js`, `programPackageScope.js`
- Lab files: `src/utils/healthLabFiles.ts` + `HealthLabFilesPanel` (profil Evet kapısı; personel salt okunur)
- `src/services/healthScoreAnalysis.ts` — kilit: `getHealthTestLockState` + `retakeAt` (web `src/utils/healthTestLock.js`)
- Retake lock spec: `docs/mobile/domains/health-test-retake-lock.md`
- `api/ai-food-text.js`, `api/ai-food-vision.js`

## Staff visibility

Staff health profile: answers + clinical notes; **no** full `healthAnalysis` UI (`showHealthAnalysis={false}`). Admin sees analysis.
