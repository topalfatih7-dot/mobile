import { Redirect, usePathname, type Href } from 'expo-router';
import type { ReactNode } from 'react';

import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { useAuth } from '@/context/AuthContext';
import type { SessionRole } from '@/services/authHydrate';
import { hrefForRoleMismatch, resolvePanelPathname } from '@/utils/panelRouteRemap';

type Props = {
  allow: SessionRole;
  children: ReactNode;
};

/** LOCK ProfileCompletionGate + oturumsuz panel sızıntısı. */
export function PanelAuthGate({ allow, children }: Props) {
  const { loading, isAuthenticated, role, registeredMember, routeForRole } = useAuth();
  const pathname = resolvePanelPathname(usePathname());

  if (loading) return <LoadingScreen label="Oturum kontrol ediliyor…" />;

  if (!isAuthenticated) {
    const from =
      pathname && pathname !== '/'
        ? `/(auth)/login?from=${encodeURIComponent(pathname)}`
        : '/(auth)/login';
    return <Redirect href={from as Href} />;
  }

  if (role !== allow) {
    const href = hrefForRoleMismatch({
      role,
      allow,
      pathname,
      fallback: routeForRole() || '/(auth)/login',
    });
    return <Redirect href={href as Href} />;
  }

  if (allow === 'member' && !registeredMember) {
    return <Redirect href={'/(auth)/onboarding' as Href} />;
  }

  return <>{children}</>;
}
