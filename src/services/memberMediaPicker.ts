/**
 * Image picker — native modül yoksa net hata; sessiz null yok.
 * Dev client’ta ExponentImagePicker yoksa require() patlar → önce optional check.
 *
 * Kamera çökmesi: base64:true + full-res foto bellek baskısı / Android Activity kill.
 * Varsayılan base64 kapalı; profil uri ile yükler. Kalori ihtiyaç halinde sonradan okur.
 */
import { requireOptionalNativeModule } from 'expo-modules-core';
import { InteractionManager, Platform } from 'react-native';

export type PickedImage = {
  uri: string;
  base64?: string | null;
  mimeType?: string | null;
};

export type PickErrorCode = 'native_missing' | 'permission_denied' | 'canceled' | 'error';

export type PickResult =
  | { ok: true; image: PickedImage }
  | { ok: false; code: PickErrorCode; message: string };

export type PickImageOptions = {
  /** Varsayılan false — kamera dönüşünde OOM/crash riskini azaltır */
  base64?: boolean;
  quality?: number;
  allowsEditing?: boolean;
  aspect?: [number, number];
};

const NATIVE_MISSING: { ok: false; code: 'native_missing'; message: string } = {
  ok: false,
  code: 'native_missing',
  message:
    'Fotoğraf seçici bu uygulama sürümünde yok. Yeni geliştirme APK’sını yüklemeniz gerekiyor (expo-image-picker).',
};

type ImagePickerMod = typeof import('expo-image-picker');

function resolveImagePickerModule(mod: ImagePickerMod): ImagePickerMod {
  const anyMod = mod as unknown as {
    getMediaLibraryPermissionsAsync?: unknown;
    default?: ImagePickerMod;
  };
  if (typeof anyMod.getMediaLibraryPermissionsAsync === 'function') return mod;
  if (anyMod.default && typeof anyMod.default.getMediaLibraryPermissionsAsync === 'function') {
    return anyMod.default;
  }
  return mod;
}

async function loadImagePicker(): Promise<
  | { ok: true; ImagePicker: ImagePickerMod }
  | { ok: false; code: 'native_missing'; message: string }
> {
  if (Platform.OS !== 'web') {
    const native = requireOptionalNativeModule('ExponentImagePicker');
    if (!native) {
      console.warn('[ImagePicker] ExponentImagePicker native module missing');
      return NATIVE_MISSING;
    }
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const raw = require('expo-image-picker') as ImagePickerMod;
    const ImagePicker = resolveImagePickerModule(raw);
    if (typeof ImagePicker.getMediaLibraryPermissionsAsync !== 'function') {
      return NATIVE_MISSING;
    }
    return { ok: true, ImagePicker };
  } catch (e) {
    console.warn('[ImagePicker] load failed', String((e as Error)?.message || e));
    return NATIVE_MISSING;
  }
}

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

/** Alert/ActionSheet sonrası native kamera Activity’ye geçmeden önce UI settle */
async function waitForUiSettle() {
  await new Promise<void>((resolve) => {
    InteractionManager.runAfterInteractions(() => resolve());
  });
  await delay(Platform.OS === 'android' ? 280 : 120);
}

function assetToImage(
  asset: {
    uri: string;
    base64?: string | null;
    mimeType?: string | null;
  },
): PickedImage {
  return {
    uri: asset.uri,
    base64: asset.base64 ?? null,
    mimeType: asset.mimeType ?? null,
  };
}

/**
 * Android: kamera sırasında process öldürülürse promise orphan kalabilir.
 * App yeniden açılınca pending result’ı dene.
 */
