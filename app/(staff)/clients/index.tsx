import { router, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { ResponsiveCenter } from '@/components/layout/ResponsiveCenter';
import { StaffClientCard } from '@/components/staff/StaffClientCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { useStaffDashboard } from '@/hooks/useStaffDashboard';
import { useResponsive } from '@/hooks/useResponsive';
import { colors, spacing } from '@/constants/theme';

export default function StaffClientsScreen() {
  const { clients, syncing, refresh } = useStaffDashboard();
  const { horizontalPadding } = useResponsive();

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <ScreenHeader subtitle={`${clients.length} atanmış danışan`} title="Danışanlarım" />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl onRefresh={refresh} refreshing={syncing} tintColor={colors.brand[600]} />}
        showsVerticalScrollIndicator={false}>
        <ResponsiveCenter innerStyle={{ paddingHorizontal: horizontalPadding }}>
          {clients.length > 0 ? (
            clients.map((client) => (
              <StaffClientCard
                client={client}
                key={client.id}
                onPress={() => router.push(`/(staff)/clients/${client.id}/health` as Href)}
              />
            ))
          ) : (
            <EmptyState
              subtitle="Size atanmış aktif ücretli danışan olduğunda burada görünür."
              title="Henüz danışan yok"
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
    backgroundColor: colors.canvas,
  },
  content: {
    paddingBottom: spacing.xxl,
  },
});
