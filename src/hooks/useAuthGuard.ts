import { router } from 'expo-router';
import { useEffect } from 'react';

import { useApp } from '@/context/AppContext';
import type { SessionType } from '@/types/session';
import { hasRegisteredMember, isSocialAuthUser } from '@/utils/memberProfile';

function toAllowedList(allowed: SessionType | SessionType[]) {
  return Array.isArray(allowed) ? allowed : [allowed];
}

/** Oturum yoksa login'e; yanlış roldeyse doğru kabuğa yönlendirir (docs/rn-migration/05 §4). */
export function useProtectedRoute(allowed: SessionType | SessionType[]) {
  const { loading, isAuthenticated, sessionType, routeForRole, user, authUser, isAdmin, isStaff } =
    useApp();

  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated || !sessionType) {
      router.replace('/(auth)/login');
      return;
    }

    const allowedList = toAllowedList(allowed);
    if (!allowedList.includes(sessionType)) {
      router.replace(routeForRole(sessionType));
      return;
    }

    // ProfileCompletionGate — yalnızca member kabuğu
    if (allowedList.includes('member') && !isAdmin && !isStaff) {
      if (!hasRegisteredMember(user)) {
        const oauth = isSocialAuthUser(authUser) ? '1' : '0';
        router.replace(`/(auth)/onboarding?plan=free&oauth=${oauth}`);
      }
    }
  }, [loading, isAuthenticated, sessionType, routeForRole, allowed, user, authUser, isAdmin, isStaff]);
}

/** Giriş yapmış kullanıcıyı rolüne göre ana kabuğa yönlendirir. */
export function useAuthRedirect() {
  const { loading, isAuthenticated, sessionType, routeForRole, user, authUser, isAdmin, isStaff } =
    useApp();

  useEffect(() => {
    if (loading || !isAuthenticated || !sessionType) return;

    if (sessionType === 'member' && !isAdmin && !isStaff && !hasRegisteredMember(user)) {
      const oauth = isSocialAuthUser(authUser) ? '1' : '0';
      router.replace(`/(auth)/onboarding?plan=free&oauth=${oauth}`);
      return;
    }

    router.replace(routeForRole(sessionType));
  }, [loading, isAuthenticated, sessionType, routeForRole, user, authUser, isAdmin, isStaff]);
}
