/**
 * Ana proje browserNotifications.js — notification.wav + 1400ms throttle.
 * Öncelik: expo-audio (dev client). Yoksa OS bildirimi sesi (push.presentSystemNotification).
 * Expo Go’da expo-audio no-op — OS local notification sesi kullanılır.
 */
import Constants from 'expo-constants';
import { NativeModules, Platform } from 'react-native';

const THROTTLE_MS = 1400;
let lastPlayedAt = 0;
let player: {
  seekTo: (seconds: number) => Promise<unknown>;
  play: () => void;
} | null = null;
let unlocked = false;
let audioUnavailable = false;

/** DataContext / layout — settings.soundNotifs === false iken sessiz. */
let soundEnabledGetter: (() => boolean) | null = null;

type ExpoAudio = typeof import('expo-audio');

export function setNotificationSoundEnabledGetter(getter: (() => boolean) | null) {
  soundEnabledGetter = getter;
}

/** Web `isNotificationSoundEnabled` parity. */
export function isNotificationSoundEnabled(
  settings?: Record<string, unknown> | null,
): boolean {
  // settings verildiyse getter’a girme (sonsuz döngü yok)
  if (settings != null) return settings.soundNotifs !== false;
  if (soundEnabledGetter) return soundEnabledGetter();
  return true;
}

/** Web `isReminderNotificationsEnabled` parity. */
export function isReminderNotificationsEnabled(
  settings?: Record<string, unknown> | null,
): boolean {
  return settings?.reminderNotifs !== false;
}

function canUseAudio(): boolean {
  if (Platform.OS === 'web') return false;
  if (Constants.appOwnership === 'expo') return false;
  const mods = NativeModules as Record<string, unknown>;
  return Boolean(mods.ExpoAudio);
}

/** true = in-app wav çalınabilir (dev client). */
export function isInAppNotificationAudioAvailable(): boolean {
  return !audioUnavailable && canUseAudio();
}

async function loadAudio(): Promise<ExpoAudio | null> {
  if (audioUnavailable || !canUseAudio()) {
    audioUnavailable = true;
    return null;
  }
  try {
    return await import('expo-audio');
  } catch {
    audioUnavailable = true;
    return null;
  }
}

async function ensurePlayer() {
  if (player) return player;
  const audio = await loadAudio();
  if (!audio?.createAudioPlayer) return null;
  try {
    await audio.setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: false,
      interruptionMode: 'duckOthers',
    });
    player = audio.createAudioPlayer(require('../../assets/sounds/notification.wav'));
    return player;
  } catch {
    audioUnavailable = true;
    return null;
  }
}

/** İlk kullanıcı etkileşiminde ses kilidini aç (iOS autoplay). */
export async function unlockNotificationAudio(): Promise<void> {
  if (unlocked || audioUnavailable) return;
  unlocked = true;
  await ensurePlayer();
}

export async function playNotificationSound(): Promise<void> {
  if (!isNotificationSoundEnabled()) return;
  try {
    const p = await ensurePlayer();
    if (!p) return;
    await p.seekTo(0);
    p.play();
  } catch {
    /* ignore */
  }
}

export async function playNotificationSoundThrottled(): Promise<void> {
  if (!isNotificationSoundEnabled()) return;
  const now = Date.now();
  if (now - lastPlayedAt < THROTTLE_MS) return;
  lastPlayedAt = now;
  await playNotificationSound();
}
