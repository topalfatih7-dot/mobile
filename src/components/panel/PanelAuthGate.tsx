import { Redirect, type Href } from 'expo-router';
import type { ReactNode } from 'react';

import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { useAuth } from '@/context/AuthContext';
import type { SessionRole } from '@/services/authHydrate';

type Props = {
  allow: SessionRole;
  children: ReactNode;
};

/** LOCK ProfileCompletionGate + oturumsuz panel sızıntısı. */
export function PanelAuthGate({ allow, children }: Props) {
  const { loading, isAuthenticated, role, registeredMember, routeForRole } = useAuth();

  if (loading) return <LoadingScreen label="Oturum kontrol ediliyor…" />;

  if (!isAuthenticated) {
    return <Redirect href={'/(auth)/login' as Href} />;
  }

  if (role !== allow) {
    return <Redirect href={(routeForRole() || '/(auth)/login') as Href} />;
  }

  if (allow === 'member' && !registeredMember) {
    return <Redirect href={'/(auth)/onboarding' as Href} />;
  }

  return <>{children}</>;
}
