/**
 * Ana proje browserNotifications.js — notification.wav + 1400ms throttle.
 * expo-av yalnızca native binary’de; Expo Go’da no-op.
 */
import Constants from 'expo-constants';
import { NativeModules, Platform } from 'react-native';

const THROTTLE_MS = 1400;
let lastPlayedAt = 0;
let sound: { setPositionAsync: (n: number) => Promise<unknown>; playAsync: () => Promise<unknown> } | null =
  null;
let unlocked = false;
let audioUnavailable = false;

type ExpoAv = typeof import('expo-av');

function canUseAv(): boolean {
  if (Platform.OS === 'web') return false;
  if (Constants.appOwnership === 'expo') return false;
  const mods = NativeModules as Record<string, unknown>;
  return Boolean(mods.ExponentAV || mods.ExpoAV);
}

async function loadAv(): Promise<ExpoAv | null> {
  if (audioUnavailable || !canUseAv()) {
    audioUnavailable = true;
    return null;
  }
  try {
    return await import('expo-av');
  } catch {
    audioUnavailable = true;
    return null;
  }
}

async function ensureSound() {
  if (sound) return sound;
  const av = await loadAv();
  if (!av?.Audio) return null;
  try {
    await av.Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });
    const { sound: s } = await av.Audio.Sound.createAsync(
      require('../../assets/sounds/notification.wav'),
      { shouldPlay: false, volume: 1 },
    );
    sound = s;
    return sound;
  } catch {
    audioUnavailable = true;
    return null;
  }
}

/** İlk kullanıcı etkileşiminde ses kilidini aç (iOS autoplay). */
export async function unlockNotificationAudio(): Promise<void> {
  if (unlocked || audioUnavailable) return;
  unlocked = true;
  await ensureSound();
}

export async function playNotificationSound(): Promise<void> {
  try {
    const s = await ensureSound();
    if (!s) return;
    await s.setPositionAsync(0);
    await s.playAsync();
  } catch {
    /* ignore */
  }
}

export async function playNotificationSoundThrottled(): Promise<void> {
  const now = Date.now();
  if (now - lastPlayedAt < THROTTLE_MS) return;
  lastPlayedAt = now;
  await playNotificationSound();
}
