# Staff — Client Program Builder (IMPLEMENTATION LOCK)

- **Expo:** `/(staff)/clients/[memberId]/program`
- **Web:** `/staff/clients/:memberId/program` → `StaffClientProgramPage.jsx`
- **Priority:** P1
- **Flow:** F11
- **Role:** coach only (dietitian redirected to lists)

---

## Access

- Staff auth; member in `getStaffClients`
- `memberHasProgramTypePackage` / package windows — warn outside range (`findEntriesOutsidePackage`)

## Cart entry factory (birebir)

```js
{
  id: `e-${Date.now()}-${random}`,
  exerciseId, exerciseName,
  videoUrl, videoPending,
  description,
  amountType: 'reps',  // default
  amount: 12,
  durationUnit: 'sn',
  sets: 3,             // DEFAULT_CART_SETS
  note: '',
}
```

## UX blocks

1. Adım 1: süre (14 gün / özel) + paket tarih sınırları  
2. Adım 2: library filters + pagination; güne **ekle**. Satır **Bu günde** tekrar basınca `exerciseId` ile o günden çıkar. Alt sheet: kısa liste (ad + `cartEntrySummary`) + çöp + **Gün akışını düzenle** — süre/tekrar editor sheet’te yok  
3. Adım 3: `CoachProgramDayFlowEditor` — set, tekrar veya süre, birim, not, sıra, sil. Ekleme yok  
4. Adım 4: sayfa içi önizleme  
5. Gönder → `CoachProgramSendModal` (tek modal). iOS `presentationStyle="pageSheet"` + `OverlayPortalProvider`; `PlanDateField embedded` (iç içe Modal yok). Android sheet `height: '92%'`

## CoachProgramSendModal validation toasts (birebir)

| Condition | Toast |
|-----------|-------|
| empty cart | En az bir hareket ekleyin |
| custom range end < start | Bitiş tarihi başlangıçtan önce olamaz |
| session end <= start | Seans bitiş saati başlangıçtan sonra olmalı |
| !hasWorkoutDays | Danışan antrenman günü belirtmemiş. Önce müsaitlik doldurmasını isteyin. |

Date modes: `fixed14` (CYCLE_PLAN_LENGTH=14) | `custom` range.  
Title: `buildCoachProgramTitle(...)` — use `utils/coachProgram.js` port.  
Payload: `buildCoachProgramPayload` → `createProgram` / onSubmit.

## Do not

- Change default amount 12 / amountType reps without product decision  
- Allow dietitian on this route  

## Acceptance

- [ ] createCartEntry defaults (sets: 3)  
- [ ] Send modal toasts exact  
- [ ] Package date bounds via getDateInputBounds  
- [ ] Programlarım kartı edit hydrates sets/amount; boş “Program yok” değil  
- [ ] iOS önizleme sayfa içi (nested Modal yok)  
- [ ] Adım 2 **Bu günde** o günün sepetinden çıkarır  
- [ ] iOS gönder modalı içerik görünür (pageSheet; tarih embedded)  
- [ ] Video thumb/sign rules  
