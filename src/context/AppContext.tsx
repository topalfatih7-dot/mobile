import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { LoadingScreen } from '@/components/ui/LoadingScreen';
import type { Conversation } from '@/data/messages';
import type { Program } from '@/data/programs';
import type {
  DailyStat,
  NextSession,
  TodayItem,
} from '@/data/dashboard';
import type { FeaturedProgramData } from '@/data/programs';
import { fetchMemberChatThreads, type DbChatThread } from '@/services/db/chat';
import { saveMemberPatch, markNotificationRead as dbMarkNotificationRead, markAllNotificationsRead as dbMarkAllNotificationsRead } from '@/services/db/members';
import { fetchMemberPrograms, type DbProgram } from '@/services/db/programs';
import {
  buildDailyGoal,
  buildDailyStats,
  buildFeaturedProgram,
  buildNextSession,
  buildTodayPlan,
  buildWeeklyActivity,
  mapChatThreadsToConversations,
  mapProgramsToMobile,
  totalChatUnread,
} from '@/services/memberDashboard';
import {
  countUnreadNotifications,
  parseMemberNotifications,
  type AppNotification,
} from '@/services/notifications';
import {
  parseMemberSettings,
  type MemberSettings,
} from '@/services/pushNotifications';
import {
  hydrateAuthState,
  login as authLogin,
  logout as authLogout,
  onAuthChange,
  register as authRegister,
  routeForRole,
  type RegisterProfile,
} from '@/services/supabaseAuth';
import { completionKey } from '@/utils/programSchedule';
import type { AppSession, AuthUser, MemberProfile, SessionType, StaffProfile } from '@/types/session';

type AppContextValue = {
  loading: boolean;
  syncing: boolean;
  session: AppSession | null;
  sessionType: SessionType | null;
  authUser: AuthUser | null;
  member: MemberProfile | null;
  staff: StaffProfile | null;
  user: { id?: string; name: string; email: string };
  isAuthenticated: boolean;
  isAdmin: boolean;
  isStaff: boolean;
  isMember: boolean;
  programs: Program[];
  featuredProgram: FeaturedProgramData | null;
  conversations: Conversation[];
  chatUnreadCount: number;
  dailyGoal: ReturnType<typeof buildDailyGoal>;
  dailyStats: DailyStat[];
  todayPlan: TodayItem[];
  nextSession: NextSession | null;
  weeklyActivity: { day: string; value: number }[];
  notifications: AppNotification[];
  notificationUnreadCount: number;
  login: (email: string, password: string, remember?: boolean) => Promise<{ success: boolean; error?: string; role?: SessionType }>;
  register: (profile: RegisterProfile) => Promise<{ success: boolean; error?: string; role?: SessionType }>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  updateProfile: (patch: Record<string, unknown>) => Promise<{ success: boolean; error?: string }>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  memberSettings: MemberSettings;
  updateSettings: (
    patch: Partial<MemberSettings>,
    extra?: Record<string, unknown>,
  ) => Promise<{ success: boolean; error?: string }>;
  toggleTask: (taskId: string) => Promise<void>;
  toggleProgramEntry: (dateStr: string, entryId: string) => Promise<void>;
  routeForRole: typeof routeForRole;
};

const AppContext = createContext<AppContextValue | null>(null);

const EMPTY_MEMBER_DATA = {
  programs: [] as Program[],
  featuredProgram: null as FeaturedProgramData | null,
  conversations: [] as Conversation[],
  chatUnreadCount: 0,
  dailyGoal: { progress: 0, completed: 0, total: 0 },
  dailyStats: [] as DailyStat[],
  todayPlan: [] as TodayItem[],
  nextSession: null as NextSession | null,
  weeklyActivity: [] as { day: string; value: number }[],
  notifications: [] as AppNotification[],
  notificationUnreadCount: 0,
};

