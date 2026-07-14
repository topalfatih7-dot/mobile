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
import { startPresenceTracker } from '@/services/presenceService';
import { subscribeRealtimeSync } from '@/services/realtimeSync';
import {
  fetchAdminStaffMessages,
  hydrateAdminStaffThreads,
  markAdminStaffThreadRead,
  sendAdminStaffMessage as dbSendAdminStaffMessage,
  type AdminStaffMessage,
  type AdminStaffThread,
} from '@/services/db/adminChat';
import {
  fetchStaffCollabMessages,
  hydrateStaffCollabThreads,
  markStaffCollabThreadRead,
  sendStaffCollabMessage as dbSendStaffCollabMessage,
  type StaffCollabMessage,
  type StaffCollabThread,
} from '@/services/db/staffCollabChat';
import { fetchAllMembers } from '@/services/db/members';
import { loadRememberMePreference } from '@/services/authStorage';
import { normalizeStaffRole } from '@/utils/staffAccess';
import {
  registerActiveSession,
  verifyActiveSessionOrSignOut,
} from '@/services/singleSession';
import * as authVerification from '@/services/authVerification';
import {
  signInWithSocial,
  type SignInWithSocialOpts,
} from '@/services/oauthAuth';
import { startStripeCheckout as openStripeCheckout } from '@/services/stripePayment';
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
  adminStaffThreads: AdminStaffThread[];
  staffCollabThreads: StaffCollabThread[];
  adminStaffMessages: Record<string, AdminStaffMessage[]>;
  staffCollabMessages: Record<string, StaffCollabMessage[]>;
  loadAdminStaffMessages: (threadId: string) => Promise<AdminStaffMessage[]>;
  sendAdminStaffChat: (
    thread: AdminStaffThread,
    text: string,
  ) => Promise<{ success: boolean; error?: string; message?: AdminStaffMessage }>;
  markAdminStaffRead: (threadId: string) => Promise<void>;
  loadStaffCollabMessages: (threadId: string) => Promise<StaffCollabMessage[]>;
  sendStaffCollabChat: (
    thread: StaffCollabThread,
    text: string,
  ) => Promise<{ success: boolean; error?: string; message?: StaffCollabMessage }>;
  markStaffCollabRead: (threadId: string) => Promise<void>;
  memberSettings: MemberSettings;
  updateSettings: (
    patch: Partial<MemberSettings>,
    extra?: Record<string, unknown>,
  ) => Promise<{ success: boolean; error?: string }>;
  verificationStatus: {
    email: string;
    phone: string;
    emailVerified: boolean;
    phoneVerified: boolean;
  } | null;
  sendEmailVerification: () => Promise<{ success: boolean; error?: string; message?: string }>;
  confirmEmailVerification: (
    code: string,
  ) => Promise<{ success: boolean; error?: string }>;
  sendPhoneVerification: (
    phone: string,
    countryIso?: string,
  ) => Promise<{
    success: boolean;
    error?: string;
    message?: string;
    phone?: string;
    viaEmail?: boolean;
  }>;
  confirmPhoneVerification: (
    code: string,
    phone: string,
    countryIso?: string,
    viaEmail?: boolean,
  ) => Promise<{ success: boolean; error?: string }>;
  refreshVerification: () => Promise<{ success: boolean; error?: string }>;
  startStripeCheckout: (
    planId: string,
    flow?: 'register' | 'change',
    durationMonths?: number,
  ) => Promise<{ success: boolean; error?: string; dismissed?: boolean }>;
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
  const [adminStaffThreads, setAdminStaffThreads] = useState<AdminStaffThread[]>([]);
  const [staffCollabThreads, setStaffCollabThreads] = useState<StaffCollabThread[]>([]);
  const [adminStaffMessages, setAdminStaffMessages] = useState<Record<string, AdminStaffMessage[]>>({});
  const [staffCollabMessages, setStaffCollabMessages] = useState<Record<string, StaffCollabMessage[]>>({});
  const sessionTypeRef = useRef<SessionType | null>(null);
  const chatThreadIdsRef = useRef<Set<string>>(new Set());
  const adminStaffThreadIdsRef = useRef<Set<string>>(new Set());
  const staffCollabThreadIdsRef = useRef<Set<string>>(new Set());
  const memberRef = useRef<MemberProfile | null>(null);
  const authUserRef = useRef<AuthUser | null>(null);
  const staffRef = useRef<StaffProfile | null>(null);

  useEffect(() => {
    memberRef.current = member;
  }, [member]);
  useEffect(() => {
    authUserRef.current = authUser;
  }, [authUser]);
  useEffect(() => {
    staffRef.current = staff;
  }, [staff]);

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
    chatThreadIdsRef.current = new Set(threads.map((t) => t.id));
    setMemberData(buildMemberViewModels(profile, dbPrograms, threads));
  }, []);

  const clearMemberData = useCallback(() => {
    setMemberData(EMPTY_MEMBER_DATA);
    setChatMessages({});
    chatThreadIdsRef.current = new Set();
  }, []);

  const hydrateInternalChats = useCallback(
    async (
      sessionType: SessionType | null | undefined,
      staffUser: StaffProfile | null,
      staffList: StaffProfile[],
    ) => {
      if (sessionType !== 'admin' && sessionType !== 'staff') {
        setAdminStaffThreads([]);
        setStaffCollabThreads([]);
        adminStaffThreadIdsRef.current = new Set();
        staffCollabThreadIdsRef.current = new Set();
        return;
      }
      const members = sessionType === 'staff' || sessionType === 'admin' ? await fetchAllMembers() : [];
      const [adminThreads, collabThreads] = await Promise.all([
        hydrateAdminStaffThreads(sessionType, staffList, staffUser),
        hydrateStaffCollabThreads(sessionType, members, staffList, staffUser),
      ]);
      setAdminStaffThreads(adminThreads);
      setStaffCollabThreads(collabThreads);
      adminStaffThreadIdsRef.current = new Set(adminThreads.map((t) => t.id));
      staffCollabThreadIdsRef.current = new Set(collabThreads.map((t) => t.id));
    },
    [],
  );

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
      await hydrateInternalChats(state.session?.type, state.staff, sharedDb.staff);
    } finally {
      setSyncing(false);
    }
  }, [applyAuthState, loadMemberData, clearMemberData, hydrateInternalChats]);

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
        await hydrateInternalChats(state.session?.type, state.staff, sharedDb.staff);
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
        await hydrateInternalChats(state.session?.type, state.staff, sharedDb.staff);
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
  }, [applyAuthState, loadMemberData, clearMemberData, hydrateInternalChats]);

  // Presence heartbeat — oturum tipi çözülmeden yazma
  useEffect(() => {
    if (!session?.type) return undefined;
    return startPresenceTracker({
      resolvePresenceInfo: async () => {
        const type = sessionTypeRef.current;
        if (!type) return null;
        const user = authUserRef.current;
        const m = memberRef.current;
        const st = staffRef.current;
        const userId =
          type === 'member'
            ? m?.id || user?.id
            : type === 'staff'
              ? st?.id || user?.id
              : user?.id;
        if (!userId) return null;
        const name =
          type === 'member'
            ? m?.name || user?.name
            : type === 'staff'
              ? st?.name || user?.name
              : user?.name || 'Admin';
        const email = m?.email || st?.email || user?.email || '';
        return { userId, email, name, role: type };
      },
      getPagePath: () => 'mobile',
    });
  }, [session?.type, session && 'memberId' in session ? session.memberId : null, session && 'staffId' in session ? session.staffId : null]);

  // Realtime: chat + member + programs
  useEffect(() => {
    if (!session?.type) return undefined;
    const memberId = session.type === 'member' ? session.memberId : member?.id ?? null;
    const staffId = session.type === 'staff' ? session.staffId : staff?.id ?? null;

    return subscribeRealtimeSync({
      session: { type: session.type, memberId, staffId },
      memberId,
      staffId,
      isChatMessageRelevant: (threadId) => {
        if (!threadId) return false;
        if (sessionTypeRef.current === 'admin') return true;
        return chatThreadIdsRef.current.has(threadId);
      },
      isAdminStaffMessageRelevant: (threadId) => {
        if (!threadId) return false;
        if (sessionTypeRef.current === 'admin') return true;
        return adminStaffThreadIdsRef.current.has(threadId);
      },
      isStaffCollabMessageRelevant: (threadId) => {
        if (!threadId) return false;
        if (sessionTypeRef.current === 'admin') return true;
        return staffCollabThreadIdsRef.current.has(threadId);
      },
      onMemberChange: (nextMember) => {
        setMember(nextMember);
        if (session.type === 'member' && session.memberId) {
          void loadMemberData(session.memberId, nextMember);
        }
      },
      onChatThreadChange: (thread) => {
        chatThreadIdsRef.current.add(thread.id);
        if (session.type === 'member' && session.memberId) {
          void loadMemberData(session.memberId, memberRef.current);
        }
      },
      onChatMessageChange: (message) => {
        setChatMessages((prev) => {
          const list = prev[message.threadId] || [];
          if (list.some((m) => m.id === message.id)) return prev;
          return { ...prev, [message.threadId]: [...list, message] };
        });
        if (session.type === 'member' && session.memberId) {
          void loadMemberData(session.memberId, memberRef.current);
        }
      },
      onAdminStaffThreadChange: (thread) => {
        adminStaffThreadIdsRef.current.add(thread.id);
        setAdminStaffThreads((prev) => {
          const idx = prev.findIndex((t) => t.id === thread.id);
          if (idx >= 0) return prev.map((t, i) => (i === idx ? thread : t));
          return [thread, ...prev];
        });
      },
      onAdminStaffMessageChange: (message) => {
        setAdminStaffMessages((prev) => {
          const list = prev[message.threadId] || [];
          if (list.some((m) => m.id === message.id)) return prev;
          return { ...prev, [message.threadId]: [...list, message] };
        });
      },
      onStaffCollabThreadChange: (thread) => {
        staffCollabThreadIdsRef.current.add(thread.id);
        setStaffCollabThreads((prev) => {
          const idx = prev.findIndex((t) => t.id === thread.id);
          if (idx >= 0) return prev.map((t, i) => (i === idx ? thread : t));
          return [thread, ...prev];
        });
      },
      onStaffCollabMessageChange: (message) => {
        setStaffCollabMessages((prev) => {
          const list = prev[message.threadId] || [];
          if (list.some((m) => m.id === message.id)) return prev;
          return { ...prev, [message.threadId]: [...list, message] };
        });
      },
      onProgramsChange: () => {
        if (session.type === 'member' && session.memberId) {
          void loadMemberData(session.memberId, memberRef.current);
        }
      },
    });
  }, [
    session?.type,
    session && 'memberId' in session ? session.memberId : null,
    session && 'staffId' in session ? session.staffId : null,
    member?.id,
    staff?.id,
    loadMemberData,
  ]);

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

  const loadAdminStaffMessages = useCallback(async (threadId: string) => {
    const msgs = await fetchAdminStaffMessages(threadId);
    setAdminStaffMessages((prev) => ({ ...prev, [threadId]: msgs }));
    return msgs;
  }, []);

  const sendAdminStaffChat = useCallback(
    async (thread: AdminStaffThread, text: string) => {
      if (!session || (session.type !== 'admin' && session.type !== 'staff')) {
        return { success: false, error: 'Oturum yok.' };
      }
      const senderType = session.type === 'admin' ? 'admin' : 'staff';
      const senderId = session.type === 'staff' ? session.staffId : authUser?.id || null;
      const result = await dbSendAdminStaffMessage({ thread, senderType, senderId, text });
      if (!result.success || !result.message) return result;
      setAdminStaffMessages((prev) => ({
        ...prev,
        [thread.id]: [...(prev[thread.id] || []), result.message!],
      }));
      if (result.thread) {
        setAdminStaffThreads((prev) => {
          const idx = prev.findIndex((t) => t.id === result.thread!.id);
          if (idx >= 0) return prev.map((t, i) => (i === idx ? result.thread! : t));
          return [result.thread!, ...prev];
        });
      }
      return result;
    },
    [session, authUser?.id],
  );

  const markAdminStaffRead = useCallback(
    async (threadId: string) => {
      if (!session || (session.type !== 'admin' && session.type !== 'staff')) return;
      const readerType = session.type === 'admin' ? 'admin' : 'staff';
      const updated = await markAdminStaffThreadRead(threadId, readerType);
      if (updated) {
        setAdminStaffThreads((prev) => prev.map((t) => (t.id === threadId ? updated : t)));
      }
    },
    [session],
  );

  const loadStaffCollabMessages = useCallback(async (threadId: string) => {
    const msgs = await fetchStaffCollabMessages(threadId);
    setStaffCollabMessages((prev) => ({ ...prev, [threadId]: msgs }));
    return msgs;
  }, []);

  const sendStaffCollabChat = useCallback(
    async (thread: StaffCollabThread, text: string) => {
      if (!session || session.type !== 'staff' || !staff) {
        return { success: false, error: 'Oturum yok.' };
      }
      const role = normalizeStaffRole(staff.role);
      if (role !== 'coach' && role !== 'dietitian') {
        return { success: false, error: 'Geçersiz rol.' };
      }
      const result = await dbSendStaffCollabMessage({
        thread,
        senderType: role,
        senderId: staff.id,
        text,
      });
      if (!result.success || !result.message) return result;
      setStaffCollabMessages((prev) => ({
        ...prev,
        [thread.id]: [...(prev[thread.id] || []), result.message!],
      }));
      if (result.thread) {
        setStaffCollabThreads((prev) => {
          const idx = prev.findIndex((t) => t.id === result.thread!.id);
          if (idx >= 0) return prev.map((t, i) => (i === idx ? result.thread! : t));
          return [result.thread!, ...prev];
        });
      }
      return result;
    },
    [session, staff],
  );

  const markStaffCollabRead = useCallback(
    async (threadId: string) => {
      if (!session || session.type !== 'staff' || !staff) return;
      const role = normalizeStaffRole(staff.role);
      if (role !== 'coach' && role !== 'dietitian') return;
      const updated = await markStaffCollabThreadRead(threadId, role);
      if (updated) {
        setStaffCollabThreads((prev) => prev.map((t) => (t.id === threadId ? updated : t)));
      }
    },
    [session, staff],
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

  const verificationStatus = useMemo(() => {
    if (!member) return null;
    return {
      email: member.email,
      phone: (member.phone as string) || '',
      emailVerified: Boolean(member.emailVerifiedAt),
      phoneVerified: Boolean(member.phoneVerifiedAt),
    };
  }, [member]);

  const sendEmailVerification = useCallback(
    async () => authVerification.sendEmailVerification(),
    [],
  );

  const confirmEmailVerification = useCallback(
    async (code: string) => {
      const res = await authVerification.confirmEmailVerification(code, member);
      if (res.success) await refresh();
      return res;
    },
    [member, refresh],
  );

  const sendPhoneVerification = useCallback(
    async (phone: string, countryIso?: string) =>
      authVerification.sendPhoneVerification(phone, countryIso, member),
    [member],
  );

  const confirmPhoneVerification = useCallback(
    async (code: string, phone: string, countryIso?: string, viaEmail?: boolean) => {
      const res = await authVerification.confirmPhoneVerification(
        code,
        phone,
        member,
        countryIso,
        viaEmail,
      );
      if (res.success) await refresh();
      return res;
    },
    [member, refresh],
  );

  const refreshVerification = useCallback(async () => {
    const res = await authVerification.refreshEmailVerification(member);
    await refresh();
    return res;
  }, [member, refresh]);

  const startStripeCheckout = useCallback(
    async (planId: string, flow: 'register' | 'change' = 'change', durationMonths = 1) => {
      const email =
        (authUser?.email as string | undefined) ||
        (member?.email as string | undefined) ||
        null;
      const result = await openStripeCheckout(planId, flow, durationMonths, email);
      await refresh();
      return result;
    },
    [authUser?.email, member?.email, refresh],
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
      adminStaffThreads,
      staffCollabThreads,
      adminStaffMessages,
      staffCollabMessages,
      loadAdminStaffMessages,
      sendAdminStaffChat,
      markAdminStaffRead,
      loadStaffCollabMessages,
      sendStaffCollabChat,
      markStaffCollabRead,
      memberSettings,
      updateSettings,
      verificationStatus,
      sendEmailVerification,
      confirmEmailVerification,
      sendPhoneVerification,
      confirmPhoneVerification,
      refreshVerification,
      startStripeCheckout,
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
      adminStaffThreads,
      staffCollabThreads,
      adminStaffMessages,
      staffCollabMessages,
      loadAdminStaffMessages,
      sendAdminStaffChat,
      markAdminStaffRead,
      loadStaffCollabMessages,
      sendStaffCollabChat,
      markStaffCollabRead,
      memberSettings,
      updateSettings,
      verificationStatus,
      sendEmailVerification,
      confirmEmailVerification,
      sendPhoneVerification,
      confirmPhoneVerification,
      refreshVerification,
      startStripeCheckout,
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
