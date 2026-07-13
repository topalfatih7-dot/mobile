import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { LoadingScreen } from '@/components/ui/LoadingScreen';
import type { Conversation } from '@/data/messages';
import type { Program } from '@/data/programs';
import type {
  DailyStat,
  NextSession,
  TodayItem,
} from '@/data/dashboard';
import type { FeaturedProgramData } from '@/data/programs';
import {
  fetchChatMessages,
  fetchMemberChatThreads,
  markChatThreadRead as dbMarkChatThreadRead,
  sendChatMessage as dbSendChatMessage,
  type DbChatMessage,
  type DbChatThread,
} from '@/services/db/chat';
import { saveMemberPatch, markNotificationRead as dbMarkNotificationRead, markAllNotificationsRead as dbMarkAllNotificationsRead } from '@/services/db/members';
import { fetchMemberPrograms, type DbProgram } from '@/services/db/programs';
import {
  hydrateSharedRemote,
  type MembershipPlan,
  type SharedRemoteDb,
  type SiteContentBundle,
} from '@/services/hydrateShared';
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
import { loadRememberMePreference } from '@/services/authStorage';
import {
  registerActiveSession,
  verifyActiveSessionOrSignOut,
} from '@/services/singleSession';
import {
  signInWithSocial,
  type SignInWithSocialOpts,
} from '@/services/oauthAuth';
import {
  AUTH_EVENTS_REQUIRING_HYDRATE,
  hydrateAuthState,
  login as authLogin,
  logout as authLogout,
  onAuthChange,
  register as authRegister,
  routeForRole,
  type RegisterProfile,
} from '@/services/supabaseAuth';
import { syncAutoRefresh } from '@/services/supabaseClient';
import { completionKey } from '@/utils/programSchedule';
import { hasRegisteredMember } from '@/utils/memberProfile';
import type { AppSession, AuthUser, MemberProfile, SessionType, StaffProfile } from '@/types/session';

type LoginWithGoogleResult =
  | {
      success: true;
      role: SessionType;
      needsOnboarding: boolean;
      redirecting?: false;
    }
  | {
      success: true;
      redirecting: true;
    }
  | {
      success: false;
      error?: string;
      cancelled?: boolean;
      providerNotConfigured?: boolean;
      redirectMisconfigured?: boolean;
      expectedRedirect?: string;
    };

