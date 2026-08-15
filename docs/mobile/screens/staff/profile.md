# Staff — Self Profile (LOCK) (IMPLEMENTATION LOCK)

- Web: StaffSelfProfilePage + StaffProfileEditor
- Tabs: Profil / Çalışma / Güvenlik (segmented)
- Profil: photo (ImagePicker → data URL), phone, city/district, gender, bio, title; locked credential display (email, specialty, experience, languages)
- Çalışma: WeeklyAvailability (08–22), workDays/workStart/workEnd, social links, WhatsApp notif toggle
- Güvenlik: current + new password (`PASSWORD_RULES` / `isPasswordValid` → `signInWithPassword` + `updateUser`)
- Save via `updateStaffSelfProfile` / `staff_update_self_profile` (field names: `staffProfileDataPayload`)
- Validation: name, phone, city+district, gender, photo required; bio `detectExternalContactInfo`
- MOBILE DIFF: RN single-column; WhatsApp under Çalışma (web places it under Güvenlik)
