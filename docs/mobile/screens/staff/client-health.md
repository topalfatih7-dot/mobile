# Staff — Client Health (LOCK) (IMPLEMENTATION LOCK)

- **Expo:** `/(staff)/clients/[id]/health`
- **Web:** `/staff/clients/:memberId/health` → `MemberHealthProfilePage` audience=`staff`
- **Priority:** P1

---

## Scope (staff audience)

- `showHealthAnalysis={false}` — admin AnalysisSummary yok
- `showStaffBrief={true}` — `StaffHealthBrief` (skorlar + role-filtered brief)
- Klinik notlar CRUD (mevcut `healthStaffNotes`)

## Layout (üst → alt)

1. Geri / başlık (PanelScaffold: **Sağlık özeti**, subtitle danışan adı)
2. Kimlik kartı (avatar, ad, plan badge, cinsiyet)
3. Analiz aşama meta (çekirdek / detaylı / kilit)
4. Durum bandı: tamamlandı / devam ediyor / başlanmadı + yaş·kg·cm
5. Profil chips: Spor Seviyesi · Hedefler · Beslenme (`FITNESS_LABELS` / `GOAL_LABELS` / `NUTRITION_LABELS`)
6. `StaffHealthBrief` — `briefKeysForRole(staff.role)`, `showBrief=isPaidMembership`, stale + **Yeniden analiz et**
7. **Sağlık Analizi Cevapları** — `describeHealthTest` → `sectionVisibleForRole` filtre + audience chip
8. Onay satırları (`healthAck` / `disclaimer`) varsa
9. Klinik Notlar + **Notu Kaydet**

## Role filters

| Role | Sections (`audience`) | Brief keys |
|------|----------------------|------------|
| coach | shared + coach | general, movement, risks, actions |
| dietitian | shared + dietitian | general, nutrition, risks, actions |
| doctor | shared only | general, nutrition, movement, risks, actions |
| admin (ref) | all | all five |

## Yeniden analiz

- Gate: `isPaidMembership(member.membership)` — toast: **Yeniden analiz yalnızca aktif ücretli üyelikte kullanılabilir**
- Hook: `useStaffHealthAnalysisRerun` → `resolveHealthScoreAnalysis` + `staffPatchMember({ healthAnalysis, healthScoreHistory })`
- Success toast: **Sağlık analizi güncellendi**
- Stale copy: **Analiz güncel değil** / **Yeniden analiz et**

## Copy

| Key | TR |
|-----|-----|
| answers title | Sağlık Analizi Cevapları |
| empty answers | Henüz cevaplanmış soru yok. |
| notes title | Klinik Notlar |
| save note | Notu Kaydet |
| note saved | Not kaydedildi. |
| brief title (paid) | Detaylı sağlık analizi |
| brief title (free) | Sağlık skorları |
| brief locked | Detaylı personel brief’i üye ücretli paket aldığında görünür. |

## Acceptance

- [ ] Role-filtered sections + audience chips
- [ ] StaffHealthBrief + stale rerun (paid only)
- [ ] Notes CRUD unchanged
- [ ] showHealthAnalysis false for staff
