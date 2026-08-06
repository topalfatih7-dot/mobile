/**
 * Web parity upload for health-lab-results bucket.
 * Path: `{userId}/{ts}-{rand}.{ext}` — Adsız `uploadHealthLabResult`.
 */
import { isUiOnly } from '@/config/runtime';
import type { PickedImage, PickResult } from '@/services/memberMediaPicker';
import { requireSupabase } from '@/services/supabase';

export type { PickedImage, PickResult };

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

export async function pickImageFromLibraryDetailed(): Promise<PickResult> {
  try {
    const { pickWithLibraryDetailed } = await import('@/services/memberMediaPicker');
    return await pickWithLibraryDetailed();
  } catch (e) {
    return {
      ok: false,
      code: 'error',
      message: String((e as Error)?.message || e),
    };
  }
}

export async function pickImageFromCameraDetailed(): Promise<PickResult> {
  try {
    const { pickWithCameraDetailed } = await import('@/services/memberMediaPicker');
    return await pickWithCameraDetailed();
  } catch (e) {
    return {
      ok: false,
      code: 'error',
      message: String((e as Error)?.message || e),
    };
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
    const path = `${opts.memberId}/${opts.folder}/${Date.now()}-${randomSuffix()}.${ext}`;
    const res = await fetch(opts.uri);
    const buf = await res.arrayBuffer();
    const { error } = await sb.storage
      .from(opts.folder === 'profile' ? 'avatars' : LAB_BUCKET)
      .upload(path, buf, {
        contentType: opts.contentType || 'image/jpeg',
        upsert: true,
      });
    if (error) return { ok: false, error: error.message };
    const { data } = sb.storage
      .from(opts.folder === 'profile' ? 'avatars' : LAB_BUCKET)
      .getPublicUrl(path);
    return { ok: true, url: data.publicUrl, path };
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
