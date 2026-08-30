---
name: yeniform-health-programs
description: >-
  Handles Yeni Form health tests, calendar meal/workout completion, member
  programs, calorie AI, and water tracking. Use when working on sağlık testi,
  health-test, takvim, programlarım, öğün, antrenman tamamlama, kalori,
  ai-food-text, ai-food-vision, su takibi, water tracking, or hydration.
---

# Yeni Form Health, Programs & Calendar

## Health test (iki aşamalı)

- Hub `/(member)/health-test` → çekirdek `/(member)/health-test/core` → opsiyonel kategori `/(member)/health-test/:sectionId`
- Label: **Kişisel Sağlık Analizi**
- **Gate:** boy/kilo/doğum tarihi (+ cinsiyet) zorunlu — `HealthProfileGateForm` (inline); `hasCompleteAnalysisProfile`
- **Onay:** `healthAck` + `disclaimer` (mevcut consent)
- **1. Aşama — Genel Sağlık Testi** (`src/data/coreHealthTest.ts`): kategori göstermeden 25 (erkek) / 26 (kadın) sabit soru
  - Bitince hub’da **Analizi Başlat** → `useHealthAnalysisSync` → `POST /api/ai-health-analysis` → `healthAnalysis.analysisStage = 'core'`
- **2. Aşama — Opsiyonel kategoriler:** `general`, `medical`, `nutrition`, `physical`, `lifestyle` + `women`/`men`
  - Çekirdek sorular kategoride tekrar sorulmaz (`getRemainingSectionQuestions`); hub ile aynı sayım (serbest metin muaf)
  - Core analiz sonrası tüm opsiyonel kategoriler açık (yarıda bırakılanlar dahil “Devam et”)
  - Katı tamamlanma (`isDetailedHealthTestComplete`) → `healthTest.optionalCompletedAt` + 2. AI analizi (`analysisStage = 'detailed'`)
  - Serbest metin "İsteğe bağlı" alanları (`DETAILED_OPTIONAL_TEXT_KEYS`) detaylı tetikleyiciden ve akış sayımından muaf
- Stored in `members.data.healthTest` JSONB; analiz `members.data.healthAnalysis`
- AI erişim: çekirdek + detaylı analiz **herkese açık**; `force` yeniden analiz yalnızca ücretli (staff takip)
- **14 günlük kilit (plan fark etmez):** kilit **tüm opsiyonel sorular bitince** başlar (`optionalCompletedAt`; detaylı AI henüz yoksa da). Core analiz tek başına soru kilidi başlatmaz. `fullLock` süresince tüm sorular kapalı; skorlar görünür. Süre dolunca “Testi Yeniden Çöz” → `healthTest: { retakeAt }` + `healthAnalysis.analysisStage = 'core'` (cevaplar + `optionalCompletedAt` sıfırlanır; eski detailed stage kilitte kalmaz) → baştan çöz → yeni analiz. `retakeAt` kilit başlangıcından sonraysa UI kilit açık. Personel `force` muaf. API: `423` yalnızca `fullLock` + `stage=detailed`. Web 2026-08-27: [docs/mobile/domains/health-test-retake-lock.md](../../../docs/mobile/domains/health-test-retake-lock.md) — mobil `healthScoreAnalysis.ts` + hub retake web ile aynı.
- Çıktı: 8 skor + `staffBrief` / `memberBrief` (şema web ile aynı)
- Üye hub + dashboard: `HealthScoreCard` (skorlar; lock badge)
- Personel: skor meta + cevaplar + `staffBrief` (ücretli üyelikte)
- Free/eko program AI yalnızca **detailed complete** sonrası (`memberHealthSync`)
- Fingerprint stale → personel yeniden analiz (ücretli; takip işi)
- Eski `isHealthTestComplete` (zorunlu sorular) checklist/rozet/istatistik için korunur

## Calendar / programs

- Entries from `programs.data`; date mapping `programSchedule` / `getProgramEntriesForDate`
- Complete workout: activity toggle; meals: `toggleMealCompletion(date, mealType, entryIds)`
- Meal types: kahvaltı, ara öğünler, öğle, akşam (see `MEAL_TYPES`)

## Calorie AI

- Text: `POST /api/ai-food-text` — gated by `hasManualCalorieAccess`
- Vision: `POST /api/ai-food-vision` — gated by `hasPhotoCalorieAccess`
- Quotas / usage logs — respect API guards

## Water tracking

- Spec: `docs/mobile/domains/water-tracking.md` + web `docs/WATER_TRACKING.md`
- Default 2000 ml; RPC `set_member_water_goal`; table `member_water_logs`; karaf UI; bardak sayacı yok
- habit_water: skip when daily goal reached; remaining ml copy

## Related

[reference.md](reference.md) · `yeniform-membership-payments` for gates
