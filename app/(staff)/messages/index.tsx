import { StatusBar } from 'expo-status-bar';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { ConversationRow } from '@/components/messages/ConversationRow';
import { ResponsiveCenter } from '@/components/layout/ResponsiveCenter';
import { EmptyState } from '@/components/ui/EmptyState';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { useStaffDashboard } from '@/hooks/useStaffDashboard';
import { useResponsive } from '@/hooks/useResponsive';
import { colors, spacing } from '@/constants/theme';

export default function StaffMessagesScreen() {
  const { inbox, syncing, refresh } = useStaffDashboard();
  const { horizontalPadding } = useResponsive();

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <ScreenHeader subtitle="Danışanlarınızla mesajlaşın" title="Mesajlar" />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl onRefresh={refresh} refreshing={syncing} tintColor={colors.brand[600]} />}
        showsVerticalScrollIndicator={false}>
        <ResponsiveCenter innerStyle={{ paddingHorizontal: horizontalPadding }}>
          {inbox.length > 0 ? (
            inbox.map((item) => <ConversationRow item={item} key={item.id} />)
          ) : (
            <EmptyState
              subtitle="Danışanlarınızla mesajlaşmaya başladığınızda sohbetler burada görünür."
              title="Henüz mesaj yok"
            />
          )}
        </ResponsiveCenter>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingBottom: spacing.xxl,
  },
});
