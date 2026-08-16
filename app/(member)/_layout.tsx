import { Stack, router, useFocusEffect, type Href } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Alert, AppState, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { PanelAuthGate } from '@/components/panel/PanelAuthGate';
import { PanelChrome } from '@/components/panel/PanelChrome';
import { useAuth } from '@/context/AuthContext';
import { useChatUnread } from '@/context/ChatUnreadContext';
import { useData, useMember } from '@/context/DataContext';
import { getMemberChatContacts } from '@/utils/chatContacts';
import { buildMemberNavItems } from '@/data/memberNav';
import {
  getCoreHealthTestKeySet,
  isCoreHealthTestComplete,
} from '@/data/coreHealthTest';
import { isDetailedHealthTestComplete } from '@/data/healthTest';
import { getHealthTestLockState } from '@/services/healthScoreAnalysis';
import {
  fetchMemberChatUnreadSummary,
  subscribeMemberChat,
} from '@/services/chat';
import {
  fetchMemberTickets,
  subscribeMemberTickets,
} from '@/services/supportTickets';
import { perfInc } from '@/utils/perfCounters';
import {
  addForegroundNotificationListener,
  addNotificationReceivedListener,
  consumeInitialPushData,
  presentSystemNotification,
  registerForPushNotifications,
  routeFromPushData,
  watchAppStateForPushReregister,
} from '@/services/push';
import { syncEngagementReminders, cancelHabitReminders } from '@/services/engagementReminders';
import {
  isNotificationSoundEnabled,
  isReminderNotificationsEnabled,
  playNotificationSoundThrottled,
  setNotificationSoundEnabledGetter,
  unlockNotificationAudio,
} from '@/services/notificationSound';

const PUSH_ASKED_KEY = 'push_permission_asked';

type NotifRow = {
  id?: string;
  title?: string;
  message?: string;
  type?: string;
  staffRole?: string;
  ticketId?: string;
  action?: string;
  threadId?: string;
  read?: boolean;
};

