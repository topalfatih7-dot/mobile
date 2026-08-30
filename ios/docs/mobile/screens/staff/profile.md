# Staff — Self Profile (LOCK) (IMPLEMENTATION LOCK)

- Web: StaffSelfProfilePage + StaffProfileEditor
- Tabs: Profil / Çalışma / Güvenlik (segmented)
- Profil: photo (ImagePicker → data URL), phone, city/district, gender, bio, title; locked credential display (email, specialty, experience, languages)
- Unvan placeholder (role): koç → `uzman koç`; diyetisyen → `uzman diyetisyen`; doktor → `uzman doktor`
- Çalışma: WeeklyAvailability (08–22), social links. **MOBILE:** `workDays` / `workStart` / `workEnd` chips **gösterilmez**; kayıtta mevcut `workDays`, `workStart`, `workEnd` korunur.
- Güvenlik: current + new password (`PASSWORD_RULES` / `isPasswordValid` → `signInWithPassword` + `updateUser`)
- Save via `updateStaffSelfProfile` / `staff_update_self_profile` (field names: `staffProfileDataPayload`)
- Validation: name, phone, city+district, gender, photo required; bio `detectExternalContactInfo`
- MOBILE DIFF: RN single-column
