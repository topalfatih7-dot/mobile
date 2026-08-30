# F07 — Member ↔ Staff Chat

1. Messages — threads by staff role (coach/dietitian/doctor) if assigned  
2. Open thread → load messages; realtime insert; inverted list + date chips; keyboard keeps latest message above composer  
3. Send text → insert `chat_messages` sender_type=member; list stays pinned to newest (inverted index 0)  
4. Unread badge on nav; mark read on open  
5. Push (mobile): notify staff/member on new message  

Thread uniqueness: `(member_id, staff_role)`. No assignment → empty state “Uzman atanmadı”.
