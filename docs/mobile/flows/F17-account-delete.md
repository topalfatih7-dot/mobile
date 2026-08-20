# F17 — Hesap silme (Play / KVKK)

Play URL: `https://www.yeniform.com/hesap-silme`  
Web: `DeleteAccountPage.jsx` (public)  
Mobil: profil linki → JWT handoff (`openWebAccountDeleteHandoff`). Native silme formu yok.

## Actors

Üye (e-posta/şifre). Personel / admin self-servis yok → `info@yeniform.com`.

## Steps

1. Kullanıcı `/hesap-silme` açar (Play, footer, profil).
2. Giriş yoksa `/login` (`from=/hesap-silme`).
3. Uyarılar + şifre + onay kutusu.
4. `POST /api/auth` `{ action: "delete-account", ack: true, password, emailConfirm? }` Bearer JWT.
5. Sunucu: rol kontrolü → şifre doğrula → Stripe abonelikleri hemen kapat (`prorate: false`) → `members` + auth user + lab dosyaları silinir.
6. İstemci çıkış → `/hesap-silme?done=1`.
7. **MOBILE DIFF:** Native form yok. Web silince uygulama JWT’si süre dolana kadar yerelde kalabilir. Ön plana dönüşte `members` satırı **kesin yoksa** (timeout/ağ değil) yerel `signOut` → landing + toast **Hesabınız silindi**. Ödeme handoff hatası oturumu silmez.

## API

Başarı: `{ ok: true }`  
Hata: `{ ok: false, error }` — 401 oturum/şifre, 400 onay, 403 personel, 502 Stripe.

Rate limit: 5 / saat.

## Data

Silinir: hesap, sağlık, program, sohbet, push token, lab dosyaları.  
Saklanabilir: Stripe yasal fatura kayıtları. İade yok (hemen kapat ile aynı).

## Failure

Stripe iptal fail → hesap silinmez.  
Mobil handoff fail → toast; uygulama oturumu durur.  
Silme başarılı, uygulamaya dönüş → yerel oturum kapanır (JWT hâlâ geçerli olsa bile).

## Acceptance

- [ ] Girişsiz sayfa Play için açıklama + giriş CTA içerir
- [ ] Onay’sız istek 400
- [ ] Üye silinince aynı e-posta ile giriş çalışmaz
- [ ] Aktif Stripe sub iptal (iade yok)
- [ ] Staff/admin 403 + mailto
- [ ] Mobil profil linki `/hesap-silme` handoff
- [ ] Silme sonrası uygulamaya dönüşte panel kullanılamaz (yerel çıkış + landing)
