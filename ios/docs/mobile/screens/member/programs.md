# Member — Programs (IMPLEMENTATION LOCK)

- **Expo:** `/(member)/programs`
- **Web:** `/programs` → `ProgramsPage.jsx`
- **Priority:** P0

---

## Header (birebir)

- title: **Programlarım**
- subtitle: **Koçunuz ve diyetisyeniniz tarafından hazırlanan programlar**

## Filters (yalnızca bunlar)

| id | label |
|----|-------|
| all | Tümü |
| workout | Antrenman |
| nutrition | Beslenme |

## Unpaid

`isUnpaidMember` → header + `UnpaidMemberGate` (title/desc C-copy-strings unpaid programs). Liste yok. **iOS:** kapıda Plan Seç / web checkout yok.

## Empty (ücretli)

- Atama bekleniyorsa: **Uzmanınız atanıyor** / paket ataması cümlesi
- Değilse: **Uzmanınız program hazırlıyor** / gönderince görünecek cümlesi
- Eski tek cümle yalnızca LOCK öncesi; web `needsProgramStaff` kazanır

## List item

- Program type icon (workout/nutrition)
- Title, staff/meta as web
- Entries grouped via `groupBySchedule` (programs-model)
- **Antrenman** satırı: ExerciseVideoThumbnail + name + amountText; tap → video modal; prefetch on press
- **Beslenme / diyet** satırı: öğün ikonu + name + note/saat; video yok, tap yok, signed URL yok (web `ProgramsPage` parity)

## amountText

duration → `{amount} {durationUnit||'sn'}`; else `{amount} tekrar`

## Acceptance

- [ ] Filter ids/labels exact  
- [ ] Empty copy exact  
- [ ] groupBySchedule parity including daily fixed labels  
- [ ] No client-side program editing for members  
