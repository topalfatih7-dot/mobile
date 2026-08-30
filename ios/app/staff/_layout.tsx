import { Stack, router, type Href } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, View } from 'react-native';

import { StaffForcePasswordChange } from '@/components/auth/StaffForcePasswordChange';
import { PanelAuthGate } from '@/components/panel/PanelAuthGate';
import { PanelChrome } from '@/components/panel/PanelChrome';
import { useAuth } from '@/context/AuthContext';
import { useChatUnread } from '@/context/ChatUnreadContext';
import { useData } from '@/context/DataContext';
import { buildStaffNavItems } from '@/data/staffNav';
import type { IonName } from '@/data/memberNav';
import {
  fetchStaffChatUnreadSummary,
  subscribeStaffClientChat,
  type ChatThread,
} from '@/services/chat';
import {
  getOrCreateAdminStaffThread,
  subscribeAdminStaffChat,
} from '@/services/adminStaffChat';
import {
  collabUnreadForStaff,
  subscribeStaffCollabChat,
  type StaffCollabThread,
} from '@/services/staffCollabChat';
import { clearStaffTempPasswordIssued } from '@/services/staffDb';
import {
  collabNotificationTitle,
  getStaffNotificationsList,
} from '@/services/staffNotifications';
import { setNotificationSoundEnabledGetter } from '@/services/notificationSound';
import {
  addForegroundNotificationListener,
  addNotificationReceivedListener,
  consumeInitialPushData,
  getNotificationPermissionSnapshot,
  presentSystemNotification,
  registerForPushNotifications,
  routeFromStaffPushData,
  watchAppStateForPushReregister,
} from '@/services/push';
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

function StaffPushBootstrap() {
  const { staff, userId } = useAuth();
  const seenIdsRef = useRef<Set<string> | null>(null);
  const bootstrappedRef = useRef(false);

  useEffect(() => {
    bootstrappedRef.current = false;
    seenIdsRef.current = null;
  }, [userId]);

  useEffect(() => {
    const settings = (staff?.settings || {}) as Record<string, unknown>;
    const enabled = settings.soundNotifs !== false;
    setNotificationSoundEnabledGetter(() => enabled);
    return () => setNotificationSoundEnabledGetter(null);
  }, [staff?.settings]);

  useEffect(() => {
    if (!userId) return;
    let alive = true;
    void (async () => {
      const snap = await getNotificationPermissionSnapshot();
      if (!alive) return;
      if (snap?.status === 'undetermined') {
        await registerForPushNotifications(userId, { prompt: true });
      } else {
        await registerForPushNotifications(userId);
      }
    })();
    const unwatch = watchAppStateForPushReregister(userId);
    void consumeInitialPushData().then((data) => {
      if (!alive || !data) return;
      const route = routeFromStaffPushData(data);
      if (route) router.push(route as Href);
    });
    const responseSub = addNotificationReceivedListener((data) => {
      const route = routeFromStaffPushData(data);
      if (route) router.push(route as Href);
    });
    const foregroundSub = addForegroundNotificationListener();
    return () => {
      alive = false;
      unwatch();
      responseSub.remove();
      foregroundSub.remove();
    };
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    const list = getStaffNotificationsList(staff).filter((n) => n?.id);
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
      if (!showLocalBanner) continue;
      void presentSystemNotification({
        id,
        title: String(n.title || 'Yeni Form'),
        message: String(n.message || ''),
        type: String(n.type || ''),
        threadId: n.threadId != null ? String(n.threadId) : null,
        audience: 'staff',
        memberId: n.memberId != null ? String(n.memberId) : null,
        sessionId: n.sessionId != null ? String(n.sessionId) : null,
        sessionType: n.sessionType != null ? String(n.sessionType) : null,
        userId,
        senderId: n.senderId != null ? String(n.senderId) : null,
      });
    }
  }, [userId, staff]);

  return null;
}

/** TopBar + Drawer — ana proje StaffShell / PanelMobileMenu paritesi */
export default function StaffLayout() {
  const { staff, userId, refreshAuth, setLocalStaffOverlay } = useAuth();
  const { setChatNotifyHandler } = useData();
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
  const threadCacheRef = useRef<Map<string, ChatThread>>(new Map());
  const collabCacheRef = useRef<StaffCollabThread[]>([]);

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
      // Thread bilgilerini cache'le (bildirim için memberName lookup)
      const map = new Map<string, ChatThread>();
      clientSummary.threads.forEach((t) => map.set(t.id, t));
      threadCacheRef.current = map;
      collabCacheRef.current = collab;
    } catch {
      /* keep last known */
    }
  }, [staff, setFromSummary]);

  // Realtime chat INSERT → uygulama öndeyken yerel banner.
  // Arka planda gönderenin Expo’su yeterli; burada ikinci OS bildirimi üretme.
  useEffect(() => {
    if (!userId || !staffId) {
      setChatNotifyHandler(null);
      return;
    }
    setChatNotifyHandler(({ threadId, senderType, text, channel, senderId }) => {
      if (channel === 'collab') {
        if (AppState.currentState !== 'active') return;
        const collabThread = collabCacheRef.current.find((t) => t.id === threadId);
        const preview = text || '';
        void presentSystemNotification({
          id: `collab-rt-${threadId}`,
          title: collabNotificationTitle(senderType),
          message: collabThread?.memberName
            ? `${collabThread.memberName}: ${preview}`
            : preview,
          type: 'collab',
          threadId,
          audience: 'staff',
          memberId: collabThread?.memberId || null,
          userId,
          senderId: senderId || null,
        });
        return;
      }
      if (senderType !== 'member') return;
      if (AppState.currentState !== 'active') return;
      const thread = threadCacheRef.current.get(threadId);
      // İkincil koruma: thread cache'de yoksa bu personele ait değil (RLS zaten
      // filtreler, bu kontrol olası geçiş/yarış durumları için ek güvencedir).
      if (!thread) return;
      void presentSystemNotification({
        id: `chat-rt-${threadId}`,
        title: `${thread.memberName || 'Danışan'} yeni mesaj gönderdi`,
        message: text || '',
        type: 'chat',
        threadId,
        audience: 'staff',
        memberId: thread.memberId || null,
        userId,
      });
    });
    return () => setChatNotifyHandler(null);
  }, [userId, staffId, setChatNotifyHandler]);

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
    <PanelAuthGate allow="staff">
    <View style={{ flex: 1 }}>
      <StaffPushBootstrap />
      <PanelChrome
        accent="staff"
        badge={badge}
        brandHref="/staff"
        items={items}
        notificationUnreadCount={notificationUnreadCount}
        notificationsHref="/staff/notifications"
        showNotificationBell
        userName={userName}
        userPhoto={staff?.photo ? String(staff.photo) : null}>
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
    </PanelAuthGate>
  );
}
