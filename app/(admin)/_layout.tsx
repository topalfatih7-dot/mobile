import { Stack } from 'expo-router';
import { useMemo } from 'react';

import { PanelChrome } from '@/components/panel/PanelChrome';
import { useAuth } from '@/context/AuthContext';
import { buildAdminNavItems } from '@/data/adminNav';

/** TopBar + Drawer — ana proje AdminShell / PanelMobileMenu paritesi */
export default function AdminLayout() {
  const { email } = useAuth();

  const items = useMemo(
    () =>
      buildAdminNavItems({
        applicationsCount: 0,
        chatUnreadCount: 0,
        openSupportTicketsCount: 0,
      }),
    [],
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
