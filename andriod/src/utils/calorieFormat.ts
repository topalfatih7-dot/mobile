/** LOCK: calorie.md — formatAnalysisReply parity (UI-only mock da aynı format) */

export type CalorieItem = {
  name: string;
  amount: number;
  unit: string;
  cal: number;
  protein?: number;
  carb?: number;
  fat?: number;
};

export type CalorieAnalysis = {
  label: string;
  items: CalorieItem[];
  confidence?: string;
  cached?: boolean;
  source?: string;
};

export function formatAnalysisReply(result: CalorieAnalysis | null): string {
  if (!result?.items?.length) {
    return 'Yiyecek tespit edilemedi. Lütfen ne yediğinizi daha açık yazın.\nÖrnek: 2 yumurta, 1 dilim tam buğday ekmeği, 1 kase yoğurt';
  }
  const total = result.items.reduce((a, i) => a + (Number(i.cal) || 0), 0);
  const lines = [
    `🍽 ${result.label}`,
    '',
    ...result.items.map(
      (i) => `• ${i.name} — ${i.amount} ${i.unit} · ~${i.cal} kcal`,
    ),
    '',
    `📊 Toplam: ~${total} kcal`,
  ];
  if (result.confidence === 'low') {
    lines.push('', '⚠️ Düşük güven — tahmini değerlerdir.');
  }
  if (result.source === 'cache' || result.source === 'dictionary' || result.cached) {
    lines.push(
      '',
      result.source === 'dictionary'
        ? '💾 Kayıtlı yiyecek sözlüğünden hesaplandı (AI çağrılmadı).'
        : '💾 Kayıtlı öğünden getirildi (AI çağrılmadı).',
    );
  }
  return lines.join('\n');
}

/** UI-only: basit sözlük tahmini — bağlama sonrası API */
export function mockAnalyzeFoodText(text: string): CalorieAnalysis | null {
  const t = text.trim().toLowerCase();
  if (t.length < 2) return null;
  const items: CalorieItem[] = [];
  if (t.includes('yumurta')) items.push({ name: 'Yumurta', amount: 2, unit: 'adet', cal: 140 });
  if (t.includes('yoğurt') || t.includes('yogurt')) {
    items.push({ name: 'Yoğurt', amount: 1, unit: 'kase', cal: 120 });
  }
  if (t.includes('ekmek')) {
    items.push({ name: 'Tam buğday ekmeği', amount: 1, unit: 'dilim', cal: 80 });
  }
  if (t.includes('tavuk')) {
    items.push({ name: 'Izgara tavuk', amount: 1, unit: 'porsiyon', cal: 220 });
  }
  if (t.includes('salata')) {
    items.push({ name: 'Salata', amount: 1, unit: 'porsiyon', cal: 90 });
  }
  if (!items.length) {
    items.push({ name: 'Öğün (tahmini)', amount: 1, unit: 'porsiyon', cal: 350 });
  }
  return {
    label: 'Tahmini öğün',
    items,
    confidence: items.length === 1 && items[0].name.includes('tahmini') ? 'low' : 'medium',
    source: 'dictionary',
  };
}
