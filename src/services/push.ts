/**
 * LOCK: docs/mobile/domains/notifications-model.md — Push (mobile)
 * Token → device_push_tokens; outbound via /api/application-notify → Expo Push.
 * Yerel banner: in-app bildirim gelince (realtime) OS üst şeridi — token/Expo gecikse bile.
 */
import { AppState, Platform } from 'react-native';

import { isUiOnly } from '@/config/runtime';
import { getActiveChatThreadId } from '@/services/activeChatThread';
import { isHabitAction } from '@/data/engagementReminderCopy';
import { isNotificationSoundEnabled } from '@/services/notificationSound';
import { requireSupabase, supabase } from '@/services/supabase';

/**
 * v3: cihaz varsayılan bildirimi. Android 8+ kanal sesi kilitlenir —
 * v2 `notification.wav` (web klibi, yarıda kesiliyordu) bu id ile durur.
 */
export const ANDROID_ALERTS_CHANNEL = 'yeniform-alerts-v3';
export const ANDROID_ALERTS_CHANNEL_SILENT = 'yeniform-alerts-v3-silent';

export function androidNotificationChannelId(): string {
  return isNotificationSoundEnabled()
    ? ANDROID_ALERTS_CHANNEL
    : ANDROID_ALERTS_CHANNEL_SILENT;
}

/** iOS content.sound / Android kanal `default`. Kapalıysa null. */
export function notificationContentSound(): 'default' | null {
  return isNotificationSoundEnabled() ? 'default' : null;
}

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
        handleNotification: async (notification) => {
          const data = (notification.request.content.data || {}) as PushNavigatePayload;
          const hideHabit =
            isHabitAction(data.action) && AppState.currentState === 'active';
          if (hideHabit) {
            return {
              shouldShowAlert: false,
              shouldPlaySound: false,
              shouldSetBadge: false,
              shouldShowBanner: false,
              shouldShowList: false,
            };
          }
          return {
            shouldShowAlert: true,
            shouldPlaySound: isNotificationSoundEnabled(),
            shouldSetBadge: true,
            shouldShowBanner: true,
            shouldShowList: true,
          };
        },
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
        const base = {
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 120, 250] as number[],
          enableVibrate: true,
          lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
          bypassDnd: false,
        };
        await Notifications.setNotificationChannelAsync(ANDROID_ALERTS_CHANNEL, {
          ...base,
          name: 'Yeni Form Bildirimler',
          sound: 'default',
        });
        await Notifications.setNotificationChannelAsync(ANDROID_ALERTS_CHANNEL_SILENT, {
          ...base,
          name: 'Yeni Form Bildirimler (sessiz)',
          sound: null,
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
  const action = String(data.action || '');
  if (type === 'chat' && data.staffRole) {
    return `/(member)/messages/${data.staffRole}`;
  }
  if (type === 'program') {
    return '/(member)/programs';
  }
  if (type === 'availability' || action === 'availability') {
    return '/(member)/calendar?avail=1';
  }
  if (type === 'support' || type === 'support-reply') {
    return '/(member)/support';
  }
  if (type === 'appointment') {
    return '/(member)/schedule';
  }
  if (type === 'assignment') {
    return '/(member)/profile';
  }
  if (
    action === 'habit_meal' ||
    action === 'habit_workout' ||
    action === 'habit_streak'
  ) {
    return '/(member)/calendar';
  }
  if (action === 'habit_health') {
    return '/(member)/health-test';
  }
  if (action === 'habit_upsell') {
    return '/(member)/profile/payments';
  }
  if (type === 'reminder' || isHabitAction(action)) {
    return '/(member)/dashboard';
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
        sound: notificationContentSound(),
        ...(Platform.OS === 'android'
          ? { channelId: androidNotificationChannelId() }
          : {}),
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

/** Foreground’da gelen remote/local push (ses: OS handler shouldPlaySound). */
export function addForegroundNotificationListener(
  onReceive?: (data: PushNavigatePayload) => void,
) {
  let sub: { remove: () => void } | null = null;
  let cancelled = false;
  void loadNotifications().then((Notifications) => {
    if (!Notifications || cancelled) return;
    sub = Notifications.addNotificationReceivedListener((notification) => {
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
