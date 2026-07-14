import { Stack } from 'expo-router';

import { colors } from '@/constants/theme';

export default function PublicLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.canvas },
        animation: 'slide_from_right',
      }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="membership" />
      <Stack.Screen name="about" />
      <Stack.Screen name="stories" />
      <Stack.Screen name="blog/index" />
      <Stack.Screen name="blog/[id]" />
      <Stack.Screen name="team/index" />
      <Stack.Screen name="team/[id]" />
      <Stack.Screen name="team/apply" />
      <Stack.Screen name="corporate/index" />
      <Stack.Screen name="corporate/apply" />
      <Stack.Screen name="legal/[slug]" />
    </Stack>
  );
}
