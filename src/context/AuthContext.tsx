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
import { router, type Href } from 'expo-router';

import {
  isColdBootCompleted,
  markColdBootCompleted,
  waitColdBootMin,
} from '@/boot/coldBoot';
import { BrandedBootScreen } from '@/components/welcome/BrandedBootScreen';
import { isUiOnly } from '@/config/runtime';
import { ACCOUNT_DELETE_COPY } from '@/data/accountDeleteCopy';
import { buildDemoAuth } from '@/data/uiDemo';
import { resetChatUi } from '@/data/uiChat';
import { useToast } from '@/context/ToastContext';
import { hydrateAuth, routeForHydrated, type HydratedAuth, type SessionRole } from '@/services/authHydrate';
import { passwordLogin } from '@/services/authLogin';
import {
  clearDemoAuth,
  loadDemoAuth,
  saveDemoAuth,
} from '@/services/demoAuthStorage';
import { supabase } from '@/services/supabase';

export type AuthContextValue = {
  loading: boolean;
  isAuthenticated: boolean;
  role: SessionRole | null;
  userId: string | null;
  email: string | null;
  member: Record<string, unknown> | null;
  staff: Record<string, unknown> | null;
  registeredMember: boolean;
  refreshAuth: () => Promise<HydratedAuth | null>;
  /** Optimistic staff patch (notifications mark-read) before refreshAuth */
  setLocalStaffOverlay: (staff: Record<string, unknown> | null) => void;
  /** Realtime member row — update auth without full hydrateAuth round-trip */
  applyRemoteMember: (member: Record<string, unknown>) => void;
  /** Realtime staff row patch into overlay/auth */
  applyRemoteStaff: (staff: Record<string, unknown>) => void;
  login: (opts: {
    email: string;
    password: string;
    remember: boolean;
    turnstileToken?: string;
  }) => Promise<{ success: boolean; error?: string; route?: string }>;
  logout: () => Promise<void>;
  /** F17: members satırı silindi — yerel oturum + landing. Ağ/timeout çağırmaz. */
  endSessionAfterAccountPurge: () => Promise<void>;
  routeForRole: () => string | null;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [booting, setBooting] = useState(true);
  const [showColdBoot, setShowColdBoot] = useState(() => !isColdBootCompleted());
  const [auth, setAuth] = useState<HydratedAuth | null>(null);
  const [staffOverride, setStaffOverride] = useState<Record<string, unknown> | null>(
    null,
  );
  const authRef = useRef<HydratedAuth | null>(null);
  authRef.current = auth;
  const authEventGenRef = useRef(0);
  const loginLockRef = useRef(false);
  const loginEpochRef = useRef(0);
  const accountPurgeLockRef = useRef(false);

  const refreshAuth = useCallback(async () => {
    if (isUiOnly()) {
      return authRef.current;
    }
    const next = await hydrateAuth();
    setStaffOverride(null);
    setAuth(next);
    return next;
  }, []);

  const setLocalStaffOverlay = useCallback((next: Record<string, unknown> | null) => {
    setStaffOverride(next);
  }, []);

  const applyRemoteMember = useCallback((member: Record<string, unknown>) => {
    setAuth((prev) => {
      if (!prev || prev.role !== 'member') return prev;
      return { ...prev, member };
    });
  }, []);

  const applyRemoteStaff = useCallback((next: Record<string, unknown>) => {
    setStaffOverride(next);
    setAuth((prev) => {
      if (!prev || prev.role !== 'staff') return prev;
      return { ...prev, staff: next };
    });
  }, []);

  useEffect(() => {
    let alive = true;

    if (isUiOnly()) {
      (async () => {
        try {
          const saved = await loadDemoAuth();
          if (alive && saved) setAuth(saved);
        } finally {
          if (alive) setBooting(false);
        }
      })();
      return () => {
        alive = false;
      };
    }

    (async () => {
      try {
        const next = await hydrateAuth();
        if (alive) setAuth(next);
      } finally {
        if (alive) setBooting(false);
      }
    })();

    if (!supabase) {
      return () => {
        alive = false;
      };
    }

    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      const my = ++authEventGenRef.current;
      if (loginLockRef.current) return;
      void hydrateAuth().then((next) => {
        if (!alive || my !== authEventGenRef.current) return;
        if (my <= loginEpochRef.current) return;
        setAuth(next);
      });
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const login = useCallback(
    async (opts: {
      email: string;
      password: string;
      remember: boolean;
      turnstileToken?: string;
    }) => {
      if (isUiOnly()) {
        if (!opts.email.trim() || opts.password.length < 6) {
          return { success: false as const, error: 'Lütfen formu kontrol edin.' };
        }
        resetChatUi();
        const demo = buildDemoAuth(opts.email.trim().toLowerCase());
        setAuth(demo);
        await saveDemoAuth(demo);
        return { success: true as const, route: routeForHydrated(demo) };
      }

      loginLockRef.current = true;
      try {
        const result = await passwordLogin({
          email: opts.email,
          password: opts.password,
          remember: opts.remember,
          turnstileToken: opts.turnstileToken || '',
        });
        if (!result.success) return { success: false as const, error: result.error };
        const next =
          (await hydrateAuth(result.session)) || (await hydrateAuth());
        setAuth(next);
        loginEpochRef.current = authEventGenRef.current;
        accountPurgeLockRef.current = false;
        if (!next) {
          return { success: false as const, error: 'Oturum açılamadı. Lütfen tekrar deneyin.' };
        }
        return { success: true as const, route: routeForHydrated(next) };
      } catch {
        return { success: false as const, error: 'Oturum açılamadı. Lütfen tekrar deneyin.' };
      } finally {
        loginLockRef.current = false;
      }
    },
    [],
  );

  const logout = useCallback(async () => {
    if (isUiOnly()) {
      resetChatUi();
      await clearDemoAuth();
      setStaffOverride(null);
      setAuth(null);
      return;
    }
    try {
      if (supabase) await supabase.auth.signOut();
    } catch {
      try {
        await supabase?.auth.signOut({ scope: 'local' });
      } catch {
        /* already gone */
      }
    }
    setStaffOverride(null);
    setAuth(null);
  }, []);

  const endSessionAfterAccountPurge = useCallback(async () => {
    if (isUiOnly()) return;
    if (!authRef.current?.registeredMember) return;
    if (accountPurgeLockRef.current) return;
    accountPurgeLockRef.current = true;
    try {
      if (supabase) await supabase.auth.signOut({ scope: 'local' });
    } catch {
      /* server user already deleted */
    }
    setStaffOverride(null);
    setAuth(null);
    toast(ACCOUNT_DELETE_COPY.doneTitle, 'info');
    router.replace('/(public)/landing' as Href);
  }, [toast]);

  const routeForRole = useCallback(() => (auth ? routeForHydrated(auth) : null), [auth]);

  useEffect(() => {
    if (booting || !showColdBoot) return;
    let cancelled = false;
    void waitColdBootMin().then(() => {
      if (cancelled) return;
      markColdBootCompleted();
      setShowColdBoot(false);
    });
    return () => {
      cancelled = true;
    };
  }, [booting, showColdBoot]);

  const resolvedStaff = staffOverride ?? auth?.staff ?? null;

  const value = useMemo<AuthContextValue>(
    () => ({
      loading: booting,
      isAuthenticated: Boolean(auth),
      role: auth?.role ?? null,
      userId: auth?.userId ?? null,
      email: auth?.email ?? null,
      member: auth?.member ?? null,
      staff: resolvedStaff,
      registeredMember: auth?.registeredMember ?? false,
      refreshAuth,
      setLocalStaffOverlay,
      applyRemoteMember,
      applyRemoteStaff,
      login,
      logout,
      endSessionAfterAccountPurge,
      routeForRole,
    }),
    [
      booting,
      auth,
      resolvedStaff,
      refreshAuth,
      setLocalStaffOverlay,
      applyRemoteMember,
      applyRemoteStaff,
      login,
      logout,
      endSessionAfterAccountPurge,
      routeForRole,
    ],
  );

  return (
    <AuthContext.Provider value={value}>
      {booting || showColdBoot ? <BrandedBootScreen /> : children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
