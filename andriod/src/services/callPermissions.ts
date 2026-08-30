/**
 * Kamera / mikrofon izni — Daily join öncesi.
 * Expo Go’da da expo-camera ile gerçek izin iste; sessizce false dönme.
 */
import { Platform } from 'react-native';

export type CallPermissionResult = {
  granted: boolean;
  /** Native kamera modülü yok / Expo ortamında Daily kullanılamaz */
  unavailable?: boolean;
  camera: boolean;
  microphone: boolean;
};

export async function requestCallMediaPermissions(): Promise<CallPermissionResult> {
  if (Platform.OS === 'web') {
    return { granted: true, camera: true, microphone: true };
  }

  try {
    const Cam = await import('expo-camera');
    const cam = await Cam.Camera.requestCameraPermissionsAsync();
    const mic = await Cam.Camera.requestMicrophonePermissionsAsync();
    const camera = Boolean(cam.granted);
    const microphone = Boolean(mic.granted);
    return {
      granted: camera && microphone,
      camera,
      microphone,
    };
  } catch {
    return {
      granted: false,
      unavailable: true,
      camera: false,
      microphone: false,
    };
  }
}
