import { Stack } from 'expo-router';

export default function HealthTestLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[sectionId]" />
      <Stack.Screen name="finish" />
    </Stack>
  );
}
