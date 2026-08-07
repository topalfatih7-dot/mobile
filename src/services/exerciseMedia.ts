import { postJson } from '@/services/api';
import { normalizeExerciseVideoRef } from '@/services/mappers';
import { requireSupabase, supabase } from '@/services/supabase';

/** 15 dk signed URL; 2 dk yenileme payı → ~13 dk cache. */
const CACHE_TTL_MS = 13 * 60 * 1000;

type CacheEntry = { url: string; expiresAt: number };

const urlCache = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<string | null>>();

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

function readCache(path: string): string | null {
  const hit = urlCache.get(path);
  if (!hit) return null;
  if (Date.now() >= hit.expiresAt) {
    urlCache.delete(path);
    return null;
  }
  return hit.url;
}

function writeCache(path: string, url: string) {
  urlCache.set(path, { url, expiresAt: Date.now() + CACHE_TTL_MS });
}

export function invalidateExerciseVideoUrl(videoRef: unknown) {
  const path = normalizeExerciseVideoRef(videoRef);
  if (path) urlCache.delete(path);
}

async function signExerciseVideoPath(path: string): Promise<string | null> {
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

/**
 * Client-first signed URL (15 dk) + in-memory cache + in-flight dedupe.
 * `video_pending` ekran tarafında kontrol edilir — burada imza istenmez.
 */
export async function resolveExerciseVideoUrl(videoRef: unknown): Promise<string | null> {
  const path = normalizeExerciseVideoRef(videoRef);
  if (!path) return null;
  if (/^https?:\/\//.test(String(videoRef))) return String(videoRef);

  const cached = readCache(path);
  if (cached) return cached;

  const pending = inflight.get(path);
  if (pending) return pending;

  const task = (async () => {
    try {
      const url = await signExerciseVideoPath(path);
      if (url) writeCache(path, url);
      return url;
    } finally {
      inflight.delete(path);
    }
  })();

  inflight.set(path, task);
  return task;
}

/** Press-in prefetch — modal açılmadan imzayı ısıtır. */
export function prefetchExerciseVideo(videoRef: unknown) {
  if (!videoRef) return;
  void resolveExerciseVideoUrl(videoRef);
}
