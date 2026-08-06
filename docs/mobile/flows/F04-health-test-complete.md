# F04 — Health Test Complete

1. `/health-test` hub — progress per section; consent if required  
2. Open section `/health-test/:sectionId` — answer required questions  
   - Types: `single`, `emoji`, `multi`, `text`, `time`, `scale` (0–10), `file`  
   - Support `followUps`, `detail`, `softWarning`, exclusive multi  
3. Applicable sections: **general, medical, nutrition, physical, lifestyle** for everyone; gender-only `women` / `men` via `getApplicableSections`  
4. Save answers into `members.data.healthTest` (flat keys)  
5. On full completion + consent:  
   - Hub done banner (“Kişisel sağlık analizi kaydedildi”)  
   - `useHealthAnalysisSync` → `resolveHealthScoreAnalysis` → save `healthAnalysis` + `healthScoreHistory`  
   - Dashboard `HealthScoreCard` shows 8-dim YeniForm Sağlık Skoru (+ trend)  
   - Optional: `memberHealthSync` auto program for free/eko  
6. Staff can read answers; admin/staff brief via `staffBrief` (not member-facing)  

Empty: incomplete badge on nav. Offline: block submit with message.