async function recoverPendingResult(ImagePicker: ImagePickerMod): Promise<PickResult | null> {
  if (Platform.OS !== 'android') return null;
  if (typeof ImagePicker.getPendingResultAsync !== 'function') return null;
  try {
    const pending = await ImagePicker.getPendingResultAsync();
    if (!pending || typeof pending !== 'object') return null;
    if ('canceled' in pending && pending.canceled) {
      return { ok: false, code: 'canceled', message: 'İptal edildi' };
    }
    const assets = 'assets' in pending ? pending.assets : null;
    if (assets?.[0]?.uri) {
      console.log('[ImagePicker] recovered pending camera/library result');
      return { ok: true, image: assetToImage(assets[0]) };
    }
  } catch (e) {
    console.warn('[ImagePicker] getPendingResultAsync failed', String((e as Error)?.message || e));
  }
  return null;
}

export async function pickWithLibrary(): Promise<PickedImage | null> {
  const result = await pickWithLibraryDetailed();
  return result.ok ? result.image : null;
}

export async function pickWithCamera(): Promise<PickedImage | null> {
  const result = await pickWithCameraDetailed();
  return result.ok ? result.image : null;
}

export async function pickWithLibraryDetailed(
  options: PickImageOptions = {},
): Promise<PickResult> {
  const loaded = await loadImagePicker();
  if (!loaded.ok) return loaded;
  const { ImagePicker } = loaded;
  const wantBase64 = Boolean(options.base64);
  try {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    console.log('[ImagePicker] library perm', perm.status, 'granted=', perm.granted);
    if (!perm.granted) {
      return {
        ok: false,
        code: 'permission_denied',
        message: 'Galeri izni verilmedi. Ayarlardan izin verin.',
      };
    }
    await waitForUiSettle();
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: options.quality ?? 0.85,
      base64: wantBase64,
      allowsEditing: options.allowsEditing ?? false,
      aspect: options.aspect,
    });
    console.log('[ImagePicker] library canceled=', result.canceled);
    if (result.canceled || !result.assets?.[0]) {
      const recovered = await recoverPendingResult(ImagePicker);
      if (recovered) return recovered;
      return { ok: false, code: 'canceled', message: 'İptal edildi' };
    }
    return { ok: true, image: assetToImage(result.assets[0]) };
  } catch (e) {
    const msg = String((e as Error)?.message || e);
    console.warn('[ImagePicker] library error', msg);
    if (/native module|ExponentImagePicker|Cannot find/i.test(msg)) return NATIVE_MISSING;
    const recovered = await recoverPendingResult(ImagePicker);
    if (recovered) return recovered;
    return { ok: false, code: 'error', message: msg };
  }
}

export async function pickWithCameraDetailed(
  options: PickImageOptions = {},
): Promise<PickResult> {
  const loaded = await loadImagePicker();
  if (!loaded.ok) return loaded;
  const { ImagePicker } = loaded;
  // Kamera: asla varsayılan base64 — native encode + Activity kill = sık crash
  const wantBase64 = Boolean(options.base64);
  try {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    console.log('[ImagePicker] camera perm', perm.status, 'granted=', perm.granted);
    if (!perm.granted) {
      return {
        ok: false,
        code: 'permission_denied',
        message: 'Kamera izni verilmedi. Ayarlardan izin verin.',
      };
    }
    await waitForUiSettle();
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: options.quality ?? 0.7,
      base64: wantBase64,
      allowsEditing: options.allowsEditing ?? false,
      aspect: options.aspect,
      exif: false,
    });
    console.log('[ImagePicker] camera canceled=', result.canceled);
    if (result.canceled || !result.assets?.[0]) {
      const recovered = await recoverPendingResult(ImagePicker);
      if (recovered) return recovered;
      return { ok: false, code: 'canceled', message: 'İptal edildi' };
    }
    return { ok: true, image: assetToImage(result.assets[0]) };
  } catch (e) {
    const msg = String((e as Error)?.message || e);
    console.warn('[ImagePicker] camera error', msg);
    if (/native module|ExponentImagePicker|Cannot find/i.test(msg)) return NATIVE_MISSING;
    const recovered = await recoverPendingResult(ImagePicker);
    if (recovered) return recovered;
    return { ok: false, code: 'error', message: msg };
  }
}
