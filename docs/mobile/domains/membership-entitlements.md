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

Helpers: `packageIncludesCoach`, `packageIncludesDietitian`, `sanitizeStaffForPackage`, `memberNeedsStaffAssignment`.

## Süre / expiry

- `durationMonths` 1|3|6  
- `premiumExpiresAt` = start + N calendar months  
- Expiry sync → membership `free`  

## Staff assignment

Paid plans with meeting quotas get `assigned_coach_id` / `assigned_dietitian_id` / `assigned_doctor_id`. Plan değişince `sanitizeStaffForPackage` paket dışı rolleri temizler.
