import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from 'react';

import { isUiOnly } from '@/config/runtime';
import { useAuth } from '@/context/AuthContext';
import { useData, useMember } from '@/context/DataContext';
import { useToast } from '@/context/ToastContext';
import { bookSessionApi } from '@/services/bookSession';
import { fetchMemberById, patchMemberFields } from '@/services/memberDb';
import {
  beginMemberWrite,
  endMemberWrite,
} from '@/services/memberWriteGate';
import type { MemberRecord } from '@/services/mappers';
import { submitSuccessStory as submitSuccessStoryDb } from '@/services/successStory';
import { createTicket } from '@/services/supportTickets';
import { buildProgressPatch } from '@/utils/memberProgress';
import { completionKey, mealCompletionKey } from '@/utils/programSchedule';
import {
  sessionTitle,
  sessionsKey,
  type MemberSession,
} from '@/utils/sessionBooking';

export type ActionsContextValue = {
  refresh: () => Promise<void>;
  toggleActivityCompletion: (dateStr: string, entryId: string) => Promise<void>;
  toggleMealCompletion: (
    dateStr: string,
    mealType: string,
    entryIds?: string[],
  ) => Promise<void>;
  updateProfile: (
    patch: Record<string, unknown>,
    opts?: { toastMsg?: string; skipAuthRefresh?: boolean },
  ) => Promise<void>;
  updateSettings: (settings: Record<string, unknown>) => Promise<void>;
  /** Flat healthTest patch — web `saveHealthTestProgress` parity */
  updateHealthTestPartial: (
    nextFlatHealthTest: Record<string, unknown>,
  ) => Promise<void>;
  bookStaffSession: (
    type: 'coach' | 'dietitian' | 'doctor',
    startsAt: string,
    duration?: number,
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  cancelStaffSession: (
    type: 'coach' | 'dietitian' | 'doctor',
    sessionId: string,
  ) => Promise<void>;
  rescheduleStaffSession: (
    type: 'coach' | 'dietitian' | 'doctor',
    sessionId: string,
    newDate: string,
  ) => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  flushNotificationReads: () => Promise<void>;
  createSupportTicket: (input: {
    category: string;
    subject: string;
    message: string;
  }) => Promise<{ ok: true } | { ok: false; error: string }>;
  submitSuccessStory: (input: {
    story: string;
    duration?: string;
    consent: boolean;
  }) => Promise<{ ok: true } | { ok: false; error: string }>;
};

const ActionsContext = createContext<ActionsContextValue | null>(null);

export function ActionsProvider({ children }: { children: ReactNode }) {
  const { refreshAuth } = useAuth();
  const { programs, refreshData, setLocalMemberOverlay, staffById } = useData();
  const member = useMember();
  const { toast } = useToast();
  const memberRef = useRef(member);
  const notificationsRef = useRef<({ id: string; read?: boolean } & Record<string, unknown>)[]>(
    [],
  );
  const notificationsDirtyRef = useRef(false);
  const notificationFlushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notificationFlushInFlightRef = useRef<Promise<void> | null>(null);
  const memberWriteQueueRef = useRef<Promise<void>>(Promise.resolve());
  const memberWriteRevisionRef = useRef(0);

  useEffect(() => {
    memberRef.current = member;
    if (!notificationsDirtyRef.current) {
      notificationsRef.current =
        ((member?.notifications as typeof notificationsRef.current) || []).slice();
    }
  }, [member]);

  const refresh = useCallback(async () => {
    await refreshData();
  }, [refreshData]);

  const persistPatch = useCallback(
    async (
      patch: Record<string, unknown>,
      opts?: { toastMsg?: string; skipAuthRefresh?: boolean },
    ) => {
      const current = memberRef.current;
      if (!current?.id) return;
      const revision = ++memberWriteRevisionRef.current;
      const optimistic = { ...current, ...patch } as MemberRecord;
      memberRef.current = optimistic;
      setLocalMemberOverlay(optimistic);

      // UI-only: yalnızca bellek — DB yazılmaz
      if (isUiOnly()) {
        if (opts?.toastMsg) toast(opts.toastMsg, 'success');
        return;
      }

      beginMemberWrite();
      const queuedWrite = memberWriteQueueRef.current
        .catch(() => {})
        .then(async () => {
          try {
            const localLatest = memberRef.current;
            if (!localLatest?.id) return;
            // Her yazıdan önce sunucudaki son kaydı al; yalnız bu aksiyonun
            // patch'ini uygula. Böylece webhook/realtime gibi eşzamanlı
            // güncellemeler eski bir tam üye snapshot'ıyla ezilmez.
            const remoteLatest = await fetchMemberById(String(localLatest.id));
            const next = await patchMemberFields(remoteLatest || localLatest, patch);
            if (memberWriteRevisionRef.current === revision) {
              memberRef.current = next;
              setLocalMemberOverlay(next);
            }
            // Sessiz sağlık analizi yazılarında full hydrate atlanır —
            // overlay zaten güncel; realtime refresh yarışını azaltır.
            if (!opts?.skipAuthRefresh) {
              await refreshAuth();
            }
            if (opts?.toastMsg) toast(opts.toastMsg, 'success');
          } finally {
            endMemberWrite();
          }
        });
      memberWriteQueueRef.current = queuedWrite;
      await queuedWrite;
    },
    [setLocalMemberOverlay, refreshAuth, toast],
  );

  const toggleActivityCompletion = useCallback(
    async (dateStr: string, entryId: string) => {
      if (!member || !dateStr) return;
      const current = (member.completedActivities as Record<string, string[]>) || {};
      const dayKeys = current[dateStr] || [];
      const key = completionKey(dateStr, entryId);
      const newKeys = dayKeys.includes(key)
        ? dayKeys.filter((k) => k !== key)
        : [...dayKeys, key];
      const completedActivities = { ...current, [dateStr]: newKeys };
      const myProgs = programs.filter((p) => p.memberId === member.id);
      const progressPatch = buildProgressPatch(
        myProgs,
        completedActivities,
        (member.progress as object) || {},
        member as never,
      );
      await persistPatch({ completedActivities, ...progressPatch });
    },
    [member, programs, persistPatch],
  );

  const toggleMealCompletion = useCallback(
    async (dateStr: string, mealType: string, entryIds: string[] = []) => {
      if (!member || !dateStr || !mealType) return;
      const current = (member.completedActivities as Record<string, string[]>) || {};
      const dayKeys = current[dateStr] || [];
      const mealKey = mealCompletionKey(dateStr, mealType);
      const entryKeys = entryIds.map((id) => completionKey(dateStr, id));
      const isDone = dayKeys.includes(mealKey);
      const newKeys = isDone
        ? dayKeys.filter((k) => k !== mealKey && !entryKeys.includes(k))
        : [...new Set([...dayKeys, mealKey, ...entryKeys])];
      const completedActivities = { ...current, [dateStr]: newKeys };
      const myProgs = programs.filter((p) => p.memberId === member.id);
      const progressPatch = buildProgressPatch(
        myProgs,
        completedActivities,
        (member.progress as object) || {},
        member as never,
      );
      await persistPatch({ completedActivities, ...progressPatch });
    },
    [member, programs, persistPatch],
  );

  const updateProfile = useCallback(
    async (
      patch: Record<string, unknown>,
      opts?: { toastMsg?: string; skipAuthRefresh?: boolean },
    ) => {
      await persistPatch(patch, {
        toastMsg: opts?.toastMsg ?? 'Profil güncellendi',
        skipAuthRefresh: opts?.skipAuthRefresh,
      });
    },
    [persistPatch],
  );

  const updateSettings = useCallback(
    async (settings: Record<string, unknown>) => {
      const prev =
        (memberRef.current?.settings as Record<string, unknown>) || {};
      await persistPatch({ settings: { ...prev, ...settings } });
    },
    [persistPatch],
  );

  const updateHealthTestPartial = useCallback(
    async (nextFlatHealthTest: Record<string, unknown>) => {
      if (!member) return;
      // Web parity: flat keys at top level — no nested sectionId wrapper
      await persistPatch({ healthTest: nextFlatHealthTest });
    },
    [member, persistPatch],
  );

  const bookStaffSession = useCallback(
    async (
      type: 'coach' | 'dietitian' | 'doctor',
      startsAt: string,
      duration = 30,
    ): Promise<{ ok: true } | { ok: false; error: string }> => {
      if (!member?.id) return { ok: false, error: 'Üye kaydı bulunamadı.' };
      const start = new Date(startsAt);
      if (Number.isNaN(start.getTime()) || start.getTime() < Date.now()) {
        return { ok: false, error: 'Geçmiş bir zaman seçilemez.' };
      }

      if (!isUiOnly()) {
        const api = await bookSessionApi(type, startsAt, duration);
        if (!api.ok) return api;
        await refreshData();
        toast('Randevunuz oluşturuldu.', 'success');
        return { ok: true };
      }

      const key = sessionsKey(type);
      const existing = ((member[key] as MemberSession[]) || []).slice();
      const assignedKey =
        type === 'dietitian'
          ? 'assignedDietitianId'
          : type === 'doctor'
            ? 'assignedDoctorId'
            : 'assignedCoachId';
      const staffId = member[assignedKey] ? String(member[assignedKey]) : '';
      const staffName = staffId
        ? String(staffById[staffId]?.name || 'Uzman')
        : 'Uzman';
      const session: MemberSession = {
        id: `bk-${Date.now()}`,
        type,
        title: sessionTitle(type),
        date: start.toISOString(),
        duration,
        status: 'scheduled',
        coach: staffName,
        bookedBy: 'member',
        createdAt: new Date().toISOString(),
      };
      await persistPatch({ [key]: [...existing, session] }, { toastMsg: 'Randevunuz oluşturuldu.' });
      return { ok: true };
    },
    [member, persistPatch, refreshData, staffById, toast],
  );

  const cancelStaffSession = useCallback(
    async (type: 'coach' | 'dietitian' | 'doctor', sessionId: string) => {
      if (!member) return;
      const key = sessionsKey(type);
      const existing = ((member[key] as MemberSession[]) || []).map((s) =>
        s.id === sessionId
          ? {
              ...s,
              status: 'cancelled',
              cancelledAt: new Date().toISOString(),
              cancelledReason: 'member_cancel',
            }
          : s,
      );
      await persistPatch({ [key]: existing }, { toastMsg: 'Randevu iptal edildi' });
    },
    [member, persistPatch],
  );

  /** Web parity: AppContext.rescheduleSession — mevcut oturumu yeni tarihe taşı. */
  const rescheduleStaffSession = useCallback(
    async (
      type: 'coach' | 'dietitian' | 'doctor',
      sessionId: string,
      newDate: string,
    ) => {
      if (!member) return;
      const key = sessionsKey(type);
      const sessions = ((member[key] as MemberSession[]) || []).map((session) =>
        session.id === sessionId
          ? { ...session, date: newDate, status: 'rescheduled' }
          : session,
      );
      await persistPatch({ [key]: sessions });
    },
    [member, persistPatch],
  );

  const flushNotificationReads = useCallback(async () => {
    if (notificationFlushTimerRef.current) {
      clearTimeout(notificationFlushTimerRef.current);
      notificationFlushTimerRef.current = null;
    }
    if (!notificationsDirtyRef.current) return;

    const current = memberRef.current;
    if (!current) return;
    const notifications = notificationsRef.current.slice();
    notificationsDirtyRef.current = false;

    if (isUiOnly()) return;
    if (notificationFlushInFlightRef.current) {
      await notificationFlushInFlightRef.current.catch(() => {});
    }
    const persist = patchMemberFields(current, { notifications })
      .then((next) => {
        memberRef.current = next;
        setLocalMemberOverlay(next);
      })
      .catch(() => {
        notificationsDirtyRef.current = true;
      })
      .finally(() => {
        notificationFlushInFlightRef.current = null;
      });
    notificationFlushInFlightRef.current = persist;
    await persist;
  }, [setLocalMemberOverlay]);

  const applyNotificationsOptimistic = useCallback(
    (notifications: typeof notificationsRef.current) => {
      const current = memberRef.current;
      if (!current) return;
      notificationsRef.current = notifications;
      notificationsDirtyRef.current = true;
      const next = { ...current, notifications } as MemberRecord;
      memberRef.current = next;
      setLocalMemberOverlay(next);
    },
    [setLocalMemberOverlay],
  );

  const scheduleNotificationFlush = useCallback(() => {
    if (notificationFlushTimerRef.current) {
      clearTimeout(notificationFlushTimerRef.current);
    }
    notificationFlushTimerRef.current = setTimeout(() => {
      notificationFlushTimerRef.current = null;
      void flushNotificationReads();
    }, 1500);
  }, [flushNotificationReads]);

  useEffect(
    () => () => {
      void flushNotificationReads();
    },
    [flushNotificationReads],
  );

  const markNotificationRead = useCallback(
    async (id: string) => {
      const prev = notificationsRef.current;
      if (prev.find((notification) => notification.id === id)?.read) return;
      applyNotificationsOptimistic(
        prev.map((notification) =>
          notification.id === id ? { ...notification, read: true } : notification,
        ),
      );
      scheduleNotificationFlush();
    },
    [applyNotificationsOptimistic, scheduleNotificationFlush],
  );

  const markAllNotificationsRead = useCallback(async () => {
    const prev = notificationsRef.current;
    if (!prev.length || prev.every((notification) => notification.read)) return;
    applyNotificationsOptimistic(
      prev.map((notification) => ({ ...notification, read: true })),
    );
    toast('Tümü okundu olarak işaretlendi', 'success');
    await flushNotificationReads();
  }, [applyNotificationsOptimistic, flushNotificationReads, toast]);

  const createSupportTicket = useCallback(
    async (input: {
      category: string;
      subject: string;
      message: string;
    }): Promise<{ ok: true } | { ok: false; error: string }> => {
      const subject = input.subject.trim();
      const message = input.message.trim();
      if (!subject) return { ok: false, error: 'Konu gerekli' };
      if (!message) return { ok: false, error: 'Mesaj gerekli' };
      if (message.length < 10) return { ok: false, error: 'En az 10 karakter' };
      if (!member?.id) return { ok: false, error: 'Üye kaydı bulunamadı.' };

      // Web parity: tickets tablosuna insert (member.supportTickets JSON değil)
      const ticket = await createTicket(member, {
        subject,
        category: input.category || 'Genel',
        message,
      });
      if (!ticket) return { ok: false, error: 'Destek talebi oluşturulamadı.' };
      toast('Destek talebiniz alındı. Admin panelinde görünecek.', 'success');
      return { ok: true };
    },
    [member, toast],
  );

  /** Web parity: SuccessStorySubmitModal → site_content kind=success_story */
  const submitSuccessStory = useCallback(
    async (input: {
      story: string;
      duration?: string;
      consent: boolean;
    }): Promise<{ ok: true } | { ok: false; error: string }> => {
      if (!member?.id) return { ok: false, error: 'Hikaye göndermek için giriş yapın' };
      if (!input.story.trim()) return { ok: false, error: 'Lütfen hikayenizi yazın' };
      if (!input.consent) return { ok: false, error: 'Paylaşım onayı gerekli' };

      const r = await submitSuccessStoryDb(member, {
        story: input.story.trim(),
        highlight: input.story.trim().slice(0, 80),
        duration: (input.duration || '').trim(),
      });
      if (r.success === false) return { ok: false, error: r.error || 'Gönderilemedi' };
      toast('Hikayeniz incelemeye alındı. Teşekkürler!', 'success');
      return { ok: true };
    },
    [member, toast],
  );

  const value = useMemo(
    () => ({
      refresh,
      toggleActivityCompletion,
      toggleMealCompletion,
      updateProfile,
      updateSettings,
      updateHealthTestPartial,
      bookStaffSession,
      cancelStaffSession,
      rescheduleStaffSession,
      markNotificationRead,
      markAllNotificationsRead,
      flushNotificationReads,
      createSupportTicket,
      submitSuccessStory,
    }),
    [
      refresh,
      toggleActivityCompletion,
      toggleMealCompletion,
      updateProfile,
      updateSettings,
      updateHealthTestPartial,
      bookStaffSession,
      cancelStaffSession,
      rescheduleStaffSession,
      markNotificationRead,
      markAllNotificationsRead,
      flushNotificationReads,
      createSupportTicket,
      submitSuccessStory,
    ],
  );

  return <ActionsContext.Provider value={value}>{children}</ActionsContext.Provider>;
}

export function useActions() {
  const ctx = useContext(ActionsContext);
  if (!ctx) throw new Error('useActions outside ActionsProvider');
  return ctx;
}
