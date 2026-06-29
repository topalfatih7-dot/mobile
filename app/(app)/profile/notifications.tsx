import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ResponsiveCenter } from '@/components/layout/ResponsiveCenter';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { StackHeader } from '@/components/ui/StackHeader';
import { useApp } from '@/context/AppContext';
import { useResponsive } from '@/hooks/useResponsive';
import { formatNotificationTime } from '@/services/notifications';
import { colors, fonts, radius, spacing } from '@/constants/theme';

export default function NotificationsScreen() {
  const { notifications, syncing, refresh, markNotificationRead, markAllNotificationsRead } = useApp();
  const { horizontalPadding } = useResponsive();

  const onOpen = async (id: string, threadId?: string) => {
    await markNotificationRead(id);
    if (threadId) router.push(`/messages/${threadId}` as Href);
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <StackHeader subtitle="Mesajlar, hatırlatmalar ve güncellemeler" title="Bildirimler" />

      {notifications.some((item) => !item.read) ? (
        <Pressable onPress={() => void markAllNotificationsRead()} style={styles.markAll}>
          <Text style={styles.markAllText}>Tümünü okundu işaretle</Text>
        </Pressable>
      ) : null}

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl onRefresh={refresh} refreshing={syncing} tintColor={colors.brand[600]} />}
        showsVerticalScrollIndicator={false}>
        <ResponsiveCenter innerStyle={{ paddingHorizontal: horizontalPadding }}>
          {notifications.length > 0 ? (
            notifications.map((item) => (
              <Pressable key={item.id} onPress={() => void onOpen(item.id, item.threadId)}>
                <Card
                  padding={spacing.md}
                  style={[styles.card, !item.read && styles.cardUnread]}>
                  <View style={styles.row}>
                    <View style={[styles.icon, !item.read && styles.iconUnread]}>
                      <Ionicons
                        color={item.read ? colors.text.muted : colors.brand[600]}
                        name={item.type === 'chat' ? 'chatbubble' : 'notifications'}
                        size={18}
                      />
                    </View>
                    <View style={styles.body}>
                      <Text style={[styles.title, !item.read && styles.titleUnread]}>{item.title}</Text>
                      <Text numberOfLines={2} style={styles.message}>
                        {item.message}
                      </Text>
                      <Text style={styles.time}>{formatNotificationTime(item.createdAt)}</Text>
                    </View>
                  </View>
                </Card>
              </Pressable>
            ))
          ) : (
            <EmptyState
              subtitle="Koçunuzdan mesaj, hatırlatma veya sistem bildirimi geldiğinde burada görünür."
              title="Bildirim yok"
            />
          )}
        </ResponsiveCenter>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  markAll: {
    alignSelf: 'flex-end',
    marginRight: spacing.lg,
    marginBottom: spacing.sm,
  },
  markAllText: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.brand[600],
  },
  content: { paddingBottom: spacing.xxl },
  card: { marginBottom: spacing.sm },
  cardUnread: {
    borderColor: colors.brand[200],
    backgroundColor: colors.brand[50],
  },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  icon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.ink[50],
    marginRight: spacing.md,
  },
  iconUnread: { backgroundColor: colors.white },
  body: { flex: 1 },
  title: {
    fontFamily: fonts.display,
    fontSize: 15,
    color: colors.text.primary,
  },
  titleUnread: {
    fontFamily: fonts.displayExtra,
  },
  message: {
    fontFamily: fonts.regular,
    fontSize: 13.5,
    lineHeight: 19,
    color: colors.text.secondary,
    marginTop: 4,
  },
  time: {
    fontFamily: fonts.medium,
    fontSize: 11.5,
    color: colors.text.muted,
    marginTop: 6,
  },
});
