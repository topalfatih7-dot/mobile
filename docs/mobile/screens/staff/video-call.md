# Staff — Video Call (IMPLEMENTATION LOCK)

- Same route pattern as member: `/(staff)/call/[sessionType]/[sessionId]`
- Token: `POST /api/daily-room` with `{ sessionType, sessionId, userName }` (web parity)
- Server sets `isOwner: true` for staff/admin — client does not send `isOwner`
- See [`member/video-call.md`](../member/video-call.md) + [`contracts/api-daily-room.md`](../../contracts/api-daily-room.md)
