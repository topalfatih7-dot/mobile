/**
 * Web parity: AppContext startPresenceTracker — oturum açıkken heartbeat.
 */
import { useEffect, useRef } from 'react';
import { usePathname } from 'expo-router';

import { useAuth } from '@/context/AuthContext';
import { startPresenceTracker } from '@/services/presence';

export function PresenceBootstrap() {
  const { isAuthenticated, userId, email, role, member, staff } = useAuth();
  const pathname = usePathname();
  const pathRef = useRef(pathname);
  pathRef.current = pathname;

  useEffect(() => {
    if (!isAuthenticated || !userId || !role) return;

    return startPresenceTracker({
      resolvePresenceInfo: async () => {
        if (!userId || !role) return null;
        let name: string | null = email;
        if (role === 'member' && member?.name) name = String(member.name);
        else if (role === 'staff' && staff?.name) name = String(staff.name);
        return {
          userId,
          email,
          name,
          role,
        };
      },
      getPagePath: () => pathRef.current || '/',
    });
  }, [isAuthenticated, userId, email, role, member?.name, staff?.name]);

  return null;
}
