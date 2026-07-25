# Admin Destek — UI Brief (Fable 5)

> Kaynak: `app/(admin)/support.tsx` · LOCK: `docs/mobile/screens/admin/support.md`
> Veri: `DEMO_ADMIN_TICKETS` (subject, category, memberName, messages[], status). Yanıt **yerel state** + toast; sendTicketReply bağlanmaz. Durum etiketleri kilitli: Bekliyor / İşleme Alındı / Çözüldü.

## Mevcut durum
Ticket kartları + seçilince altta sabit detay kutusu var. Sorunlar: detay listeyle aynı sayfada itişiyor (sheet değil); mesaj geçmişi hiç gösterilmiyor (t1'de üye mesajı var); yanıt bir composer değil "Yanıt gönder (demo)" tek butonu; durum rozeti yok, durum düz metin.

## Hedef kompozisyon
1. **Başlık**: "Destek" + subtitle "Destek talepleri" (kalır).
2. **Ticket kartı**: üst satır konu + durum rozeti; alt satır üye adı + kategori; en altta son mesaj önizlemesi (varsa, tek satır ellipsis) + göreli zaman.
3. Karta dokun → **yanıt bottom sheet**:
   - Grabber + konu başlığı + durum rozeti + "{memberName} · {category}" alt satırı.
   - **Mesaj geçmişi**: `messages[]` balonları — üye solda beyaz/cream-200 border, admin sağda brand-600 zemin beyaz metin; boş geçmişte cream-800 "Henüz mesaj yok." satırı.
   - **Composer**: çok satırlı TextField ("Yanıtını yaz…" placeholder) + sağında 48×48 brand-600 yuvarlak gönder butonu (`send` ikonu).
4. Gönder → mesaj yerel listeye admin balonu olarak eklenir, alan temizlenir, toast **"Mesajınız gönderildi"** (mevcut kilitli metin), sheet açık kalır. Ticket "Bekliyor" ise rozet yerelde **"İşleme Alındı"** olur (LOCK: open → in-progress on admin reply).

## Bileşen ve token detayı
- Durum rozeti (radius.full, 11pt): Bekliyor warm-100/warm-500 · İşleme Alındı brand-100/brand-700 · Çözüldü sage-100/sage-700.
- Kart: beyaz, radius 20, cream-200 border; konu `fonts.sansSemi` 15 cream-900; önizleme `fonts.sans` 12 cream-800 italic yok (düz).
- Sheet: beyaz, üst radius 24, grabber cream-300; scrim cream-900 %40; içerik maksimum ekranın %85'i, mesaj listesi kaydırılabilir.
- Balon: radius 16, padding 12; üye balonu metin cream-900; admin balonu beyaz metin; altında 10pt zaman etiketi cream-800 (admin balonunda brand-100).
- Composer: klavye açılınca sheet ile birlikte yükselir (KeyboardAvoiding); gönder butonu boş metinde %50 opak ve pasif.

## Durumlar
- Mesajsız ticket (t2): geçmiş alanında "Henüz mesaj yok." satırı; composer aktif.
- Gönderim sonrası: yeni admin balonu listede, rozet güncel.
- Liste boş olamaz (demo sabit) — boş durum tasarlanmaz.

## Motion
1. Sheet açılış/kapanış: translateY spring + scrim fade.
2. Yeni balon: alttan fade + translateY 8→0; liste otomatik en alta kayar.
3. Rozet Bekliyor→İşleme Alındı: renk geçişi ~200ms.

## Değişiklik listesi
- [ ] Sayfa içi detay kutusunu kaldır; yanıt bottom sheet'e taşı.
- [ ] Mesaj geçmişi balonları (messages[] verisinden) + boş geçmiş satırı.
- [ ] "Yanıt gönder (demo)" tek butonu → gerçek composer (çok satır alan + gönder butonu).
- [ ] Kartlara durum rozeti + son mesaj önizlemesi + göreli zaman.
- [ ] Admin yanıtında yerel open→in-progress durumu.

## Kabul kriterleri
- [ ] STATUS etiketleri (Bekliyor / İşleme Alındı / Çözüldü) ve toast "Mesajınız gönderildi" birebir korunur.
- [ ] Yalnız DEMO_ADMIN_TICKETS alanları; yeni alan/kategori icat edilmez.
- [ ] Ekranda "demo" / "UI-only" ibaresi görünmez; renkler token; UI Türkçe.
