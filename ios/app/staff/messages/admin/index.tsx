/**
 * Admin mesajları giriş — ensure thread then open.
 */
import { router, type Href } from 'expo-router';
import { useEffect } from 'react';

import { PanelScaffold } from '@/components/panel/PanelScaffold';
import { InlineSpinner } from '@/components/ui/InlineSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuth } from '@/context/AuthContext';
import { getOrCreateAdminStaffThread } from '@/services/adminStaffChat';

export default function StaffAdminMessagesIndex() {
  const { staff } = useAuth();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!staff?.id) return;
      const t = await getOrCreateAdminStaffThread({
        id: String(staff.id),
        name: String(staff.name || ''),
        role: String(staff.role || ''),
      });
      if (cancelled) return;
      if (t?.id) {
        router.replace(`/staff/messages/admin/${t.id}` as Href);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [staff]);

  if (!staff?.id) {
    return (
      <PanelScaffold showBack title="Admin Mesajları">
        <EmptyState title="Oturum bulunamadı." />
      </PanelScaffold>
    );
  }

  return (
    <PanelScaffold showBack title="Admin Mesajları">
      <InlineSpinner fill />
    </PanelScaffold>
  );
}
