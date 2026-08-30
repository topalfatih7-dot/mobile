/**
 * LOCK: docs/mobile/domains/notifications-model.md — Push (mobile)
 * Token → device_push_tokens; outbound via /api/application-notify → Expo Push.
 * Yerel banner: in-app bildirim gelince (realtime) OS üst şeridi — token/Expo gecikse bile.
 */
import { AppState, Platform } from 'react-native';

import { getActiveJoinedCallSessionId } from '@/services/activeCallSession';
import { getActiveChatThreadId } from '@/services/activeChatThread';
import { isHabitAction } from '@/data/engagementReminderCopy';
import { isNotificationSoundEnabled } from '@/services/notificationSound';
import { requireSupabase, supabase } from '@/services/supabase';
import { canOfferWebPurchase } from '@/services/webCheckoutHandoff';

/**
 * v3: cihaz varsayılan bildirimi. Android 8+ kanal sesi kilitlenir —
 * v2 `notification.wav` (web klibi, yarıda kesiliyordu) bu id ile durur.
 */
export const ANDROID_ALERTS_CHANNEL = 'yeniform-alerts-v3';
export const ANDROID_ALERTS_CHANNEL_SILENT = 'yeniform-alerts-v3-silent';

export function androidNotificationChannelId(): string {
  return isNotificationSoundEnabled()
    ? ANDROID_ALERTS_CHANNEL
    : ANDROID_ALERTS_CHANNEL_SILENT;
}

/** iOS content.sound / Android kanal `default`. Kapalıysa null. */
export function notificationContentSound(): 'default' | null {
  return isNotificationSoundEnabled() ? 'default' : null;
}

type NotificationsMod = typeof import('expo-notifications');

let notificationsMod: NotificationsMod | null | undefined;
let handlerWired = false;
let channelReady: Promise<void> | null = null;

/** Remote Expo/APNs/FCM vs `scheduleNotificationAsync` (yerel banner). */
function isRemotePushTrigger(trigger: unknown): boolean {
  if (!trigger || typeof trigger !== 'object') return false;
  return (trigger as { type?: string }).type === 'push';
}

const SILENT_PRESENTATION = {
  shouldShowAlert: false,
  shouldPlaySound: false,
  shouldSetBadge: true,
  shouldShowBanner: false,
  shouldShowList: false,
} as const;

const recentBannerAt = new Map<string, number>();
const BANNER_DEDUPE_MS = 8000;

let currentPushUserId: string | null = null;

export function setCurrentPushUserId(userId: string | null) {
  currentPushUserId = userId ? String(userId) : null;
}

export function isPushForCurrentUser(data: { userId?: string | null }): boolean {
  if (!data.userId) return true;
  // Kullanıcı kimliği henüz belirlenmemişse bildirimi göster (uygulama başlatma/arka plan geçişi)
  if (!currentPushUserId) return true;
  return String(data.userId) === String(currentPushUserId);
}

/** Remote/local banner: wrong account or the sender echoing their own chat. */
export function shouldSuppressPushForCurrentUser(data: {
  userId?: string | null;
  senderId?: string | null;
  type?: string | null;
}): boolean {
  if (data.userId && !isPushForCurrentUser({ userId: data.userId })) return true;
  const type = String(data.type || '');
  const isChatEcho =
    type === 'chat' || type === 'collab' || type === 'admin-chat';
  if (
    isChatEcho &&
    data.senderId &&
    currentPushUserId &&
    String(data.senderId) === String(currentPushUserId)
  ) {
    return true;
  }
  return false;
}

function bannerDedupeKey(opts: {
  id?: string;
  title: string;
  message?: string;
  type?: string;
  threadId?: string | null;
  sessionId?: string | null;
}): string {
  if (opts.type && opts.threadId) {
    return `${opts.type}|thread|${opts.threadId}`;
  }
  if (opts.type && opts.sessionId) {
    return `${opts.type}|session|${opts.sessionId}`;
  }
  if (opts.id) {
    return `id|${opts.id}`;
  }
  return [
    opts.type || '',
    opts.title,
    (opts.message || '').slice(0, 80),
  ].join('|');
}

