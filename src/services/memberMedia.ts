/**
 * Web parity upload for health-lab-results bucket.
 * Path: `{userId}/{ts}-{rand}.{ext}` — Adsız `uploadHealthLabResult`.
 */
import { isUiOnly } from '@/config/runtime';
import type {
  PickedImage,
  PickImageOptions,
  PickResult,
} from '@/services/memberMediaPicker';
import { requireSupabase } from '@/services/supabase';

export type { PickedImage, PickImageOptions, PickResult };

const LAB_BUCKET = 'health-lab-results';

export type LabFileMeta = {
  path: string;
  name: string;
  contentType: string;
};

/** Sağlık testi lab yükleme — native galeri (PDF: web; Expo ImagePicker görsel). */
export async function pickLabFile(): Promise<{
  uri: string;
  name: string;
  mimeType?: string;
} | null> {
  const picked = await pickImageFromLibrary();
  if (!picked?.uri) return null;
  const mime = picked.mimeType || 'image/jpeg';
  const ext = mime.includes('png') ? 'png' : mime.includes('webp') ? 'webp' : 'jpg';
  return { uri: picked.uri, name: `lab.${ext}`, mimeType: mime };
}

export async function pickImageFromLibrary(): Promise<PickedImage | null> {
  try {
    const { pickWithLibrary } = await import('@/services/memberMediaPicker');
    return await pickWithLibrary();
  } catch {
    return null;
  }
}

export async function pickImageFromLibraryDetailed(
  options?: PickImageOptions,
): Promise<PickResult> {
  try {
    const { pickWithLibraryDetailed } = await import('@/services/memberMediaPicker');
    return await pickWithLibraryDetailed(options);
  } catch (e) {
    return {
      ok: false,
      code: 'error',
      message: String((e as Error)?.message || e),
    };
  }
}

export async function pickImageFromCameraDetailed(
  options?: PickImageOptions,
): Promise<PickResult> {
  try {
    const { pickWithCameraDetailed } = await import('@/services/memberMediaPicker');
    return await pickWithCameraDetailed(options);
  } catch (e) {
    return {
      ok: false,
      code: 'error',
      message: String((e as Error)?.message || e),
    };
  }
}

/** Kalori vision vb. — picker base64’siz; uri’den sonra oku (kamera OOM azaltır). */
export async function readImageUriAsBase64(uri: string): Promise<string | null> {
  try {
    const { readAsStringAsync } = await import('expo-file-system/legacy');
    const b64 = await readAsStringAsync(uri, { encoding: 'base64' });
    return b64 || null;
  } catch (e) {
    console.warn('[memberMedia] readImageUriAsBase64 failed', String((e as Error)?.message || e));
    return null;
  }
}

function randomSuffix() {
  return Math.random().toString(36).slice(2, 8);
}

/** Web PhotoUpload parity: members.data.photo data URL */
const PROFILE_PHOTO_MAX = 720;
const PROFILE_JPEG_QUALITY = 0.85;

async function uriToJpegDataUrl(uri: string): Promise<string | null> {
  const b64 = await readImageUriAsBase64(uri);
  if (!b64) return null;
  return `data:image/jpeg;base64,${b64}`;
}

/**
 * Profil fotoğrafı — storage bucket YOK (web parity).
 * Sonuç: `data:image/jpeg;base64,...` (members.data.photo).
 *
 * `expo-image-manipulator` yalnız native modül varsa kullanılır (dev client rebuild gerekir).
 * Yoksa picker’ın sıkıştırılmış uri’si doğrudan data URL’e çevrilir — crash yok.
 */
