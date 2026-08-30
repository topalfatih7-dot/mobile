/** Sağlık testi kan tahlili dosyaları — `members.data.healthTest.bloodWorkFiles` */

export const HEALTH_LAB_BUCKET = 'health-lab-results';
export const HEALTH_LAB_FILES_KEY = 'bloodWorkFiles';
export const HEALTH_LAB_INTENT_KEY = 'bloodWorkUploadIntent';
export const HEALTH_LAB_MAX_BYTES = 8 * 1024 * 1024;
export const HEALTH_LAB_ALLOWED_EXT = ['pdf', 'jpg', 'jpeg', 'png', 'webp'] as const;
export const HEALTH_LAB_SIGNED_TTL_SEC = 900;

const IMAGE_EXT = new Set(['jpg', 'jpeg', 'png', 'webp']);

export type HealthLabFile = {
  path: string;
  name: string;
  contentType: string;
};

export function isHealthLabStoragePath(path: unknown, memberId?: string): path is string {
  if (typeof path !== 'string' || !path) return false;
  if (path.includes('..') || path.startsWith('/') || path.includes('\\')) return false;
  const parts = path.split('/');
  if (parts.length !== 2) return false;
  const [folder, file] = parts;
  if (!folder || !file) return false;
  if (!/^[\w.-]+$/.test(file)) return false;
  if (memberId && folder !== String(memberId)) return false;
  return true;
}

export function normalizeHealthLabFile(entry: unknown): HealthLabFile | null {
  if (!entry || typeof entry !== 'object') return null;
  const rec = entry as Record<string, unknown>;
  const path = String(rec.path || '').trim();
  if (!path) return null;
  return {
    path,
    name: String(rec.name || path.split('/').pop() || 'dosya'),
    contentType: String(rec.contentType || ''),
  };
}

export function collectHealthLabFiles(
  healthTest: Record<string, unknown> | null | undefined,
  memberId?: string,
): HealthLabFile[] {
  const raw = healthTest?.[HEALTH_LAB_FILES_KEY];
  if (!Array.isArray(raw)) return [];
  return raw
    .map(normalizeHealthLabFile)
    .filter((file): file is HealthLabFile => Boolean(file && isHealthLabStoragePath(file.path, memberId)));
}

/** Profilde tahlil alanı: testte “Evet” diyen üyeler (hayır / daha sonra / sormadı → kapalı). */
export function memberOptedInToHealthLab(
  healthTest: Record<string, unknown> | null | undefined,
): boolean {
  return String(healthTest?.[HEALTH_LAB_INTENT_KEY] || '') === 'yes';
}

export function isHealthLabImage(file: HealthLabFile | null | undefined): boolean {
  const ct = String(file?.contentType || '').toLowerCase();
  if (ct.startsWith('image/')) return true;
  const ext = String(file?.name || file?.path || '')
    .split('.')
    .pop()
    ?.toLowerCase();
  return IMAGE_EXT.has(ext || '');
}

export function patchHealthTestLabFiles(
  healthTest: Record<string, unknown> | null | undefined,
  files: HealthLabFile[],
): Record<string, unknown> {
  const prev = healthTest && typeof healthTest === 'object' ? { ...healthTest } : {};
  const next: Record<string, unknown> = { ...prev, [HEALTH_LAB_FILES_KEY]: files };
  if (Array.isArray(files) && files.length > 0) {
    next[HEALTH_LAB_INTENT_KEY] = 'yes';
  }
  return next;
}
