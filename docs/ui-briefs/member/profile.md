# Profil — UI Brief (Fable 5)

## Mevcut durum
Cover + avatar hero, uzman kartları, bilgi kartları ve edit modalı çalışıyor; genel iskelet LOCK'a uygun. Zayıf noktalar: hero'da düz gradient/kompozisyon, edit modalındaki fotoğraf satırında kullanıcıya görünen geliştirici metni ("UI-only: demo görsel atanır…") ve modalın sıkışık hissi.

## Hedef kompozisyon (viewport sırası)
1. (Varsa) `FreeTrialExpiredProfileAlert` — dokunma.
2. **Hero kartı**: cover görseli (PANEL_IMAGES.profileCover) + brand-600→brand-900 gradient; sağ üstte "Profili Düzenle" pill. Avatar (112, radius.xl, 4px beyaz çerçeve) coverin altına -56 taşmalı; ad (displayExtra 24), e-posta, MembershipBadge, plan pill (sage-50 zemin).
3. **Uzman kartları** (Koç / Diyetisyen / Doktor) hero içinde 3'lü satır — mevcut rota ve etiketler aynen.
4. Aktif paketler → Kişisel bilgiler → Sağlık özeti → Doğrulama → Bildirim ayarları kartları (LOCK sırası).
5. Hızlı bağlantılar (Takvim / Programlarım / Ödemeler / Üyelik) + "Çıkış Yap".

## Bileşen ve token detayı
- Hero kart: radius 28 (mevcut, izinli aralıkta 24'e çekilebilir), border cream-200, beyaz zemin.
- Cover gradient: `rgba(36,120,168,0.35)` → `rgba(26,69,92,0.85)` — alt kenarda biraz daha koyu bitir ki avatar çerçevesi netleşsin.
- Avatarsız durumda brand-400→sage-500 gradient + baş harf (mevcut) korunur.
- Uzman kartı ikon renkleri: brand-500 / sage-500 / warm-500 (mevcut). Atanmadıysa "Atanmadı" metni cream-800 %55 opaklık.
- Edit modal: bottom sheet, üst radius 28, tutamaç çizgisi (36×4, cream-200) ekle; "Kaydet" primary CTA min-height 48.

## Edit modal — fotoğraf satırı (odak)
- 56'lık önizleme kutusu (brand-50 zemin, brand-200 border) + kamera ikonu korunur; dokununca hafif scale-down feedback.
- **Geliştirici metnini değiştir.** Mevcut: "UI-only: demo görsel atanır. Gerçek yükleme bağlama sonrası."
  Yeni hint: **"Fotoğraf yükleme çok yakında. Şimdilik dokunarak örnek görseli deneyebilirsin."**
- Demo görsel atandıktan sonra hint: **"Örnek görsel atandı."** + önizlemede görsel.
- Sağ uçta küçük gold-400 "Yakında" rozeti (radius.full, gold zemin %12 opaklık) — kilit değil, beklenti yönetimi.

## Durumlar
- **Boş profil** (`registeredMember` false): ad yerine "Profil tamamlanacak" (mevcut, dokunma), avatar baş harf fallback.
- **Dolu**: tüm InfoRow'lar; boş alanlar "—".
- **Paket yok**: "Aktif ücretli paket yok" (mevcut metin korunur).
- **Kaydetme**: Kaydet butonunda spinner; toast **"Profil güncellendi"** (locked).

## Motion
1. Kart sırası: mevcut FadeIn kademesi (0/80/100/120…) korunur, translateY 12→0 eklenebilir.
2. Edit modal: slide-up + backdrop fade (Reanimated); kapanışta simetrik.
3. Demo görsel atanınca önizleme kutusunda tek seferlik scale 0.9→1 spring.

## Değişiklik listesi
- [ ] `photoHint` metnini yukarıdaki yeni Türkçe kopya ile değiştir; foto atandıysa "Örnek görsel atandı." göster.
- [ ] Fotoğraf satırına gold "Yakında" rozeti ekle (token: gold-400, radius.full).
- [ ] Modal karta tutamaç çizgisi + üst boşluk; alan grupları arasına spacing.sm.
- [ ] Cover gradientinin alt durağını koyulaştır (`rgba(26,69,92,0.85)`).
- [ ] Demo görsel atama davranışı korunur (updateProfile photo) — sadece sunum değişir.
- [ ] Hiçbir locked string (Profili Düzenle, Kaydet, Vazgeç, Çıkış Yap, Profil güncellendi) değişmez.

## Kabul kriterleri
- [ ] Kullanıcıya görünen hiçbir yerde "UI-only", "bağlama sonrası" ifadesi yok.
- [ ] Renk/radius/font yalnız 02-design-system tokenları; mor yok.
- [ ] LOCK bölüm sırası (cover→avatar→uzman→paket→bilgi→sağlık→doğrulama→ayar→link→logout) bozulmadı.
- [ ] Edit kaydet → "Profil güncellendi" toast; logout spinner çalışıyor.
- [ ] Uzman kart rotaları `/schedule?tab=…` aynen.
