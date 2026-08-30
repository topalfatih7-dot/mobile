import '@/polyfills';
import '@/boot/coldBoot';
import '@/boot/fontScaleCap';

import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { BrandedBootScreen } from '@/components/welcome/BrandedBootScreen';
import { AppProviders } from '@/context/AppProviders';
import { ensureNotificationChannel } from '@/services/push';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  useEffect(() => {
    // Native splash → JS branded boot (animasyonlu giriş)
    SplashScreen.hideAsync().catch(() => {});
    if (Platform.OS === 'android') {
      void ensureNotificationChannel();
    }
  }, []);

  if (!fontsLoaded) return <BrandedBootScreen />;

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <KeyboardProvider>
          <ErrorBoundary>
            <AppProviders>
              <StatusBar style="dark" />
              <Stack screenOptions={{ headerShown: false }} />
            </AppProviders>
          </ErrorBoundary>
        </KeyboardProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
