import { postJson } from '@/services/api';
import { normalizeExerciseVideoRef } from '@/services/mappers';
import { requireSupabase, supabase } from '@/services/supabase';

export function isExerciseVideoStoragePath(value: unknown) {
  const path = normalizeExerciseVideoRef(value);
  return Boolean(path && /^[\w.-]+$/.test(path) && !path.includes('..'));
}

export function getExerciseThumbUrl(videoRef: unknown): string | null {
  const path = normalizeExerciseVideoRef(videoRef);
  if (!isExerciseVideoStoragePath(path) || !supabase) return null;
  const thumbPath = path.replace(/\.\w+$/, '.webp');
  const { data } = requireSupabase().storage.from('exercise-thumbs').getPublicUrl(thumbPath);
  return data?.publicUrl || null;
}

export async function resolveExerciseVideoUrl(videoRef: unknown): Promise<string | null> {
  const path = normalizeExerciseVideoRef(videoRef);
  if (!path) return null;
  if (/^https?:\/\//.test(String(videoRef))) return String(videoRef);

  if (supabase && isExerciseVideoStoragePath(path)) {
    const { data, error } = await requireSupabase()
      .storage.from('exercise-videos')
      .createSignedUrl(path, 60 * 15);
    if (!error && data?.signedUrl) return data.signedUrl;
  }

  const { ok, json } = await postJson<{ url?: string }>('/api/auth', {
    action: 'exercise-video-url',
    path,
  });
  if (ok && json.url) return json.url;
  return null;
}
