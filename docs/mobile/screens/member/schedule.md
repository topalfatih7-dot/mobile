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

### dietitian
- title: **Diyetisyen Randevuları**
- subtitle: **Beslenme rehberliği — tıbbi tedavi değildir**
- canBook: `packageIncludesDietitian(packageConfig)`
- monthlyLimit: `dietitianMonthlyLimit(packageConfig)`
- lockedTitle: **Diyetisyen randevuları paketinizde yok**
- lockedDescription: **Beslenme rehberliği için diyetisyen içeren bir pakete geçin.**

### doctor
- title: **Doktor Randevuları**
- subtitle: **Online sağlık görüşmeleriniz**
- canBook: `packageIncludesDoctor(packageConfig)`
- monthlyLimit: **1** (sabit)
- lockedTitle: **Doktor randevuları paketinizde yok**
- lockedDescription: **Online doktor görüşmesi için Doktor Paketi veya VIP pakete geçin.**

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

Join window config (`videoCall.js`):
- `joinMinutesBefore` default **15**
- `joinMinutesAfter` default **30**

## Booking API

See [contracts/api-book-session.md](../../contracts/api-book-session.md) — body, errors, UI strings for MemberScheduleView.

## Acceptance

- [ ] Tab labels/locked strings exact  
- [ ] doctor monthlyLimit = 1  
- [ ] Package include helpers from membershipPlans  
- [ ] Join path pattern exact  
- [ ] Scheduled future session: 3/5-day reschedule + existing member data patch
