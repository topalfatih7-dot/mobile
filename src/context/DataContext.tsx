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

import { isUiOnly } from '@/config/runtime';
import { useAuth } from '@/context/AuthContext';
import { useChatUnread } from '@/context/ChatUnreadContext';
import {
  DEMO_CLIENTS,
  DEMO_POSTS,
  DEMO_PROGRAMS,
  DEMO_STAFF,
  DEMO_ADMIN_STATS,
  DEMO_ADMIN_TICKETS,
  DEMO_APPLICATIONS,
} from '@/data/uiDemo';
import { usePlatformRealtime } from '@/hooks/usePlatformRealtime';
import {
  rowToPlan,
  rowToPost,
  rowToProgram,
  type MemberRecord,
} from '@/services/mappers';
import {
  EMPTY_PLATFORM,
  hydratePlatform,
  type PlatformBundle,
} from '@/services/platformDb';
import { isMemberWriteInFlight } from '@/services/memberWriteGate';
import { fetchMemberRowQuiet } from '@/services/memberRowRefresh';
import { fetchStaffDirectory } from '@/services/staffDirectory';
import { requireSupabase, supabase } from '@/services/supabase';
import { isPaidMembership, setPlanCatalog } from '@/data/membershipPlans';
import { getStaffClients } from '@/utils/staffClients';
import { isProgramListedForMember } from '@/utils/programPackageScope';
import { perfInc } from '@/utils/perfCounters';

export type ProgramRecord = Record<string, unknown> & {
  id: string;
  memberId?: string;
  type?: string;
  title?: string;
  entries?: unknown[];
};

export type PostRecord = Record<string, unknown> & {
  id: string;
  published?: boolean;
  createdAt?: string;
  title?: string;
  slug?: string;
};

export type RefreshDataOptions = {
  /** Realtime / arka plan: full-screen loading yok (call unmount önlenir) */
  silent?: boolean;
  reason?: 'boot' | 'chat' | 'ticket' | 'member' | 'focus' | 'write' | 'manual' | 'unknown';
};

export type DataContextValue = {
  loading: boolean;
  programs: ProgramRecord[];
  myPrograms: ProgramRecord[];
  posts: PostRecord[];
  staffById: Record<string, Record<string, unknown>>;
  isFreeTrialExpired: boolean;
  isUnpaidMember: boolean;
  refreshData: (opts?: RefreshDataOptions) => Promise<void>;
  setLocalMemberOverlay: (member: MemberRecord | null) => void;
  memberOverride: MemberRecord | null;
  /** Staff platform slice (admin panel is web-only) */
  platform: PlatformBundle;
  staffClients: MemberRecord[];
};

const DataContext = createContext<DataContextValue | null>(null);

const STAFF_DIR_TTL_MS = 10 * 60 * 1000;

function demoPlatform(role: string | null): PlatformBundle {
  const members = DEMO_CLIENTS as MemberRecord[];
  const staffList = Object.values(DEMO_STAFF);
  return {
    ...EMPTY_PLATFORM,
    members,
    staffClients: members,
    programs: DEMO_PROGRAMS,
    posts: DEMO_POSTS,
    staffList,
    staffById: DEMO_STAFF,
    tickets: DEMO_ADMIN_TICKETS as unknown as Record<string, unknown>[],
    payments: members.slice(0, 3).map((m, i) => ({
      id: `ui-pay-${i + 1}`,
      memberId: m.id,
      membership: m.membership,
      plan: m.membership,
      months: i === 0 ? 6 : 1,
      amount: undefined,
      createdAt: new Date(Date.now() - i * 86400000).toISOString(),
      source: 'stripe',
    })),
    staffApplications: DEMO_APPLICATIONS.filter((a) => a.kind === 'staff') as unknown as Record<
      string,
      unknown
    >[],
    corporateApplications: DEMO_APPLICATIONS.filter(
      (a) => a.kind === 'corporate',
    ) as unknown as Record<string, unknown>[],
    contactInquiries: DEMO_APPLICATIONS.filter((a) => a.kind === 'contact') as unknown as Record<
      string,
      unknown
    >[],
    adminStats: {
      members: DEMO_ADMIN_STATS.members,
      paid: Math.max(0, DEMO_ADMIN_STATS.members - DEMO_ADMIN_STATS.unassigned),
      staff: DEMO_ADMIN_STATS.staffCount,
      openTickets: DEMO_ADMIN_STATS.openTickets,
      pendingApps: DEMO_ADMIN_STATS.applications,
    },
  };
}

