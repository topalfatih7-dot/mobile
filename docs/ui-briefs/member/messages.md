# Üye Mesajlar — UI Brief (Fable 5)

Kaynak: `app/(member)/messages/index.tsx` + `[threadId].tsx` · LOCK: `docs/mobile/screens/member/messages.md`

## Mevcut durum

Liste (rol tabları + thread satırları) ve thread ekranı (header, balonlar, composer, consent modal) LOCK yapısına uygun. Zayıf noktalar: thread listesi görsel olarak düz (avatar hep aynı ikon/renk), balonlarda zaman bilgisi yok, consent modal ortada kuru bir kart, composer'da gönder butonu 44 (CTA-benzeri ama yeterli).

## Hedef kompozisyon (viewport sırası)

### Liste (`index.tsx`)
1. Geri linki → başlık **Mesajlar** → alt başlık (mevcut string'ler).
2. **Rol tabları** (yalnız contact'ı olan roller): segment satırı; aktif tab brand-600 dolu; unread toplamı warm-500 mini rozet.
3. **Thread satırları**: role göre renkli avatar (koç=brand-500, diyetisyen=sage-500, doktor=warm-400), ad + son mesaj önizleme, sağda memberUnread rozeti (brand-600) veya chevron.
4. **Boş durum**: "Henüz uzman atanmadı" / "Sohbet yok" (mevcut).

### Thread (`[threadId].tsx`)
1. Yarı saydam header: geri + staffName + rol etiketi.
2. Mesaj listesi: benim balonlarım brand-600 sağda, karşı taraf beyaz+cream-200 solda; balon altına saat (HH:mm) Inter 10 cream-800/0.6 — LOCK'ta yasak değil, veri `createdAt`'ten.
3. Composer: çok satırlı input + brand-600 gönder butonu; consent yoksa input disabled, placeholder "Önce onay gerekli".
4. **Consent modal** (`!memberConsentAt`): başlık "Sohbet onayı" → açıklama → checkbox → "Onayla ve devam et" / "Vazgeç" (mevcut string'ler korunur).

## Bileşen ve token detayı

- Rol tab: min yükseklik 44 (mevcut); aktif brand-600 zemin/beyaz metin; pasif beyaz + brand-200 border. Rozet warm-500, 18px.
- Avatar 44, radius 14; rol renk eşlemesi yukarıdaki gibi — yeni renk icat etme, hepsi token.
- Thread satırı: min 72, beyaz, radius `radius.xl`, cream-200 border; ad Inter semi 16, önizleme Inter 13 cream-800, `numberOfLines={1}`.
- Balon: radius `radius.lg`, kuyruk köşesi 4 (mevcut); benimki brand-600/beyaz metin, diğeri beyaz/cream-900; max genişlik %82.
- Composer: input min 44 / max 120, beyaz, cream-200 border; gönder 44×44 radius 14 brand-600; disabled opacity 0.45.
- Consent modal kartı: radius `radius.xl`, üstte brand-100 zeminli kalkan (shield-checkmark) ikon rozeti; primary buton min 48.

## Durumlar

- **Uzman yok:** EmptyState (chatbubbles-outline) — mevcut string.
- **Rol boş:** "Sohbet yok" EmptyState.
- **Consent yok:** modal + composer disabled; onay sonrası toast "Onay kaydedildi."
- **Gönderim hatası:** toast (Mesaj boş. / iletişim bloğu mesajı) — string'ler LOCK'tan, dokunma.
- **Okundu:** thread açılınca `markChatThreadRead` → rozet kaybolur.

## Motion (Reanimated)

1. Thread satırları kademeli fade+slide (mevcut `FadeIn` delay yapısı).
2. Yeni mesaj balonu: gönderimde alttan 8px slide + fade (100–150ms).
3. Consent modal: backdrop fade + kart scale 0.96→1.

## Değişiklik listesi

- [ ] Liste avatarına role göre token rengi (brand-500 / sage-500 / warm-400) — `staffRole`'dan map.
- [ ] Balon altına saat etiketi (`format(createdAt, 'HH:mm')`), Inter 10, karşıt tonda %60 opaklık.
- [ ] Consent modal kartına ikon rozeti (brand-100 zemin, brand-600 shield ikonu); "Onayla ve devam et" min 48.
- [ ] Gönderilen mesaj balonuna Reanimated entering animasyonu.
- [ ] Thread satırında son mesaj yoksa "Sohbete başlayın" italik/soluk ton (cream-800 %50).
- [ ] Hiçbir string, veri şekli, guard veya consent mantığı değişmez.

## Kabul kriterleri

- [ ] Rol tabları yalnız contact'ı olan rolleri gösterir; unread = memberUnread toplamı.
- [ ] Tüm renkler token; radius 16–24; touch hedefleri ≥44.
- [ ] Consent modal string'leri ve akışı birebir; onaydan önce input kilitli.
- [ ] İletişim bilgisi bloğu mesajı (CONTACT_INFO_BLOCK_MESSAGE) aynen korunur.
- [ ] Balon hizalama/renk: member sağ brand-600, staff sol beyaz.
