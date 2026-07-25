# Ödemeler & Üyelik — UI Brief (Fable 5)

## Mevcut durum
Plan kartı, aktif paket listesi ve geri yükleme CTA'sı çalışıyor; sahte ödeme geçmişi yok (doğru). Zayıf noktalar: plan kartı düz beyaz ve hiyerarşisi zayıf, bilgi notu ve restore toast'ı geliştirici dili içeriyor ("RevenueCat bağlandığında…", "Sahte ödeme geçmişi gösterilmez").

## Hedef kompozisyon (viewport sırası)
1. **Başlık bloğu**: geri linki + "Ödemeler & Üyelik" + "Mevcut planınız ve abonelik yönetimi" (mevcut kopyalar korunur).
2. **Plan hero kartı**: gradient zemin, MembershipBadge, plan adı büyük, bitiş/durum satırı, "Planları incele" CTA.
3. **Aktif paketler**: bölüm başlığı + paket satır kartları (plan etiketi + bitiş).
4. **Abonelik yönetimi**: yumuşak bilgi kutusu + "Satın almaları geri yükle" secondary CTA.

## Bileşen ve token detayı
- Plan hero kartı: brand-600→brand-800 LinearGradient zemin, radius 24; badge ve plan adı beyaz (displayExtra 24); bitiş satırı `rgba(255,255,255,0.8)`. Free planda gradient yerine beyaz kart + brand-100 border (ücretsizlik hissi abartılmasın).
  - Bitiş metni: "Bitiş: d MMMM yyyy" (mevcut format); yoksa "Ücretsiz plan" / "Aktif abonelik" (mevcut).
  - "Planları incele" CTA: gradient kart üstünde beyaz zemin + brand-700 metin (min-height 48); free kartta primary brand-600.
- Paket satırı: beyaz kart, cream-200 border, radius 16; solda 36'lık sage-50 daire + sage-600 `cube` ikonu; sağda bitiş metni. "Süresiz / tek seferlik" mevcut metin korunur.
- Bilgi kutusu: mevcut gold tonlu kutu korunur (gold-400 %35 border, `#fbf6ea` yerine warm-50 tercih edilir — token dışı hex bırakma).
  - **Metin değişimi.** Mevcut: "Abonelik yönetimi ve satın almaları geri yükleme, RevenueCat bağlandığında burada açılacak. Sahte ödeme geçmişi gösterilmez."
    Yeni: **"Abonelik yönetimi ve satın alma geri yükleme çok yakında burada. Ödemeleriniz uygulama mağazası hesabınız üzerinden güvenle yönetilecek."**
- Restore CTA toast. Mevcut: "Geri yükleme RevenueCat bağlandıktan sonra kullanılabilir." → Yeni: **"Satın alma geri yükleme çok yakında aktif olacak."** (info)
- ÖNEMLİ: Ödeme geçmişi bölümü **ekleme** — gerçek `payments` verisi bağlanana dek liste yok (LOCK: sahte geçmiş yasak).

## Durumlar
- **Free üye**: beyaz plan kartı, "Ücretsiz plan" satırı, paket bölümü gizli (packages boş), bilgi kutusu + restore görünür.
- **Ücretli / dolu**: gradient kart + bitiş tarihi + aktif paket listesi.
- **Süresi geçmiş** (`membershipStatus !== 'active'`): MembershipBadge status gösterir (mevcut); kart gradientini brand yerine cream-800→cream-900 koyusuna çevirme — sadece badge yeter, kart aynı kalır.
- **Hata**: yok (yerel veri).

## Motion
1. Kartlar: mevcut FadeIn kademesi (0/60/100/140) + translateY 12→0.
2. Plan hero kartı: girişte hafif scale 0.97→1.
3. Restore butonu basışta scale feedback; toast standart.

## Değişiklik listesi
- [ ] Plan kartını gradient hero'ya dönüştür (free için beyaz varyant); CTA kontrastını ayarla.
- [ ] Bilgi kutusu metnini ve restore toast metnini yukarıdaki kullanıcı-dostu kopyalarla değiştir.
- [ ] `#fbf6ea` sabitini warm-50 (`#fff9f5`) tokenına çevir.
- [ ] Paket satırlarına ikon dairesi + hizalı bitiş metni.
- [ ] Ödeme geçmişi / fatura listesi EKLENMEDİĞİNİ koru; hiçbir mock satır yok.

## Kabul kriterleri
- [ ] Kullanıcıya görünen hiçbir yerde "RevenueCat", "sahte", "bağlandığında" ifadesi yok.
- [ ] Sahte ödeme geçmişi yok; entitlement verisi member'dan geliyor (değişmedi).
- [ ] "Planları incele" `/(public)/membership` rotası ve "Satın almaları geri yükle" etiketi korunur.
- [ ] Tüm renkler 02-design-system tokenları; CTA min-height 48.
