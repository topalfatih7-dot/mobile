# F06 — Book & Join Daily Call

1. Schedule tab shows coach/dietitian/doctor sessions  
2. Join when session window open **and** `status === 'scheduled'` → navigate `/(member)/call/:sessionType/:sessionId`  
3. `POST /api/daily-room` with Bearer → body `{ sessionType, sessionId, userName }` → `{ roomUrl, token, roomName, isOwner }`  
4. Daily RN join; mic/camera permissions  
5. Attendance tracking if web has `sessionAttendance` parity  

**sessionId** = session object `id` in `members.data.*Sessions[]` (not Daily room name).

Errors: `sessionId gerekli` (bad body), 401, Daily key missing, `too_early` / `expired` / `inactive`. Max 4 participants; token ~1h.

Join windows: coach 10/20 · dietitian 15/30 · doctor 15/30 (`api/_videoJoinWindows.js`).
