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

/** Expo / OS push — tanımsız varsayılan açık (`=== false` kapatır). */
export function isPushNotificationsEnabled(
  settings?: Record<string, unknown> | null,
): boolean {
  return settings?.pushNotifs !== false;
}
