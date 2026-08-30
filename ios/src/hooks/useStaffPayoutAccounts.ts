import { useCallback, useEffect, useState } from 'react';

import {
  fetchOwnPayoutAccount,
  type StaffPayoutAccount,
} from '@/services/staffPayoutAccounts';

export function useStaffPayoutAccounts({ staffId = null }: { staffId?: string | null } = {}) {
  const [accounts, setAccounts] = useState<StaffPayoutAccount[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(
    async ({ silent = false }: { silent?: boolean } = {}) => {
      if (!silent) setLoading(true);
      try {
        if (staffId) {
          const row = await fetchOwnPayoutAccount(staffId);
          setAccounts(row ? [row] : []);
        } else {
          setAccounts([]);
        }
      } catch {
        setAccounts([]);
      } finally {
        setLoading(false);
      }
    },
    [staffId],
  );

  useEffect(() => {
    void load();
  }, [load]);

  return {
    accounts,
    account: accounts[0] || null,
    loading,
    reload: () => load({ silent: true }),
  };
}
