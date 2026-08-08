# Member — Video Call (IMPLEMENTATION LOCK)

- **Expo:** `/(member)/call/[sessionType]/[sessionId]`
- **Staff:** `/(staff)/call/[sessionType]/[sessionId]`
- **Web:** `VideoCallPage.jsx` + `config/videoCall.js` + `hooks/useDailyCall`
- **Priority:** P1
- **Contract:** `contracts/api-daily-room.md`

---

## Path params

- `sessionType`: `coach` | `dietitian` | `doctor`
- `sessionId`: `members.data.*Sessions[].id` (ör. `bk-…`, `s-…`)

## Room name (server üretir; client fallback)

```js
roomPrefix = EXPO_PUBLIC_DAILY_ROOM_PREFIX || 'donusum'
safeId = sessionId.replace(/[^a-zA-Z0-9-_]/g, '')
roomName = `${roomPrefix}-${sessionType}-${safeId}`.toLowerCase()
```

## Token request (web parity — 2026-08-08)

```http
POST /api/daily-room
Authorization: Bearer …
Content-Type: application/json

{
  "sessionType": "coach",
  "sessionId": "<session.id>",
  "userName": "<displayName>"
}
```

- `isOwner` / `roomName` **gönderme** — server karar verir
- Member join: `isOwner: false` response
- Staff: `isOwner: true` response

### Success

```json
{ "ok": true, "token": "<jwt>", "roomUrl": "https://{domain}/{roomName}", "roomName": "…", "isOwner": false }
```

### Errors

Exact strings: `contracts/api-daily-room.md` — notably **`sessionId gerekli`** if body missing `sessionId`.

## Join window (web / `_videoJoinWindows.js`)

| Type | Before start | After session end |
|------|--------------|-------------------|
| coach | 10 dk | 20 dk |
| dietitian | 15 dk | 30 dk |
| doctor | 15 dk | 30 dk |

Status for token: **`scheduled` only** (not `rescheduled` / `pending`).

## UI / SDK

- Daily RN (`@daily-co/react-native-daily-js`) or WebView fallback
- Camera/mic permission before join
- Empty `sessionId` → client: `Randevu bulunamadı.` (no API call)

## Acceptance

- [ ] Schedule Katıl → call screen → token 200 (no `sessionId gerekli`)
- [ ] Body contains `sessionType` + `sessionId`
- [ ] Outside window: Turkish too_early / client countdown
