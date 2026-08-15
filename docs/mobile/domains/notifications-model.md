# Domain — Notifications (LOCK)

## Storage

`members.data.notifications[]` — each item typically:

```ts
{
  id: string
  type: string   // 'chat' | 'program' | 'availability' | 'support-reply' | 'support' | 'reminder' | 'appointment' | 'assignment' | ...
  title: string
  message?: string
  read: boolean
  createdAt?: string
  staffRole?: 'coach' | 'dietitian' | 'doctor'  // for chat
  action?: string  // e.g. 'availability' | habit_*
  ticketId?: string
}
```

Builders: `src/data/memberNotificationTemplates.js` + `buildMemberNotification` — **port templates; do not invent new types without updating navigate map**.

Günlük alışkanlık (su / motivasyon / öğün): OS-only `type: reminder` + `action: habit_*`. Listeye yazılmaz. Ayrıntı: [`engagement-reminders.md`](engagement-reminders.md).

## Client APIs

- `markNotificationRead(id)` — optimistic + debounced persist
- `markAllNotificationsRead()`
- `flushNotificationReads()` on notifications screen unmount

## Navigate map

See `screens/member/notifications.md`.

## Push (mobile)

1. Client: `registerForPushNotifications(userId)` → Expo token → upsert `device_push_tokens` (RLS own row).
2. On `append_member_notification` + `POST /api/application-notify` `{ memberId, notification }`:
   - WhatsApp fan-out (program/chat, existing)
   - **Expo Push** via `api/_expoPush.js` → `https://exp.host/--/api/v2/push/send`
3. Respect `members.data.settings.pushNotifs === false` → skip Expo.
4. Payload `data`: `{ type, staffRole?, ticketId?, action?, threadId?, ... }` — same navigate map as in-app.

Table: `device_push_tokens (user_id PK, expo_push_token, platform, updated_at)`.
