# F04 — Health Test Complete (2 aşama)

1. `/health-test` hub — consent if required  
2. Profile gate (`HealthProfileGateForm`) — birthDate / weight / height (+ gender)  
3. **1. Aşama:** `/health-test/core` — 25 (E) / 26 (K) core questions (`coreHealthTest`)  
4. Hub → **Analizi Başlat** → `runSync({ stage: 'core' })` → `healthAnalysis.analysisStage = 'core'`  
   - Hub + dashboard `HealthScoreCard` shows 8-dim scores  
5. **2. Aşama (opsiyonel):** `/health-test/:sectionId` — remaining questions only (`getRemainingSectionQuestions`)  
   - Types: `single`, `emoji`, `multi`, `text`, `time`, `scale`, `file` + followUps/detail  
6. When `isDetailedHealthTestComplete`:  
   - write `healthTest.optionalCompletedAt`  
   - auto `runSync({ stage: 'detailed' })`  
   - 14-day `fullLock` (questions closed; scores visible)  
7. After lock expires: **Testi Yeniden Çöz** → `healthTest: { retakeAt }` → restart core  
8. Free/eko: `memberHealthSync` only after detailed complete  

Save answers into `members.data.healthTest` (flat keys + meta).  
AI: `POST /api/ai-health-analysis`. Staff reads answers + stage/lock meta.
