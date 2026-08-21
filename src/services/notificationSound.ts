/**
 * Web `browserNotifications.js` — tarayıcıda notification.wav.
 * MOBILE DIFF: native’de in-app wav yok; ses OS varsayılan bildirim sesi
 * (`push.presentSystemNotification` + Android kanal `default`).
 * soundNotifs / reminderNotifs getter’ları web parity.
 */
/** DataContext / layout — settings.soundNotifs === false iken sessiz. */
let soundEnabledGetter: (() => boolean) | null = null;

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

/** Native’de in-app wav yok (OS sesi). */
export function isInAppNotificationAudioAvailable(): boolean {
  return false;
}

/** Web autoplay kilidi. Native’de no-op. */
export async function unlockNotificationAudio(): Promise<void> {}

/** Native: OS bildirimi çalar. Çağrı yerleri web parity için durur. */
export async function playNotificationSound(): Promise<void> {}

export async function playNotificationSoundThrottled(): Promise<void> {}
