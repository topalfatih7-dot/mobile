import { Stack, router, type Href } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';

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
  registerForPushNotifications,
  routeFromPushData,
} from '@/services/push';
import { unlockNotificationAudio } from '@/services/notificationSound';
import { getMemberChatContacts } from '@/utils/chatContacts';

function MemberPushBootstrap() {
  const { role, userId } = useAuth();

  useEffect(() => {
    if (role !== 'member') return;

    let alive = true;

    (async () => {
      await unlockNotificationAudio();
      await configureIap(userId);
      // Client registration is valid; server persistence remains blocked until
      // a token storage/API contract exists.
      if (alive) await registerForPushNotifications();
    })();

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
      responseSub.remove();
      foregroundSub.remove();
    };
  }, [role, userId]);

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
