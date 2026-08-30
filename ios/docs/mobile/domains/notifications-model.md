# Domain — Notifications (LOCK)

## Storage

`members.data.notifications[]` — each item typically:

```ts
{
  id: string
  type: string   // 'chat' | 'program' | 'availability' | 'support-reply' | 'support' | 'reminder' | 'appointment' | 'assignment' | 'call-join' | ...
  title: string
  message?: string
  read: boolean
  createdAt?: string
  staffRole?: 'coach' | 'dietitian' | 'doctor'  // for chat / call-join
  action?: string  // e.g. 'availability' | habit_* | water_goal_updated
  ticketId?: string
  sessionId?: string
  sessionType?: 'coach' | 'dietitian' | 'doctor'  // call-join
}
```

Builders: `src/data/memberNotificationTemplates.js` + `buildMemberNotification` — **port templates; do not invent new types without updating navigate map**.

Günlük alışkanlık (su / motivasyon / öğün / günün ipucu): OS-only `type: reminder` + `action: habit_*`. Listeye yazılmaz. Ayrıntı: [`engagement-reminders.md`](engagement-reminders.md). Diyetisyen hedef değişince listeye yazılır: `action: water_goal_updated` → dashboard ([`water-tracking.md`](water-tracking.md)).

## Client APIs

- `markNotificationRead(id)` — optimistic + debounced persist
- `markAllNotificationsRead()`
- `flushNotificationReads()` on notifications screen unmount

## Navigate map

See `screens/member/notifications.md`.

## Push (mobile)

**MOBILE DIFF (2026-08-21):** Native bildirim sesi web `notification.wav` değil — cihazın varsayılan OS bildirimi (`default`). Android kanal `yeniform-alerts-v3` (v2 wav kilitli kalır). `soundNotifs === false` → sessiz kanal + `shouldPlaySound: false`. In-app `expo-audio` çalma yok.

1. Client: `registerForPushNotifications(userId, { prompt?: boolean })` → Expo token → upsert `device_push_tokens` (RLS own row). Varsayılan **sessiz** (`getPermissions` + token); OS diyaloğu yalnızca `{ prompt: true }` ve status `undetermined` iken. Denied / “Şimdi Değil”: tekrar `requestPermissionsAsync` yok. AppState yeniden kayıt sessiz. Aynı `expo_push_token` başka `user_id` satırlarında silinir (cihaz tek sahibi). Logout / hesap silme: `clearDevicePushToken` satırı + OS banner’ları kapatır; `data.userId` mevcut oturumla eşleşmezse banner/tap yok sayılır.
2. On `append_member_notification` + `POST /api/application-notify` `{ memberId, notification }`:
   - WhatsApp fan-out (program/chat, existing)
   - **Expo Push** via `api/_expoPush.js` → `https://exp.host/--/api/v2/push/send`
3. Respect `members.data.settings.pushNotifs === false` → skip Expo.
4. Payload `data`: `{ type, staffRole?, ticketId?, action?, threadId?, sessionId?, sessionType?, userId?, ... }` — same navigate map as in-app.

**Çift bildirim (2026-08-24 / 2026-08-29):** Aynı olay hem Expo remote push hem `members`/`staff` realtime ile gelebilir. Uygulama **önde** (`AppState === 'active'`) `chat` / `admin-chat` / `collab` / `appointment` / `call-join` / `program` / `assignment` remote handler **sessiz**; tek OS banner yerel `presentSystemNotification` veya satır realtime. Kilit / arka plan: remote gösterilir. 8 sn banner dedupe (`type+sessionId` call-join için). `settings.pushNotifs` tanımsız = açık; yalnızca `=== false` Expo ve OS banner’ı keser.

**Oda katılımı `call-join` (2026-08-29):** Personel Daily odaya (veya WebView fallback) katılınca danışana; danışan katılınca ilgili personele. Kaynak: `notifyMemberCallJoin` / `notifyStaffCallJoin` → aynı RPC + `application-notify` zinciri. Tap: üye `/(member)/call/{sessionType}/{sessionId}`; personel `/staff/call/{sessionType}/{sessionId}`. Karşı taraf **zaten o odadaysa** yerel banner mute (`activeCallSession`). Önizlemedeyken (henüz katılmamış) banner gösterilir.

**Randevu Expo (2026-08-29):** `api/_bookSession.js` personel push; `api/_respondSession.js` üye onay/red push; iptal/yeniden planlama `api/_sessionCancel.js` / `api/_sessionReschedule.js`. Günlük habit + program saati zilleri (`engagementReminders.ts` DATE trigger) bu yoldan bağımsızdır.

**İzin reddi (2026-08-26):** Denied izin `requestPermissionsAsync` veya `scheduleNotificationAsync` tetiklemez. `presentSystemNotification` ve engagement reminder schedule yalnızca OS `granted` iken. Aksi halde Android 13+ overlay flicker ve bazı OEM’lerde Activity recreate (panelden atılma) oluşuyordu.

Table: `device_push_tokens (user_id PK, expo_push_token, platform, updated_at)`.

## Staff push (mobile)

Personel `staff.id` = `auth.uid` → aynı `device_push_tokens` satırı. Kayıt: status `undetermined` ise bir kez `{ prompt: true }`, aksi halde sessiz. AppState yeniden kayıt sessiz.

`append_staff_notification` + `POST /api/application-notify` `{ audience: 'staff', staffId, memberId: staffId, notification }`. Top-level `memberId` Expo hedefidir (personel). Danışan id’si yalnızca `notification.memberId` içinde olur — aksi halde gönderen kendi mesajının push’unu alır. API `audience: 'staff'` ile token’ı `staffId` üzerinden çözer; sohbet push’u gönderene (`auth.user`) gitmez.

Tipler: `chat` (danışan), `admin-chat`, `collab`, `appointment`, `call-join`. Navigate: `screens/staff/notifications.md`.

Gönderen mobil/web (üye sohbet / ekip / admin sohbeti) notify eder. Alıcı uygulama unread artışı veya realtime INSERT üzerine **ikinci Expo atmaz** — aksi halde aynı mesaj telefona iki kez düşer. Uygulama öndeyken tek OS banner yerel `presentSystemNotification`; arka planda yalnız gönderenin Expo’su. `collapseId` = `{type}-{threadId}`.

Yerel banner: `staff.notifications` realtime → `presentSystemNotification` (üye ile aynı 8 sn dedupe; açık thread mute; yalnız `AppState === 'active'`).
