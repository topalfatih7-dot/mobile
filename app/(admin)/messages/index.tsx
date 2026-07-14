import { StatusBar } from 'expo-status-bar';
import { useMemo } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import type { Href } from 'expo-router';

import { ConversationRow } from '@/components/messages/ConversationRow';
import { ResponsiveCenter } from '@/components/layout/ResponsiveCenter';
import { EmptyState } from '@/components/ui/EmptyState';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { useApp } from '@/context/AppContext';
import type { Conversation } from '@/data/messages';
import { useResponsive } from '@/hooks/useResponsive';
import { staffRoleLabel } from '@/utils/staffAccess';
import { colors, gradients, spacing } from '@/constants/theme';

function formatTime(iso: string | null | undefined) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
}

export default function AdminMessagesScreen() {
  const { adminStaffThreads, syncing, refresh } = useApp();
  const { horizontalPadding } = useResponsive();

  const items: Conversation[] = useMemo(
    () =>
      adminStaffThreads.map((t) => ({
        id: t.id,
        name: t.staffName || 'Personel',
        role: staffRoleLabel(t.staffRole),
        last: t.lastPreview || 'Henüz mesaj yok',
        time: formatTime(t.lastMessageAt),
        unread: t.adminUnread,
        online: false,
        gradient: gradients.violet,
      })),
    [adminStaffThreads],
  );

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <ScreenHeader subtitle="Personel ile iç iletişim" title="Personel Mesajları" />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl onRefresh={() => void refresh()} refreshing={syncing} tintColor={colors.brand[600]} />
        }
        showsVerticalScrollIndicator={false}>
        <ResponsiveCenter innerStyle={{ paddingHorizontal: horizontalPadding }}>
          {items.length > 0 ? (
            items.map((item) => (
              <ConversationRow href={`/(admin)/messages/${item.id}` as Href} item={item} key={item.id} />
            ))
          ) : (
            <EmptyState
              subtitle="Personel listesinden sohbetler otomatik oluşur."
              title="Henüz sohbet yok"
            />
          )}
        </ResponsiveCenter>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: spacing.xxl },
});
