import { Stack } from 'expo-router';

import { colors } from '@/constants/theme';

export default function StaffClientsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.canvas },
      }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[id]/health" />
      <Stack.Screen name="[id]/program" />
    </Stack>
  );
}