export async function prepareProfilePhotoDataUrl(
  uri: string,
): Promise<{ ok: true; dataUrl: string } | { ok: false; error: string }> {
  if (!uri) return { ok: false, error: 'Görsel gerekli' };

  // Native yokken `import('expo-image-manipulator')` kırmızı hata basar — önce kontrol et
  let hasManipulator = false;
  try {
    const { requireOptionalNativeModule } = await import('expo-modules-core');
    hasManipulator = Boolean(requireOptionalNativeModule('ExpoImageManipulator'));
  } catch {
    hasManipulator = false;
  }

  if (hasManipulator) {
    try {
      const ImageManipulator = await import('expo-image-manipulator');
      const result = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: PROFILE_PHOTO_MAX } }],
        {
          compress: PROFILE_JPEG_QUALITY,
          format: ImageManipulator.SaveFormat.JPEG,
          base64: true,
        },
      );
      if (result.base64) {
        return { ok: true, dataUrl: `data:image/jpeg;base64,${result.base64}` };
      }
      const fromUri = await uriToJpegDataUrl(result.uri);
      if (fromUri) return { ok: true, dataUrl: fromUri };
    } catch (e) {
      console.warn(
        '[prepareProfilePhotoDataUrl] manipulator failed, fallback',
        String((e as Error)?.message || e),
      );
    }
  }

  try {
    const dataUrl = await uriToJpegDataUrl(uri);
    if (!dataUrl) return { ok: false, error: 'Görsel okunamadı' };
    return { ok: true, dataUrl };
  } catch (e) {
    return { ok: false, error: String((e as Error)?.message || e) };
  }
}

/**
 * Profile → data URL (web parity). health-test → health-lab-results bucket.
 */
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

  if (opts.folder === 'profile') {
    const prepared = await prepareProfilePhotoDataUrl(opts.uri);
    if (!prepared.ok) return prepared;
    return { ok: true, url: prepared.dataUrl, path: 'members.data.photo' };
  }

  try {
    const sb = requireSupabase();
    const ext =
      opts.fileName?.split('.').pop() ||
      (opts.contentType?.includes('png') ? 'png' : 'jpg');
    const path = `${opts.memberId}/${opts.folder}/${Date.now()}-${randomSuffix()}.${ext}`;
    const res = await fetch(opts.uri);
    const buf = await res.arrayBuffer();
    const { error } = await sb.storage.from(LAB_BUCKET).upload(path, buf, {
      contentType: opts.contentType || 'image/jpeg',
      upsert: true,
    });
    if (error) return { ok: false, error: error.message };
    const signed = await sb.storage.from(LAB_BUCKET).createSignedUrl(path, 60 * 15);
    if (signed.error || !signed.data?.signedUrl) {
      return { ok: false, error: signed.error?.message || 'İmzalı URL alınamadı' };
    }
    return { ok: true, url: signed.data.signedUrl, path };
  } catch (e) {
    return { ok: false, error: String((e as Error)?.message || e) };
  }
}

export async function uploadHealthLabResult(opts: {
  userId: string;
  uri: string;
  fileName?: string;
  contentType?: string;
}): Promise<{ ok: true; meta: LabFileMeta; url: string } | { ok: false; error: string }> {
  if (isUiOnly()) {
    return {
      ok: true,
      meta: {
        path: `demo/${opts.userId}/lab.pdf`,
        name: opts.fileName || 'lab.pdf',
        contentType: opts.contentType || 'application/pdf',
      },
      url: 'https://www.yeniform.com/brand-mark.png',
    };
  }
  try {
    const sb = requireSupabase();
    const ext = opts.fileName?.split('.').pop() || 'jpg';
    const path = `${opts.userId}/${Date.now()}-${randomSuffix()}.${ext}`;
    const res = await fetch(opts.uri);
    const buf = await res.arrayBuffer();
    const { error } = await sb.storage.from(LAB_BUCKET).upload(path, buf, {
      contentType: opts.contentType || 'image/jpeg',
      upsert: false,
    });
    if (error) return { ok: false, error: error.message };
    const signed = await sb.storage.from(LAB_BUCKET).createSignedUrl(path, 60 * 15);
    return {
      ok: true,
      meta: {
        path,
        name: opts.fileName || path.split('/').pop() || 'file',
        contentType: opts.contentType || 'image/jpeg',
      },
      url: signed.data?.signedUrl || '',
    };
  } catch (e) {
    return { ok: false, error: String((e as Error)?.message || e) };
  }
}
