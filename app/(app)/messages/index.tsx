import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ResponsiveCenter } from '@/components/layout/ResponsiveCenter';
import { ConversationRow } from '@/components/messages/ConversationRow';
import { EmptyState } from '@/components/ui/EmptyState';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { useApp } from '@/context/AppContext';
import { useResponsive } from '@/hooks/useResponsive';
import { colors, fonts, radius, spacing } from '@/constants/theme';

export default function MessagesScreen() {
  const { conversations, syncing, refresh } = useApp();
  const { horizontalPadding } = useResponsive();

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <ScreenHeader
        actionIcon="create-outline"
        subtitle="Koçun ve diyetisyeninle iletişim"
        title="Mesajlar"
      />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl onRefresh={refresh} refreshing={syncing} tintColor={colors.brand[600]} />}
        showsVerticalScrollIndicator={false}>
        <ResponsiveCenter innerStyle={{ paddingHorizontal: horizontalPadding }}>
          <View style={styles.search}>
            <Ionicons color={colors.text.muted} name="search" size={18} />
            <Text style={styles.searchText}>Sohbetlerde ara</Text>
          </View>

          {conversations.length > 0 ? (
            conversations.map((item) => <ConversationRow item={item} key={item.id} />)
          ) : (
            <EmptyState
              subtitle="Atanmış koç veya diyetisyeninle mesajlaşmaya başladığında sohbetler burada görünür."
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
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    height: 50,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  searchText: {
    fontFamily: fonts.regular,
    fontSize: 14.5,
    color: colors.text.muted,
  },
});
