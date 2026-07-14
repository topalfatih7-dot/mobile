/**
 * Kalori metin analizi — web `calorieChat.js` ile aynı API sözleşmesi.
 */
import { apiUrl } from '@/config/env';
import { getApiAuthHeaders } from '@/services/apiAuth';

export type FoodAnalysisItem = {
  name: string;
  amount?: string | number;
  unit?: string;
  cal?: number;
};

export type FoodAnalysisResult =
  | {
      ok: true;
      label?: string;
      items: FoodAnalysisItem[];
      confidence?: string;
    }
  | {
      ok: false;
      code?: string;
      error: string;
    };

export async function analyzeFoodText(text: string): Promise<FoodAnalysisResult> {
  try {
    const res = await fetch(apiUrl('/api/ai-food-text'), {
      method: 'POST',
      headers: await getApiAuthHeaders(),
      body: JSON.stringify({ text }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      code?: string;
      error?: string;
      label?: string;
      items?: FoodAnalysisItem[];
      confidence?: string;
    };
    if (!res.ok || !data.ok) {
      return {
        ok: false,
        code: data.code,
        error: data.error || 'Kalori analizi başarısız oldu.',
      };
    }
    return {
      ok: true,
      label: data.label,
      items: Array.isArray(data.items) ? data.items : [],
      confidence: data.confidence,
    };
  } catch (e) {
    return {
      ok: false,
      code: 'network_error',
      error: e instanceof Error ? e.message : 'Ağ hatası',
    };
  }
}

export function formatAnalysisReply(result: Extract<FoodAnalysisResult, { ok: true }>): string {
  if (!result.items.length) {
    return 'Yiyecek tespit edilemedi. Lütfen ne yediğinizi daha açık yazın.\nÖrnek: 2 yumurta, 1 dilim tam buğday ekmeği, 1 kase yoğurt';
  }
  const lines = [`${result.label || 'Analiz'}`, ''];
  let total = 0;
  result.items.forEach((item) => {
    total += item.cal || 0;
    lines.push(`• ${item.name} — ${item.amount ?? ''} ${item.unit ?? ''} · ~${item.cal ?? 0} kcal`.replace(/\s+/g, ' ').trim());
  });
  lines.push('', `Toplam: ~${total} kcal`);
  if (result.confidence === 'low') {
    lines.push('', 'Düşük güven — tahmini değerlerdir.');
  }
  return lines.join('\n');
}
