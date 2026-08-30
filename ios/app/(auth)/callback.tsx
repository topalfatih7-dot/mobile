import { Redirect } from 'expo-router';

/** Deep link tek giriş: app/auth/callback.tsx */
export default function AuthCallbackRedirect() {
  return <Redirect href="/auth/callback" />;
}
