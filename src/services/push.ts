/**
 * LOCK: docs/mobile/domains/notifications-model.md — Push (mobile)
 * Token → device_push_tokens; outbound via /api/application-notify → Expo Push.
 * Yerel banner: in-app bildirim gelince (realtime) OS üst şeridi — token/Expo gecikse bile.
 */
import { AppState, Platform } from 'react-native';

import { isUiOnly } from '@/config/runtime';
import { getActiveChatThreadId } from '@/services/activeChatThread';
import { playNotificationSoundThrottled } from '@/services/notificationSound';
import { requireSupabase, supabase } from '@/services/supabase';

/**
 * v2: Android kanalı bir kez oluşunca ses ayarı kilitlenir.
 * Eski `yeniform-alerts` sessiz kalmış olabilir → yeni id + bundled wav.
 */
const CHANNEL_ID = 'yeniform-alerts-v2';
/** app.json expo-notifications.sounds → native resource adı */
const CHANNEL_SOUND = 'notification.wav';

type NotificationsMod = typeof import('expo-notifications');

let notificationsMod: NotificationsMod | null | undefined;
let handlerWired = false;
let channelReady: Promise<void> | null = null;

async function loadNotifications(): Promise<NotificationsMod | null> {
  if (notificationsMod !== undefined) return notificationsMod;
  if (Platform.OS === 'web') {
    notificationsMod = null;
    return null;
  }
  try {
    notificationsMod = await import('expo-notifications');
    if (!handlerWired && notificationsMod) {
      handlerWired = true;
      notificationsMod.setNotificationHandler({
        handleNotification: async () => ({
          // Uygulama açıkken de banner + ses (WhatsApp/Telegram benzeri).
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
        await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
          name: 'Yeni Form Bildirimler',
          importance: Notifications.AndroidImportance.HIGH,
          // Android 8+: ses kanalda tanımlanmalı; content.sound tek başına yetmez.
          sound: CHANNEL_SOUND,
          vibrationPattern: [0, 250, 120, 250],
          enableVibrate: true,
          lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
          bypassDnd: false,
        });
      } catch {
        /* ignore */
      }
    })();
  }
  await channelReady;
}

/** Persist Expo token for the signed-in user (RLS upsert). */
export async function persistPushToken(
  userId: string,
  token: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!userId || !token || isUiOnly() || !supabase) {
    return { ok: false, error: 'Token kaydı atlandı.' };
  }
  const platform =
    Platform.OS === 'ios' || Platform.OS === 'android' ? Platform.OS : 'unknown';
  const { error } = await requireSupabase().from('device_push_tokens').upsert(
    {
      user_id: userId,
      expo_push_token: token,
      platform,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  );
  if (error) {
    if (__DEV__) console.warn('[push] persist failed', error.message);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

function resolveProjectId(Constants: {
  expoConfig?: { extra?: { eas?: { projectId?: string } } } | null;
  easConfig?: { projectId?: string } | null;
}): string | undefined {
  return (
    Constants.easConfig?.projectId ||
    Constants.expoConfig?.extra?.eas?.projectId ||
    undefined
  );
}

export async function registerForPushNotifications(
  userId?: string | null,
): Promise<string | null> {
  if (isUiOnly()) return null;
  if (Platform.OS === 'web') return null;

  try {
    const Device = await import('expo-device');
    // Fiziksel cihaz şart (OS push); simülatörde token alınmaz.
    if (!Device.isDevice) {
      if (__DEV__) console.warn('[push] Fiziksel cihaz gerekli — simulator/web atlandı.');
      return null;
    }

    const Notifications = await loadNotifications();
    if (!Notifications) return null;

    await ensureNotificationChannel();

    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      if (__DEV__) console.warn('[push] İzin reddedildi:', finalStatus);
      return null;
    }

    const Constants = (await import('expo-constants')).default;
    const projectId = resolveProjectId(Constants);
    let token: string | null = null;
    try {
      const tokenData = await Notifications.getExpoPushTokenAsync(
        projectId ? { projectId } : undefined,
      );
      token = tokenData.data;
    } catch (err) {
      if (__DEV__) console.warn('[push] getExpoPushTokenAsync', err);
      // projectId olmadan bir kez daha dene (Expo Go)
      if (projectId) {
        try {
          const tokenData = await Notifications.getExpoPushTokenAsync();
          token = tokenData.data;
        } catch (err2) {
          if (__DEV__) console.warn('[push] token retry failed', err2);
          return null;
        }
      } else {
        return null;
      }
    }

    if (userId && token) {
      const saved = await persistPushToken(userId, token);
      if (!saved.ok && __DEV__) console.warn('[push] DB kaydı yok:', saved.error);
    }
    return token;
  } catch (err) {
    if (__DEV__) console.warn('[push] register failed', err);
    return null;
  }
}

export type PushNavigatePayload = {
  type?: string;
  staffRole?: string;
  ticketId?: string;
  action?: string;
  threadId?: string;
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

/**
 * Telefon üst banner (OS bildirimi).
 * Uygulama açıkken de gösterilir (shouldShowBanner).
 * Açık chat thread’inde aynı thread mute.
 */
export async function presentSystemNotification(opts: {
  id: string;
  title: string;
  message?: string;
  type?: string;
  staffRole?: string;
  ticketId?: string;
  action?: string;
  threadId?: string | null;
}): Promise<void> {
  if (Platform.OS === 'web' || isUiOnly()) return;
  if (!opts.title) return;

  if (
    opts.type === 'chat' &&
    opts.threadId &&
    getActiveChatThreadId() &&
    String(opts.threadId) === getActiveChatThreadId()
  ) {
    return;
  }

  const Notifications = await loadNotifications();
  if (!Notifications) return;

  await ensureNotificationChannel();

  const data: PushNavigatePayload = {
    type: opts.type,
    staffRole: opts.staffRole,
    ticketId: opts.ticketId,
    action: opts.action,
    threadId: opts.threadId || undefined,
  };

  try {
    await Notifications.scheduleNotificationAsync({
      identifier: `yf-${opts.id}`,
      content: {
        title: opts.title,
        body: opts.message || '',
        data,
        sound: Platform.OS === 'android' ? CHANNEL_SOUND : 'default',
        ...(Platform.OS === 'android' ? { channelId: CHANNEL_ID } : {}),
      },
      trigger: null,
    });
  } catch (err) {
    if (__DEV__) console.warn('[push] presentSystemNotification', err);
  }
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

/** Foreground’da gelen remote/local push → ses */
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

export async function consumeInitialPushData(): Promise<PushNavigatePayload | null> {
  const Notifications = await loadNotifications();
  if (!Notifications) return null;
  const response = await Notifications.getLastNotificationResponseAsync();
  if (!response) return null;
  await Notifications.clearLastNotificationResponseAsync();
  return (response.notification.request.content.data || {}) as PushNavigatePayload;
}

/** App öne gelince token’ı yenile (izin / token rotasyonu). */
export function watchAppStateForPushReregister(userId: string | null | undefined) {
  if (!userId || Platform.OS === 'web') return () => {};
  const sub = AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      void registerForPushNotifications(userId);
    }
  });
  return () => sub.remove();
}
