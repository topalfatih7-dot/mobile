import * as Notifications from 'expo-notifications';
import { router, type Href } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

import { useApp } from '@/context/AppContext';
import {
  cancelAllScheduledReminders,
  getExpoPushToken,
  parseMemberSettings,
  parseNotificationDeepLink,
  registerAndroidNotificationChannel,
  requestPushPermissions,
  scheduleLocalReminder,
} from '@/services/pushNotifications';
import { initOneSignal } from '@/services/oneSignal';

/** Oturum açık üye için push izni, token kaydı ve bildirim tıklama yönlendirmesi. */
export function PushBootstrap() {
  const { isMember, member, user, updateProfile, nextSession } = useApp();
  const registeredRef = useRef(false);

  useEffect(() => {
    void registerAndroidNotificationChannel();
  }, []);

  useEffect(() => {
    if (!isMember || !member?.id || registeredRef.current) return;

    registeredRef.current = true;
    void (async () => {
      const settings = parseMemberSettings(member.settings);
      if (settings.pushNotifs === false) return;

      await requestPushPermissions();
      const token = await getExpoPushToken();
      if (token && member.pushToken !== token) {
        await updateProfile({ pushToken: token });
      }
      await initOneSignal(user.id);
    })();
  }, [isMember, member?.id, member?.pushToken, member?.settings, updateProfile, user.id]);

  useEffect(() => {
    if (!isMember || !member) return;
    const settings = parseMemberSettings(member.settings);
    if (!settings.reminderNotifs || !nextSession?.rawDate) return;

    void (async () => {
      await cancelAllScheduledReminders();
      const sessionStart = new Date(nextSession.rawDate);
      if (Number.isNaN(sessionStart.getTime())) return;

      const reminderAt = new Date(sessionStart.getTime() - 30 * 60 * 1000);
      if (reminderAt.getTime() <= Date.now()) return;

      await scheduleLocalReminder({
        title: 'Yaklaşan seans',
        body: `${nextSession.coach} ile ${nextSession.time} seansınız 30 dk içinde.`,
        triggerDate: reminderAt,
        data: {
          pathname: `/call/${nextSession.sessionType}/${nextSession.id}`,
        },
      });
    })();
  }, [isMember, member, nextSession]);

  useEffect(() => {
    if (Platform.OS === 'web') return;

    const onResponse = (response: Notifications.NotificationResponse) => {
      const link = parseNotificationDeepLink(response.notification.request.content.data);
      if (!link) return;
      router.push(link.pathname as Href);
    };

    const sub = Notifications.addNotificationResponseReceivedListener(onResponse);
    return () => sub.remove();
  }, []);

  return null;
}
