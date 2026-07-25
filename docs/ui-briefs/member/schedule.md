# Üye Randevular (Schedule) — UI Brief (Fable 5)

Kaynak: `app/(member)/schedule.tsx` + `components/schedule/SessionBooker.tsx` · LOCK: `docs/mobile/screens/member/schedule.md` + `session-booker.md`

## Mevcut durum

Gradyan hero + 3 segment tab + kota satırı + seans kartları + SessionBooker modal çalışıyor; string'ler LOCK ile uyumlu. Eksikler: hero tab değişiminde sert atlıyor, seans kartında durum/katılım hiyerarşisi zayıf (Katıl butonu ile İptal linki aynı blokta dağınık), iptal metni token dışı `#c2410c`.

## Hedef kompozisyon (viewport sırası)

1. **Gradyan hero** (brand-600 → brand-700 → sage-600, mevcut): kicker "Randevular" → tab başlığı → alt başlık → atanmış uzman pill'i. Yükseklik 148 sabit; tab değişince başlık cross-fade.
2. **Segment tabs ×3** (Koç / Diyetisyen / Doktor — LOCK, ekleme yok): dikey ikon+etiket kartları; aktif kart brand-50 zemin + brand-300 border.
3. **Kota satırı**: sol "Bu ay: x/y", sağ **Randevu Al** primary buton (min 48).
4. **Seans kartları** (yaklaşan): ikon rozeti + başlık + tarih·saat + uzman adı; altta aksiyon satırı — katılım penceresi açıksa tam genişlik **Katıl**, değilse pencere ipucu metni; **İptal** sağda ikincil.
5. **Kilitli durum** (paket yok): kilit ikonu + lockedTitle/lockedDescription + "Paketleri gör".

Booker modal (bottom sheet): başlık **Randevu Al** → uzman ipucu + kalan hak → yatay gün seçici (EEE/d/MMM) → saat grid'i → onay kartı (**Randevuyu onaylayın** / **Saati değiştir** / **Randevuyu Onayla**). Adım metinleri session-booker LOCK'undan birebir.

## Bileşen ve token detayı

- Hero: radius `radius.xl` (≤24) kalır; kicker Inter semi 11 uppercase; başlık Plus Jakarta Extra 24; blob dekoru `rgba(255,255,255,0.12)` kalsın.
- Tab kartı: beyaz zemin + cream-200 border; aktif brand-50/brand-300; ikon kutusu 28, radius 10; etiket Inter semi 12; min yükseklik 68 (44 üstü, uygun).
- Seans kartı: beyaz, radius `radius.xl`, cream-200 border; ikon rozeti brand-100 zemin / brand-700 ikon; başlık Inter semi 16 cream-900; tarih Inter 13 cream-800.
- İptal: `#c2410c` → **warm-500** (`#e8894f`) metin; dokunma alanı min 44 (şu an `paddingVertical: 8` — büyüt).
- Booker: gün chip'i seçiliyken brand-600 zemin/beyaz metin; saat hücresi disabled cream-100 zemin + cream-300 metin; onay kartı sage-50 zemin + sage-200 border (onay = pozitif ton).
- Kilitli kart: beyaz + kilit ikonu warm-500 (mevcut); buton secondary.

## Durumlar

- **Kilitli:** `canBook=false` → lockedTitle/Description (LOCK string'leri: "… paketinizde yok").
- **Boş:** "Randevu bulunamadı" + "Uygun bir saat seçerek randevu oluşturabilirsiniz." (mevcut).
- **Kota dolu (booker):** "Bu ay için randevu hakkınız doldu. Sonraki ay için bir gün seçebilirsiniz."
- **Uzman yok (booker):** "Henüz bir uzman atanmamış. Atama sonrası randevu alabilirsiniz."
- **Trial bitti:** `FreeTrialExpiredGate` short-circuit.

## Motion (Reanimated)

1. Tab değişiminde hero başlık/alt başlık cross-fade (150ms) — layout zıplamasın.
2. Seans kartları kademeli fade+slide (mevcut `FadeIn` delay'i kalır).
3. Booker sheet açılışı slide-up + backdrop fade; adım geçişi (saat→onay) fade.

## Değişiklik listesi

- [ ] `cancelText` rengi `#c2410c` → `colors.warm[500]`; `cancelBtn` min yükseklik 44.
- [ ] Seans kartı aksiyon satırı: Katıl (flex:1) + İptal sağda tek satır; pencere ipucu ayrı satır.
- [ ] Hero başlığına tab değişiminde cross-fade (Reanimated `FadeIn/FadeOut` veya key'li `FadeIn`).
- [ ] "Randevu Al" butonu min 48 yükseklik doğrulansın (`size="md"` yeterli değilse yükselt).
- [ ] Booker onay kartına sage-50/sage-200 pozitif ton; saat grid'inde disabled görünümü netleşsin.
- [ ] Tab/string/limit mantığına dokunulmaz (doctor limit=1, join penceresi 15/30 dk).

## Kabul kriterleri

- [ ] Tab etiketleri, locked string'ler ve booker adım metinleri LOCK ile birebir.
- [ ] Tüm renkler design-system tokenı; radius 16–24; CTA min 48; İptal touch ≥44.
- [ ] Tab geçişinde hero yüksekliği sabit, içerik cross-fade.
- [ ] Kota dolu / uzman yok / boş / kilitli durumların hepsi görsel olarak ayrışıyor.
- [ ] `memberCallPath` join akışı ve booking mantığı değişmedi (UI-only).
