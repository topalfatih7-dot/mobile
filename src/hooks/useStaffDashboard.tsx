import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { useApp } from '@/context/AppContext';
import { fetchStaffChatThreads } from '@/services/db/chat';
import { fetchAllMembers } from '@/services/db/members';
import { fetchStaffPrograms, type DbProgram } from '@/services/db/programs';
import {
  buildStaffStats,
  mapStaffThreadsToInbox,
  totalStaffUnread,
  type StaffInboxItem,
} from '@/services/staffDashboard';
import type { MemberProfile } from '@/types/session';
import { getStaffAppointments, getStaffClients, staffRoleLabel } from '@/utils/staffAccess';

type StaffDashboardContextValue = {
  clients: MemberProfile[];
  inbox: StaffInboxItem[];
  programs: DbProgram[];
  stats: ReturnType<typeof buildStaffStats>;
  unreadCount: number;
  roleLabel: string;
  syncing: boolean;
  refresh: () => Promise<void>;
};

const EMPTY_STATS = buildStaffStats([], [], []);

const StaffDashboardContext = createContext<StaffDashboardContextValue | null>(null);

export function StaffDashboardProvider({ children }: { children: ReactNode }) {
  const { staff, isStaff } = useApp();
  const [clients, setClients] = useState<MemberProfile[]>([]);
  const [inbox, setInbox] = useState<StaffInboxItem[]>([]);
  const [programs, setPrograms] = useState<DbProgram[]>([]);
  const [stats, setStats] = useState(EMPTY_STATS);
  const [unreadCount, setUnreadCount] = useState(0);
  const [syncing, setSyncing] = useState(false);

  const refresh = useCallback(async () => {
    if (!isStaff || !staff?.id) {
      setClients([]);
      setInbox([]);
      setPrograms([]);
      setStats(EMPTY_STATS);
      setUnreadCount(0);
      return;
    }

    setSyncing(true);
    try {
      const [members, threads, staffPrograms] = await Promise.all([
        fetchAllMembers(),
        fetchStaffChatThreads(staff.id),
        fetchStaffPrograms(staff.id),
      ]);

      const staffClients = getStaffClients(members, staff.role, staff.id);
      const appointments = getStaffAppointments(staffClients, staff.role);

      setClients(staffClients);
      setInbox(mapStaffThreadsToInbox(threads, staffClients));
      setPrograms(staffPrograms);
      setStats(buildStaffStats(staffClients, staffPrograms, appointments));
      setUnreadCount(totalStaffUnread(threads));
    } finally {
      setSyncing(false);
    }
  }, [isStaff, staff?.id, staff?.role]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const roleLabel = useMemo(() => `${staffRoleLabel(staff?.role)} paneli`, [staff?.role]);

  const value = useMemo(
    () => ({
      clients,
      inbox,
      programs,
      stats,
      unreadCount,
      roleLabel,
      syncing,
      refresh,
    }),
    [clients, inbox, programs, stats, unreadCount, roleLabel, syncing, refresh],
  );

  return <StaffDashboardContext.Provider value={value}>{children}</StaffDashboardContext.Provider>;
}

export function useStaffDashboard() {
  const ctx = useContext(StaffDashboardContext);
  if (!ctx) throw new Error('useStaffDashboard must be used within StaffDashboardProvider');
  return ctx;
}
