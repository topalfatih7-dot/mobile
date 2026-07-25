/**
 * Image picker — yalnızca native modül varsa yüklenir.
 * Expo Go / eski dev client / web eksik binary → null (crash yok).
 */
import { requireOptionalNativeModule } from 'expo-modules-core';
import { Platform } from 'react-native';

export type PickedImage = {
  uri: string;
  base64?: string | null;
  mimeType?: string | null;
};

function isImagePickerAvailable(): boolean {
  if (Platform.OS === 'web') {
    // Web: expo-image-picker DOM input kullanır; native modül gerekmez.
    return true;
  }
  return requireOptionalNativeModule('ExponentImagePicker') != null;
}

export async function pickWithLibrary(): Promise<PickedImage | null> {
  if (!isImagePickerAvailable()) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const ImagePicker = require('expo-image-picker') as typeof import('expo-image-picker');
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return null;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
      base64: true,
    });
    if (result.canceled || !result.assets?.[0]) return null;
    const asset = result.assets[0];
    return { uri: asset.uri, base64: asset.base64, mimeType: asset.mimeType };
  } catch {
    return null;
  }
}

export async function pickWithCamera(): Promise<PickedImage | null> {
  if (!isImagePickerAvailable()) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const ImagePicker = require('expo-image-picker') as typeof import('expo-image-picker');
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return null;
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.85,
      base64: true,
    });
    if (result.canceled || !result.assets?.[0]) return null;
    const asset = result.assets[0];
    return { uri: asset.uri, base64: asset.base64, mimeType: asset.mimeType };
  } catch {
    return null;
  }
}
