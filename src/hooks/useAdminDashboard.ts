import { useCallback, useEffect, useState } from 'react';

import { fetchAdminOverview } from '@/services/db/members';
import type { AdminMemberRow, AdminStats } from '@/services/staffDashboard';

const EMPTY_STATS: AdminStats = {
  memberCount: 0,
  staffCount: 0,
  threadCount: 0,
  programCount: 0,
  paidMemberCount: 0,
};

export function useAdminDashboard() {
  const [stats, setStats] = useState<AdminStats>(EMPTY_STATS);
  const [members, setMembers] = useState<AdminMemberRow[]>([]);
  const [syncing, setSyncing] = useState(false);

  const refresh = useCallback(async () => {
    setSyncing(true);
    try {
      const overview = await fetchAdminOverview();
      setStats(overview.stats);
      setMembers(overview.members);
    } finally {
      setSyncing(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { stats, members, syncing, refresh };
}
