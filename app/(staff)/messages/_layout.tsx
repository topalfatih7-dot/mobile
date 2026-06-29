import { Stack } from 'expo-router';

export default function StaffMessagesLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[threadId]" />
    </Stack>
  );
}
