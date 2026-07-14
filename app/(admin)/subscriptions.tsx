import { router, type Href } from 'expo-router';
import { useEffect } from 'react';

/** Web stub parity — abonelikler → ödemeler. */
export default function AdminSubscriptionsScreen() {
  useEffect(() => {
    router.replace('/(admin)/payments' as Href);
  }, []);

  return null;
}
