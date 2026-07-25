import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { isUiOnly } from '@/config/runtime';
import { useAuth } from '@/context/AuthContext';
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
import { rowToPost, rowToProgram, type MemberRecord } from '@/services/mappers';
import {
  EMPTY_PLATFORM,
  hydratePlatform,
  type PlatformBundle,
} from '@/services/platformDb';
import { fetchStaffDirectory } from '@/services/staffDirectory';
import { requireSupabase, supabase } from '@/services/supabase';
import { getStaffClients } from '@/utils/staffClients';
import { isProgramListedForMember } from '@/utils/programPackageScope';

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

export type DataContextValue = {
  loading: boolean;
  programs: ProgramRecord[];
  myPrograms: ProgramRecord[];
  posts: PostRecord[];
  staffById: Record<string, Record<string, unknown>>;
  isFreeTrialExpired: boolean;
  refreshData: () => Promise<void>;
  setLocalMemberOverlay: (member: MemberRecord | null) => void;
  memberOverride: MemberRecord | null;
  /** Staff/admin platform slice */
  platform: PlatformBundle;
  staffClients: MemberRecord[];
};

const DataContext = createContext<DataContextValue | null>(null);

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
      source: 'IAP',
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
  const { userId, role, member, staff, refreshAuth } = useAuth();
  const [loading, setLoading] = useState(false);
  const [programs, setPrograms] = useState<ProgramRecord[]>([]);
  const [posts, setPosts] = useState<PostRecord[]>([]);
  const [staffById, setStaffById] = useState<Record<string, Record<string, unknown>>>({});
  const [memberOverride, setMemberOverride] = useState<MemberRecord | null>(null);
  const [platform, setPlatform] = useState<PlatformBundle>(EMPTY_PLATFORM);

  const effectiveMember = (memberOverride || member) as MemberRecord | null;

  const refreshData = useCallback(async () => {
    if (isUiOnly()) {
      if (role === 'member' && userId) {
        setPrograms(DEMO_PROGRAMS);
        setPosts(DEMO_POSTS);
        setStaffById(DEMO_STAFF);
      } else if (role === 'staff' || role === 'admin') {
        const demo = demoPlatform(role);
        setPlatform(demo);
        setPrograms(demo.programs as ProgramRecord[]);
        setPosts(demo.posts as PostRecord[]);
        setStaffById(demo.staffById);
      } else {
        setPrograms([]);
        setPosts([]);
        setStaffById({});
        setPlatform(EMPTY_PLATFORM);
      }
      return;
    }

    if (!supabase || !userId) {
      setPrograms([]);
      setPosts([]);
      setPlatform(EMPTY_PLATFORM);
      return;
    }

    setLoading(true);
    try {
      const client = requireSupabase();

      if (role === 'member') {
        const [progRes, postsRes, staffBundle] = await Promise.all([
          client.from('programs').select('*').eq('member_id', userId),
          client.from('posts').select('*').eq('published', true).limit(24),
          // RLS: ham `staff` üye için boş döner — web gibi staff_directory
          fetchStaffDirectory(),
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
        setStaffById(staffBundle.staffById);
        setPlatform(EMPTY_PLATFORM);
        await refreshAuth();
        setMemberOverride(null);
      } else if (role === 'staff' || role === 'admin') {
        const bundle = await hydratePlatform({ role, userId, staff });
        setPlatform(bundle);
        setPrograms(bundle.programs as ProgramRecord[]);
        setPosts(bundle.posts as PostRecord[]);
        setStaffById(bundle.staffById);
        await refreshAuth();
      }
    } finally {
      setLoading(false);
    }
  }, [userId, role, staff, refreshAuth]);

  useEffect(() => {
    void refreshData();
  }, [refreshData]);

  usePlatformRealtime({
    role,
    userId,
    staffId: staff?.id ? String(staff.id) : null,
    onChange: () => {
      void refreshData();
    },
  });

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
    if (role === 'admin') return platform.members;
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

  const value = useMemo<DataContextValue>(
    () => ({
      loading,
      programs,
      myPrograms,
      posts,
      staffById,
      isFreeTrialExpired,
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
