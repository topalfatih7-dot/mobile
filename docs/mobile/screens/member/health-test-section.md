# Member — Health Test Section (IMPLEMENTATION LOCK)

- **Expo:** `/(member)/health-test/[sectionId]`
- **Web:** `/health-test/:sectionId` → `HealthTestSectionPage.jsx` + `HealthTestFlow` + `HealthTestStep`
- **Priority:** P1

---

## Data

- Load questions: `getSectionQuestions(sectionId, gender, packageConfig)` from `src/data/healthTest.ts` (web parity)
- Persist **flat** `healthTest` via `updateHealthTestPartial(nextFlatHealthTest)` — no section nesting
- Autosave debounce ~700ms + save on section complete (web `saveHealthTestProgress`)
- Consent required: missing `healthAck`/`disclaimer` → redirect hub
- Invalid sectionId → hub

## Question engine (required)

Support: `emoji | single | multi | text | time | scale | file`  
Plus: `detail`, `followUps[]`, `softWarning`, `exclusive` multi, `infoNote`/`infoNoteWhen`, `footerNote`, `hint`  
Options / catalog: web `healthTestSections.js` + `healthTestDietitianSections.js` (ported).

## Completion

- Enforce `isQuestionFullyAnswered` (detail + follow-ups)
- On last question → `isSectionComplete` → toast → hub (or AI program sync for free/eko then `/programs`)
- **No** `/health-test/finish` route

## Lab uploads

Private bucket `health-lab-results`, path `{userId}/{ts}-{rand}.{ext}` via `uploadHealthLabResult`.  
Value shape: `[{ path, name, contentType }, …]`

## Acceptance

- [ ] required fields enforced per question.required (+ detail/followUps)  
- [ ] No invented options  
- [ ] gender-gated sections (women/men/diet_women)  
- [ ] Flat keys match web  