function shouldSkipDuplicateBanner(opts: {
  id?: string;
  title: string;
  message?: string;
  type?: string;
  threadId?: string | null;
  sessionId?: string | null;
}): boolean {
  const now = Date.now();
  for (const [key, at] of recentBannerAt) {
    if (now - at > BANNER_DEDUPE_MS) recentBannerAt.delete(key);
  }
  const key = bannerDedupeKey(opts);
  const prev = recentBannerAt.get(key);
  if (prev && now - prev < BANNER_DEDUPE_MS) return true;
  recentBannerAt.set(key, now);
  return false;
}

async function loadNotifications(): Promise<NotificationsMod | null> {
  if (notificationsMod !== undefined) return notificationsMod;
  if (Platform.OS === 'web') {
    notificationsMod = null;
    return null;
  }
  try {
    notificationsMod = await import('expo-notifications');
    if (!handlerWired && notificationsMod) {
      handlerWired = true;
      notificationsMod.setNotificationHandler({
        handleNotification: async (notification) => {
          const data = (notification.request.content.data || {}) as PushNavigatePayload;
          if (shouldSuppressPushForCurrentUser(data)) {
            return { ...SILENT_PRESENTATION, shouldSetBadge: false };
          }
          const hideHabit =
            isHabitAction(data.action) && AppState.currentState === 'active';
          if (hideHabit) {
            return { ...SILENT_PRESENTATION, shouldSetBadge: false };
          }
          /**
           * Çift bildirim: aynı olay Expo remote + realtime yerel banner.
           * Önde (`active`) listedeki remote tipler sessiz — yerel
           * `presentSystemNotification` (chat) veya members/staff satır
           * realtime banner’ı (appointment / program / assignment) gösterir.
           * Kilit / inactive / background: remote’u OS göstersin.
           */
          const remoteType = String(data.type || '');
          const silentForegroundRemote =
            remoteType === 'chat' ||
            remoteType === 'admin-chat' ||
            remoteType === 'collab' ||
            remoteType === 'appointment' ||
            remoteType === 'call-join' ||
            remoteType === 'program' ||
            remoteType === 'assignment';
          if (
            isRemotePushTrigger(notification.request.trigger) &&
            AppState.currentState === 'active' &&
            silentForegroundRemote
          ) {
            return SILENT_PRESENTATION;
          }
          return {
            shouldShowAlert: true,
            shouldPlaySound: isNotificationSoundEnabled(),
            shouldSetBadge: true,
            shouldShowBanner: true,
            shouldShowList: true,
          };
        },
      });
    }
    return notificationsMod;
  } catch {
    notificationsMod = null;
    return null;
  }
}

export async function ensureNotificationChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  if (!channelReady) {
    channelReady = (async () => {
      const Notifications = await loadNotifications();
      if (!Notifications) {
        channelReady = null;
        return;
      }
      try {
        const base = {
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 120, 250] as number[],
          enableVibrate: true,
          lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
          bypassDnd: false,
        };
        await Notifications.setNotificationChannelAsync(ANDROID_ALERTS_CHANNEL, {
          ...base,
          name: 'Yeni Form Bildirimler',
          sound: 'default',
        });
        await Notifications.setNotificationChannelAsync(ANDROID_ALERTS_CHANNEL_SILENT, {
          ...base,
          name: 'Yeni Form Bildirimler (sessiz)',
          sound: null,
        });
      } catch {
        channelReady = null;
      }
    })();
  }
  await channelReady;
}

/**
 * Persist Expo token for the signed-in user.
 * Uses `upsert_device_push_token` RPC (security definer) which:
 * - Removes the same token from other users (cross-user device reuse)
 * - Removes any old token the current user had
 * - Upserts by user_id PK
 * Avoids the RLS gap where DELETE on another user's row was blocked,
 * causing a unique-index conflict and silent token storage failure.
 */
export async function persistPushToken(
  userId: string,
  token: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!userId || !token || !supabase) {
    return { ok: false, error: 'Token kaydı atlandı.' };
  }
  const platform =
    Platform.OS === 'ios' || Platform.OS === 'android' ? Platform.OS : 'unknown';
  const sb = requireSupabase();
  const { error } = await sb.rpc('upsert_device_push_token', {
    p_token: token,
    p_platform: platform,
  });
  if (error) {
    if (__DEV__) console.warn('[push] persist failed', error.message);
    return { ok: false, error: error.message };
  }
  setCurrentPushUserId(userId);
  return { ok: true };
}

