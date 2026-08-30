# Domain — Membership & Entitlements

## Plan katalogu

### free (Basic)
- Fiyat: 0  
- 48 saat deneme programları; temel video; sağlık analizi  
- Yok: koç/diyet görüşmesi, manuel/foto kalori (kapı fonksiyonlarına göre)

### eko (eski — satış kapalı)
- Görüşme: 0/0/0  
- Manuel kalori: evet · Foto: hayır · Tam video: hayır (sınırlı)  
- AI program yenilemeleri (yalnız `membership === 'eko'`)

### eko_diyet
- Ayda 1 diyetisyen  
- Manuel + foto kalori · Tam video: hayır  

### eko_spor
- Ayda 1 koç  
- Manuel + foto kalori · Tam video  

### diyet
- Ayda 2 diyetisyen; doktor alanı paket config’de  
- Manuel + foto kalori  

### spor
- Ayda 2 koç  
- Manuel + foto kalori · Tam video  

### doktor
- Tek seferlik 1 doktor görüşmesi (`doctorSessionsTotal: 1`, `billingType: one_time`)  
- Manuel/foto kalori: hayır  

### vip
- Ayda 2 koç + 2 diyetisyen  
- Manuel + foto · Tam video · VIP rozet  

## Kapı fonksiyonları (web + DB katalog)

Runtime SoT: `public.plans.entitlements` (hydrate `setPlanCatalog`). Yoksa fallback:

```
isPaidMembership: free değil + PAID_MEMBERSHIPS veya katalog fiyat/isSellable

hasManualCalorieAccess(m):
  katalog entitlements.manualCalorie; yoksa false if m in (free, doktor, kurucu)

hasPhotoCalorieAccess(m):
  katalog entitlements.photoCalorie; yoksa eko_diyet, eko_spor, diyet, spor, vip, platinum, premium

Kütüphane: UnpaidMemberGate + program-scoped. Tam katalog: fullLibraryAccess / library_catalog (web). fullVideo entitlement listeyi açmaz.
```

## PACKAGE_BY_PLAN

| plan | coach/mo | dietitian/mo | doctor notes |
|------|----------|--------------|--------------|
| eko (eski) | 0 | 0 | 0 |
| eko_diyet | 0 | 1 | 0 |
| eko_spor | 1 | 0 | 0 |
| diyet | 0 | 2 | 0 |
| spor | 2 | 0 | 0 |
| doktor | 0 | 0 | doctorSessionsTotal 1 |
| vip | 2 | 2 | 0 |
| kurucu (legacy) | 2 | 2 | 0 |

Helpers: `packageIncludesCoach`, `packageIncludesDietitian`, `packageIncludesDoctor` (remaining kota kapıyı kapatmaz), `sanitizeStaffForPackage`, `memberNeedsStaffAssignment`.

## Süre / expiry

- `durationMonths` 1|3|6  
- `premiumExpiresAt` = **aktif paketlerin en geç** `expiresAt` değeri (tek paket max’ı değil; stacking)  
- Expiry sync → membership `free` yalnız **hiç aktif paket kalmazsa**  
- Doktor tek seferlik: paket `consumed` yalnız görüşme `completed` / `no_show` olunca (onay = `scheduled` tüketmez)

## Stripe stacking / iptal

- Her ücretli Stripe aboneliği ayrı `activePackages[]` satırı: `stripeSubscriptionId`, `cancelAtPeriodEnd`, `currentPeriodEnd`
- Yeni Checkout **mevcut abonelikleri kapatmaz**
- `customer.subscription.deleted` yalnız eşleşen paketi expire eder
- Hemen kapat: iade yok; o paketin kota/randevuları `sanitizeStaffForPackage` ile kesilir
- Doktor: self-servis iptal yok
- Admin `paused` / `cancelled` **yok** (migration: `active`)

## MOBILE DIFF — satın alma (2026-08-21)

- IAP / StoreKit / RevenueCat **yok**
- **Android:** login’li web `/plans` (`canOfferWebPurchase`)
- **iOS:** satın alma CTA yok (3.1.3(f)). UnpaidMemberGate / FreeTrialExpiredGate **Plan Seç** yok. Kilitli randevu/kalori **Paketleri gör** yok. **MOBILE DIFF (2026-08-22):** iOS’ta Ödeme Yönetimi / Stripe Portal UI yok (ileride). Android durur.
- Runbook: `store/ios-app-store.md` · formlar: `store/ios-asc-forms.md`

## Staff assignment

Paid plans with meeting quotas get `assigned_coach_id` / `assigned_dietitian_id` / `assigned_doctor_id`. Plan değişince `sanitizeStaffForPackage` koç/diyetisyen atamasını paket dışındaysa temizler. **Doktor ataması yalnız admin ile kalkar.**
