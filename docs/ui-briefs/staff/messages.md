# Staff Mesajlar (3 kanal) — UI Brief (Fable 5)

Kaynak: `app/(staff)/messages/index.tsx` + `[threadId].tsx` + `admin/[threadId].tsx` + `collab/[threadId].tsx`
LOCK: `docs/mobile/screens/staff/messages.md` + `collab-messages.md` + `admin-messages.md`

## Mevcut durum
- **Inbox**: yalnız danışan listesi; her satırda sabit "Sohbete dokunun" — gerçek önizleme yok, unread rozeti yok, admin/collab kanalları inbox'ta görünmüyor (overview linklerinden gidiliyor).
- **Danışan thread**: tam sohbet (composer + contactInfoGuard) — en olgun ekran; baloncuklar karaktersiz.
- **Admin thread**: statik 2 baloncuk, composer YOK, baloncukta **"UI-only demo sohbet."** metni.
- **Collab thread**: statik 1 baloncuk + **"UI-only collab shell — realtime bağlama sonrası."** hint'i; composer yok; LOCK'taki "Danışan adına: {member}" alt başlığı yok.

## Hedef kompozisyon
### Inbox (`messages/index.tsx`)
1. Header: "Mesajlar" + "Danışan sohbetleri" — korunur.
2. **Sabit kanallar bölümü** (üstte, "Diğer kanallar" ayırıcı olmadan iki özel satır): "Admin" (shield ikonu, brand) → `admin/ui-admin-1`; "Ekip" (git-network, sage) → `collab/ui-collab-1`, alt satır **"Danışan adına: Demo Üye"** (LOCK collab inbox kuralı). Yeni thread listesi uydurulmaz — mevcut tekil demo route'ları.
3. **Danışan sohbetleri**: avatar (baş harf, plan renkli) + isim + **gerçekçi son mesaj önizlemesi** + saat + unread rozeti. "Sohbete dokunun" silinir. Demo önizlemeler: Demo Üye → "Merhaba koçum, programı aldım." (thread ile tutarlı, unread 1); Ayşe Yılmaz → "Bu hafta 3 antrenman tamamladım 💪" · Dün; Mehmet Kaya → "Liste için teşekkürler." · Paz.

### Danışan thread (`[threadId].tsx`)
Mevcut yapı korunur; baloncuk köşe asimetrisi (kendi: sağ alt 6, karşı: sol alt 6), karşı baloncuk yanında 24 avatar dairesi. Composer + contactInfoGuard aynen.

### Admin thread (`admin/[threadId].tsx`)
Danışan thread'inin yapısal kopyası: header "Admin mesajları" + FlatList baloncuklar + **composer eklenir** (yerel state'e ekler). Demo açılış: Admin → "Merhaba, bu haftaki seans planını kontrol eder misiniz?" (korunur); staff cevabı "Evet, kontrol ettim. UI-only demo sohbet." → **"Kontrol ettim, plan hazır. İki danışan için saat güncellemesi gerekiyor."**. Admin baloncuk vurgusu brand-600 "Admin" etiketi.

### Collab thread (`collab/[threadId].tsx`)
Aynı thread yapısı: header "Ekip sohbeti" + alt başlık "Koç ↔ Diyetisyen" (korunur) + **"Danışan adına: Demo Üye"** bağlam satırı (LOCK). "UI-only collab shell…" hint'i silinir; demo mesajlar: Demo Diyetisyen → "Danışanın beslenme programını güncelledim." (korunur) + ekleme: "Öğle öğününe protein takviyesi ekledim, antrenman planını buna göre ayarlayabilirsin." Composer eklenir; karşı taraf etiketi sage-600.

## Bileşen ve token detayı
- Inbox satırı: mevcut row stili; unread rozeti 20 daire warm-500/beyaz sayı; önizleme 12pt cream-800 %65, saat 11pt cream-800 sağ üst.
- Baloncuklar: kendi brand-600/beyaz; karşı beyaz + cream-200 border; kanal kimlik rengi yalnız gönderen etiketi/avatarında (admin: brand-600, collab: sage-600, danışan: warm-500 avatar).
- Composer: danışan thread'indeki mevcut bileşen (min 44 input, 44×44 gönder) üç kanalda ortak; contactInfoGuard yalnız danışan kanalında (mevcut davranış).

## Durumlar (boş / dolu / hata / kilitli)
- **Dolu**: yukarıdaki demo içerik.
- **Boş mesaj gönderme**: "Mesaj boş." toast (mevcut, üç kanala da uygulanır).
- **Engel**: danışan kanalında iletişim bilgisi tespiti → CONTACT_INFO_BLOCK_MESSAGE (mevcut, birebir).
- **Kilitli**: yok.

## Motion
1. Yeni baloncuk: fade + translateY 8→0 (~200ms).
2. Inbox satırları sıralı FadeIn (mevcut).
3. Gönder butonu basışta scale 0.92→1.

## Değişiklik listesi
- [ ] Inbox: "Sohbete dokunun" yerine gerçekçi önizleme + saat + unread rozeti.
- [ ] Inbox'a Admin ve Ekip kanal satırları (collab'da "Danışan adına: Demo Üye").
- [ ] Admin thread'e composer + FlatList yapısı; "UI-only demo sohbet." metnini değiştir.
- [ ] Collab thread'e composer + bağlam satırı; "UI-only collab shell…" hint'ini sil.
- [ ] Baloncuklara köşe asimetrisi + karşı taraf avatarı (üç kanal ortak).

## Kabul kriterleri
- [ ] "UI-only", "bağlama sonrası", "Sohbete dokunun" ifadeleri görünmüyor.
- [ ] Collab inbox/thread'de peer adı birincil + "Danışan adına: {member}" alt satırı (LOCK birebir).
- [ ] contactInfoGuard davranışı ve CONTACT_INFO_BLOCK_MESSAGE değişmemiş.
- [ ] Yeni thread/route uydurulmamış; mevcut demo id'ler kullanılıyor.
- [ ] Tüm renkler token; mor yok; composer öğeleri ≥44.
