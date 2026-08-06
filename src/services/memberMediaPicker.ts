/**
 * Image picker — native modül yoksa net hata; sessiz null yok.
 * Dev client’ta ExponentImagePicker yoksa require() patlar → önce optional check.
 */
import { requireOptionalNativeModule } from 'expo-modules-core';
import { Platform } from 'react-native';

export type PickedImage = {
  uri: string;
  base64?: string | null;
  mimeType?: string | null;
};

export type PickErrorCode = 'native_missing' | 'permission_denied' | 'canceled' | 'error';

export type PickResult =
  | { ok: true; image: PickedImage }
  | { ok: false; code: PickErrorCode; message: string };

const NATIVE_MISSING: PickResult = {
  ok: false,
  code: 'native_missing',
  message:
    'Fotoğraf seçici bu uygulama sürümünde yok. Yeni geliştirme APK’sını yüklemeniz gerekiyor (expo-image-picker).',
};

function resolveImagePickerModule(
  mod: typeof import('expo-image-picker'),
): typeof import('expo-image-picker') {
  const anyMod = mod as unknown as {
    getMediaLibraryPermissionsAsync?: unknown;
    default?: typeof import('expo-image-picker');
  };
  if (typeof anyMod.getMediaLibraryPermissionsAsync === 'function') return mod;
  if (anyMod.default && typeof anyMod.default.getMediaLibraryPermissionsAsync === 'function') {
    return anyMod.default;
  }
  return mod;
}

async function loadImagePicker(): Promise<
  | { ok: true; ImagePicker: typeof import('expo-image-picker') }
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
    const raw = require('expo-image-picker') as typeof import('expo-image-picker');
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

export async function pickWithLibrary(): Promise<PickedImage | null> {
  const result = await pickWithLibraryDetailed();
  return result.ok ? result.image : null;
}

export async function pickWithCamera(): Promise<PickedImage | null> {
  const result = await pickWithCameraDetailed();
  return result.ok ? result.image : null;
}

export async function pickWithLibraryDetailed(): Promise<PickResult> {
  const loaded = await loadImagePicker();
  if (!loaded.ok) return loaded;
  const { ImagePicker } = loaded;
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
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
      base64: true,
    });
    console.log('[ImagePicker] library canceled=', result.canceled);
    if (result.canceled || !result.assets?.[0]) {
      return { ok: false, code: 'canceled', message: 'İptal edildi' };
    }
    const asset = result.assets[0];
    return {
      ok: true,
      image: { uri: asset.uri, base64: asset.base64, mimeType: asset.mimeType },
    };
  } catch (e) {
    const msg = String((e as Error)?.message || e);
    console.warn('[ImagePicker] library error', msg);
    if (/native module|ExponentImagePicker|Cannot find/i.test(msg)) return NATIVE_MISSING;
    return { ok: false, code: 'error', message: msg };
  }
}

export async function pickWithCameraDetailed(): Promise<PickResult> {
  const loaded = await loadImagePicker();
  if (!loaded.ok) return loaded;
  const { ImagePicker } = loaded;
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
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.85,
      base64: true,
    });
    console.log('[ImagePicker] camera canceled=', result.canceled);
    if (result.canceled || !result.assets?.[0]) {
      return { ok: false, code: 'canceled', message: 'İptal edildi' };
    }
    const asset = result.assets[0];
    return {
      ok: true,
      image: { uri: asset.uri, base64: asset.base64, mimeType: asset.mimeType },
    };
  } catch (e) {
    const msg = String((e as Error)?.message || e);
    console.warn('[ImagePicker] camera error', msg);
    if (/native module|ExponentImagePicker|Cannot find/i.test(msg)) return NATIVE_MISSING;
    return { ok: false, code: 'error', message: msg };
  }
}
