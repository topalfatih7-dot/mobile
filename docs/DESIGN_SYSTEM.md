# Yeni Form Mobile — Lumina Design System

> Mobil-native görsel dil. Web mavi/sage kopyası değil.  
> Token kaynağı: `src/constants/theme.ts`  
> **Son güncelleme:** 2026-07-14

---

## 1. İlkeler

1. **Marka önce:** Welcome / landing’de “Yeni Form” hero düzeyinde; headline markayı ezmesin.
2. **Tek kompozisyon:** İlk viewport dashboard değilse tek sahne (brand + bir headline + bir cümle + CTA).
3. **Kart kuralı:** Kart yalnız etkileşim konteyneri; hero’da kart yok.
4. **Atmosfer:** Düz düz renk yok — mist canvas + teal/champagne glow katmanları.
5. **Motion:** 2–3 kasıtlı hareket (stagger giriş, PressableScale, liste fade). Gürültü yok.
6. **Kaçın:** mor gradient, krem+terracotta+serif, broadsheet, dark-mode default, emoji süs, Inter/Roboto.

---

## 2. Renk token’ları

| Token | Hex | Kullanım |
|-------|-----|----------|
| `canvas` | `#F4F7FA` | Ekran zemini |
| `surface` | `#FFFFFF` | Yüzey / sheet |
| `surfaceMuted` | `#E8EEF3` | İkincil yüzey |
| `ink` | `#0F172A` | Başlık |
| `inkSecondary` | `#475569` | Gövde |
| `inkMuted` | `#94A3B8` | Hint |
| `teal.600` | `#0F766E` | Primary CTA |
| `teal.400` | `#14B8A6` | Aktif / gradient light |
| `champagne` | `#C4A574` | İkincil vurgu |
| `coral` | `#F07167` | Energy / destructive |
| `border` | `#D8E2EA` | Ayırıcı |
| `success` | `#0D9488` | Başarı |
| `warning` | `#D97706` | Uyarı |
| `danger` | `#DC2626` | Hata |

**Gradients (`expo-linear-gradient`):**
- `primary`: `#0F766E` → `#14B8A6`
- `aurora`: soft teal + champagne wash on canvas (welcome/auth bg)
- `energy`: coral → warm peach (antrenman vurgusu)

**Rol aksanları:** coach=teal, dietitian=champagne, doctor=coral-soft.

---

## 3. Tipografi

| Rol | Font | Ağırlık |
|-----|------|---------|
| Display | Outfit | 700 / 800 |
| Body | Manrope | 400 / 500 / 600 / 700 |

Scale (`theme.type`):
- `display` 34/40, `title` 24/30, `headline` 20/26, `body` 16/24, `callout` 14/20, `caption` 12/16, `label` 11/14 tracking.

---

## 4. Spacing / radius / shadow

- Space: 4, 8, 12, 16, 20, 24, 32, 40, 48
- Radius: `md` 16, `lg` 24, `xl` 32, `full` pill (sadece chip/avatar)
- Shadow: soft elevation 1–2; çok katmanlı glow yok
- Min touch: 44pt

---

## 5. Motion

| Preset | Kullanım |
|--------|----------|
| `enterStagger` | Ekran çocukları 40–60ms gecikme ile fade+translateY |
| `pressScale` | PressableScale 0.97 |
| `listFade` | FlatList item opacity/translate |

Süre: 220–320ms, easing ease-out. Loop animasyon yok (splash hariç).

---

## 6. Component kit

| Component | Path | Not |
|-----------|------|-----|
| `Screen` | `ui/Screen.tsx` | Safe area + canvas + optional aurora |
| `AppHeader` | `ui/AppHeader.tsx` | Başlık + back + actions |
| `Button` | `ui/Button.tsx` | primary / secondary / ghost / danger |
| `Input` | `ui/Input.tsx` | label + error |
| `IconButton` | `ui/IconButton.tsx` | 44pt |
| `Chip` | `ui/Chip.tsx` | filtre / durum |
| `EmptyState` | `ui/EmptyState.tsx` | ikon + copy + CTA |
| `Skeleton` | `ui/Skeleton.tsx` | yükleme |
| `PressableScale` | `motion/PressableScale.tsx` | reanimated |
| `AuroraBackground` | `ui/AuroraBackground.tsx` | auth/welcome |
| Floating tab bar | role `_layout` | glass teal active |

---

## 7. Ekran şablonları

### Auth / Welcome
- Full-bleed `AuroraBackground`
- Brand mark + Outfit display
- Form `surface` sheet alt yarı (radius xl)
- Tek primary CTA

### App (member/staff)
- Mist canvas
- Floating tab bar
- Header Outfit headline
- İçerik Manrope

### Admin
- Stack + liste hub (web 16 item erişimi)
- Yoğun veri: ListRow + Chip, kart minimal

---

## 8. İkonlar

`@expo/vector-icons` Ionicons. Lucide web parity isim eşlemesi serbest; anlam aynı kalsın.
