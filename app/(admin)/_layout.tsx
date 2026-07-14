import { Stack } from 'expo-router';

import { useProtectedRoute } from '@/hooks/useAuthGuard';
import { colors } from '@/constants/theme';

export default function AdminLayout() {
  useProtectedRoute('admin');

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.canvas },
      }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="members/[id]" />
      <Stack.Screen name="messages/index" />
      <Stack.Screen name="messages/[threadId]" />
      <Stack.Screen name="plans" />
      <Stack.Screen name="premium" />
      <Stack.Screen name="applications" />
      <Stack.Screen name="library" />
      <Stack.Screen name="staff" />
      <Stack.Screen name="blog" />
      <Stack.Screen name="content" />
      <Stack.Screen name="payments" />
      <Stack.Screen name="subscriptions" />
      <Stack.Screen name="sessions" />
      <Stack.Screen name="support" />
      <Stack.Screen name="analytics" />
      <Stack.Screen name="activity" />
      <Stack.Screen name="account" />
    </Stack>
  );
}
