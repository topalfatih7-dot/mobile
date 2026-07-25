/**
 * LOCK: docs/mobile/domains/notifications-model.md — Push (mobile)
 * Token persistence requires a locked server contract; this module only obtains
 * the device token and handles existing notification payload types.
 * Native modüller lazy — Expo Go / eksik binary’de crash etmez.
 *
 * Android kanal sesi:
 * - `sound` alanını **hiç gönderme** → native `Settings.System.DEFAULT_NOTIFICATION_URI`
 * - `sound: 'default'` YANLIŞ: dosya adı gibi `res/raw/default` aranır → ERROR log
 * - `sound: 'notification.wav'` yalnızca plugin + native rebuild sonrası (res/raw’da varlık)
 * Foreground özel ses: `notificationSound.ts` (expo-av).
 */
import { Platform } from 'react-native';

import { isUiOnly } from '@/config/runtime';
import { playNotificationSoundThrottled } from '@/services/notificationSound';

const CHANNEL_ID = 'yeniform-alerts';

type NotificationsMod = typeof import('expo-notifications');

let notificationsMod: NotificationsMod | null | undefined;
let handlerWired = false;
let channelReady: Promise<void> | null = null;

async function loadNotifications(): Promise<NotificationsMod | null> {
  if (notificationsMod !== undefined) return notificationsMod;
  try {
    notificationsMod = await import('expo-notifications');
    if (!handlerWired && notificationsMod) {
      handlerWired = true;
      notificationsMod.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });
    }
    return notificationsMod;
  } catch {
    notificationsMod = null;
    return null;
  }
}

export async function ensureNotificationChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  if (!channelReady) {
    channelReady = (async () => {
      const Notifications = await loadNotifications();
      if (!Notifications) return;
      try {
        // sound OMIT — do not pass 'default' or a missing .wav filename
        await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
          name: 'Yeni Form Bildirimler',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 120, 250],
          enableVibrate: true,
        });
      } catch {
        /* ignore */
      }
    })();
  }
  await channelReady;
}

export async function registerForPushNotifications(): Promise<string | null> {
  if (isUiOnly()) return null;

  try {
    const Device = await import('expo-device');
    if (!Device.isDevice) return null;

    const Notifications = await loadNotifications();
    if (!Notifications) return null;

    // Android 13 permission prompt appears only after a channel exists.
    await ensureNotificationChannel();

    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') return null;

    const Constants = (await import('expo-constants')).default;
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    const tokenData = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    return tokenData.data;
  } catch {
    return null;
  }
}

export type PushNavigatePayload = {
  type?: string;
  staffRole?: string;
  ticketId?: string;
  action?: string;
};

/** Navigate map — screens/member/notifications.md */
export function routeFromPushData(data: PushNavigatePayload): string | null {
  const type = String(data.type || '');
  if (type === 'chat' && data.staffRole) {
    return `/(member)/messages/${data.staffRole}`;
  }
  if (type === 'program') {
    return '/(member)/programs';
  }
  if (type === 'availability' || data.action === 'availability') {
    return '/(member)/calendar?avail=1';
  }
  if (type === 'support' || type === 'support-reply') {
    return '/(member)/support';
  }
  return '/(member)/notifications';
}

export function addNotificationReceivedListener(
  handler: (data: PushNavigatePayload) => void,
) {
  let sub: { remove: () => void } | null = null;
  let cancelled = false;
  void loadNotifications().then((Notifications) => {
    if (!Notifications || cancelled) return;
    sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = (response.notification.request.content.data ||
        {}) as PushNavigatePayload;
      handler(data);
    });
  });
  return {
    remove: () => {
      cancelled = true;
      sub?.remove();
    },
  };
}

/** Foreground’da gelen push → ses (throttle’lı) */
export function addForegroundNotificationListener(
  onReceive?: (data: PushNavigatePayload) => void,
) {
  let sub: { remove: () => void } | null = null;
  let cancelled = false;
  void loadNotifications().then((Notifications) => {
    if (!Notifications || cancelled) return;
    sub = Notifications.addNotificationReceivedListener((notification) => {
      void playNotificationSoundThrottled();
      const data = (notification.request.content.data || {}) as PushNavigatePayload;
      onReceive?.(data);
    });
  });
  return {
    remove: () => {
      cancelled = true;
      sub?.remove();
    },
  };
}

/** Consume a notification tap that launched the app from a terminated state. */
export async function consumeInitialPushData(): Promise<PushNavigatePayload | null> {
  const Notifications = await loadNotifications();
  if (!Notifications) return null;
  const response = await Notifications.getLastNotificationResponseAsync();
  if (!response) return null;
  await Notifications.clearLastNotificationResponseAsync();
  return (response.notification.request.content.data || {}) as PushNavigatePayload;
}