function MemberPushBootstrap() {
  const { role, userId } = useAuth();
  const member = useMember();
  const { myPrograms } = useData();
  const seenIdsRef = useRef<Set<string> | null>(null);
  const bootstrappedRef = useRef(false);

  const settings = (member?.settings || {}) as Record<string, unknown>;

  // Yeni üye oturumu — bootstrap sıfırla
  useEffect(() => {
    bootstrappedRef.current = false;
    seenIdsRef.current = null;
  }, [userId]);

  // soundNotifs → playNotificationSoundThrottled (web parity)
  useEffect(() => {
    if (role !== 'member') {
      setNotificationSoundEnabledGetter(null);
      return;
    }
    const enabled = settings.soundNotifs !== false;
    setNotificationSoundEnabledGetter(() => enabled);
    return () => setNotificationSoundEnabledGetter(null);
  }, [role, settings.soundNotifs]);

  // Delayed push permission request shown once after login (6A)
  useEffect(() => {
    if (role !== 'member' || !userId || Platform.OS === 'web') return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      if (cancelled) return;
      try {
        const asked = await AsyncStorage.getItem(PUSH_ASKED_KEY);
        if (asked) return;
        Alert.alert(
          'Bildirim İzni',
          'Koçundan ve diyetisyeninden anlık bildirim almak ister misin?',
          [
            {
              text: 'Şimdi Değil',
              style: 'cancel',
              onPress: async () => {
                await AsyncStorage.setItem(PUSH_ASKED_KEY, 'true');
              },
            },
            {
              text: 'Evet, İzin Ver',
              onPress: async () => {
                await AsyncStorage.setItem(PUSH_ASKED_KEY, 'true');
                await registerForPushNotifications(userId);
              },
            },
          ],
        );
      } catch {
        /* ignore storage errors */
      }
    }, 3000);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [role, userId]);

  useEffect(() => {
    if (role !== 'member') return;

    let alive = true;

    (async () => {
      await unlockNotificationAudio();
      if (alive) await registerForPushNotifications(userId);
    })();

    const unwatch = watchAppStateForPushReregister(userId);

    void consumeInitialPushData().then((data) => {
      if (!alive || !data) return;
      const route = routeFromPushData(data);
      if (route) router.push(route as Href);
    });

    const responseSub = addNotificationReceivedListener((data) => {
      const route = routeFromPushData(data);
      if (route) router.push(route as Href);
    });
    const foregroundSub = addForegroundNotificationListener();

    return () => {
      alive = false;
      unwatch();
      responseSub.remove();
      foregroundSub.remove();
    };
  }, [role, userId]);

  useEffect(() => {
    if (role !== 'member' || !member?.id) {
      void cancelHabitReminders();
      return;
    }
    void syncEngagementReminders({
      member: member as Record<string, unknown>,
      programs: myPrograms,
    });
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      void syncEngagementReminders({
        member: member as Record<string, unknown>,
        programs: myPrograms,
      });
    });
    return () => {
      sub.remove();
      void cancelHabitReminders();
    };
  }, [
    role,
    member?.id,
    member?.membership,
    member?.settings,
    member?.completedActivities,
    member?.healthTest,
    member?.gender,
    myPrograms,
  ]);

  /**
   * Web `useNotificationAlerts` parity:
   * Yeni in-app bildirim → OS banner + ses (chat sesi realtime’da; burada program/assignment vb.).
   */
  useEffect(() => {
    if (role !== 'member' || !userId) return;
    // Hydrate bitmeden bootstrap etme (web: profileReady)
    if (!Array.isArray(member?.notifications)) return;

    const list = (member.notifications as NotifRow[]).filter((n) => n?.id);
    const soundOn = isNotificationSoundEnabled(settings);
    const remindersOn = isReminderNotificationsEnabled(settings);

    if (!bootstrappedRef.current) {
      bootstrappedRef.current = true;
      seenIdsRef.current = new Set(list.map((n) => String(n.id)));
      return;
    }

    const seen = seenIdsRef.current || new Set<string>();
    seenIdsRef.current = seen;
    const showLocalBanner = AppState.currentState === 'active';

    for (const n of list) {
      const id = String(n.id);
      if (seen.has(id)) continue;
      seen.add(id);
      if (n.read) continue;

      const type = String(n.type || '');
      if ((type === 'reminder' || type === 'availability') && !remindersOn) continue;

      if (showLocalBanner) {
        void presentSystemNotification({
          id,
          title: String(n.title || 'Yeni Form'),
          message: String(n.message || ''),
          type: n.type,
          staffRole: n.staffRole,
          ticketId: n.ticketId,
          action: n.action,
          threadId: n.threadId,
        });
      }

      // Chat sesi usePlatformRealtime / useIncomingChatSound parity — çift ses yok
      if (soundOn && type !== 'chat') {
        void playNotificationSoundThrottled();
      }
    }
  }, [role, userId, member?.notifications, settings.soundNotifs, settings.reminderNotifs]);

  return null;
}

