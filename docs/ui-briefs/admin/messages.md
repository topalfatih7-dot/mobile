# Admin Mesajlar (Personel) — UI Brief (Fable 5)

> Kaynak: `app/(admin)/messages/index.tsx` + `messages/[threadId].tsx` · LOCK: `docs/mobile/screens/admin/messages.md`
> Veri: `DEMO_STAFF`. Yalnız staff thread modu polish edilir (audit/collab mobilde ayrı iş — yeni ekran icat edilmez). Gönderim yerel state.

## Mevcut durum
**Inbox**: personel satırları ham İngilizce rol ("coach") basıyor; avatar/önizleme yok. **Thread**: tek kutuda "UI-only demo — personel ile yazışma bağlama sonrası." geliştirici metni; başlık "Admin mesaj" garip; balon listesi ve composer yok.

## Hedef kompozisyon

### Inbox (`messages/index.tsx`)
1. Başlık "Mesajlar" + subtitle "Personel sohbetleri" (kalır).
2. Satır: rol renkli avatar (baş harf) + personel adı + Türkçe rol etiketi (**Koç / Diyetisyen / Doktor**); sağda son mesaj göreli zamanı + chevron.
3. Satır altında son mesaj önizlemesi (tek satır ellipsis) — thread'in yerel demo tohum mesajından.

### Thread (`messages/[threadId].tsx`)
1. Başlık: personel adı; subtitle: Türkçe rol etiketi ("Admin mesaj" başlığı kalkar).
2. **Balon listesi**: yerel demo tohum sohbeti — her personel için 2-3 gerçekçi balon, ör. Koç: personel "Yeni üyenin programını bugün hazırlıyorum." / admin "Teşekkürler, atamasız üyeleri de kontrol edelim."; Diyetisyen: "Diyet listeleri güncellendi."; Doktor: "Perşembe randevularım onaylandı." Personel solda beyaz balon, admin sağda brand-600 balon.
3. **Composer**: alt sabit — çok satırlı alan ("Mesajını yaz…" placeholder) + 48×48 brand-600 gönder butonu. Gönder → balon yerel listeye eklenir, alan temizlenir (toast gerekmez; balonun görünmesi geri bildirimdir).

## Bileşen ve token detayı
- Avatar 40×40: koç brand-100/brand-700, diyetisyen sage-100/sage-700, doktor warm-100/warm-500 baş harf.
- Inbox satırı: beyaz, radius 20, cream-200 border, min 64.
- Balon: radius 16 (konuşan tarafın alt köşesi 4); üye tarafı yok — taraflar personel/admin. Personel balonu beyaz + cream-200 border, cream-900 metin; admin balonu brand-600, beyaz metin; altında 10pt zaman.
- Composer çubuğu: beyaz zemin, üstte cream-200 hairline; safe-area alt padding; gönder butonu boş metinde pasif %50 opak.
- Thread zemin: mevcut MeshBackground (PanelScaffold) kalır; balon listesi `spacing.sm` dikey aralık.

## Durumlar
- Geçersiz threadId: EmptyState "Sohbet bulunamadı."
- Tohum mesajlar oturum içinde yereldir; ekrandan çıkıp dönünce sıfırlanması kabul (UI-only).
- Inbox boş olamaz (DEMO_STAFF sabit).

## Motion
1. Inbox satırları: 40ms stagger FadeIn.
2. Thread açılış: balonlar alttan sıralı fade.
3. Gönderilen balon: translateY 8→0 + fade; liste en alta kayar.

## Değişiklik listesi
- [ ] Inbox: ham rol stringi → Türkçe etiket; rol renkli avatar + son mesaj önizleme + zaman.
- [ ] Thread: "UI-only demo — personel ile yazışma bağlama sonrası." kutusunu kaldır; personel başına gerçekçi tohum sohbet balonları.
- [ ] Thread başlığını personel adı yap; composer (alan + gönder) ekle, yerel gönderim.
- [ ] Gönder butonu boş metinde pasif.

## Kabul kriterleri
- [ ] Yeni ekran/mod (audit, collab) eklenmedi; route yapısı aynen.
- [ ] Ekranda İngilizce rol/"UI-only" metni kalmadı; tohum kopyalar Türkçe ve alan uydurmuyor.
- [ ] CTA/composer dokunma hedefleri ≥48; renkler token.