/** Logout / account switch: drop this device token so the previous user is not reached. */
export async function clearDevicePushToken(userId?: string | null): Promise<void> {
  const Notifications = await loadNotifications();
  let token: string | null = null;
  try {
    if (Notifications) {
      const Constants = (await import('expo-constants')).default;
      const projectId = resolveProjectId(Constants);
      const tokenData = await Notifications.getExpoPushTokenAsync(
        projectId ? { projectId } : undefined,
      );
      token = tokenData.data;
    }
  } catch {
    /* simulator / permission */
  }
  if (supabase) {
    try {
      const sb = requireSupabase();
      if (token) {
        await sb.from('device_push_tokens').delete().eq('expo_push_token', token);
      }
      if (userId) {
        await sb.from('device_push_tokens').delete().eq('user_id', userId);
      }
    } catch {
      /* proceed with local cleanup */
    }
  }
  try {
    if (Notifications) {
      await Notifications.dismissAllNotificationsAsync();
      await Notifications.setBadgeCountAsync(0);
    }
  } catch {
    /* ignore */
  }
  setCurrentPushUserId(null);
}

function resolveProjectId(Constants: {
  expoConfig?: { extra?: { eas?: { projectId?: string } } } | null;
  easConfig?: { projectId?: string } | null;
}): string | undefined {
  return (
    Constants.easConfig?.projectId ||
    Constants.expoConfig?.extra?.eas?.projectId ||
    undefined
  );
}

export type NotificationPermissionSnapshot = {
  status: string;
  granted: boolean;
  canAskAgain: boolean;
};

export type PushRegisterOptions = {
  /** OS diyaloğu yalnızca status === undetermined iken. Mount/AppState varsayılanı sessiz. */
  prompt?: boolean;
  /** Cooldown atla — izin/ayar açılınca token’ı hemen DB’ye yaz. */
  force?: boolean;
};

const IOS_PERMISSION_REQUEST = {
  ios: {
    allowAlert: true,
    allowBadge: true,
    allowSound: true,
  },
} as const;

let registerInFlight: Promise<string | null> | null = null;
let lastGrantedToken: string | null = null;
let lastGrantedUserId: string | null = null;
let lastGrantedRegisterAt = 0;
const TOKEN_REFRESH_COOLDOWN_MS = 60_000;
/** Simulator / web: push token yok. Sessiz atla — LogBox spam etme. */
let skipPushRuntime: boolean | null = null;

async function isPushRuntimeSkipped(): Promise<boolean> {
  if (Platform.OS === 'web') return true;
  if (skipPushRuntime != null) return skipPushRuntime;
  try {
    const Device = await import('expo-device');
    skipPushRuntime = !Device.isDevice;
  } catch {
    skipPushRuntime = true;
  }
  return skipPushRuntime;
}

function snapshotFromPermissionResponse(result: {
  status?: string;
  granted?: boolean;
  canAskAgain?: boolean;
}): NotificationPermissionSnapshot {
  const status = String(result.status || '');
  return {
    status,
    granted: Boolean(result.granted || status === 'granted'),
    canAskAgain: result.canAskAgain !== false,
  };
}

export async function getNotificationPermissionSnapshot(): Promise<NotificationPermissionSnapshot | null> {
  if (Platform.OS === 'web') return null;
  const Notifications = await loadNotifications();
  if (!Notifications) return null;
  try {
    return snapshotFromPermissionResponse(await Notifications.getPermissionsAsync());
  } catch {
    return null;
  }
}

export async function hasGrantedNotificationPermission(): Promise<boolean> {
  const snap = await getNotificationPermissionSnapshot();
  return Boolean(snap?.granted);
}

/** In-app izin Alert: granted veya kalıcı denied değilse. OS isteği yine yalnız prompt:true. */
export function shouldOfferNotificationPermissionPrompt(
  snap: NotificationPermissionSnapshot | null,
): boolean {
  if (!snap) return false;
  if (snap.granted) return false;
  return snap.canAskAgain !== false;
}

