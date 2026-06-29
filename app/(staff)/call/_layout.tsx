import { Stack } from 'expo-router';

export default function StaffCallLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="[type]/[sessionId]" />
    </Stack>
  );
}
