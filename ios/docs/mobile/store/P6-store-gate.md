# P6 Store paket — iOS

## Kod / şablon

- [x] `ios-listing.tr.md` (dolu — tıbbi uyarı + IAP yok + tanıtım/copyright)
- [x] `ios-app-store.md` + `ios-asc-forms.md` (App Privacy; yaş anketi; inceleme notu)
- [x] `screenshot-checklist.md`
- [x] Legal URL’ler (yeniform.com)
- [x] Hesap silme canlı: https://www.yeniform.com/hesap-silme
- [ ] iPhone 6.7" screenshot 1290×2796 — sen, TestFlight IPA

## Test yolu

iOS: onaylı `npm run build:ios` (`eas.json` profil `app-store`) → TestFlight Internal (`ios-app-store.md`). Ad hoc UDID: `ios-preview-build.md`. **Onaysız eas build yok.** Android AAB bu klasörden üretilmez.

## Senin işin

- [ ] Apple Developer + ASC uygulama `com.yeniform.app` (Push; IAP yok)
- [ ] EAS APNs `.p8` (ilk `build:ios`)
- [ ] Onaylı `npm run build:ios` → TestFlight Internal
- [ ] iOS smoke: satın alma CTA yok, ödeme yönetimi yok, push, Daily, hesap silme
- [ ] iPhone 6.7" screenshot + ASC listing / App Privacy / inceleme notu (`ios-asc-forms.md`)

## Legal

yeniform.com gizlilik / kullanım / hesap silme.
