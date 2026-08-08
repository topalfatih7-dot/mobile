/**
 * Profil fotoğrafı — kamera/galeri seçimi.
 *
 * Android: Alert, açık RN Modal üstünde görünmez → önce modal kapatılır.
 * iOS: ImagePicker de Modal üstünde fail olur → aynı sıra.
 */
import { ActionSheetIOS, Alert, Platform } from 'react-native';

import {
  pickImageFromCameraDetailed,
  pickImageFromLibraryDetailed,
  type PickedImage,
} from '@/services/memberMedia';

export type ImageSourceChoice = 'camera' | 'library';

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function showPickFailure(message: string) {
  return new Promise<void>((resolve) => {
    Alert.alert('Fotoğraf seçilemedi', message, [
      { text: 'Tamam', onPress: () => resolve() },
    ]);
  });
}

/** Kamera / Galeri / Vazgeç — ActionSheet (iOS) veya Alert (Android). */
export function promptImageSource(): Promise<ImageSourceChoice | null> {
  return new Promise((resolve) => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Vazgeç', 'Kamera', 'Galeri'],
          cancelButtonIndex: 0,
        },
        (idx) => {
          if (idx === 1) resolve('camera');
          else if (idx === 2) resolve('library');
          else resolve(null);
        },
      );
      return;
    }
    Alert.alert('Fotoğraf kaynağı', 'Nereden seçmek istersiniz?', [
      { text: 'Vazgeç', style: 'cancel', onPress: () => resolve(null) },
      { text: 'Kamera', onPress: () => resolve('camera') },
      { text: 'Galeri', onPress: () => resolve('library') },
    ]);
  });
}

/**
 * 1) Modal kapat (beforePick)
 * 2) Kaynak sor (Alert/ActionSheet)
 * 3) Native picker
 * 4) Modal aç (afterPick)
 */
export async function pickProfilePhoto(opts?: {
  beforePick?: () => void | Promise<void>;
  afterPick?: () => void | Promise<void>;
  dismissMs?: number;
}): Promise<PickedImage | null> {
  const dismissMs = opts?.dismissMs ?? (Platform.OS === 'android' ? 450 : 350);

  // KRİTİK: Modal kapanmadan Alert/ImagePicker Android+iOS'ta açılmaz
  if (opts?.beforePick) {
    console.log('[pickProfilePhoto] closing modal before prompt');
    await opts.beforePick();
    await delay(dismissMs);
  }

  console.log('[pickProfilePhoto] prompting source', Platform.OS);
  const source = await promptImageSource();
  console.log('[pickProfilePhoto] source=', source);
  if (!source) {
    if (opts?.afterPick) await opts.afterPick();
    return null;
  }

  // Alert kapanmadan kamera açılırsa Android’de Activity geçişi crash/kill riski
  await delay(Platform.OS === 'android' ? 200 : 80);

  const pickOpts = {
    // Profil upload uri kullanır — base64 kamera dönüşünde bellek çökmesi yapar
    base64: false,
    quality: 0.7,
    allowsEditing: true,
    aspect: [1, 1] as [number, number],
  };

  try {
    const result =
      source === 'camera'
        ? await pickImageFromCameraDetailed(pickOpts)
        : await pickImageFromLibraryDetailed(pickOpts);
    console.log('[pickProfilePhoto] result=', result.ok ? 'ok' : result);
    if (!result.ok) {
      if (result.code !== 'canceled') {
        await showPickFailure(result.message);
      }
      return null;
    }
    return result.image;
  } finally {
    if (opts?.afterPick) {
      await opts.afterPick();
    }
  }
}
