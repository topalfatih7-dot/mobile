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

import { isUiOnly } from '@/config/runtime';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { buildDemoAuth } from '@/data/uiDemo';
import { resetChatUi } from '@/data/uiChat';
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
  login: (opts: {
    email: string;
    password: string;
    remember: boolean;
    turnstileToken?: string;
  }) => Promise<{ success: boolean; error?: string; route?: string }>;
  logout: () => Promise<void>;
  routeForRole: () => string | null;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [booting, setBooting] = useState(true);
  const [auth, setAuth] = useState<HydratedAuth | null>(null);
  const authRef = useRef<HydratedAuth | null>(null);
  authRef.current = auth;

  const refreshAuth = useCallback(async () => {
    if (isUiOnly()) {
      return authRef.current;
    }
    const next = await hydrateAuth();
    setAuth(next);
    return next;
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
      void hydrateAuth().then((next) => {
        if (alive) setAuth(next);
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

      const result = await passwordLogin({
        email: opts.email,
        password: opts.password,
        remember: opts.remember,
        turnstileToken: opts.turnstileToken || '',
      });
      if (!result.success) return { success: false as const, error: result.error };
      const next = await hydrateAuth();
      setAuth(next);
      if (!next) return { success: false as const, error: 'Oturum açılamadı. Lütfen tekrar deneyin.' };
      return { success: true as const, route: routeForHydrated(next) };
    },
    [],
  );

  const logout = useCallback(async () => {
    if (isUiOnly()) {
      resetChatUi();
      await clearDemoAuth();
      setAuth(null);
      return;
    }
    if (supabase) await supabase.auth.signOut();
    setAuth(null);
  }, []);

  const routeForRole = useCallback(() => (auth ? routeForHydrated(auth) : null), [auth]);

  const value = useMemo<AuthContextValue>(
    () => ({
      loading: booting,
      isAuthenticated: Boolean(auth),
      role: auth?.role ?? null,
      userId: auth?.userId ?? null,
      email: auth?.email ?? null,
      member: auth?.member ?? null,
      staff: auth?.staff ?? null,
      registeredMember: auth?.registeredMember ?? false,
      refreshAuth,
      login,
      logout,
      routeForRole,
    }),
    [booting, auth, refreshAuth, login, logout, routeForRole],
  );

  return (
    <AuthContext.Provider value={value}>
      {booting ? <LoadingScreen label="Oturum kontrol ediliyor…" /> : children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
