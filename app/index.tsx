import { Redirect, router, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { IntroCarousel } from '@/components/welcome/IntroCarousel';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { useAuth } from '@/context/AuthContext';

/**
 * İlk açılış — kaydırmalı welcome.
 * Oturum varsa role redirect.
 */
export default function Index() {
  const { loading, isAuthenticated, routeForRole } = useAuth();

  if (loading) {
    return <LoadingScreen label="Oturum kontrol ediliyor…" />;
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
