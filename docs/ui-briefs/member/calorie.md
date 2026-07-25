# Kalori — UI Brief (Fable 5)

## Mevcut durum
Chat-first akış (inverted FlatList + composer) ve paket kilidi çalışıyor. Zayıf noktalar: baloncuklar karaktersiz, asistan yanıtı beklerken görsel geri bildirim yok, foto/vision butonunun toast metni geliştirici dili ("bağlama sonrası açılacak").

## Hedef kompozisyon (viewport sırası)
1. **Header**: geri ok + "Kalori" başlık + "Metin ile öğün analizi" alt metin (mevcut kopya korunur); sağda foto butonu (aşağıda).
2. **Mesaj listesi** (chat-first, inverted): asistan baloncukları solda küçük marka rozeti ile, kullanıcı baloncukları sağda brand-600.
3. **Composer**: çok satırlı input + gönder butonu; input odaklıyken border brand-300.

## Bileşen ve token detayı
- Asistan baloncuğu: beyaz zemin, cream-200 border, radius.lg; sol alt köşe radius 6 (konuşma yönü hissi). Yanında 24'lük daire: brand-50 zemin + brand-600 `sparkles` ikonu.
- Kullanıcı baloncuğu: brand-600 zemin, beyaz metin; sağ alt köşe radius 6.
- Karşılama mesajı (mevcut metin aynen): baloncuk içinde örnek satırı cream-800 %65 opaklıkta ikinci satır olarak.
- Composer: `rgba(255,255,255,0.92)` zemin, üst border cream-200 (mevcut); gönder butonu 44×44 brand-600, pasifken %45 opaklık (mevcut).
- **Foto/vision butonu — kilitli/yakında sunumu (odak):**
  - `canPhoto` true: kamera ikonu + butonun altına yapışık minik gold-400 "Yakında" rozeti (radius.full, 9pt). Dokununca toast metni değişir. Mevcut: "Fotoğraf analizi bağlama sonrası açılacak." → Yeni: **"Fotoğrafla kalori analizi çok yakında! Şimdilik öğününü yazarak analiz edebilirsin."** (info)
  - `canPhoto` false: kilit ikonu cream-300 (mevcut); toast: "Fotoğraf analizi paketinizde yok." (mevcut, korunur — warning).
- Kilit ekranı (!canManual): mevcut metinler locked ("Kalori AI paketinizde yok", "Paketleri gör") — yalnız görsel: warm-100 zeminli 72'lik daire içinde kilit ikonu, kart ortalı.

## Durumlar
- **Boş / ilk açılış**: yalnız karşılama baloncuğu.
- **Dolu**: mesaj geçmişi; uzun asistan yanıtları satır sonlarıyla (formatAnalysisReply çıktısı, emoji'ler korunur).
- **Bekleme (busy)**: listeye geçici "yazıyor" baloncuğu — üç nokta pulsu (asistan stili, metinsiz); input `editable=false` (mevcut).
- **Hata / boş sonuç**: `formatAnalysisReply` locked metni ("Yiyecek tespit edilemedi…") aynen baloncukta.
- **Kilitli**: yukarıdaki kilit ekranı.

## Motion
1. Yeni baloncuk: fade + translateY 8→0 (Reanimated, ~200ms).
2. "Yazıyor" göstergesi: üç noktada sıralı opacity pulsu (loop).
3. Gönder butonu: basışta scale 0.92→1.

## Değişiklik listesi
- [ ] Foto butonu toast metnini (canPhoto=true dalı) yeni kullanıcı-dostu kopya ile değiştir.
- [ ] Foto butonuna "Yakında" gold rozeti ekle (yalnız canPhoto=true iken).
- [ ] Asistan baloncuklarına marka rozeti + asimetrik köşe radius; kullanıcı baloncuğuna simetrik karşılığı.
- [ ] `busy` iken "yazıyor" baloncuğu (üç nokta pulsu) ekle; yanıt gelince kaldır.
- [ ] Baloncuk giriş animasyonu (fade+slide) ekle.
- [ ] Kilit ekranına ikon dairesi + kart kompozisyonu; metinler aynen.

## Kabul kriterleri
- [ ] "bağlama sonrası" ifadesi kullanıcıya hiçbir yerde görünmüyor.
- [ ] Gate sırası değişmedi: manual yoksa kilit ekranı, foto yoksa kilitli buton; mock analiz mantığına dokunulmadı.
- [ ] Locked stringler (karşılama, "Metin gerekli", "Metin çok uzun (max 2000 karakter)", kilit metinleri) birebir.
- [ ] Chat-first layout korunur (liste + composer); yeni alan/özellik yok.
- [ ] Tüm renkler token; mor yok.
