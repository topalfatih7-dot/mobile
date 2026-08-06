# Domain — Realtime

## Channels (web `useRealtimeSync`)

| Channel purpose | Table |
|-----------------|-------|
| tickets-sync | tickets |
| chat threads/messages | chat_threads, chat_messages |
| admin staff chat | admin_staff_* |
| collab chat | staff_collab_* |
| member row | members (filtered) |
| programs | programs |
| applications | staff/corporate/contact applications |
| admin-presence | user_presence (+ 15s poll when visible) |

## Mobile guidance

- Subscribe only while authenticated and screen tree mounted
- Re-subscribe on app foreground
- Avoid duplicate channels on React Strict remounts (web comment: session id stable)
- Push supplements realtime when backgrounded

## Chat presence (üye / staff sohbet)

Web parity — admin paneliyle sınırlı değil:

| Direction | Table / view |
|-----------|----------------|
| Write heartbeat | `user_presence` (60s; `OFFLINE_MS` 180s) |
| Chat peer read | `user_presence_public` (`user_id, last_seen_at, role`) |
| UI | Inbox avatar + thread “Çevrimiçi / Çevrimdışı” |

Mobil: `src/services/presence.ts` + `useChatPresence` + `PresenceBootstrap`.
