import { Stack } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { PanelChrome } from '@/components/panel/PanelChrome';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { buildStaffNavItems } from '@/data/staffNav';
import type { IonName } from '@/data/memberNav';
import {
  fetchStaffChatThreads,
  subscribeStaffClientChat,
} from '@/services/chat';
import {
  getOrCreateAdminStaffThread,
  subscribeAdminStaffChat,
} from '@/services/adminStaffChat';
import {
  collabUnreadForStaff,
  ensureStaffCollabThreads,
  subscribeStaffCollabChat,
} from '@/services/staffCollabChat';
import { normalizeStaffRole } from '@/utils/staffClients';

const ROLE_BADGE: Record<string, { label: string; icon: IonName }> = {
  coach: { label: 'Koç', icon: 'barbell-outline' },
  dietitian: { label: 'Diyetisyen', icon: 'nutrition-outline' },
  doctor: { label: 'Doktor', icon: 'medkit-outline' },
};

/** TopBar + Drawer — ana proje StaffShell / PanelMobileMenu paritesi */
export default function StaffLayout() {
  const { staff } = useAuth();
  const { platform } = useData();
  const role = String(staff?.role || 'coach');
  const [chatUnreadCount, setChatUnreadCount] = useState(0);
  const [staffAdminUnreadCount, setStaffAdminUnreadCount] = useState(0);
  const [staffCollabUnreadCount, setStaffCollabUnreadCount] = useState(0);

  const reloadBadges = useCallback(async () => {
    if (!staff?.id) {
      setChatUnreadCount(0);
      setStaffAdminUnreadCount(0);
      setStaffCollabUnreadCount(0);
      return;
    }
    try {
      const [threads, adminThread, collab] = await Promise.all([
        fetchStaffChatThreads(String(staff.id)),
        getOrCreateAdminStaffThread({
          id: String(staff.id),
          name: String(staff.name || ''),
          role: String(staff.role || ''),
        }),
        ensureStaffCollabThreads(
          staff,
          platform.members,
          platform.staffList.length
            ? platform.staffList
            : Object.values(platform.staffById),
        ),
      ]);
      setChatUnreadCount(
        threads.reduce((sum, t) => sum + Number(t.staffUnread || 0), 0),
      );
      setStaffAdminUnreadCount(adminThread ? Number(adminThread.staffUnread || 0) : 0);
      setStaffCollabUnreadCount(
        collab.reduce(
          (sum, t) => sum + collabUnreadForStaff(t, normalizeStaffRole(staff.role as string)),
          0,
        ),
      );
    } catch {
      /* keep last known */
    }
  }, [staff, platform.members, platform.staffList, platform.staffById]);

  useEffect(() => {
    void reloadBadges();
    if (!staff?.id) return;
    const unsubs = [
      subscribeStaffClientChat(() => void reloadBadges(), String(staff.id)),
      subscribeAdminStaffChat(() => void reloadBadges()),
      subscribeStaffCollabChat(() => void reloadBadges(), staff),
    ];
    return () => unsubs.forEach((u) => u());
  }, [staff, reloadBadges]);

  const items = useMemo(
    () =>
      buildStaffNavItems(role, {
        chatUnreadCount,
        staffAdminUnreadCount,
        staffCollabUnreadCount,
      }),
    [role, chatUnreadCount, staffAdminUnreadCount, staffCollabUnreadCount],
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
        <Stack.Screen name="messages/admin/index" />
        <Stack.Screen name="messages/admin/[threadId]" />
        <Stack.Screen name="messages/collab/index" />
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
