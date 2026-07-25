/**
 * Web parity upload for health-lab-results bucket.
 * Path: `{userId}/{ts}-{rand}.{ext}` — Adsız `uploadHealthLabResult`.
 */
import { isUiOnly } from '@/config/runtime';
import type { PickedImage } from '@/services/memberMediaPicker';
import { requireSupabase } from '@/services/supabase';

export type { PickedImage };

const LAB_BUCKET = 'health-lab-results';

export type LabFileMeta = {
  path: string;
  name: string;
  contentType: string;
};

export async function pickImageFromLibrary(): Promise<PickedImage | null> {
  try {
    const { pickWithLibrary } = await import('@/services/memberMediaPicker');
    return await pickWithLibrary();
  } catch {
    return null;
  }
}

export async function pickImageFromCamera(): Promise<PickedImage | null> {
  try {
    const { pickWithCamera } = await import('@/services/memberMediaPicker');
    return await pickWithCamera();
  } catch {
    return null;
  }
}

function randomSuffix() {
  return Math.random().toString(36).slice(2, 8);
}

/** Profile / legacy helper — keep for photo upload elsewhere */
export async function uploadMemberFile(opts: {
  memberId: string;
  uri: string;
  folder: 'profile' | 'health-test';
  fileName?: string;
  contentType?: string;
}): Promise<{ ok: true; url: string; path: string } | { ok: false; error: string }> {
  if (isUiOnly()) {
    return {
      ok: true,
      url: 'https://www.yeniform.com/brand-mark.png',
      path: `demo/${opts.folder}/brand-mark.png`,
    };
  }

  try {
    const sb = requireSupabase();
    const ext =
      opts.fileName?.split('.').pop() ||
      (opts.contentType?.includes('png') ? 'png' : 'jpg');
    const path =
      opts.folder === 'health-test'
        ? `${opts.memberId}/${Date.now()}-${randomSuffix()}.${ext}`
        : `${opts.memberId}/${opts.folder}/${Date.now()}.${ext}`;

    const response = await fetch(opts.uri);
    const blob = await response.blob();

    const { error } = await sb.storage.from(LAB_BUCKET).upload(path, blob, {
      contentType: opts.contentType || 'image/jpeg',
      upsert: opts.folder === 'profile',
    });
    if (error) {
      return { ok: false, error: error.message || 'Yükleme başarısız.' };
    }

    const { data: signed, error: signErr } = await sb.storage
      .from(LAB_BUCKET)
      .createSignedUrl(path, 60 * 60 * 24 * 7);
    if (signErr || !signed?.signedUrl) {
      return { ok: false, error: signErr?.message || 'URL alınamadı.' };
    }

    return { ok: true, url: signed.signedUrl, path };
  } catch (e: unknown) {
    const err = e as { message?: string };
    return { ok: false, error: String(err?.message || 'Yükleme başarısız.') };
  }
}

/**
 * Web `uploadHealthLabResult` parity — PDF + image, path `{userId}/{ts}-{rand}.{ext}`.
 */
export async function uploadHealthLabResult(opts: {
  userId: string;
  uri: string;
  name: string;
  contentType?: string;
}): Promise<
  { success: true; path: string; meta: LabFileMeta } | { success: false; error: string }
> {
  if (!opts.userId) return { success: false, error: 'Oturum gerekli' };
  if (!opts.uri) return { success: false, error: 'Dosya seçilmedi' };

  const ext = (opts.name?.split('.').pop() || 'bin').toLowerCase();
  const allowed = ['pdf', 'jpg', 'jpeg', 'png', 'webp'];
  if (!allowed.includes(ext)) {
    return { success: false, error: 'Yalnızca PDF veya görsel yükleyebilirsiniz' };
  }

  if (isUiOnly()) {
    const path = `${opts.userId}/${Date.now()}-${randomSuffix()}.${ext}`;
    return {
      success: true,
      path,
      meta: {
        path,
        name: opts.name,
        contentType: opts.contentType || 'application/octet-stream',
      },
    };
  }

  try {
    const sb = requireSupabase();
    const path = `${opts.userId}/${Date.now()}-${randomSuffix()}.${ext}`;
    const response = await fetch(opts.uri);
    const blob = await response.blob();

    // 8 MB limit — web parity
    if (blob.size > 8 * 1024 * 1024) {
      return { success: false, error: 'Dosya en fazla 8 MB olabilir' };
    }

    const { error } = await sb.storage.from(LAB_BUCKET).upload(path, blob, {
      cacheControl: '3600',
      upsert: false,
      contentType: opts.contentType || 'application/octet-stream',
    });
    if (error) return { success: false, error: error.message };

    return {
      success: true,
      path,
      meta: {
        path,
        name: opts.name,
        contentType: opts.contentType || 'application/octet-stream',
      },
    };
  } catch (e: unknown) {
    const err = e as { message?: string };
    return { success: false, error: String(err?.message || 'Yükleme başarısız') };
  }
}

/** Pick PDF or image via document picker when available; fall back to image library. */
export async function pickLabFile(): Promise<{
  uri: string;
  name: string;
  mimeType: string;
} | null> {
  try {
    // Optional peer — may not be installed in Expo Go
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const DocumentPicker = require('expo-document-picker') as {
      getDocumentAsync: (opts: {
        type: string[];
        copyToCacheDirectory: boolean;
      }) => Promise<{
        canceled: boolean;
        assets?: { uri: string; name?: string; mimeType?: string }[];
      }>;
    };
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets?.[0]) return null;
    const asset = result.assets[0];
    return {
      uri: asset.uri,
      name: asset.name || 'dosya',
      mimeType: asset.mimeType || 'application/octet-stream',
    };
  } catch {
    const picked = await pickImageFromLibrary();
    if (!picked) return null;
    return {
      uri: picked.uri,
      name: `lab-${Date.now()}.jpg`,
      mimeType: picked.mimeType || 'image/jpeg',
    };
  }
}
