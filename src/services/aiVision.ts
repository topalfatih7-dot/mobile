/**
 * Fotoğraflı kalori — web `aiVision.js` (RN: ImagePicker URI → base64).
 */
import { EncodingType, readAsStringAsync } from 'expo-file-system/legacy';

import { apiUrl } from '@/config/env';
import { getApiAuthHeaders } from '@/services/apiAuth';
import type { FoodAnalysisResult } from '@/services/calorieChat';

export function isAiVisionEnabled() {
  return process.env.EXPO_PUBLIC_AI_VISION_ENABLED !== 'false';
}

export async function analyzeFoodPhoto(imageUri: string): Promise<FoodAnalysisResult> {
  try {
    const base64 = await readAsStringAsync(imageUri, { encoding: EncodingType.Base64 });
    const mimeType = imageUri.toLowerCase().includes('.png') ? 'image/png' : 'image/jpeg';
    const dataUrl = `data:${mimeType};base64,${base64}`;
    const res = await fetch(apiUrl('/api/ai-food-vision'), {
      method: 'POST',
      headers: await getApiAuthHeaders(),
      body: JSON.stringify({ image: dataUrl, mimeType }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      code?: string;
      error?: string;
      label?: string;
      items?: { name: string; amount?: string | number; unit?: string; cal?: number }[];
      confidence?: string;
    };
    if (!res.ok || !data.ok) {
      return {
        ok: false,
        code: data.code,
        error: data.error || 'Fotoğraf analizi başarısız oldu.',
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
