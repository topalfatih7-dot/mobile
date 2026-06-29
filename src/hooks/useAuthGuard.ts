import { router } from 'expo-router';
import { useEffect } from 'react';

import { useApp } from '@/context/AppContext';
import type { SessionType } from '@/types/session';

function toAllowedList(allowed: SessionType | SessionType[]) {
  return Array.isArray(allowed) ? allowed : [allowed];
}

/** Oturum yoksa welcome'a; yanlış roldeyse doğru kabuğa yönlendirir. */
export function useProtectedRoute(allowed: SessionType | SessionType[]) {
  const { loading, isAuthenticated, sessionType, routeForRole } = useApp();

  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated || !sessionType) {
      router.replace('/');
      return;
    }

    const allowedList = toAllowedList(allowed);
    if (!allowedList.includes(sessionType)) {
      router.replace(routeForRole(sessionType));
    }
  }, [loading, isAuthenticated, sessionType, routeForRole, allowed]);
}

/** Giriş yapmış kullanıcıyı rolüne göre ana kabuğa yönlendirir. */
export function useAuthRedirect() {
  const { loading, isAuthenticated, sessionType, routeForRole } = useApp();

  useEffect(() => {
    if (loading || !isAuthenticated || !sessionType) return;
    router.replace(routeForRole(sessionType));
  }, [loading, isAuthenticated, sessionType, routeForRole]);
}
