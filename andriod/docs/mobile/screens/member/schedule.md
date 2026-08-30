# Member — Schedule / Appointments (IMPLEMENTATION LOCK)

- **Expo:** `/(member)/schedule`
- **Web:** `/schedule?tab=` → `AppointmentsPage.jsx` + `MemberScheduleView`
- **Priority:** P1
- **Flow:** F06

---

## Unpaid

`isUnpaidMember` (FreeTrialExpiredGate sonrası) → UnpaidMemberGate (randevular paket). Tab/booker yok.

## Tabs (yalnızca bunlar)

| id | label | icon meaning |
|----|-------|----------------|
| coach | Koç | Dumbbell |
| dietitian | Diyetisyen | Apple |
| doctor | Doktor | Stethoscope |

Default tab if missing/invalid: **coach**.  
Set via `setSearchParams({ tab: id }, { replace: true })`.

Redirects (web App.jsx): `/schedule/coach|dietitian|doctor` → `?tab=`.

## Per-tab props (birebir)

### coach
- title: **Koç Randevuları**
- subtitle: **Birebir antrenman görüşmeleriniz**
- sessions: `coachSessions`
- canBook: `packageIncludesCoach(packageConfig)`
- monthlyLimit: `coachMonthlyLimit(packageConfig)`
- lockedTitle: **Koç randevuları paketinizde yok**
- lockedDescription: **Birebir koç görüşmeleri için koç içeren bir pakete geçin.**
- **MOBILE DIFF (2026-08-22) iOS:** kilit CTA **Paketleri gör** yok. lockedDescription: `MEMBERSHIP_CANCEL_COPY.iosScheduleLocked.coach`

### dietitian
- title: **Diyetisyen Randevuları**
- subtitle: **Beslenme rehberliği — tıbbi tedavi değildir**
- canBook: `packageIncludesDietitian(packageConfig)`
- monthlyLimit: `dietitianMonthlyLimit(packageConfig)`
- lockedTitle: **Diyetisyen randevuları paketinizde yok**
- lockedDescription: **Beslenme rehberliği için diyetisyen içeren bir pakete geçin.**
- **MOBILE DIFF (2026-08-22) iOS:** kilit CTA yok. lockedDescription: `iosScheduleLocked.dietitian`

### doctor
- title: **Doktor Randevuları**
- subtitle: **Online sağlık görüşmeleriniz**
- canBook: `packageIncludesDoctor(packageConfig) && doctorBookingLimit(packageConfig, user) > 0`
- monthlyLimit: tek seferlik `doctorSessionsTotal`, aksi halde `doctorMeetingsPerMonth`
- limitScope: tek seferlik `all`, aksi halde `month`
- lockedTitle: **Doktor randevuları paketinizde yok**
- lockedDescription: **Online doktor görüşmesi için Doktor Paketi satın alın. Diğer abonelik planlarına dahil değildir.**
- **MOBILE DIFF (2026-08-22) iOS:** kilit CTA yok. lockedDescription: `iosScheduleLocked.doctor` (satın alın yok)
- Kilit: yalnız `!canBook && sessions.length === 0`. Onaylı/bekleyen randevu varken liste ve katıl görünür; yeni randevu butonu kota bitince gizlenir.
- Tek seferlik paket `scheduled` olunca **consumed olmaz** — tüketim yalnız `completed` / `no_show` (web `countConsumedDoctorSessions`).

## MemberScheduleView behavior

Port from `src/components/calendar/MemberScheduleView.jsx` — booking, join window, cancel/reschedule if present.  
Join → `memberCallPath(type, sessionId)` = `/call/{type}/{id}`.

### Cancel / reschedule (web parity — 24s + onay zinciri)

- **≥24 saat** kala (`session.date - now >= 24h`):
  - `pending` → **Talebi İptal Et** → anında `cancelled` (çekme).
  - `scheduled` / `rescheduled` → **İptal Talebi Gönder** → `cancel_pending` (personel onay/red). Toast: **İptal talebiniz gönderildi. Uzman onayı bekleniyor.**
  - **Yeniden Planla** → +3 (koç) / +5 gün; API `reschedule-session`; `status: rescheduled`.
- **&lt;24 saat** kala: iptal ve yeniden planla **yok**; bilgi: **Randevuya 24 saatten az kaldığı için iptal veya değişiklik yapılamaz.**
- `cancel_pending`: rozet **İptal onayı bekleniyor**; video join açık kalır; tekrar iptal yok.
- API: `request-cancel-session` / `reschedule-session` — client patch ile anında iptal yok.
- Booker: 24s kuralı metni + **Anladım** onayı zorunlu (bkz. session-booker + `BOOKING_POLICY_ACK_COPY`).

Join window (`videoCallSession.getJoinWindowMinutes` — web `_videoJoinWindows.js` parity):
- koç: 10 dk önce / 20 dk sonra (süre bitiminden)
- diyetisyen / doktor: 15 dk önce / 30 dk sonra
- Ekran 30 sn `now` tick: Katıl pencere açılınca görünür; seans başladıysa upcoming’de kalır (join hâlâ açıkken).

## Booking API

See [contracts/api-book-session.md](../../contracts/api-book-session.md) — body, errors, UI strings for MemberScheduleView.

## Acceptance

- [ ] Tab labels/locked strings exact  
- [ ] doctor canBook = include + bookingLimit; kilit yalnız seans yokken  
- [ ] Package include helpers from membershipPlans (remaining kota include’u düşürmez)  
- [ ] Join path pattern exact  
- [ ] Scheduled future session: 3/5-day reschedule + existing member data patch
