import { Stack } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';

import { StaffForcePasswordChange } from '@/components/auth/StaffForcePasswordChange';
import { PanelChrome } from '@/components/panel/PanelChrome';
import { useAuth } from '@/context/AuthContext';
import { useChatUnread } from '@/context/ChatUnreadContext';
import { buildStaffNavItems } from '@/data/staffNav';
import type { IonName } from '@/data/memberNav';
import {
  fetchStaffChatUnreadSummary,
  subscribeStaffClientChat,
} from '@/services/chat';
import {
  getOrCreateAdminStaffThread,
  subscribeAdminStaffChat,
} from '@/services/adminStaffChat';
import {
  collabUnreadForStaff,
  subscribeStaffCollabChat,
} from '@/services/staffCollabChat';
import { clearStaffTempPasswordIssued } from '@/services/staffDb';
import { getStaffNotificationsList } from '@/services/staffNotifications';
import { normalizeStaffRole } from '@/utils/staffClients';
import { perfInc } from '@/utils/perfCounters';

/** rowToStaff spreads `data` → top-level; tolerate nested `staff.data.tempPasswordIssued`. */
function staffMustChangePassword(staff: Record<string, unknown> | null | undefined): boolean {
  if (!staff) return false;
  if (staff.tempPasswordIssued) return true;
  const nested = staff.data;
  if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
    return Boolean((nested as Record<string, unknown>).tempPasswordIssued);
  }
  return false;
}

const ROLE_BADGE: Record<string, { label: string; icon: IonName }> = {
  coach: { label: 'Koç', icon: 'barbell-outline' },
  dietitian: { label: 'Diyetisyen', icon: 'nutrition-outline' },
  doctor: { label: 'Doktor', icon: 'medkit-outline' },
};

/** TopBar + Drawer — ana proje StaffShell / PanelMobileMenu paritesi */
export default function StaffLayout() {
  const { staff, refreshAuth, setLocalStaffOverlay } = useAuth();
  const {
    staffClientUnread,
    collabUnread,
    adminStaffUnread,
    setFromSummary,
    subscribeBump,
  } = useChatUnread();
  const role = String(staff?.role || 'coach');
  const staffId = staff?.id ? String(staff.id) : '';
  const [passwordChanged, setPasswordChanged] = useState(false);

  const mustChangePassword = staffMustChangePassword(staff);
  const showForceChange = mustChangePassword && !passwordChanged;

  useEffect(() => {
    setPasswordChanged(false);
  }, [staff?.id]);

  const handlePasswordChanged = useCallback(async () => {
    try {
      if (staff?.id) {
        await clearStaffTempPasswordIssued(String(staff.id));
        const nested =
          staff.data && typeof staff.data === 'object' && !Array.isArray(staff.data)
            ? (staff.data as Record<string, unknown>)
            : null;
        setLocalStaffOverlay({
          ...staff,
          tempPasswordIssued: false,
          ...(nested
            ? { data: { ...nested, tempPasswordIssued: false } }
            : {}),
        });
      }
    } catch {
      // Web parity: güncelleme başarısız olsa bile devam; sonraki girişte yeniden sorar.
    }
    await refreshAuth().catch(() => {});
    setPasswordChanged(true);
  }, [staff, refreshAuth, setLocalStaffOverlay]);

  const notificationUnreadCount = useMemo(() => {
    const raw = getStaffNotificationsList(staff);
    return raw.filter((n) => !n?.read).length;
  }, [staff]);

  const reloadBadges = useCallback(async () => {
    if (!staff?.id) {
      setFromSummary({
        staffClientUnread: 0,
        adminStaffUnread: 0,
        collabUnread: 0,
      });
      return;
    }
    try {
      perfInc('badge_unread_summary');
      const { fetchStaffCollabThreadsForStaff } = await import('@/services/staffCollabChat');
      const [clientSummary, adminThread, collab] = await Promise.all([
        fetchStaffChatUnreadSummary(String(staff.id)),
        getOrCreateAdminStaffThread({
          id: String(staff.id),
          name: String(staff.name || ''),
          role: String(staff.role || ''),
        }),
        fetchStaffCollabThreadsForStaff(staff),
      ]);
      setFromSummary({
        staffClientUnread: clientSummary.unreadTotal,
        adminStaffUnread: adminThread ? Number(adminThread.staffUnread || 0) : 0,
        collabUnread: collab.reduce(
          (sum, t) =>
            sum + collabUnreadForStaff(t, normalizeStaffRole(staff.role as string)),
          0,
        ),
      });
    } catch {
      /* keep last known */
    }
  }, [staff, setFromSummary]);

  useEffect(() => {
    void reloadBadges();
    if (!staffId || !staff) return;
    let t: ReturnType<typeof setTimeout> | null = null;
    const bump = () => {
      if (t) clearTimeout(t);
      t = setTimeout(() => void reloadBadges(), 400);
    };
    const unsubs = [
      subscribeStaffClientChat(bump, staffId),
      subscribeAdminStaffChat(bump),
      subscribeStaffCollabChat(bump, staff),
      subscribeBump(bump),
    ];
    return () => {
      if (t) clearTimeout(t);
      unsubs.forEach((u) => u());
    };
  }, [staffId, staff, reloadBadges, subscribeBump]);

  const items = useMemo(
    () =>
      buildStaffNavItems(role, {
        chatUnreadCount: staffClientUnread,
        staffAdminUnreadCount: adminStaffUnread,
        staffCollabUnreadCount: collabUnread,
        notificationUnreadCount,
      }),
    [
      role,
      staffClientUnread,
      adminStaffUnread,
      collabUnread,
      notificationUnreadCount,
    ],
  );

  const badge = ROLE_BADGE[role] || ROLE_BADGE.coach;
  const userName = String(staff?.name || staff?.email || '').trim();

  return (
    <View style={{ flex: 1 }}>
      <PanelChrome
        accent="staff"
        badge={badge}
        brandHref="/(staff)"
        items={items}
        notificationUnreadCount={notificationUnreadCount}
        notificationsHref="/(staff)/notifications"
        showNotificationBell
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
          <Stack.Screen name="clients/[id]/list" />
          <Stack.Screen name="messages/index" />
          <Stack.Screen name="messages/[threadId]" />
          <Stack.Screen name="messages/admin/index" />
          <Stack.Screen name="messages/admin/[threadId]" />
          <Stack.Screen name="messages/collab/index" />
          <Stack.Screen name="messages/collab/[threadId]" />
          <Stack.Screen name="notifications" />
          <Stack.Screen name="profile" />
          <Stack.Screen name="programs" />
          <Stack.Screen name="lists" />
          <Stack.Screen name="library" />
          <Stack.Screen name="payments" />
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

      {showForceChange ? (
        <StaffForcePasswordChange
          onDone={handlePasswordChanged}
          staffName={String(staff?.name || '')}
        />
      ) : null}
    </View>
  );
}
