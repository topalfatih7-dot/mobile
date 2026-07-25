# Admin Üyeler (Liste + Detay) — UI Brief (Fable 5)

> Kaynak: `app/(admin)/members/index.tsx` + `members/[id].tsx` · LOCK: `docs/mobile/screens/admin/members.md` + `member-health.md`
> Veri: `DEMO_CLIENTS` + `DEMO_STAFF` + `getPlanLabel`. Salt sunum polish'i; adminPatchMember/remove bağlanmaz.

## Mevcut durum
**Liste**: arama + düz satırlar çalışıyor; satırda avatar/plan rozeti yok, arama sonucu boşken hiçbir şey görünmüyor. **Detay**: tek düz kartta etiket-değer çiftleri; "Sağlık testi: UI-only — admin analiz bağlama sonrası" geliştirici metni ekranda; atanan uzmanlar (DEMO_CLIENTS'ta mevcut alanlar) hiç gösterilmiyor; member-health LOCK'undaki sağlık özeti sunumu yok.

## Hedef kompozisyon

### Liste (`members/index.tsx`)
1. Başlık "Üyeler" + subtitle "Üye listesi" (kalır); arama alanına brand-600 `search` ikonu.
2. Satır: avatar (baş harf, cinsiyete göre zemin: female warm-100/warm-500, male brand-100/brand-600) + ad + e-posta; sağda plan rozeti (`getPlanLabel`) + chevron.
3. Arama sonucu boş: EmptyState — "Aramanla eşleşen üye yok."

### Detay (`members/[id].tsx`) — kart sırası
1. **Profil kartı**: büyük avatar + ad + plan rozeti; altında e-posta ve telefon satırları (ikonlu).
2. **Atanan ekip kartı**: assignedCoachId / assignedDietitianId / assignedDoctorId → DEMO_STAFF isimleri; atanmamış rol için cream-800 "Atanmadı" metni. Başlık: "Atanan ekip".
3. **Sağlık özeti kartı** (member-health LOCK: admin tam görür): başlık "Sağlık özeti"; demo üyelerde test verisi boş olduğundan durum satırı **"Sağlık testi henüz tamamlanmadı"** + cream-800 açıklama "Üye testi tamamladığında analiz burada görünür." — geliştirici dili yok, gerçek boş durum dili var.
4. **Hızlı aksiyon satırı**: "Paketi düzenle" secondary buton → `/(admin)/premium` sayfasına yönlendirir (members LOCK: "premium edit" bağlantısı; yeni ekran icat edilmez).

## Bileşen ve token detayı
- Satır/kart: beyaz, radius 20, cream-200 border; satır min 56.
- Plan rozeti: premium brief ile aynı stil (brand-50/brand-700; Basic cream-100/cream-800).
- Detay profil kartı: üstte brand-50→beyaz dikey `expo-linear-gradient` şerit (atmosfer, sayfanın mesh'iyle uyumlu); avatar 56×56.
- Bilgi satırı: solda 28×28 cream-100 kutuda cream-800 ikon (`mail`, `call`), değer `fonts.sans` 15 cream-900.
- Atanan ekip satırı: rol etiketi (Koç/Diyetisyen/Doktor) `fonts.sansSemi` 12 brand-600; isim 15 cream-900.
- Sağlık kartı boş durumu: sage-50 zemin, sage-200 border, sage-600 `pulse` ikonu — bilgilendirici, hata değil.
- Kart bölüm başlıkları: `fonts.sansSemi` 12 brand-600 uppercase.

## Durumlar
- Liste boş arama → EmptyState.
- Detayda üye bulunamazsa (geçersiz id): başlık "Üye" + EmptyState "Üye bulunamadı." (mevcut '—' değerleri yerine).
- Sağlık verisi boş → 3. karttaki bilgilendirici durum.

## Motion
1. Liste satırları: 40ms stagger FadeIn.
2. Detay kartları: sıralı fade + translateY 12→0.
3. Arama yazarken liste değişimi: yumuşak fade (LayoutAnimation/Reanimated).

## Değişiklik listesi
- [ ] Liste satırına avatar + plan rozeti; aramaya ikon; boş sonuç EmptyState.
- [ ] Detayı tek karttan 3 kart + aksiyon satırına böl (profil / atanan ekip / sağlık özeti).
- [ ] "UI-only — admin analiz bağlama sonrası" → "Sağlık testi henüz tamamlanmadı" boş durum kartı.
- [ ] Atanan ekip kartını DEMO_CLIENTS'taki assigned* alanlarından doldur.
- [ ] "Paketi düzenle" butonu → mevcut premium ekranına yönlendirme.

## Kabul kriterleri
- [ ] Yalnız DEMO_CLIENTS/DEMO_STAFF alanları kullanıldı; yeni alan/ekran yok.
- [ ] Sağlık kartı admin görünürlük kuralına uygun (member-health LOCK) ama veri uydurmuyor.
- [ ] "UI-only" / "bağlama sonrası" ibareleri ekrandan kalktı; UI Türkçe, renkler token.
