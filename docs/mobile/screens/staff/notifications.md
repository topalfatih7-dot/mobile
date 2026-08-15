# Staff — Notifications (IMPLEMENTATION LOCK)

- **Expo:** `/(staff)/notifications`
- **Web:** `/staff/notifications` → `StaffNotificationsPage.jsx`
- **Priority:** P1
- **Domain:** `domains/notifications-model.md` + `staff.data.notifications` (RPC `staff_set_notifications`)
- **Storage shape:** `rowToStaff` spreads `data` → `staff.notifications[]` (tolerate nested `staff.data.notifications`)

---

## Header

- title: **Bildirimler**
- subtitle: unread > 0 → `{n} okunmamış bildiriminiz var` else **Her şey güncel görünüyor**
- Action if unread: **Tümünü okundu işaretle** → `markAllNotificationsRead` + toast **Tümü okundu olarak işaretlendi**

## Filters (yalnızca)

| id | label |
|----|-------|
| unread | Okunmamışlar |
| all | Tümü |
| read | Okunanlar |

Default filter: `all` (web parity).

## Empty

- title: **Bildirim yok**
- description: **Yeni randevular ve güncellemeler burada görünecek.**

## Open / navigate map (birebir)

| condition | navigate |
|-----------|----------|
| `type === 'appointment' && memberId` | `/(staff)/clients` |
| `type === 'chat' && memberId` | `/(staff)/messages/{memberId}` |

Always `markNotificationRead(n.id)` first.

## Lifecycle

Unmount: `flushNotificationReads()` (staff path → `setStaffNotifications` RPC).

## Persist

- Service: `src/services/staffNotifications.ts` → `staff_set_notifications`
- Optimistic overlay via Auth `setLocalStaffOverlay` + ActionsContext (aynı API isimleri: `markNotificationRead` / `markAllNotificationsRead` / `flushNotificationReads`)

## Acceptance

- [ ] Filter labels exact
- [ ] Navigate map exact (appointment→clients, chat→messages/:memberId)
- [ ] Subtitle / empty / mark-all strings exact
- [ ] Staff badge unread uses same notifications list
