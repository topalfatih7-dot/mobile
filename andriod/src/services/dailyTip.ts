import { pickFallbackTip } from '@/data/dailyTipFallback';
import { apiUrl, getApiAuthHeaders } from '@/services/api';

function todayLocal() {
  return new Date().toLocaleDateString('en-CA');
}

export async function fetchDailyTip() {
  const date = todayLocal();
  try {
    const res = await fetch(`${apiUrl('/api/ai-blog-generate')}?task=daily-tip`, {
      method: 'GET',
      headers: await getApiAuthHeaders(),
    });
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      tip?: string;
      date?: string;
      aiGenerated?: boolean;
      fallback?: boolean;
    };
    if (!res.ok || !data.ok || !data.tip) {
      return { ok: true, tip: pickFallbackTip(date), date, aiGenerated: false, fallback: true };
    }
    return {
      ok: true,
      tip: data.tip,
      date: data.date || date,
      aiGenerated: Boolean(data.aiGenerated),
      fallback: Boolean(data.fallback),
    };
  } catch {
    return { ok: true, tip: pickFallbackTip(date), date, aiGenerated: false, fallback: true };
  }
}
