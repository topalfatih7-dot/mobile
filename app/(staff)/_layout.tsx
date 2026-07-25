import { Stack } from 'expo-router';
import { useMemo } from 'react';

import { PanelChrome } from '@/components/panel/PanelChrome';
import { useAuth } from '@/context/AuthContext';
import { buildStaffNavItems } from '@/data/staffNav';
import type { IonName } from '@/data/memberNav';

const ROLE_BADGE: Record<string, { label: string; icon: IonName }> = {
  coach: { label: 'Koç', icon: 'barbell-outline' },
  dietitian: { label: 'Diyetisyen', icon: 'nutrition-outline' },
  doctor: { label: 'Doktor', icon: 'medkit-outline' },
};

/** TopBar + Drawer — ana proje StaffShell / PanelMobileMenu paritesi */
export default function StaffLayout() {
  const { staff } = useAuth();
  const role = String(staff?.role || 'coach');

  const items = useMemo(
    () =>
      buildStaffNavItems(role, {
        chatUnreadCount: 0,
        staffAdminUnreadCount: 0,
        staffCollabUnreadCount: 0,
      }),
    [role],
  );

  const badge = ROLE_BADGE[role] || ROLE_BADGE.coach;
  const userName = String(staff?.name || staff?.email || '').trim();

  return (
    <PanelChrome
      accent="staff"
      badge={badge}
      brandHref="/(staff)"
      items={items}
      userName={userName}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: 'transparent' },
        }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="clients/index" />
        <Stack.Screen name="clients/[id]/health" />
        <Stack.Screen name="clients/[id]/program" />
        <Stack.Screen name="messages/index" />
        <Stack.Screen name="messages/[threadId]" />
        <Stack.Screen name="messages/admin/[threadId]" />
        <Stack.Screen name="messages/collab/[threadId]" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="programs" />
        <Stack.Screen name="lists" />
        <Stack.Screen name="library" />
        <Stack.Screen name="payments" />
        <Stack.Screen name="call/[sessionType]/[sessionId]" />
      </Stack>
    </PanelChrome>
  );
}
