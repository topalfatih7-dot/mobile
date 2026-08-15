# Staff — Member Messages (LOCK) (IMPLEMENTATION LOCK)

- **Expo:** `/(staff)/messages` + `/(staff)/messages/[memberId]`
- **Web:** `/staff/messages`, `/staff/messages/:memberId` → `StaffMessagesPage.jsx`
- Same chat-model as member; senderType staff
- Route optional `:memberId` (param adı Expo’da `threadId` — değer member id)
- `ensureStaffChatThreads` / `loadStaffClientThread`
- Unread `staffUnread`

## Layout

1. Inbox: admin channel row + danışan listesi  
2. Search: **Danışan ara…** — isme göre filtre  
3. Presence: avatar nokta (inbox) + thread header `Çevrimiçi` / `Çevrimdışı` (`useChatPresence` / `user_presence_public`)  
4. Thread: header (isim + rol · plan) → `ChatCollapsiblePrograms` (coach → workout, dietitian → nutrition; **doctor → gizli**) → mesajlar → composer  

## MOBILE DIFF — split-pane

Web geniş ekranda inbox + thread yan yana (`ChatWorkspace`). Mobilde **inbox → thread push** (stack navigation): `/(staff)/messages` listesi, satıra dokununca `/(staff)/messages/[memberId]`. Split-pane yok; geri ile inbox’a dönüş.
