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
- Native join fail + WebView: toast **Tarayıcı görüntülü görüşmesi açılıyor. Kamera ve mikrofon izni gerekecek.** `roomUrl` / `EXPO_PUBLIC_DAILY_DOMAIN` yoksa `console.error('[daily] room URL missing', …)`
- Camera/mic permission on call screen open
- **Pre-join preview (web parity):** `startCamera()` yerel önizleme; mic/cam toggle join öncesi; “Görüşmeye katılmadan önce cihazlarınızı test edebilirsiniz.”
- Join: preview call object **reuse** (destroy → yeni object yok)
- Exit / Geri dön: `destroy()` (kamera kapanır)
- Empty `sessionId` → client: `Randevu bulunamadı.` (no API call)
- MOBILE DIFF: cihaz seçici dropdown yok (web desktop)
- **MOBILE DIFF (2026-08-20):** Görüşme ekranındayken Android’de Ana Ekran / başka uygulama: Daily ön plan servisi ile kamera+mikrofon akışı sürer (Play `FOREGROUND_SERVICE_CAMERA` = arka planda kamera görüntü akışı). Uygulama içinde başka rotaya çıkmak unmount → `destroy()`; canlı yayın dosya yüklemesi değildir.
- **MOBILE DIFF (2026-08-21) iOS:** arka planda kamera kapalı (Apple). Ses `voip` background mode (Daily WebRTC). `audio` mode yok (expo-audio kaldırıldı; App Store incelemesi). PushKit gelen arama yok. Ekran paylaşımı yok. Daily Expo config plugin kullanılmaz (SDK 55 peer + Android 16 KB / overlay riski); plist + `withDailyForegroundService`.
- **MOBILE DIFF (2026-08-29):** Daily native’de kamera yönü (`cycleCamera`, ön ↔ arka). Ön kamera local tile mirror; arka kamera mirror kapalı. Canlı odada kendi görüntüsü (PIP) sahne içinde sürüklenebilir; kenarlardan taşmaz, varsayılan sağ-alt. Boyut telefon genişliğine göre ölçeklenir. WebView fallback Daily prebuilt UI kullanır (özel PIP/çevirme yok).
- **Oda katılım bildirimi:** Native veya WebView odaya girince karşı tarafa `call-join` (RPC + Expo). Ayrıntı: [`notifications-model.md`](../../domains/notifications-model.md).

## Acceptance

- [ ] Schedule Katıl → call screen → local camera preview before join
- [ ] Mic/cam toggle works in preview
- [ ] Camera reverse (ön ↔ arka) preview + canlı oda
- [ ] Self-view PIP sürüklenir, ekrandan taşmaz
- [ ] Görüşmeye katıl → token 200 (no `sessionId gerekli`); same Daily call object reused
- [ ] Body contains `sessionType` + `sessionId`
- [ ] Outside window: Turkish too_early / client countdown
- [ ] Geri dön stops camera / leaves preview