function buildMemberViewModels(member: MemberProfile | null, dbPrograms: DbProgram[], threads: DbChatThread[]) {
  const programs = mapProgramsToMobile(dbPrograms, member);
  return {
    programs,
    featuredProgram: buildFeaturedProgram(programs),
    conversations: mapChatThreadsToConversations(threads),
    chatUnreadCount: totalChatUnread(threads),
    dailyGoal: buildDailyGoal(member),
    dailyStats: buildDailyStats(member, programs),
    todayPlan: buildTodayPlan(member),
    nextSession: buildNextSession(member),
    weeklyActivity: buildWeeklyActivity(member),
    notifications: parseMemberNotifications(member?.notifications),
    notificationUnreadCount: countUnreadNotifications(parseMemberNotifications(member?.notifications)),
  };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [session, setSession] = useState<AppSession | null>(null);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [member, setMember] = useState<MemberProfile | null>(null);
  const [staff, setStaff] = useState<StaffProfile | null>(null);
  const [memberData, setMemberData] = useState(EMPTY_MEMBER_DATA);

  const applyAuthState = useCallback((state: Awaited<ReturnType<typeof hydrateAuthState>>) => {
    setSession(state.session);
    setAuthUser(state.authUser);
    setMember(state.member);
    setStaff(state.staff);
  }, []);

  const loadMemberData = useCallback(async (memberId: string, profile: MemberProfile | null) => {
    const [dbPrograms, threads] = await Promise.all([
      fetchMemberPrograms(memberId),
      fetchMemberChatThreads(memberId),
    ]);
    setMemberData(buildMemberViewModels(profile, dbPrograms, threads));
  }, []);

  const clearMemberData = useCallback(() => {
    setMemberData(EMPTY_MEMBER_DATA);
  }, []);

  const refresh = useCallback(async () => {
    setSyncing(true);
    try {
      const state = await hydrateAuthState();
      applyAuthState(state);
      if (state.session?.type === 'member' && state.session.memberId) {
        await loadMemberData(state.session.memberId, state.member);
      } else {
        clearMemberData();
      }
    } finally {
      setSyncing(false);
    }
  }, [applyAuthState, loadMemberData, clearMemberData]);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const state = await hydrateAuthState();
        if (!active) return;
        applyAuthState(state);
        if (state.session?.type === 'member' && state.session.memberId) {
          await loadMemberData(state.session.memberId, state.member);
        }
      } finally {
        if (active) setLoading(false);
      }
    })();

    const unsub = onAuthChange(async (event) => {
      if (
        event === 'SIGNED_OUT' ||
        event === 'TOKEN_REFRESHED' ||
        event === 'SIGNED_IN' ||
        event === 'USER_UPDATED'
      ) {
        const state = await hydrateAuthState();
        if (!active) return;
        applyAuthState(state);
        if (state.session?.type === 'member' && state.session.memberId) {
          await loadMemberData(state.session.memberId, state.member);
        } else {
          clearMemberData();
        }
      }
    });

    return () => {
      active = false;
      unsub();
    };
  }, [applyAuthState, loadMemberData, clearMemberData]);

  const login = useCallback(
    async (email: string, password: string, remember = true) => {
      const result = await authLogin(email, password, remember);
      if (!result.success) return { success: false, error: result.error };
      await refresh();
      return { success: true, role: result.role };
    },
    [refresh],
  );

  const register = useCallback(
    async (profile: RegisterProfile) => {
      const result = await authRegister(profile);
      if (!result.success) return { success: false, error: result.error };
      await refresh();
      return { success: true, role: result.role };
    },
    [refresh],
  );

  const logout = useCallback(async () => {
    await authLogout();
    applyAuthState({ session: null, authUser: null, member: null, staff: null });
    clearMemberData();
  }, [applyAuthState, clearMemberData]);

  const updateProfile = useCallback(
    async (patch: Record<string, unknown>) => {
      if (!member) return { success: false, error: 'Üye oturumu bulunamadı.' };
      const result = await saveMemberPatch(member, patch);
      if (!result.success) return result;
      setMember(result.member);
      if (session?.type === 'member' && session.memberId) {
        await loadMemberData(session.memberId, result.member);
      }
      return { success: true };
    },
    [member, session, loadMemberData],
  );

  const markNotificationRead = useCallback(
    async (id: string) => {
      if (!member) return;
      const result = await dbMarkNotificationRead(member, id);
      if (!result.success) return;
      setMember(result.member);
      if (session?.type === 'member' && session.memberId) {
        await loadMemberData(session.memberId, result.member);
      }
    },
    [member, session, loadMemberData],
  );

  const markAllNotificationsRead = useCallback(async () => {
    if (!member) return;
    const result = await dbMarkAllNotificationsRead(member);
    if (!result.success) return;
    setMember(result.member);
    if (session?.type === 'member' && session.memberId) {
      await loadMemberData(session.memberId, result.member);
    }
  }, [member, session, loadMemberData]);

  const memberSettings = useMemo(
    () => parseMemberSettings(member?.settings),
    [member?.settings],
  );

  const updateSettings = useCallback(
    async (patch: Partial<MemberSettings>, extra?: Record<string, unknown>) => {
      if (!member) return { success: false, error: 'Üye oturumu bulunamadı.' };
      const settings = { ...parseMemberSettings(member.settings), ...patch };
      return updateProfile({ settings, ...extra });
    },
    [member, updateProfile],
  );

  const toggleTask = useCallback(
    async (taskId: string) => {
      if (!member) return;
      const tasks = ((member.tasks as { id: string; done?: boolean }[] | undefined) || []).map((task) =>
        task.id === taskId ? { ...task, done: !task.done } : task,
      );
      await updateProfile({ tasks });
    },
    [member, updateProfile],
  );

  const toggleProgramEntry = useCallback(
    async (dateStr: string, entryId: string) => {
      if (!member || !dateStr || !entryId) return;
      const current = (member.completedActivities as Record<string, string[]> | undefined) || {};
      const dayKeys = current[dateStr] || [];
      const key = completionKey(dateStr, entryId);
      const nextKeys = dayKeys.includes(key) ? dayKeys.filter((k) => k !== key) : [...dayKeys, key];
      await updateProfile({
        completedActivities: { ...current, [dateStr]: nextKeys },
      });
    },
    [member, updateProfile],
  );

  const sessionType = session?.type ?? null;
  const isAuthenticated = !!session;
  const isAdmin = sessionType === 'admin';
  const isStaff = sessionType === 'staff';
  const isMember = sessionType === 'member';

  const user = useMemo(() => {
    if (isStaff && staff) return { id: staff.id, name: staff.name, email: staff.email };
    if (isAdmin) return { name: authUser?.name || 'Admin', email: authUser?.email || '' };
    if (member) return { id: member.id, name: member.name, email: member.email };
    if (authUser) return { id: authUser.id, name: authUser.name, email: authUser.email };
    return { name: '', email: '' };
  }, [isStaff, isAdmin, staff, member, authUser]);

  const value = useMemo<AppContextValue>(
    () => ({
      loading,
      syncing,
      session,
      sessionType,
      authUser,
      member,
      staff,
      user,
      isAuthenticated,
      isAdmin,
      isStaff,
      isMember,
      ...memberData,
      login,
      register,
      logout,
      refresh,
      updateProfile,
      markNotificationRead,
      markAllNotificationsRead,
      memberSettings,
      updateSettings,
      toggleTask,
      toggleProgramEntry,
      routeForRole,
    }),
    [
      loading,
      syncing,
      session,
      sessionType,
      authUser,
      member,
      staff,
      user,
      isAuthenticated,
      isAdmin,
      isStaff,
      isMember,
      memberData,
      login,
      register,
      logout,
      refresh,
      updateProfile,
      markNotificationRead,
      markAllNotificationsRead,
      memberSettings,
      updateSettings,
      toggleTask,
      toggleProgramEntry,
    ],
  );

  if (loading) return <LoadingScreen label="Oturum kontrol ediliyor…" />;

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
