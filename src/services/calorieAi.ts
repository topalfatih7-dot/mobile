/**
 * LOCK: docs/mobile/contracts/api-ai.md
 * Web parity: calorieChat.js / aiVision.js — VITE_AI_* → EXPO_PUBLIC_AI_*
 */
import { isUiOnly } from '@/config/runtime';
import { postJson } from '@/services/api';
import {
  type CalorieAnalysis,
  type CalorieItem,
  mockAnalyzeFoodText,
} from '@/utils/calorieFormat';

/** Varsayılan açık; yalnızca EXPO_PUBLIC_AI_*_ENABLED=false ile kapatılır. */
export function isCalorieChatEnabled() {
  return process.env.EXPO_PUBLIC_AI_CHAT_ENABLED !== 'false';
}

export function isCalorieVisionEnabled() {
  return process.env.EXPO_PUBLIC_AI_VISION_ENABLED !== 'false';
}

/** Web isCalorieAiEnabled — ikisi de false ise tamamen kapalı. */
export function isCalorieAiEnabled() {
  const chat = process.env.EXPO_PUBLIC_AI_CHAT_ENABLED;
  const vision = process.env.EXPO_PUBLIC_AI_VISION_ENABLED;
  if (chat === 'false' && vision === 'false') return false;
  return chat !== 'false' || vision !== 'false';
}

function normalizeItems(raw: unknown): CalorieItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => {
    const o = (item || {}) as Record<string, unknown>;
    return {
      name: String(o.name || 'Öğün').slice(0, 60),
      amount: Number(o.amount) || 1,
      unit: String(o.unit || 'porsiyon').slice(0, 20),
      cal: Math.max(0, Math.round(Number(o.cal) || 0)),
      protein: o.protein == null ? undefined : Number(o.protein) || 0,
      carb: o.carb == null ? undefined : Number(o.carb) || 0,
      fat: o.fat == null ? undefined : Number(o.fat) || 0,
    };
  });
}

export async function analyzeFoodText(
  text: string,
): Promise<{ ok: true; analysis: CalorieAnalysis } | { ok: false; error: string }> {
  if (!isCalorieChatEnabled()) {
    return { ok: false, error: 'Metin analizi şu an kapalı.' };
  }
  const trimmed = text.trim();
  if (!trimmed) return { ok: false, error: 'Metin gerekli' };
  if (trimmed.length > 2000) {
    return { ok: false, error: 'Metin çok uzun (max 2000 karakter)' };
  }

  if (isUiOnly()) {
    const analysis = mockAnalyzeFoodText(trimmed);
    if (!analysis) return { ok: false, error: 'Yiyecek tespit edilemedi.' };
    return { ok: true, analysis };
  }

  const { ok, json } = await postJson<{
    ok?: boolean;
    error?: string;
    label?: string;
    items?: unknown;
    confidence?: string;
    cached?: boolean;
    source?: string;
  }>('/api/ai-food-text', { text: trimmed });

  if (!ok || json?.ok === false) {
    return { ok: false, error: String(json?.error || 'Analiz yapılamadı.') };
  }

  const items = normalizeItems(json.items);
  return {
    ok: true,
    analysis: {
      label: String(json.label || 'Öğün'),
      items,
      confidence: json.confidence ? String(json.confidence) : undefined,
      cached: Boolean(json.cached),
      source: json.source ? String(json.source) : undefined,
    },
  };
}

/**
 * Vision body: web `aiVision.js` parity — `{ image: dataUrl, mimeType }`.
 * `image` must be a data URL (`data:image/jpeg;base64,...`), not a bare base64 string.
 */
export async function analyzeFoodVision(
  imageBase64: string,
  mimeType = 'image/jpeg',
): Promise<{ ok: true; analysis: CalorieAnalysis } | { ok: false; error: string }> {
  if (!isCalorieVisionEnabled()) {
    return { ok: false, error: 'Fotoğraf analizi şu an kapalı.' };
  }
  if (!imageBase64) return { ok: false, error: 'Görsel gerekli' };

  if (isUiOnly()) {
    return {
      ok: true,
      analysis: {
        label: 'Tahmini öğün (foto)',
        items: [{ name: 'Öğün (tahmini)', amount: 1, unit: 'porsiyon', cal: 400 }],
        confidence: 'low',
        source: 'demo',
      },
    };
  }

  const dataUrl = imageBase64.startsWith('data:')
    ? imageBase64
    : `data:${mimeType};base64,${imageBase64}`;

  const { ok, json } = await postJson<{
    ok?: boolean;
    error?: string;
    label?: string;
    items?: unknown;
    confidence?: string;
    cached?: boolean;
    source?: string;
  }>('/api/ai-food-vision', { image: dataUrl, mimeType });

  if (!ok || json?.ok === false) {
    return { ok: false, error: String(json?.error || 'Fotoğraf analizi yapılamadı.') };
  }

  return {
    ok: true,
    analysis: {
      label: String(json.label || 'Öğün'),
      items: normalizeItems(json.items),
      confidence: json.confidence ? String(json.confidence) : undefined,
      cached: Boolean(json.cached),
      source: json.source ? String(json.source) : undefined,
    },
  };
}