async function ensurePushPermission(
  Notifications: NotificationsMod,
  prompt: boolean,
): Promise<boolean> {
  let snap: NotificationPermissionSnapshot;
  try {
    snap = snapshotFromPermissionResponse(await Notifications.getPermissionsAsync());
  } catch {
    return false;
  }
  if (snap.granted) return true;
  if (!prompt) return false;
  // Android 13: ilk açılış denied + canAskAgain. Yalnız canAskAgain false iken isteme.
  if (!snap.canAskAgain) {
    if (__DEV__) console.warn('[push] İzin reddedildi:', snap.status);
    return false;
  }
  try {
    snap = snapshotFromPermissionResponse(
      await Notifications.requestPermissionsAsync(IOS_PERMISSION_REQUEST),
    );
  } catch {
    return false;
  }
  if (!snap.granted) {
    if (__DEV__) console.warn('[push] İzin reddedildi:', snap.status);
    return false;
  }
  return true;
}

async function registerForPushNotificationsInner(
  userId?: string | null,
  prompt = false,
): Promise<string | null> {
  try {
    if (userId) setCurrentPushUserId(userId);
    if (await isPushRuntimeSkipped()) return null;

    const Notifications = await loadNotifications();
    if (!Notifications) return null;

    const allowed = await ensurePushPermission(Notifications, prompt);
    if (!allowed) return null;

    await ensureNotificationChannel();

    const Constants = (await import('expo-constants')).default;
    const projectId = resolveProjectId(Constants);
    let token: string | null = null;
    try {
      const tokenData = await Notifications.getExpoPushTokenAsync(
        projectId ? { projectId } : undefined,
      );
      token = tokenData.data;
    } catch (err) {
      if (__DEV__) console.warn('[push] getExpoPushTokenAsync', err);
      if (projectId) {
        try {
          const tokenData = await Notifications.getExpoPushTokenAsync();
          token = tokenData.data;
        } catch (err2) {
          if (__DEV__) console.warn('[push] token retry failed', err2);
          return null;
        }
      } else {
        return null;
      }
    }

    if (userId && token) {
      const saved = await persistPushToken(userId, token);
      if (!saved.ok && __DEV__) console.warn('[push] DB kaydı yok:', saved.error);
    }
    if (token) {
      lastGrantedToken = token;
      lastGrantedUserId = userId ? String(userId) : null;
      lastGrantedRegisterAt = Date.now();
    }
    return token;
  } catch (err) {
    if (__DEV__) console.warn('[push] register failed', err);
    return null;
  }
}

export async function registerForPushNotifications(
  userId?: string | null,
  options?: PushRegisterOptions,
): Promise<string | null> {
  if (Platform.OS === 'web') return null;
  if (await isPushRuntimeSkipped()) return null;
  const prompt = options?.prompt === true;
  const force = options?.force === true;

  if (
    !prompt &&
    !force &&
    lastGrantedToken &&
    lastGrantedUserId === (userId ? String(userId) : null) &&
    Date.now() - lastGrantedRegisterAt < TOKEN_REFRESH_COOLDOWN_MS
  ) {
    return lastGrantedToken;
  }

  if (registerInFlight) {
    const pending = registerInFlight;
    if (!prompt) return pending;
    await pending.catch(() => null);
    if (registerInFlight) await registerInFlight.catch(() => null);
  }

  const run = registerForPushNotificationsInner(userId, prompt);
  registerInFlight = run;
  try {
    return await run;
  } finally {
    if (registerInFlight === run) registerInFlight = null;
  }
}

export type PushNavigatePayload = {
  type?: string;
  staffRole?: string;
  ticketId?: string;
  action?: string;
  threadId?: string;
  audience?: 'staff' | 'member';
  memberId?: string;
  sessionId?: string;
  sessionType?: string;
  userId?: string;
  senderId?: string;
};

function callJoinSessionType(value?: string | null): 'coach' | 'dietitian' | 'doctor' | null {
  const t = String(value || '');
  if (t === 'coach' || t === 'dietitian' || t === 'doctor') return t;
  return null;
}

