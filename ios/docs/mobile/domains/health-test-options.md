# Domain — Health Test Options (LOCK)

**Kaynak (güncel):** [`src/data/healthTestSections.ts`](../../../src/data/healthTestSections.ts) + [`src/data/healthTestDietitianSections.ts`](../../../src/data/healthTestDietitianSections.ts) — web Adsız parity.

Bu dosyadaki eski option tabloları tarihseldir. Yeni seçenek / etiket **uydurma**; TS kaynağını oku.

## 6 kategori (üyeye göre 5 ortak + 1 cinsiyet)

| id | title | audience |
|----|-------|----------|
| `general` | Genel Sağlık | shared |
| `medical` | Tıbbi Geçmiş | shared |
| `nutrition` | Beslenme Profili | dietitian |
| `physical` | Hareket Profili | coach |
| `lifestyle` | Günlük Yaşam | shared |
| `women` / `men` | Size Özel Sorular | genderOnly |

Eski `diet_reason` … `diet_extra` bölümleri kaldırıldı → tek `nutrition`.
