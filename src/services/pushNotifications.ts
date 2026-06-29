import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const supportsNativeNotifications = Platform.OS === 'ios' || Platform.OS === 'android';

if (supportsNativeNotifications) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

export type MemberSettings = {
  theme?: string;
  language?: string;
  emailNotifs?: boolean;
  pushNotifs?: boolean;
  reminderNotifs?: boolean;
};

export const DEFAULT_MEMBER_SETTINGS: Required<
  Pick<MemberSettings, 'emailNotifs' | 'pushNotifs' | 'reminderNotifs'>
> = {
  emailNotifs: true,
  pushNotifs: true,
  reminderNotifs: true,
};

export function parseMemberSettings(raw: unknown): MemberSettings {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_MEMBER_SETTINGS };
  const settings = raw as MemberSettings;
  return {
    theme: settings.theme || 'light',
    language: settings.language || 'tr',
    emailNotifs: settings.emailNotifs ?? DEFAULT_MEMBER_SETTINGS.emailNotifs,
    pushNotifs: settings.pushNotifs ?? DEFAULT_MEMBER_SETTINGS.pushNotifs,
    reminderNotifs: settings.reminderNotifs ?? DEFAULT_MEMBER_SETTINGS.reminderNotifs,
  };
}

export async function requestPushPermissions(): Promise<boolean> {
  if (!supportsNativeNotifications || !Device.isDevice) return false;

  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;

  const requested = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowBadge: true, allowSound: true },
  });
  return requested.granted || requested.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
}

export async function getExpoPushToken(): Promise<string | null> {
  if (!supportsNativeNotifications || !Device.isDevice) return null;

  const granted = await requestPushPermissions();
  if (!granted) return null;

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId ??
    undefined;

  try {
    const token = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    return token.data;
  } catch {
    return null;
  }
}

export async function registerAndroidNotificationChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('default', {
    name: 'Yeni Form',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#2478a8',
  });
}

export type NotificationDeepLink = {
  pathname: string;
  params?: Record<string, string>;
};

export function parseNotificationDeepLink(data: unknown): NotificationDeepLink | null {
  if (!data || typeof data !== 'object') return null;
  const row = data as Record<string, unknown>;
  if (typeof row.pathname === 'string') {
    return {
      pathname: row.pathname,
      params: row.params as Record<string, string> | undefined,
    };
  }
  if (typeof row.threadId === 'string') {
    return { pathname: `/messages/${row.threadId}` };
  }
  if (row.screen === 'notifications') {
    return { pathname: '/profile/notifications' };
  }
  return null;
}

export async function scheduleLocalReminder({
  title,
  body,
  triggerDate,
  data,
}: {
  title: string;
  body: string;
  triggerDate: Date;
  data?: Record<string, unknown>;
}) {
  if (!supportsNativeNotifications || triggerDate.getTime() <= Date.now()) return null;
  return Notifications.scheduleNotificationAsync({
    content: { title, body, data, sound: true },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerDate,
    },
  });
}

export async function cancelAllScheduledReminders() {
  if (!supportsNativeNotifications) return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}