/** TopBar + Drawer — ana proje AppShell / PanelMobileMenu paritesi */
export default function MemberLayout() {
  const member = useMember();
  const { staffById } = useData();
  const {
    memberUnreadTotal,
    supportOpenCount,
    setFromSummary,
    bumpGeneration,
    subscribeBump,
  } = useChatUnread();

  const reloadChatUnread = useCallback(async () => {
    if (!member?.id) {
      setFromSummary({ memberUnreadTotal: 0 });
      return;
    }
    try {
      perfInc('badge_unread_summary');
      const { threads } = await fetchMemberChatUnreadSummary(String(member.id));
      const roles = new Set(
        getMemberChatContacts(member, staffById).map((c) => c.staffRole),
      );
      const unreadTotal = threads
        .filter((t) => roles.has(t.staffRole))
        .reduce((sum, t) => sum + Number(t.memberUnread || 0), 0);
      setFromSummary({ memberUnreadTotal: unreadTotal });
    } catch {
      setFromSummary({ memberUnreadTotal: 0 });
    }
  }, [member, staffById, setFromSummary]);

  const reloadSupportBadge = useCallback(async () => {
    if (!member?.id) {
      setFromSummary({ supportOpenCount: 0 });
      return;
    }
    const tickets = await fetchMemberTickets(String(member.id));
    setFromSummary({
      supportOpenCount: tickets.filter(
        (ticket) => ticket.status === 'open' || ticket.status === 'pending',
      ).length,
    });
  }, [member?.id, setFromSummary]);

  // Single layout-level chat + tickets subscription (inbox/thread consume bump)
  useEffect(() => {
    void reloadChatUnread();
    void reloadSupportBadge();
    if (!member?.id) return;
    const mid = String(member.id);
    const unsubChat = subscribeMemberChat(() => void reloadChatUnread(), mid);
    const unsubTickets = subscribeMemberTickets(mid, () => {
      void reloadSupportBadge();
    });
    const unsubBump = subscribeBump(() => {
      void reloadChatUnread();
      void reloadSupportBadge();
    });
    return () => {
      unsubChat();
      unsubTickets();
      unsubBump();
    };
  }, [member?.id, reloadChatUnread, reloadSupportBadge, subscribeBump]);

  useFocusEffect(
    useCallback(() => {
      void reloadChatUnread();
    }, [reloadChatUnread]),
  );

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void reloadChatUnread();
    });
    return () => sub.remove();
  }, [reloadChatUnread]);

  // Keep bumpGeneration referenced so chat realtime bumps re-render nav when summary updates
  void bumpGeneration;

  const notifications = (member?.notifications as { read?: boolean }[]) || [];
  const notificationUnreadCount = notifications.filter((n) => !n.read).length;
  const healthTestIncomplete = useMemo(() => {
    if (!member) return false;
    const gender = member.gender ? String(member.gender) : null;
    const ht = (member.healthTest as Record<string, unknown>) || {};
    if (!isCoreHealthTestComplete(ht, gender)) return true;
    const coreKeys = getCoreHealthTestKeySet(gender);
    const detailed = isDetailedHealthTestComplete(
      ht,
      gender,
      (member.packageConfig as Record<string, unknown>) || null,
      coreKeys,
    );
    if (detailed) {
      const lock = getHealthTestLockState({
        healthAnalysis: member.healthAnalysis as never,
        detailedComplete: true,
        optionalCompletedAt: ht.optionalCompletedAt
          ? String(ht.optionalCompletedAt)
          : null,
      });
      return Boolean(lock.canRetake);
    }
    return true;
  }, [member]);

  const items = useMemo(
    () =>
      buildMemberNavItems({
        membership: String(member?.membership || 'free'),
        notificationUnreadCount,
        openSupportTicketsCount: supportOpenCount,
        healthTestIncomplete,
        chatUnreadCount: memberUnreadTotal,
      }),
    [
      member?.membership,
      notificationUnreadCount,
      supportOpenCount,
      healthTestIncomplete,
      memberUnreadTotal,
    ],
  );

  const userName = String(member?.name || member?.email || '').trim();

  return (
    <PanelAuthGate allow="member">
    <PanelChrome
      accent="member"
      brandHref="/(member)/dashboard"
      items={items}
      notificationUnreadCount={notificationUnreadCount}
      showNotificationBell
      userName={userName}>
      <MemberPushBootstrap />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: 'transparent' },
        }}>
        <Stack.Screen name="dashboard" />
        <Stack.Screen name="programs" />
        <Stack.Screen name="schedule" />
        <Stack.Screen name="more" />
        <Stack.Screen name="calendar" />
        <Stack.Screen name="library" />
        <Stack.Screen name="calorie" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="support" />
        <Stack.Screen name="messages/index" />
        <Stack.Screen name="messages/[threadId]" />
        <Stack.Screen name="health-test/index" />
        <Stack.Screen name="health-test/core" />
        <Stack.Screen name="health-test/[sectionId]" />
        <Stack.Screen name="profile/index" />
        <Stack.Screen name="profile/payments" />
        <Stack.Screen
          name="call/[sessionType]/[sessionId]"
          options={{
            presentation: 'fullScreenModal',
            animation: 'fade',
            gestureEnabled: false,
          }}
        />
      </Stack>
    </PanelChrome>
    </PanelAuthGate>
  );
}
