# 00 — Executive Summary

## Ürün

**Yeni Form** (`yeniform.com`) — çevrimiçi koçluk, diyetisyenlik ve doktor görüşmeleri; sağlık testi, program takibi, egzersiz kütüphanesi, kalori AI, mesajlaşma ve Daily.co video seansları.

## Mobil hedef

Tek Expo uygulaması, üç rol paneli:

| Panel | Kullanıcı | Öncelik |
|-------|-----------|---------|
| Member | Danışan üyeler | P0–P1 |
| Staff | Koç / diyetisyen / doktor | P1 |
| Admin | Operasyon | P2 (tam envanter + mobil UX) |

## Teknik kararlar

| Konu | Karar |
|------|--------|
| Framework | Expo + Expo Router |
| Backend | Mevcut Supabase + Vercel `api/` |
| Ödeme | Android: login’li web `/plans` CTA · iOS: satın alma CTA yok (3.1.3(f)) · iptal: native uyarı + Stripe Portal · Web: Stripe · Entitlement: Supabase (IAP yok) |
| Dil | Türkçe UI |
| State | `useAuth` / `useData` / `useActions` dilim modeli |

## Bu spesifikasyonun amacı

Web reposuna erişimi olmayan ekibin uygulamayı yazabilmesi. Her ekran, akış, API sözleşmesi ve paket kapısı burada gömülüdür.

## Ana riskler

1. Mobilde IAP yok — Android web Stripe CTA; iOS satın alma CTA yok (3.1.3(f)); iptal/kart Portal  
2. Sosyal giriş kapalı — Sign in with Apple gerekmez  
3. Exercise video: private bucket + 15 dk signed URL  
4. Auth: `members` satırı ödeme webhook sonrası oluşur  
5. Admin yoğun CRUD’nin telefonda sheet’lere indirgenmesi  

## Faz özeti

Detay: [appendices/E-phased-roadmap.md](appendices/E-phased-roadmap.md).

1. P0 Member MVP  
2. P1 Member+ (chat, Daily, health, calorie)  
3. P1 Staff  
4. P2 Admin + public polish  