/** Collab deep link: danışan id. Alıcı personel id'si (token/userId) danışan değildir. */
function collabRouteParam(data: PushNavigatePayload, threadId: string): string {
  const rawMemberId = data.memberId ? String(data.memberId) : '';
  const selfIds = new Set(
    [data.userId, currentPushUserId].filter(Boolean).map((id) => String(id)),
  );
  if (rawMemberId && !selfIds.has(rawMemberId)) return rawMemberId;
  return threadId;
}

export function routeFromStaffPushData(data: PushNavigatePayload): string | null {
  if (shouldSuppressPushForCurrentUser(data)) return null;
  const type = String(data.type || '');
  const memberId = data.memberId ? String(data.memberId) : '';
  const threadId = data.threadId ? String(data.threadId) : '';
  const sessionId = data.sessionId ? String(data.sessionId) : '';
  const sessionType = callJoinSessionType(data.sessionType);
  if (type === 'chat' && memberId) {
    return `/(staff)/messages/${memberId}`;
  }
  if (type === 'admin-chat') {
    return threadId
      ? `/(staff)/messages/admin/${threadId}`
      : '/(staff)/messages/admin';
  }
  if (type === 'collab') {
    const collabId = collabRouteParam(data, threadId);
    return collabId
      ? `/(staff)/messages/collab/${collabId}`
      : '/(staff)/messages/collab';
  }
  if (type === 'call-join' && sessionId && sessionType) {
    return `/(staff)/call/${sessionType}/${sessionId}`;
  }
  if (type === 'appointment' || type === 'call-join') {
    const qs = new URLSearchParams({ focus: 'appointments' });
    if (memberId) qs.set('memberId', memberId);
    if (sessionId) qs.set('sessionId', sessionId);
    return `/(staff)?${qs.toString()}`;
  }
  if (type === 'assignment') {
    return memberId ? `/(staff)/messages/${memberId}` : '/(staff)/notifications';
  }
  return '/(staff)/notifications';
}

/** Navigate map — screens/member/notifications.md + staff audience */
export function routeFromPushData(data: PushNavigatePayload): string | null {
  if (shouldSuppressPushForCurrentUser(data)) return null;
  if (data.audience === 'staff' || data.type === 'admin-chat' || data.type === 'collab') {
    return routeFromStaffPushData(data);
  }
  const type = String(data.type || '');
  const action = String(data.action || '');
  if (type === 'chat' && data.staffRole) {
    return `/(member)/messages/${data.staffRole}`;
  }
  if (type === 'program') {
    return '/(member)/programs';
  }
  if (type === 'availability' || action === 'availability') {
    return '/(member)/calendar?avail=1';
  }
  if (type === 'support' || type === 'support-reply') {
    return '/(member)/support';
  }
  if (type === 'appointment') {
    return '/(member)/schedule';
  }
  if (type === 'call-join') {
    const sessionId = data.sessionId ? String(data.sessionId) : '';
    const sessionType = callJoinSessionType(data.sessionType);
    if (sessionId && sessionType) {
      return `/(member)/call/${sessionType}/${sessionId}`;
    }
    return '/(member)/schedule';
  }
  if (type === 'assignment') {
    return '/(member)/profile';
  }
    if (
      action === 'habit_meal' ||
      action === 'habit_workout' ||
      action === 'habit_streak' ||
      action === 'habit_program_meal' ||
      action === 'habit_program_workout' ||
      action === 'habit_no_activity'
    ) {
      return '/(member)/calendar';
    }
  if (action === 'habit_health') {
    return '/(member)/health-test';
  }
  if (action === 'habit_upsell') {
    return canOfferWebPurchase()
      ? '/(member)/profile/payments'
      : '/(member)/dashboard';
  }
  if (type === 'reminder' || isHabitAction(action)) {
    return '/(member)/dashboard';
  }
  return '/(member)/notifications';
}

/**
 * Telefon üst banner (OS bildirimi).
 * Uygulama açıkken de gösterilir (shouldShowBanner).
 * Açık chat thread’inde aynı thread mute.
 */
