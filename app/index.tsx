import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { IntroCarousel } from '@/components/welcome/IntroCarousel';
import { useAuthRedirect } from '@/hooks/useAuthGuard';

export default function WelcomeScreen() {
  useAuthRedirect();

  return (
    <>
      <StatusBar style="light" />
      <IntroCarousel
        onLogin={() => router.push('/(auth)/login')}
        onStart={() => router.push('/(auth)/register')}
      />
    </>
  );
}
