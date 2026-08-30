# Domain — Health test 14-gün kilit / retake (2026-08-27)

Web Adsız commit `ca4733bd` (27 Ağu 2026). Mobil client `healthScoreAnalysis.ts` + hub retake web ile aynı (2026-08-27). API tarafı (`POST /api/ai-health-analysis` 423) web deploy sonrası `retakeAt` tanır; hub/core/section kilit **`src/services/healthScoreAnalysis.ts` içinde yerel**.

## Web’de ne oldu

Üye 14 gün dolunca **Testi Yeniden Çöz** basınca cevaplar `healthTest: { retakeAt }` ile siliniyordu. `healthAnalysis.analysisStage` **`detailed` kalıyordu**. `getHealthTestLockState` `stage === 'detailed'` görünce soruları hâlâ bitmiş sayıp süreyi eski `aiAttemptedAt`’e bağlıyordu. Core route `fullLock` ile hub’a geri atıyordu — testler açılmıyordu.

Şenol Tahmaz: retake 26 Ağu, analiz 22 Ağu → kilit 5 Eyl’e kadar. Web kaydında `analysisStage` `core` yapıldı (tek üye data düzeltmesi).

## Web düzeltmesi (parity hedefi)

1. `getHealthTestLockState({ …, retakeAt })` — `retakeAt` kilit başlangıcından sonraysa `fullLock: false`
2. Retake patch: `healthTest: { retakeAt }` **ve** `healthAnalysis.analysisStage = 'core'` (skorlar durur; 423 `stage=detailed` muafiyeti için şart)
3. `optionalCompletedAt` backfill: retake eski detailed damgasını kopyalamasın (yeni 14 gün `now` ile başlar)
4. Kilit util: web `src/utils/healthTestLock.js`

## Mobilde aynı bug vardı (iOS + Android) — düzeltildi

Önce: `getHealthTestLockState` `retakeAt` almıyordu; hub yalnız `{ healthTest: { retakeAt } }` yazıyordu; leftover `detailed` stage core’u hub’a atıyordu.

Şimdi: web ile aynı `retakeAt` / `isRetakeAfterLockStart` / retake `analysisStage: 'core'`.

## Yapılacak (kod — bu doküman spec)

`healthScoreAnalysis.ts` (web `healthTestLock.js` ile aynı):

- `retakeAt` parametresi
- `isRetakeAfterLockStart(retakeAt, lockTs)` → kilit kapalı
- `resolveOptionalCompletedAtTimestamp` — retake sonrası eski detailed zamanı kullanma

Call site’lar `retakeAt` geçsin: hub, core, section, dashboard, `_layout` badge, staff client health.

Hub `handleRetake`:

```ts
await updateProfile({
  healthTest: { retakeAt: new Date().toISOString() },
  ...(analysis ? { healthAnalysis: { ...analysis, analysisStage: 'core' } } : {}),
});
```

Retake sonrası core **açık** (`fullLock` false). 14 gün dolduğunda testler kendiliğinden açılmaz; **Testi Yeniden Çöz** gerekir.

## API

`423` yalnız `fullLock && analysisStage === 'detailed'`. Retake sonrası stage `core` olmazsa yeni detailed analiz 423 yiyebilir.
