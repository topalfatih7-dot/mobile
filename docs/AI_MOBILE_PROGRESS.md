# Yeni Form Mobile — Progress

> **Son güncelleme:** 2026-07-21 — Üye paneli tam web-parity taraması + native entegrasyon düzeltmeleri  
> **Her tur:** [`IMPLEMENTATION-LOCK.md`](./mobile/IMPLEMENTATION-LOCK.md) + [`AI_WORKING_RULES.md`](./AI_WORKING_RULES.md)  
> **Web kaynak (zorunlu):** `/Users/mac/Desktop/Serenova-F-t/Adsız` (`donusum-programi`)

## Durum

| Faz | İçerik | Durum |
|-----|--------|-------|
| **0–P0.3** | Spec, auth, member hub | ✅ |
| **UI-only** | Demo kısa devre | ⬜ kapalı (`false`) |
| **P1 Member** | Schedule, health-test, messages, calorie, notifications, support, payments | ✅ wiring |
| **P1 Call** | Daily token + native SDK / WebView fallback | ✅ |
| **Native SDK** | RevenueCat, Daily RN, expo-notifications, expo-av, camera | ✅ |
| **Nav chrome** | PanelTopBar + PanelDrawer (3 rol, web parity sıra) | ✅ |
| **Loading** | LoadingScreen + InlineSpinner | ✅ |
| **Bildirim sesi** | `assets/sounds/notification.wav` + throttle + Android kanal | ✅ |
| **Staff/Admin DB** | `platformDb` hydrate + screens DEMO→useData | ✅ |
| **Public** | Legal/About/Blog/Team WebView | ✅ |
| **Web parity (üye)** | Dashboard + kritik ekran boşlukları | ✅ tur 1 |
| **Health test parity** | Flat `healthTest` + full catalog + hub radar + section engine | ✅ |
| **Member web parity** | 17 ekran: tasarım sırası + veri/aksiyon audit | ✅ tur 2 |
| Bağlama / QA | TypeScript + IDE lint + iOS/Android/Web export | ✅ |
| RevenueCat keys | iOS/Android public SDK | ⬜ GAP (env boş) |

## Bu tur (üye paneli — tam web parity)

**Kapatılanlar:**
- Dashboard, calendar, health-test, calorie, programs, schedule, messages, library, notifications, profile, payments, support ve video call; web sayfaları + mobil LOCK dosyalarıyla karşılaştırıldı.
- Schedule: yeniden planlama, authoritative API refresh, join-compatible status ve tam haftalık uygunluk saatleri.
- Messages/notifications: realtime unread, read batching, exact route map ve push tap navigation.
- Payments: RevenueCat offerings, lokal store fiyatı, purchase, restore, Customer Center ve webhook için bounded entitlement refresh.
- Support: `site_content` FAQ accordion, ticket thread/reply/closed guard ve realtime.
- Call: session lookup, ownership/type/status kontrolü, `-15 dk / süre +30 dk` join-window gate.
- Kamera/galeri: kalori fotoğrafı ve profil avatar akışları doğrulandı.
- SDK 56 uyumu: `react-native-gesture-handler` beklenen sürüme yükseltildi.
- QA: `npx tsc --noEmit`, IDE lint ve `expo export --platform all` geçti.

## Kalan doğrulanmış GAP’ler

1. **Push teslimatı:** Expo token saklama tablosu/API/worker kontratı yok; cihaz tokenı alınabiliyor ancak backend’e uydurma alan yazılmıyor.
2. **Messages:** canlı web’de presence + chat içi program paneli var; mobil LOCK presence’i yalnız admin ile sınırlandırıyor ve program panelini tanımlamıyor. Spec kararı gerekli.
3. **Payments history:** RevenueCat SDK/webhook kontratı tam yenileme ledger’ı sağlamıyor; yanıltıcı Stripe-only tablo eklenmedi.
4. **Library:** mobil spec equipment filtresi istiyor; güncel web filtresi bunu sunmuyor. Kaynak otorite kararı gerekli.
5. **Calorie feature flags:** spec web `VITE_AI_*` flaglerini referanslıyor; kilitli Expo env karşılığı yok.
6. **RevenueCat:** `EXPO_PUBLIC_REVENUECAT_API_KEY_IOS` ve `..._ANDROID` gerçek anahtarları boş.

## Sonraki

1. Yukarıdaki kontrat/spec GAP’lerini kullanıcı kararıyla kapat.
2. RevenueCat anahtarları + gerçek cihaz IAP smoke test.
3. Dev-client rebuild ile Daily + push ses doğrulama.
4. Staff paneli web parity taraması.
