export function calculateBMI(
  weight: string | number | null | undefined,
  height: string | number | null | undefined,
): number | null {
  const w = Number(weight);
  const h = Number(height);
  if (!w || !h) return null;
  const m = h / 100;
  if (m <= 0) return null;
  return Math.round((w / (m * m)) * 10) / 10;
}

export function bmiCategory(bmi: number | null | undefined): { label: string; tone: string } {
  if (bmi == null) return { label: 'Bilinmiyor', tone: 'muted' };
  if (bmi < 18.5) return { label: 'Zayıf', tone: 'amber' };
  if (bmi < 25) return { label: 'Normal', tone: 'sage' };
  if (bmi < 30) return { label: 'Fazla kilolu', tone: 'orange' };
  return { label: 'Obez', tone: 'danger' };
}

export const GOAL_LABELS: Record<string, string> = {
  weight: 'Kilo Yönetimi',
  fatburn: 'Yağ Yakımı',
  muscle: 'Kas Kazanımı',
  tone: 'Formda Kalmak',
  endurance: 'Dayanıklılık',
  heart: 'Kalp Sağlığı',
  habit: 'Sağlıklı Alışkanlık',
  sleep: 'Uyku Kalitesi',
  performance: 'Performans',
  confidence: 'Özgüven',
};

export const FITNESS_LABELS: Record<string, string> = {
  beginner: 'Başlangıç',
  intermediate: 'Orta Seviye',
  advanced: 'İleri Seviye',
};

export const NUTRITION_LABELS: Record<string, string> = {
  balanced: 'Dengeli Beslenme',
  'high-protein': 'Yüksek Protein',
  vegetarian: 'Vejetaryen',
  vegan: 'Vegan',
  'low-carb': 'Düşük Karbonhidrat',
  'no-pork': 'Domuz Eti Yok',
  'gluten-free': 'Glutensiz',
};
