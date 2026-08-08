# Contract — POST /api/daily-room (LOCK)

Web parity: `Adsız/src/config/videoCall.js` → `getDailyToken(sessionType, sessionId, userName)`  
Server: `Adsız/api/daily-room.js`

## Request

```http
POST /api/daily-room
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "sessionType": "coach" | "dietitian" | "doctor",
  "sessionId": "bk-… veya s-…",
  "userName": "Ayşe"
}
```

Required: **`sessionId`** (trimmed).  
`sessionType` normalize: unknown → `coach`.  
`userName` default server-side: `Katılımcı`.

`sessionId` = `members.data.coachSessions|dietitianSessions|doctorSessions[].id`  
(Daily room adı **değil** — server `buildRoomName` üretir.)

Do **not** send `roomName` / `isOwner` — server decides ownership and room name.

## Success 200

```json
{
  "ok": true,
  "token": "<daily meeting token>",
  "roomUrl": "https://YOURDOMAIN.daily.co/donusum-coach-…",
  "roomName": "donusum-coach-…",
  "isOwner": false
}
```

## Errors (exact Turkish)

| HTTP | code | error |
|------|------|-------|
| 400 | bad_request | `sessionId gerekli` |
| 401 | — | `Oturum bulunamadı.` |
| 403 | forbidden | `Bu görüşme türüne erişiminiz yok.` / `Bu görüşmeye erişiminiz yok.` / `Randevu bulunamadı.` |
| 403 | inactive | `Bu randevu aktif değil veya iptal edilmiş.` |
| 403 | too_early | `Görüşme katılma penceresi henüz açılmadı.` |
| 403 | expired | `Görüşme süresi doldu.` |
| 405 | — | `POST bekleniyor` |
| 429 | rate_limit | `Çok fazla istek. Lütfen sonra tekrar deneyin.` |
| 503 | config | `DAILY_API_KEY tanımlı değil` / `Veritabanı yapılandırması eksik.` |

## Server room properties (do not change in mobile)

- privacy: private  
- exp: now+7200s  
- max_participants: 4  
- token exp: now+3600s  
- Join window: coach 10/20 · dietitian 15/30 · doctor 15/30 (`api/_videoJoinWindows.js`)  
- Status: only `scheduled`

## Client helper

Mobile: `getDailyRoomToken({ sessionType, sessionId, userName })` in `src/services/dailyRoom.ts`.
