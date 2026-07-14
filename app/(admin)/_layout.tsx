import { Stack } from 'expo-router';

import { useProtectedRoute } from '@/hooks/useAuthGuard';
import { colors } from '@/constants/theme';

export default function AdminLayout() {
  useProtectedRoute('admin');

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="members/[id]" />
      <Stack.Screen name="messages/index" />
      <Stack.Screen name="messages/[threadId]" />
    </Stack>
  );
}
