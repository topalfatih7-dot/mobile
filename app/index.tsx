import { Redirect, router, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { IntroCarousel } from '@/components/welcome/IntroCarousel';
import { useAuth } from '@/context/AuthContext';

/**
 * İlk açılış — kaydırmalı welcome.
 * Soğuk boot AuthProvider BrandedBootScreen ile biter; oturum varsa role redirect.
 */
export default function Index() {
  const { isAuthenticated, routeForRole } = useAuth();

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