type AppContextValue = {
  loading: boolean;
  syncing: boolean;
  loggingOut: boolean;
  session: AppSession | null;
  sessionType: SessionType | null;
  authUser: AuthUser | null;
  member: MemberProfile | null;
  staff: StaffProfile | null;
  /** Directory/list of staff (shared hydrate). */
  staffDirectory: StaffProfile[];
  plans: MembershipPlan[];
  posts: SharedRemoteDb['posts'];
  exerciseCount: number;
  testimonials: SiteContentBundle['testimonials'];
  faqs: SiteContentBundle['faqs'];
  successStories: SiteContentBundle['successStories'];
  user: { id?: string; name: string; email: string; phone?: string; joinedAt?: string; profileComplete?: boolean };
  isAuthenticated: boolean;
  isAdmin: boolean;
  isStaff: boolean;
  isMember: boolean;
  programs: Program[];
  featuredProgram: FeaturedProgramData | null;
  conversations: Conversation[];
  chatUnreadCount: number;
  chatMessages: Record<string, DbChatMessage[]>;
  dailyGoal: ReturnType<typeof buildDailyGoal>;
  dailyStats: DailyStat[];
  todayPlan: TodayItem[];
  nextSession: NextSession | null;
  weeklyActivity: { day: string; value: number }[];
  notifications: AppNotification[];
  notificationUnreadCount: number;
  login: (email: string, password: string, remember?: boolean) => Promise<{ success: boolean; error?: string; role?: SessionType }>;
  loginWithGoogle: (opts?: SignInWithSocialOpts) => Promise<LoginWithGoogleResult>;
  register: (profile: RegisterProfile) => Promise<{ success: boolean; error?: string; role?: SessionType }>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  updateProfile: (patch: Record<string, unknown>) => Promise<{ success: boolean; error?: string }>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  loadChatMessages: (threadId: string) => Promise<DbChatMessage[]>;
  sendChatMessage: (
    thread: DbChatThread,
    text: string,
  ) => Promise<{ success: boolean; error?: string; message?: DbChatMessage }>;
  markChatThreadRead: (threadId: string) => Promise<void>;
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

const EMPTY_SHARED: SharedRemoteDb = {
  staff: [],
  plans: [],
  posts: [],
  exerciseCount: 0,
  content: { testimonials: [], faqs: [], successStories: [], exerciseTaxonomy: null },
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
  const [loggingOut, setLoggingOut] = useState(false);
  const [session, setSession] = useState<AppSession | null>(null);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [member, setMember] = useState<MemberProfile | null>(null);
  const [staff, setStaff] = useState<StaffProfile | null>(null);
  const [shared, setShared] = useState<SharedRemoteDb>(EMPTY_SHARED);
  const [memberData, setMemberData] = useState(EMPTY_MEMBER_DATA);
  const [chatMessages, setChatMessages] = useState<Record<string, DbChatMessage[]>>({});
  const sessionTypeRef = useRef<SessionType | null>(null);

  const applyAuthState = useCallback((state: Awaited<ReturnType<typeof hydrateAuthState>>) => {
    setSession(state.session);
    setAuthUser(state.authUser);
    setMember(state.member);
    setStaff(state.staff);
    sessionTypeRef.current = state.session?.type ?? null;
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
    setChatMessages({});
  }, []);

  const refresh = useCallback(async () => {
    setSyncing(true);
    try {
      const [state, sharedDb] = await Promise.all([hydrateAuthState(), hydrateSharedRemote()]);
      applyAuthState(state);
      setShared(sharedDb);
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
        const remember = await loadRememberMePreference();
        syncAutoRefresh(remember);
        const [state, sharedDb] = await Promise.all([hydrateAuthState(), hydrateSharedRemote()]);
        if (!active) return;
        applyAuthState(state);
        setShared(sharedDb);
        if (state.session?.type === 'member' && state.session.memberId) {
          await loadMemberData(state.session.memberId, state.member);
        }
      } finally {
        if (active) setLoading(false);
      }
    })();

    const unsub = onAuthChange(async (event) => {
      if (event === 'SIGNED_IN') {
        await registerActiveSession();
      }
      if (event === 'TOKEN_REFRESHED') {
        await verifyActiveSessionOrSignOut();
        return;
      }
      if ((AUTH_EVENTS_REQUIRING_HYDRATE as readonly string[]).includes(event)) {
        const [state, sharedDb] = await Promise.all([hydrateAuthState(), hydrateSharedRemote()]);
        if (!active) return;
        applyAuthState(state);
        setShared(sharedDb);
        if (state.session?.type === 'member' && state.session.memberId) {
          await loadMemberData(state.session.memberId, state.member);
        } else {
          clearMemberData();
        }
      }
    });

    const pollId = setInterval(() => {
      if (sessionTypeRef.current) void verifyActiveSessionOrSignOut();
    }, 60_000);

    const onAppState = (next: AppStateStatus) => {
      if (next === 'active' && sessionTypeRef.current) {
        void verifyActiveSessionOrSignOut();
      }
    };
    const appSub = AppState.addEventListener('change', onAppState);

    return () => {
      active = false;
      unsub();
      clearInterval(pollId);
      appSub.remove();
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

  const loginWithGoogle = useCallback(
    async (opts: SignInWithSocialOpts = {}): Promise<LoginWithGoogleResult> => {
      const result = await signInWithSocial('google', opts);
      if (!result.success) {
        return {
          success: false,
          error: result.error,
          cancelled: 'cancelled' in result ? result.cancelled : undefined,
          providerNotConfigured:
            'providerNotConfigured' in result ? result.providerNotConfigured : undefined,
          redirectMisconfigured:
            'redirectMisconfigured' in result ? result.redirectMisconfigured : undefined,
          expectedRedirect:
            'expectedRedirect' in result ? result.expectedRedirect : undefined,
        };
      }

      // Expo web: browser navigates to Google; session returns via /auth/callback
      if ('redirecting' in result && result.redirecting) {
        return { success: true, redirecting: true };
      }

      await registerActiveSession();
      await refresh();

      const state = await hydrateAuthState();
      const role = state.session?.type || 'member';
      const needsOnboarding =
        role === 'member' && !hasRegisteredMember(state.member);

      return { success: true, role, needsOnboarding };
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
    setLoggingOut(true);
    try {
      await authLogout();
      applyAuthState({ session: null, authUser: null, member: null, staff: null });
      clearMemberData();
      const sharedDb = await hydrateSharedRemote();
      setShared(sharedDb);
    } finally {
      setLoggingOut(false);
    }
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

  const loadChatMessages = useCallback(async (threadId: string) => {
    const msgs = await fetchChatMessages(threadId);
    setChatMessages((prev) => ({ ...prev, [threadId]: msgs }));
    return msgs;
  }, []);

  const sendChatMessage = useCallback(
    async (thread: DbChatThread, text: string) => {
      if (!session) return { success: false, error: 'Oturum yok.' };
      const senderType = session.type === 'staff' ? 'staff' : 'member';
      const senderId =
        session.type === 'staff'
          ? session.staffId
          : session.type === 'member'
            ? session.memberId
            : null;
      const result = await dbSendChatMessage({
        thread,
        senderType,
        senderId,
        text,
      });
      if (!result.success || !result.message) return result;

      setChatMessages((prev) => ({
        ...prev,
        [thread.id]: [...(prev[thread.id] || []), result.message!],
      }));

      if (session.type === 'member' && session.memberId) {
        await loadMemberData(session.memberId, member);
      }
      return result;
    },
    [session, member, loadMemberData],
  );

  const markChatThreadRead = useCallback(
    async (threadId: string) => {
      if (!session) return;
      const readerType = session.type === 'staff' ? 'staff' : 'member';
      await dbMarkChatThreadRead(threadId, readerType);
      if (session.type === 'member' && session.memberId) {
        await loadMemberData(session.memberId, member);
      }
    },
    [session, member, loadMemberData],
  );

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
    if (member) {
      return {
        id: member.id,
        name: member.name,
        email: member.email,
        phone: member.phone as string | undefined,
        joinedAt: member.joinedAt as string | undefined,
        profileComplete: member.profileComplete as boolean | undefined,
      };
    }
    if (authUser) return { id: authUser.id, name: authUser.name, email: authUser.email };
    return { name: '', email: '' };
  }, [isStaff, isAdmin, staff, member, authUser]);

  const value = useMemo<AppContextValue>(
    () => ({
      loading,
      syncing,
      loggingOut,
      session,
      sessionType,
      authUser,
      member,
      staff,
      staffDirectory: shared.staff,
      plans: shared.plans,
      posts: shared.posts,
      exerciseCount: shared.exerciseCount,
      testimonials: shared.content.testimonials,
      faqs: shared.content.faqs,
      successStories: shared.content.successStories,
      user,
      isAuthenticated,
      isAdmin,
      isStaff,
      isMember,
      ...memberData,
      chatMessages,
      login,
      loginWithGoogle,
      register,
      logout,
      refresh,
      updateProfile,
      markNotificationRead,
      markAllNotificationsRead,
      loadChatMessages,
      sendChatMessage,
      markChatThreadRead,
      memberSettings,
      updateSettings,
      toggleTask,
      toggleProgramEntry,
      routeForRole,
    }),
    [
      loading,
      syncing,
      loggingOut,
      session,
      sessionType,
      authUser,
      member,
      staff,
      shared,
      user,
      isAuthenticated,
      isAdmin,
      isStaff,
      isMember,
      memberData,
      chatMessages,
      login,
      loginWithGoogle,
      register,
      logout,
      refresh,
      updateProfile,
      markNotificationRead,
      markAllNotificationsRead,
      loadChatMessages,
      sendChatMessage,
      markChatThreadRead,
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
