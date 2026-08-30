/**
 * LOCK: docs/mobile/contracts/api-ai.md
 * Web parity: calorieChat.js / aiVision.js — VITE_AI_* → EXPO_PUBLIC_AI_*
 */
import { postJson } from '@/services/api';
import {
  type CalorieAnalysis,
  type CalorieItem,
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

const AI_TIMEOUT_MS = 20_000;

function formatCalorieAiError(status: number, json?: { error?: string }): string {
  const raw = String(json?.error || '').trim();
  const lower = raw.toLowerCase();
  if (
    status === 0 ||
    lower.includes('ulaşılamadı') ||
    lower.includes('zaman aşımı') ||
    lower.includes('abort') ||
    lower.includes('failed to fetch') ||
    lower.includes('network')
  ) {
    return 'Kalori analizi şu an yanıt vermedi. Biraz sonra tekrar deneyin.';
  }
  if (raw.includes('429') || lower.includes('quota') || lower.includes('limit')) {
    return 'Analiz limitine ulaşıldı. Birkaç dakika bekleyip tekrar deneyin.';
  }
  if (raw.includes('503') || raw.includes('502')) {
    return 'Kalori analizi geçici olarak kullanılamıyor. Lütfen daha sonra tekrar deneyin.';
  }
  return raw || 'Analiz yapılamadı.';
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


  const { ok, status, json } = await postJson<{
    ok?: boolean;
    error?: string;
    label?: string;
    items?: unknown;
    confidence?: string;
    cached?: boolean;
    source?: string;
  }>('/api/ai-food-text', { text: trimmed }, { timeoutMs: AI_TIMEOUT_MS });

  if (!ok || json?.ok === false) {
    return { ok: false, error: formatCalorieAiError(status, json) };
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


  const dataUrl = imageBase64.startsWith('data:')
    ? imageBase64
    : `data:${mimeType};base64,${imageBase64}`;

  const { ok, status, json } = await postJson<{
    ok?: boolean;
    error?: string;
    label?: string;
    items?: unknown;
    confidence?: string;
    cached?: boolean;
    source?: string;
  }>('/api/ai-food-vision', { image: dataUrl, mimeType }, { timeoutMs: AI_TIMEOUT_MS });

  if (!ok || json?.ok === false) {
    return { ok: false, error: formatCalorieAiError(status, json) };
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
