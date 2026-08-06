import { Stack, router, type Href } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { PanelChrome } from '@/components/panel/PanelChrome';
import { useAuth } from '@/context/AuthContext';
import { useData, useMember } from '@/context/DataContext';
import { buildMemberNavItems } from '@/data/memberNav';
import { allApplicableComplete } from '@/data/healthTest';
import { loadMemberChat, subscribeMemberChat } from '@/services/chat';
import { configureIap } from '@/services/iap';
import {
  fetchMemberTickets,
  subscribeMemberTickets,
} from '@/services/supportTickets';
import {
  addForegroundNotificationListener,
  addNotificationReceivedListener,
  consumeInitialPushData,
  presentSystemNotification,
  registerForPushNotifications,
  routeFromPushData,
  watchAppStateForPushReregister,
} from '@/services/push';
import { unlockNotificationAudio } from '@/services/notificationSound';
import { getMemberChatContacts } from '@/utils/chatContacts';

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
  const seenIdsRef = useRef<Set<string> | null>(null);

  useEffect(() => {
    if (role !== 'member') return;

    let alive = true;

    (async () => {
      await unlockNotificationAudio();
      await configureIap(userId);
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

  /**
   * In-app bildirim listesine yeni kayıt düşünce telefon üst banner’ı göster.
   * (Expo remote push token yoksa / gecikse bile OS bildirimi gelsin.)
   */
  useEffect(() => {
    if (role !== 'member') return;
    const list = ((member?.notifications as NotifRow[]) || []).filter((n) => n?.id);
    if (!list.length) {
      seenIdsRef.current = seenIdsRef.current || new Set();
      return;
    }

    if (seenIdsRef.current == null) {
      // İlk hydrate: mevcutları “görüldü” say — eski bildirimler için banner spam yok
      seenIdsRef.current = new Set(list.map((n) => String(n.id)));
      return;
    }

    const seen = seenIdsRef.current;
    const fresh = list.filter((n) => !seen.has(String(n.id)));
    // Foreground: yerel OS banner. Arka plan/killed: Expo remote push (token şart).
    const showLocalBanner = AppState.currentState === 'active';
    for (const n of fresh) {
      seen.add(String(n.id));
      if (n.read || !showLocalBanner) continue;
      void presentSystemNotification({
        id: String(n.id),
        title: String(n.title || 'Yeni Form'),
        message: String(n.message || ''),
        type: n.type,
        staffRole: n.staffRole,
        ticketId: n.ticketId,
        action: n.action,
        threadId: n.threadId,
      });
    }
  }, [role, member?.notifications]);

  return null;
}

/** TopBar + Drawer — ana proje AppShell / PanelMobileMenu paritesi */
export default function MemberLayout() {
  const member = useMember();
  const { staffById } = useData();
  const [chatUnreadCount, setChatUnreadCount] = useState(0);
  const [openSupportTicketsCount, setOpenSupportTicketsCount] = useState(0);

  const contacts = useMemo(
    () => getMemberChatContacts(member, staffById),
    [member, staffById],
  );

  const reloadChatUnread = useCallback(async () => {
    if (!member?.id) {
      setChatUnreadCount(0);
      return;
    }
    try {
      const snapshot = await loadMemberChat(
        contacts,
        String(member.id),
        String(member.name || 'Üye'),
      );
      setChatUnreadCount(
        snapshot.threads.reduce(
          (sum, thread) => sum + Number(thread.memberUnread || 0),
          0,
        ),
      );
    } catch {
      setChatUnreadCount(0);
    }
  }, [contacts, member?.id, member?.name]);

  useEffect(() => {
    void reloadChatUnread();
    return subscribeMemberChat(
      () => void reloadChatUnread(),
      member?.id ? String(member.id) : undefined,
    );
  }, [member?.id, reloadChatUnread]);

  const reloadSupportBadge = useCallback(async () => {
    if (!member?.id) {
      setOpenSupportTicketsCount(0);
      return;
    }
    const tickets = await fetchMemberTickets(String(member.id));
    setOpenSupportTicketsCount(
      tickets.filter(
        (ticket) => ticket.status === 'open' || ticket.status === 'pending',
      ).length,
    );
  }, [member?.id]);

  useEffect(() => {
    void reloadSupportBadge();
    if (!member?.id) return;
    return subscribeMemberTickets(String(member.id), () => {
      void reloadSupportBadge();
    });
  }, [member?.id, reloadSupportBadge]);

  const notifications = (member?.notifications as { read?: boolean }[]) || [];
  const notificationUnreadCount = notifications.filter((n) => !n.read).length;
  const healthTestIncomplete = !allApplicableComplete(
    member?.gender as string | undefined,
    (member?.healthTest as Record<string, unknown>) || {},
    member?.packageConfig as Record<string, unknown> | undefined,
  );

  const items = useMemo(
    () =>
      buildMemberNavItems({
        membership: String(member?.membership || 'free'),
        notificationUnreadCount,
        openSupportTicketsCount,
        healthTestIncomplete,
        chatUnreadCount,
      }),
    [
      member?.membership,
      notificationUnreadCount,
      openSupportTicketsCount,
      healthTestIncomplete,
      chatUnreadCount,
    ],
  );

  const userName = String(member?.name || member?.email || '').trim();

  return (
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
        <Stack.Screen name="health-test/[sectionId]" />
        <Stack.Screen name="profile/index" />
        <Stack.Screen name="profile/payments" />
        <Stack.Screen name="call/[sessionType]/[sessionId]" />
      </Stack>
    </PanelChrome>
  );
}
