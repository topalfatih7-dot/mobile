import { Redirect, router, usePathname, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { IntroCarousel } from '@/components/welcome/IntroCarousel';
import { useAuth } from '@/context/AuthContext';
import {
  browserLocationPathname,
  resolvePostAuthHref,
} from '@/utils/panelRouteRemap';

/**
 * İlk açılış — kaydırmalı welcome.
 * Soğuk boot AuthProvider BrandedBootScreen ile biter; oturum varsa role redirect.
 *
 * Bu ekran yalnız `/` içindir. Stack’te mount kalsa bile başka path’te
 * `routeForRole()` ile deep link çalmasın.
 */
export default function Index() {
  const { isAuthenticated, role, routeForRole } = useAuth();
  const pathname = usePathname();
  const webPath = browserLocationPathname();

  if (pathname && pathname !== '/') {
    return null;
  }

  if (webPath && webPath !== '/') {
    const fallback = routeForRole() || '/(auth)/login';
    if (isAuthenticated) {
      return <Redirect href={resolvePostAuthHref(webPath, role, fallback) as Href} />;
    }
    return (
      <Redirect
        href={`/(auth)/login?from=${encodeURIComponent(webPath)}` as Href}
      />
    );
  }

  if (isAuthenticated) {
    return <Redirect href={(routeForRole() || '/(member)/dashboard') as Href} />;
  }

  return (
    <>
      <StatusBar style="light" />
      <IntroCarousel
        onLogin={() => router.push('/(auth)/login')}
        onStart={() => router.push('/(auth)/onboarding')}
      />
    </>
  );
}