export async function presentSystemNotification(opts: {
  id: string;
  title: string;
  message?: string;
  type?: string;
  staffRole?: string;
  ticketId?: string;
  action?: string;
  threadId?: string | null;
  audience?: 'staff' | 'member';
  memberId?: string | null;
  sessionId?: string | null;
  sessionType?: string | null;
  userId?: string | null;
  senderId?: string | null;
}): Promise<void> {
  if (Platform.OS === 'web') return;
  if (!opts.title) return;
  if (!(await hasGrantedNotificationPermission())) return;

  const userId = opts.userId || currentPushUserId || undefined;
  if (
    shouldSuppressPushForCurrentUser({
      userId,
      senderId: opts.senderId,
      type: opts.type,
    })
  ) {
    return;
  }

  if (
    opts.threadId &&
    getActiveChatThreadId() &&
    String(opts.threadId) === getActiveChatThreadId()
  ) {
    return;
  }

  if (
    String(opts.type || '') === 'call-join' &&
    opts.sessionId &&
    getActiveJoinedCallSessionId() &&
    String(opts.sessionId) === getActiveJoinedCallSessionId()
  ) {
    return;
  }

  if (shouldSkipDuplicateBanner(opts)) return;

  const Notifications = await loadNotifications();
  if (!Notifications) return;

  await ensureNotificationChannel();

  const data: PushNavigatePayload = {
    type: opts.type,
    staffRole: opts.staffRole,
    ticketId: opts.ticketId,
    action: opts.action,
    threadId: opts.threadId || undefined,
    audience: opts.audience,
    memberId: opts.memberId || undefined,
    sessionId: opts.sessionId || undefined,
    sessionType: opts.sessionType || undefined,
    userId,
    senderId: opts.senderId || undefined,
  };

  if (__DEV__) {
    console.log('[push] present', {
      type: opts.type || '',
      userId: userId || null,
      senderId: opts.senderId || null,
      audience: opts.audience || null,
      threadId: opts.threadId || null,
    });
  }

  try {
    await Notifications.scheduleNotificationAsync({
      identifier: `yf-${opts.id}`,
      content: {
        title: opts.title,
        body: opts.message || '',
        data,
        sound: notificationContentSound() || undefined,
        ...(Platform.OS === 'ios' ? { interruptionLevel: 'active' as const } : {}),
        ...(Platform.OS === 'android'
          ? { channelId: androidNotificationChannelId() }
          : {}),
      },
      trigger: null,
    });
  } catch (err) {
    if (__DEV__) console.warn('[push] presentSystemNotification', err);
  }
}

export function addNotificationReceivedListener(
  handler: (data: PushNavigatePayload) => void,
) {
  let sub: { remove: () => void } | null = null;
  let cancelled = false;
  void loadNotifications().then((Notifications) => {
    if (!Notifications || cancelled) return;
    sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = (response.notification.request.content.data ||
        {}) as PushNavigatePayload;
      handler(data);
    });
  });
  return {
    remove: () => {
      cancelled = true;
      sub?.remove();
    },
  };
}

/** Foreground’da gelen remote/local push (ses: OS handler shouldPlaySound). */
export function addForegroundNotificationListener(
  onReceive?: (data: PushNavigatePayload) => void,
) {
  let sub: { remove: () => void } | null = null;
  let cancelled = false;
  void loadNotifications().then((Notifications) => {
    if (!Notifications || cancelled) return;
    sub = Notifications.addNotificationReceivedListener((notification) => {
      const data = (notification.request.content.data || {}) as PushNavigatePayload;
      onReceive?.(data);
    });
  });
  return {
    remove: () => {
      cancelled = true;
      sub?.remove();
    },
  };
}

export async function consumeInitialPushData(): Promise<PushNavigatePayload | null> {
  const Notifications = await loadNotifications();
  if (!Notifications) return null;
  const response = await Notifications.getLastNotificationResponseAsync();
  if (!response) return null;
  await Notifications.clearLastNotificationResponseAsync();
  return (response.notification.request.content.data || {}) as PushNavigatePayload;
}

/** App öne gelince token’ı yenile — sessiz; izin diyaloğu açılmaz. */
export function watchAppStateForPushReregister(userId: string | null | undefined) {
  if (!userId || Platform.OS === 'web') return () => {};
  const sub = AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      void registerForPushNotifications(userId);
    }
  });
  return () => sub.remove();
}
