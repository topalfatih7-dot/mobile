# Görüntülü Görüşme (Bekleme Odası) — UI Brief (Fable 5)

## Mevcut durum
`VideoCallShell` koyu gradient üstünde başlık, seans/oda metası, izin satırları ve katıl CTA'sı gösteriyor. Zayıf noktalar: ekran statik (bekleme odası hissi yok), "Daily bağlama sonrası" / "Oda: donusum-…" gibi geliştirici metinleri kullanıcıya görünüyor, katıl toast'ı da geliştirici dili.

## Hedef kompozisyon (viewport sırası)
1. **Üst bar**: "Ayrıl" geri linki (mevcut) — beyaz, sol üst.
2. **Sahne (ortalanmış)**: 96'lık video ikonu dairesi çevresinde nabız halkası; altında seans tipi başlığı (Koç/Diyetisyen/Doktor Görüşmesi — locked etiketler); altında **"Bağlanılıyor…" göstergesi** (nokta pulsu + metin).
3. **Seans meta kartı**: cam efektli kart — satırlar: "Seans" + kısaltılmış id, rol rozeti ("Üye" / "Uzman (host)").
4. **İzin kartı**: mikrofon + kamera satırları, sağda "İzin istenecek" durumu.
5. **Alt blok**: "Görüşmeye katıl" primary CTA + "Geri dön" glass buton.

## Bileşen ve token detayı
- Zemin: brand-800 → brand-900 → `#0f1720` LinearGradient (mevcut, korunur) — koyu sahne hissi doğru.
- Nabız halkası: avatar dairesinin arkasında `rgba(255,255,255,0.15)` border'lı ikinci daire; scale 1→1.25 + opacity 0.6→0 loop (Reanimated).
- "Bağlanılıyor" göstergesi: mint-400 nokta (8px, opacity pulsu) + metin **"Görüşme odası hazırlanıyor…"** (`rgba(255,255,255,0.75)`).
- Rol rozeti metni değişimi. Mevcut: "Üye · Daily bağlama sonrası" → Yeni: yalnız **"Üye"** / **"Uzman (host)"** (`rgba(255,255,255,0.14)` pill korunur).
- **"Oda: donusum-…" satırını kullanıcıdan gizle** — roomName hesaplaması kodda kalır (LOCK formülü API için), UI'da ham oda adı gösterilmez. "Seans: {sessionId}" satırı meta kartına taşınır.
- İzin satırları metin değişimi. Mevcut: "Mikrofon izni — bağlama sonrası" → Yeni: **"Mikrofon — katılım sırasında izin istenecek"**; kamera aynı kalıpla. İkonlar mint-400 (mevcut).
- Katıl CTA (min-height 52): dokununca bilgi sheet/toast. Mevcut toast: "Görüntülü görüşme Daily bağlandıktan sonra açılacak." → Yeni: **"Görüntülü görüşme çok yakında! Randevu saatinde bu ekrandan tek dokunuşla katılabileceksin."** (info) — tercihen alt sheet: başlık "Çok yakında", aynı gövde metni, "Anladım" butonu.
- Meta kartı ve izin kartı: `rgba(255,255,255,0.08)` zemin, radius 20; satır min-height 44.

## Durumlar
- **Bekleme (tek ana durum)**: yukarıdaki sahne; "Bağlanılıyor" pulsu sürekli.
- **Bilinmeyen sessionType**: başlık "Görüntülü görüşme" fallback (mevcut, korunur).
- **Katıl denemesi**: sheet/toast (yukarıdaki kopya); buton disable edilmez (tekrar dokunulabilir).
- **Ayrıl**: `backHref` varsa replace, yoksa back (mevcut mantık).

## Motion
1. Nabız halkası: sonsuz scale+fade loop (~1.8s) — bekleme odasının kalbi.
2. "Bağlanılıyor" nokta pulsu: opacity 0.4→1 loop (~1s).
3. Giriş: sahne fade + translateY 16→0; meta ve izin kartları 80ms arayla kademeli.

## Değişiklik listesi
- [ ] "Oda: …" satırını UI'dan kaldır (roomName hesabı kalsın); "Seans" satırını meta kartına taşı.
- [ ] Rozet, izin satırları ve katıl toast metinlerini yukarıdaki kullanıcı-dostu kopyalarla değiştir.
- [ ] Nabız halkası + "Görüşme odası hazırlanıyor…" göstergesi ekle (Reanimated loop).
- [ ] Katıl CTA'sını bilgi sheet'ine bağla (yoksa toast fallback); "Anladım" ile kapanır.
- [ ] Meta/izin kartlarını cam efektli kart stiline getir; kademeli giriş animasyonu.
- [ ] Aynı shell staff tarafında da kullanıldığından `isOwner` dallanması korunur.

## Kabul kriterleri
- [ ] Kullanıcıya görünen hiçbir yerde "Daily", "bağlama sonrası", ham oda adı yok.
- [ ] roomName formülü ve SESSION_TYPE_META etiketleri (Koç/Diyetisyen/Doktor Görüşmesi) değişmedi.
- [ ] Hiçbir gerçek SDK/izin çağrısı eklenmedi (UI_ONLY_MODE); katıl yalnız bilgi sheet/toast gösterir.
- [ ] Renkler token (brand koyuları + mint vurgusu); mor yok; CTA min-height 52.
- [ ] "Ayrıl" ve "Geri dön" davranışları aynen.
