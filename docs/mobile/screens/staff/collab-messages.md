# Staff — Collab Messages (LOCK) (IMPLEMENTATION LOCK)

- **Expo:** `/(staff)/messages/collab` + `/(staff)/messages/collab/[memberId]`
- **Web:** `/staff/collab-messages` → `StaffCollabMessagesPage.jsx`
- Roles: **coach | dietitian | doctor** (nav + route gates doctor’ı reddetmez)
- Tables: `staff_collab_*` (`doctor_id`, `doctorUnread`, `doctorName` web parity)
- Inbox: peer name primary (role’e göre diğer ekip isimleri), subtitle `Danışan adına: {member}`
- Doctor: yalnızca ortak collab-eligible + doktor atamalı danışanlar (`getStaffCollabMembers`)

## MOBILE DIFF — split-pane

Web geniş ekranda inbox + thread yan yana. Mobilde **inbox → thread push** (`/(staff)/messages/collab` → `.../collab/[memberId]`).
