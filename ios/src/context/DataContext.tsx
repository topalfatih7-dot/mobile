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

import { useAuth } from '@/context/AuthContext';
import { useChatUnread } from '@/context/ChatUnreadContext';
import { useToast } from '@/context/ToastContext';
import {
  usePlatformRealtime,
  type IncomingChatMessage,
  type StaffRealtimeChange,
} from '@/hooks/usePlatformRealtime';
import { MEMBER_PROBE_COOLDOWN_MS, shouldRunKeyed } from '@/utils/appActivity';
import {
  rowToPlan,
  rowToPost,
  rowToProgram,
  rowToStaff,
  type MemberRecord,
} from '@/services/mappers';
import {
  EMPTY_PLATFORM,
  hydratePlatform,
  type PlatformBundle,
} from '@/services/platformDb';
import { isMemberWriteInFlight } from '@/services/memberWriteGate';
import { probeMemberRow } from '@/services/memberRowRefresh';
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
  /** Realtime chat mesajı bildirimi — layout tarafından kaydedilen handler */
  setChatNotifyHandler: (fn: ((msg: IncomingChatMessage) => void) | null) => void;
};

const DataContext = createContext<DataContextValue | null>(null);

const STAFF_DIR_TTL_MS = 10 * 60 * 1000;

function sessionSignature(member: MemberRecord | null | undefined): string {
  if (!member) return '';
  const keys = ['coachSessions', 'dietitianSessions', 'doctorSessions'] as const;
  return keys
    .map((key) => {
      const list = Array.isArray(member[key])
        ? (member[key] as Record<string, unknown>[])
        : [];
      return list
        .map(
          (s) =>
            `${String(s.id || '')}:${String(s.date || s.startsAt || '')}:${String(s.status || '')}`,
        )
        .sort()
        .join(',');
    })
    .join('|');
}

export function DataProvider({ children }: { children: ReactNode }) {
  const { userId, role, member, staff, refreshAuth, applyRemoteMember, applyRemoteStaff, endSessionAfterAccountPurge } =
    useAuth();
  const { bump: bumpChatUnread } = useChatUnread();
  const { toast } = useToast();
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

  const chatNotifyCallbackRef = useRef<((msg: IncomingChatMessage) => void) | null>(null);
  const setChatNotifyHandler = useCallback(
    (fn: ((msg: IncomingChatMessage) => void) | null) => {
      chatNotifyCallbackRef.current = fn;
    },
    [],
  );

  const staffDirFetchedAt = useRef(0);
  const bootHydrated = useRef(false);
  const staffByIdRef = useRef(staffById);
  staffByIdRef.current = staffById;
  const programsRef = useRef(programs);
  programsRef.current = programs;
  const sessionSigRef = useRef<string | null>(null);

  const effectiveMember = (memberOverride || member) as MemberRecord | null;

  const refreshData = useCallback(async (opts?: RefreshDataOptions) => {
    const silent = Boolean(opts?.silent);
    const reason = opts?.reason || (silent ? 'unknown' : 'boot');
    perfInc('refreshData', reason);
    const staffNow = staffRef.current;


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
    sessionSigRef.current = sessionSignature(member as MemberRecord | null);
    void refreshData({ reason: 'boot' });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional boot on identity change
  }, [userId, role, staffId, staffRoleKey]);

  const onProgramsChange = useCallback(
    (change: { type: 'delete'; id: string } | { type: 'upsert'; program: Record<string, unknown> }) => {
      const prev = programsRef.current;
      setPrograms((list) => {
        if (change.type === 'delete') {
          return list.filter((p) => String(p.id) !== change.id);
        }
        const next = change.program as ProgramRecord;
        const idx = list.findIndex((p) => String(p.id) === String(next.id));
        if (idx >= 0) {
          return list.map((p, i) => (i === idx ? next : p));
        }
        return [next, ...list];
      });
      if (role === 'staff') {
        setPlatform((prevPlatform) => {
          const list = (prevPlatform.programs || []) as ProgramRecord[];
          if (change.type === 'delete') {
            return {
              ...prevPlatform,
              programs: list.filter((p) => String(p.id) !== change.id),
            };
          }
          const next = change.program as ProgramRecord;
          const idx = list.findIndex((p) => String(p.id) === String(next.id));
          const nextPrograms =
            idx >= 0 ? list.map((p, i) => (i === idx ? next : p)) : [next, ...list];
          return { ...prevPlatform, programs: nextPrograms };
        });
      }
      if (role === 'member') {
        if (change.type === 'delete') {
          if (prev.some((p) => String(p.id) === change.id)) {
            toast('Programınız güncellendi', 'info');
          }
          return;
        }
        const next = change.program as ProgramRecord;
        const existed = prev.some((p) => String(p.id) === String(next.id));
        const nutrition = String(next.type || '') === 'nutrition';
        toast(
          existed
            ? 'Programınız güncellendi'
            : nutrition
              ? 'Diyetisyeniniz yeni bir beslenme programı gönderdi'
              : 'Koçunuz yeni bir antrenman programı gönderdi',
          'info',
        );
      }
    },
    [role, toast],
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
        if (isMemberWriteInFlight()) {
          sessionSigRef.current = sessionSignature(next);
          applyRemoteMember(next);
          setMemberOverride(null);
          return;
        }
        const sig = sessionSignature(next);
        if (sessionSigRef.current != null && sessionSigRef.current !== sig) {
          toast('Randevunuz güncellendi', 'info');
        }
        sessionSigRef.current = sig;
        applyRemoteMember(next);
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
    [role, applyRemoteMember, toast],
  );

  const onTicketsChange = useCallback(() => {
    perfInc('refreshData', 'ticket');
    bumpChatUnread();
  }, [bumpChatUnread]);

  const onPlatformChange = useCallback(() => {
    // Artık staff row UPDATE için refreshAuth gerekmez (onStaffChange devralır)
  }, []);

  const onStaffChange = useCallback(
    (change: StaffRealtimeChange) => {
      perfInc('refreshData', 'member');
      applyRemoteStaff(rowToStaff(change.staff) as Record<string, unknown>);
    },
    [applyRemoteStaff],
  );

  const onIncomingChatMessage = useCallback(
    (msg: IncomingChatMessage) => chatNotifyCallbackRef.current?.(msg),
    [],
  );

  usePlatformRealtime({
    role,
    userId,
    staffId: staff?.id ? String(staff.id) : null,
    staffRole: staff?.role ? String(staff.role) : null,
    onChange: onPlatformChange,
    onProgramsChange,
    onChatChange,
    onMemberChange,
    onStaffChange,
    onTicketsChange,
    onIncomingChatMessage,
  });

  useEffect(() => {
    if (role !== 'member' || !userId) return undefined;
    const onChange = (state: AppStateStatus) => {
      if (state !== 'active') return;
      if (!shouldRunKeyed(`probeMember:${userId}`, MEMBER_PROBE_COOLDOWN_MS)) return;
      void (async () => {
        try {
          const probe = await probeMemberRow(userId);
          if (probe.status === 'missing') {
            await endSessionAfterAccountPurge();
            return;
          }
          if (probe.status === 'ok' && !isMemberWriteInFlight()) {
            applyRemoteMember(probe.member);
          }
        } catch {
          /* keep stale membership card */
        }
      })();
    };
    const sub = AppState.addEventListener('change', onChange);
    return () => sub.remove();
  }, [role, userId, applyRemoteMember, endSessionAfterAccountPurge]);

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
      setChatNotifyHandler,
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
      setChatNotifyHandler,
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