export function DataProvider({ children }: { children: ReactNode }) {
  const { userId, role, member, staff, refreshAuth, applyRemoteMember } = useAuth();
  const { bump: bumpChatUnread } = useChatUnread();
  const [loading, setLoading] = useState(false);
  const [programs, setPrograms] = useState<ProgramRecord[]>([]);
  const [posts, setPosts] = useState<PostRecord[]>([]);
  const [staffById, setStaffById] = useState<Record<string, Record<string, unknown>>>({});
  const [memberOverride, setMemberOverride] = useState<MemberRecord | null>(null);
  const [platform, setPlatform] = useState<PlatformBundle>(EMPTY_PLATFORM);

  const staffId = staff?.id ? String(staff.id) : null;
  const staffRoleKey = staff?.role ? String(staff.role) : null;
  const staffRef = useRef(staff);
  staffRef.current = staff;

  const staffDirFetchedAt = useRef(0);
  const bootHydrated = useRef(false);
  const staffByIdRef = useRef(staffById);
  staffByIdRef.current = staffById;

  const effectiveMember = (memberOverride || member) as MemberRecord | null;

  const refreshData = useCallback(async (opts?: RefreshDataOptions) => {
    const silent = Boolean(opts?.silent);
    const reason = opts?.reason || (silent ? 'unknown' : 'boot');
    perfInc('refreshData', reason);
    const staffNow = staffRef.current;

    if (isUiOnly()) {
      if (role === 'member' && userId) {
        setPrograms(DEMO_PROGRAMS);
        setPosts(DEMO_POSTS);
        setStaffById(DEMO_STAFF);
      } else if (role === 'staff') {
        const demo = demoPlatform(role);
        setPlatform(demo);
        setPrograms(demo.programs as ProgramRecord[]);
        setPosts(demo.posts as PostRecord[]);
        setStaffById(demo.staffById);
      } else {
        setPrograms([]);
        setPosts(DEMO_POSTS);
        setStaffById({});
        setPlatform(EMPTY_PLATFORM);
      }
      return;
    }

    if (!supabase) {
      setPrograms([]);
      setPosts([]);
      setPlatform(EMPTY_PLATFORM);
      return;
    }

    if (!silent) setLoading(true);
    try {
      const client = requireSupabase();

      if (!userId) {
        const postsRes = await client
          .from('posts')
          .select('*')
          .eq('published', true)
          .order('created_at', { ascending: false })
          .limit(48);
        setPrograms([]);
        setPosts(
          (postsRes.data || []).map(
            (row) => rowToPost(row as Record<string, unknown>) as PostRecord,
          ),
        );
        setStaffById({});
        setPlatform(EMPTY_PLATFORM);
        return;
      }

      if (role === 'member') {
        const cachedDir = staffByIdRef.current;
        const needStaffDir =
          !silent ||
          Date.now() - staffDirFetchedAt.current > STAFF_DIR_TTL_MS ||
          Object.keys(cachedDir).length === 0;

        const [progRes, postsRes, staffBundle, plansRes] = await Promise.all([
          client.from('programs').select('*').eq('member_id', userId),
          client.from('posts').select('*').eq('published', true).limit(24),
          needStaffDir
            ? fetchStaffDirectory()
            : Promise.resolve({
                staffById: cachedDir,
                staffList: [] as Record<string, unknown>[],
              }),
          client.from('plans').select('*').eq('is_active', true).order('sort_order', { ascending: true }),
        ]);

        setPrograms(
          (progRes.data || []).map(
            (row) => rowToProgram(row as Record<string, unknown>) as ProgramRecord,
          ),
        );
        setPosts(
          (postsRes.data || []).map(
            (row) => rowToPost(row as Record<string, unknown>) as PostRecord,
          ),
        );
        if (needStaffDir) {
          setStaffById(staffBundle.staffById);
          staffDirFetchedAt.current = Date.now();
        }
        setPlanCatalog(
          (plansRes.data || []).map((row) => rowToPlan(row as Record<string, unknown>)),
        );
        setPlatform(EMPTY_PLATFORM);
        // Boot: Auth already hydrated — skip duplicate members select.
        // Explicit non-silent refresh (pull-to-refresh) still refreshes auth once.
        if (!silent && bootHydrated.current) {
          await refreshAuth();
        }
        bootHydrated.current = true;
        // Only clear overlay when auth is the SoT (non-silent)
        if (!silent && !isMemberWriteInFlight()) {
          setMemberOverride(null);
        }
      } else if (role === 'staff') {
        const bundle = await hydratePlatform({ role, userId, staff: staffNow });
        setPlatform(bundle);
        setPlanCatalog(bundle.plans as import('@/data/membershipPlans').PlanCatalogEntry[]);
        setPrograms(bundle.programs as ProgramRecord[]);
        setPosts(bundle.posts as PostRecord[]);
        setStaffById(bundle.staffById);
        if (!silent && bootHydrated.current) {
          await refreshAuth();
        }
        bootHydrated.current = true;
      } else if (role === 'admin') {
        setPlatform(EMPTY_PLATFORM);
        setPrograms([]);
        setPosts([]);
        setStaffById({});
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [userId, role, staffId, staffRoleKey, refreshAuth]);

  useEffect(() => {
    bootHydrated.current = false;
    void refreshData({ reason: 'boot' });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional boot on identity change
  }, [userId, role, staffId, staffRoleKey]);

  const onProgramsChange = useCallback(
    (change: { type: 'delete'; id: string } | { type: 'upsert'; program: Record<string, unknown> }) => {
      setPrograms((prev) => {
        if (change.type === 'delete') {
          return prev.filter((p) => String(p.id) !== change.id);
        }
        const next = change.program as ProgramRecord;
        const idx = prev.findIndex((p) => String(p.id) === String(next.id));
        if (idx >= 0) {
          return prev.map((p, i) => (i === idx ? next : p));
        }
        return [next, ...prev];
      });
      if (role === 'staff') {
        setPlatform((prev) => {
          const list = (prev.programs || []) as ProgramRecord[];
          if (change.type === 'delete') {
            return {
              ...prev,
              programs: list.filter((p) => String(p.id) !== change.id),
            };
          }
          const next = change.program as ProgramRecord;
          const idx = list.findIndex((p) => String(p.id) === String(next.id));
          const nextPrograms =
            idx >= 0 ? list.map((p, i) => (i === idx ? next : p)) : [next, ...list];
          return { ...prev, programs: nextPrograms };
        });
      }
    },
    [role],
  );

  const onChatChange = useCallback(() => {
    perfInc('refreshData', 'chat');
    bumpChatUnread();
  }, [bumpChatUnread]);

  const onMemberChange = useCallback(
    (change: { member: Record<string, unknown> }) => {
      perfInc('refreshData', 'member');
      const next = change.member as MemberRecord;
      if (role === 'member') {
        if (isMemberWriteInFlight()) return;
        applyRemoteMember(next);
        // Auth is now fresh — safe to drop stale overlay
        setMemberOverride(null);
        return;
      }
      if (role === 'staff') {
        setPlatform((prev) => {
          const list = prev.members || [];
          const idx = list.findIndex((m) => String(m.id) === String(next.id));
          const members =
            idx >= 0
              ? list.map((m, i) => (i === idx ? next : m))
              : [...list, next];
          const staffClients = staffRef.current
            ? getStaffClients(members, String(staffRef.current.role), String(staffRef.current.id))
            : prev.staffClients;
          return { ...prev, members, staffClients };
        });
      }
    },
    [role, applyRemoteMember],
  );

  const onTicketsChange = useCallback(() => {
    perfInc('refreshData', 'ticket');
    bumpChatUnread();
  }, [bumpChatUnread]);

  const onPlatformChange = useCallback(() => {
    if (role === 'staff') {
      // Staff row UPDATE → refresh auth for notification badge (not full hydrate)
      void refreshAuth();
    }
  }, [role, refreshAuth]);

  usePlatformRealtime({
    role,
    userId,
    staffId: staff?.id ? String(staff.id) : null,
    staffRole: staff?.role ? String(staff.role) : null,
    onChange: onPlatformChange,
    onProgramsChange,
    onChatChange,
    onMemberChange,
    onTicketsChange,
  });

  useEffect(() => {
    if (isUiOnly() || role !== 'member' || !userId) return undefined;
    const onChange = (state: AppStateStatus) => {
      if (state !== 'active') return;
      void (async () => {
        try {
          if (isMemberWriteInFlight()) return;
          const row = await fetchMemberRowQuiet(userId);
          if (row) applyRemoteMember(row);
        } catch {
          /* keep stale membership card */
        }
      })();
    };
    const sub = AppState.addEventListener('change', onChange);
    return () => sub.remove();
  }, [role, userId, applyRemoteMember]);

  const myPrograms = useMemo(() => {
    if (!effectiveMember?.id) return [];
    return programs.filter((p) => {
      if (p.memberId !== effectiveMember.id) return false;
      return isProgramListedForMember(p, effectiveMember as never);
    });
  }, [programs, effectiveMember]);

  const staffClients = useMemo(() => {
    if (role === 'staff' && staff) {
      return getStaffClients(platform.members, String(staff.role), String(staff.id));
    }
    return platform.staffClients;
  }, [role, staff, platform.members, platform.staffClients]);

  const isFreeTrialExpired = useMemo(
    () =>
      Boolean(
        effectiveMember?.membership === 'free' &&
          effectiveMember?.freeTrialExpiresAt &&
          new Date() > new Date(String(effectiveMember.freeTrialExpiresAt)),
      ),
    [effectiveMember],
  );

  const isUnpaidMember = useMemo(
    () => !isPaidMembership(String(effectiveMember?.membership || 'free')),
    [effectiveMember?.membership],
  );

  const value = useMemo<DataContextValue>(
    () => ({
      loading,
      programs,
      myPrograms,
      posts,
      staffById,
      isFreeTrialExpired,
      isUnpaidMember,
      refreshData,
      setLocalMemberOverlay: setMemberOverride,
      memberOverride,
      platform,
      staffClients,
    }),
    [
      loading,
      programs,
      myPrograms,
      posts,
      staffById,
      isFreeTrialExpired,
      isUnpaidMember,
      refreshData,
      memberOverride,
      platform,
      staffClients,
    ],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData outside DataProvider');
  return ctx;
}

/** Auth member + local overlay (after toggles before full refresh) */
export function useMember() {
  const { member } = useAuth();
  const { memberOverride } = useData();
  return (memberOverride || member) as MemberRecord | null;
}
