import { Redirect, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';

/**
 * OAuth / magic-link deep link hedefi: `yeniform://auth/callback` veya `exp://…/--/auth/callback`
 * Mevcut iş mantığı `(auth)/callback` içinde — buradan forward edilir.
 */
export default function AuthCallbackDeepLink() {
  const params = useLocalSearchParams();
  const qs = useMemo(() => {
    const search = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (typeof value === 'string') search.set(key, value);
      else if (Array.isArray(value) && value[0]) search.set(key, value[0]);
    });
    const s = search.toString();
    return s ? `?${s}` : '';
  }, [params]);

  return <Redirect href={`/(auth)/callback${qs}`} />;
}
