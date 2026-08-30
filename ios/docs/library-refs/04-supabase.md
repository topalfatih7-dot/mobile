# 04 — Supabase JS

**Paket:** `@supabase/supabase-js` ^2.110.7  
**Docs:** https://supabase.com/docs/reference/javascript/introduction  
**Auth/Data contracts:** `docs/mobile/contracts/*`, `supabase-tables.md`

## Mobil kullanım

- Anon/publishable key: `EXPO_PUBLIC_SUPABASE_URL` + `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- Session: SecureStore / AsyncStorage pattern (proje auth client)
- Production password login: **`POST /api/auth`** — raw `signInWithPassword` production’da yok (LOCK §4)
- Realtime: chat threads, presence (`user_presence`), poll yedek ~8s
- Storage: exercise videos → signed URL (~15 dk), public webp thumbs

## Test checklist (veri)

- [ ] Login sonrası session restore (kill app → reopen)
- [ ] Logout tüm local session temiz
- [ ] Guest: published `posts` / public content okunuyor
- [ ] Member: RLS kendi satırı / chat
- [ ] Realtime mesaj + poll fallback
- [ ] Signed URL süresi dolunca yenileme (library playback)

## Asla

- Service role key mobil binary’de yok
- UI store entitlement’ını tek başına “paid” sayma → `members.membership` (F15)
