import { useEffect } from 'react';
import { router, type Href } from 'expo-router';

/**
 * MOBILE DIFF (2026-08-22): iOS’ta ödeme yönetimi yok — profil’e yönlendir.
 * LOCK: docs/mobile/screens/member/payments.md
 */
export default function PaymentsScreen() {
  useEffect(() => {
    router.replace('/(member)/profile' as Href);
  }, []);
  return null;
}
