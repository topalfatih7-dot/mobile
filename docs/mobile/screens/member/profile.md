# Member — Profile (IMPLEMENTATION LOCK)

- **Expo:** `/(member)/profile`
- **Web:** `/profile` → `ProfilePage.jsx` + `components/profile/*`
- **Priority:** P0

---

## Sections (order — web parity)

1. Cover photo (`PANEL_IMAGES.profileCover` — mobile cover on phone)
2. Avatar / name / MembershipBadge / plan pill + camera shortcut
3. Expert cards (package-gated, web parity; name or `Atanmadı`):
   - Show only roles in package: `packageIncludesCoach` / `Dietitian` / doctor entitlement
   - Koç → `/(member)/schedule?tab=coach`
   - Diyetisyen → `/(member)/schedule?tab=dietitian`
   - Doktor → `/(member)/schedule?tab=doctor`
4. `HealthSummarySection` — kilo / boy / bel / VKİ + “Ölçüleri Güncelle” modal
5. Quick links 2×2: **Programlarım**, **Takvim**, **Kalori**, **Destek**
6. `PersonalInfoSection` — full field grid + “Düzenle” modal (see fields)
7. Üyelik Planınız card — `migrateLegacyToPackages` + `isPackageEntryActive`; multi-package chip picker; remaining days / one-time doctor session counter (`isOneTimePlan`, `countUsedDoctorSessions`, `getRemainingDays`)
   - Expiring copy: `Bu paketin süresi yakında doluyor — kesintisiz devam için Planlar’dan yenileyin. İptal için Ödeme Yönetimi.`
   - Expired copy: `Bu paketin süresi doldu — yenilemek için Planlar sayfasını kullanın.`
   - **Ödeme Yönetimi** → `/(member)/profile/payments`
   - **Planları karşılaştır / paket ekle** → **Android** web `/plans` handoff (`openWebCheckoutHandoff`). **iOS:** yok.
   - Ücretsiz “Premium özellikler için plan yükseltin” → Android ödemeler (checkout CTA orada). iOS: yükseltme linki yok; yalnız Ödeme Yönetimi.
8. Bildirimler — settings keys: `emailNotifs`, `pushNotifs`, `soundNotifs`, `reminderNotifs`  
   `reminderNotifs` ayrıca günlük habit OS hatırlatmalarını keser (`domains/engagement-reminders.md`). Yeni anahtar yok.
9. `VerificationSection` — email verify actions; phone only if `EXPO_PUBLIC_PHONE_VERIFY_ENABLED=true`
10. **Hesabımı sil** (web `/hesap-silme` JWT handoff) — `openWebAccountDeleteHandoff`
11. Logout (`loggingOut` spinner) → `/(public)/landing` + toast **Çıkış yapıldı**

## Hero edit modal (Profili Düzenle)

Fields: photo, name, email (**read-only**), phone (**read-only / locked after registration**), city, district (Turkey city/district sheets).

Save: `updateProfile({ name, city, district, photo? })` → toast **Profil güncellendi**

Photo: web parity — `members.data.photo` as JPEG **data URL** (≤720px via `expo-image-manipulator`). No `avatars` storage bucket (does not exist → Bucket not found).

## PersonalInfoSection edit modal

Fields: photo, name, email (read-only), phone (locked if set; else E.164 + country), birthDate, gender (locked if set), city/district, weight/height/waist, goals[], fitnessLevel, nutritionPrefs[].

Save toast: **Kişisel bilgileriniz kaydedildi.**

## HealthSummarySection

Save toast: **Ölçüleriniz kaydedildi.**

## Verification

- Email: `POST /api/auth` `{ action: "email-send" }` + optional OTP confirm via `supabase.auth.verifyOtp` + mark `members.data.emailVerifiedAt`
- Refresh: re-read `members.data.emailVerifiedAt`
- Phone: gated by env (web parity — default off)

## Free trial

`FreeTrialExpiredProfileAlert` when applicable.

## Do not

- Show staff email/phone on expert cards (names only)
- Invent settings keys beyond the four above
- Allow editing phone/gender after they are set
- Route logout to login (use public landing)

## Acceptance

- [ ] Expert card routes exact  
- [ ] Toast strings exact  
- [ ] Package migration helpers + remaining days / one-time counter  
- [ ] Personal info fields match web (birthDate, gender, metrics, goals, fitness, nutrition)  
- [ ] Email verification send / refresh / code confirm  
- [ ] Notification toggles ×4  
- [ ] Logout loading + landing redirect + toast  
- [ ] **Hesabımı sil** web `/hesap-silme` handoff; native silme formu yok (5.1.1(v) uygulama içinden)
- [ ] iOS: “Planları karşılaştır / paket ekle” yok
- [ ] Hesap silme sonrası ön plana dönüşte yerel çıkış + landing + toast **Hesabınız silindi**  
