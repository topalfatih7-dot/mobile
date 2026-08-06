import { Stack } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { PanelChrome } from '@/components/panel/PanelChrome';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { buildAdminNavItems } from '@/data/adminNav';
import {
  ensureAdminStaffThreads,
  subscribeAdminStaffChat,
} from '@/services/adminStaffChat';

/** TopBar + Drawer — ana proje AdminShell / PanelMobileMenu paritesi */
export default function AdminLayout() {
  const { email } = useAuth();
  const { platform } = useData();
  const [chatUnreadCount, setChatUnreadCount] = useState(0);

  const applicationsCount = useMemo(() => {
    const pending = (list: Record<string, unknown>[]) =>
      list.filter((a) => String(a.status || 'pending') === 'pending').length;
    return (
      pending(platform.staffApplications) +
      pending(platform.corporateApplications) +
      pending(platform.contactInquiries)
    );
  }, [
    platform.staffApplications,
    platform.corporateApplications,
    platform.contactInquiries,
  ]);

  const openSupportTicketsCount = useMemo(
    () =>
      (platform.tickets || []).filter((t) => {
        const s = String(t.status || '');
        return s === 'open' || s === 'pending';
      }).length,
    [platform.tickets],
  );

  const reloadChatBadge = useCallback(async () => {
    const staffList =
      platform.staffList.length > 0
        ? platform.staffList
        : Object.values(platform.staffById);
    try {
      const threads = await ensureAdminStaffThreads(
        staffList.map((s) => ({
          id: String(s.id),
          name: String(s.name || ''),
          role: String(s.role || ''),
        })),
      );
      setChatUnreadCount(
        threads.reduce((sum, t) => sum + Number(t.adminUnread || 0), 0),
      );
    } catch {
      /* keep */
    }
  }, [platform.staffList, platform.staffById]);

  useEffect(() => {
    void reloadChatBadge();
    return subscribeAdminStaffChat(() => void reloadChatBadge());
  }, [reloadChatBadge]);

  const items = useMemo(
    () =>
      buildAdminNavItems({
        applicationsCount,
        chatUnreadCount,
        openSupportTicketsCount,
      }),
    [applicationsCount, chatUnreadCount, openSupportTicketsCount],
  );

  return (
    <PanelChrome
      accent="admin"
      badge={{ label: 'Admin', icon: 'shield-outline' }}
      brandHref="/(admin)"
      items={items}
      userName={email || ''}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: 'transparent' },
        }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="members/index" />
        <Stack.Screen name="members/[id]" />
        <Stack.Screen name="premium" />
        <Stack.Screen name="sessions" />
        <Stack.Screen name="applications" />
        <Stack.Screen name="staff" />
        <Stack.Screen name="support" />
        <Stack.Screen name="messages/index" />
        <Stack.Screen name="messages/[threadId]" />
        <Stack.Screen name="library" />
        <Stack.Screen name="blog" />
        <Stack.Screen name="content" />
        <Stack.Screen name="payments" />
        <Stack.Screen name="plans" />
        <Stack.Screen name="subscriptions" />
        <Stack.Screen name="analytics" />
        <Stack.Screen name="activity" />
        <Stack.Screen name="ai-costs" />
        <Stack.Screen name="account" />
      </Stack>
    </PanelChrome>
  );
}
