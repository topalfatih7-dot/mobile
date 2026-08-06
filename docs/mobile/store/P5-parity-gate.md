# P5 Üye parity — test kapısı

## Kod (bu faz)

- [x] Messages presence: heartbeat + `user_presence_public` + inbox/thread UI
- [x] Chat collapsible programs (coach/dietitian; doctor gizli)
- [x] Library filtreleri = web (search/category/difficulty/location/machine) — equipment uydurma yok
- [x] Calorie AI flags: `EXPO_PUBLIC_AI_CHAT_ENABLED` / `EXPO_PUBLIC_AI_VISION_ENABLED`
- [x] Payments: P2 IAP UX (keys boşsa “yakında”) — acceptance cihazda
- [x] LOCK: `messages.md` + `realtime.md` güncellendi

## Smoke (cihaz / native)

1. İki hesap online → mesajlar inbox’ta yeşil nokta / Çevrimiçi
2. Thread header presence label
3. Koç thread → Antrenman Programları Göster/Gizle
4. Diyetisyen thread → Beslenme Listeleri
5. Doktor thread → program paneli yok
6. Library filtre chip’leri web ile aynı
7. Calorie metin (+ vision plan-gated) çalışır
8. Dashboard → health → calendar → programs → schedule → call kısa tur

SKIP: stories / corporate / team-apply

## Sonraki

P6 store listing şablonları + TestFlight/Play internal.
