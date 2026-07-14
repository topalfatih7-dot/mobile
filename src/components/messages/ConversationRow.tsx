import { router, type Href } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import type { Conversation } from '@/data/messages';
import { colors, fonts, spacing } from '@/constants/theme';

export function ConversationRow({
  item,
  href,
}: {
  item: Conversation;
  staffMode?: boolean;
  href?: Href;
}) {
  const hasUnread = item.unread > 0;

  return (
    <Card
      contentStyle={styles.row}
      onPress={() => router.push((href || `/messages/${item.id}`) as Href)}
      padding={spacing.md}
      style={styles.card}>
      <Avatar gradient={item.gradient} name={item.name} online={item.online} size={54} />

      <View style={styles.body}>
        <Text numberOfLines={1} style={styles.name}>
          {item.name}
        </Text>
        <Text style={styles.role}>{item.role}</Text>
        <Text numberOfLines={1} style={[styles.last, hasUnread && styles.lastUnread]}>
          {item.last}
        </Text>
      </View>

      <View style={styles.right}>
        <Text style={[styles.time, hasUnread && styles.timeUnread]}>{item.time}</Text>
        {hasUnread ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{item.unread}</Text>
          </View>
        ) : (
          <View style={styles.badgePlaceholder} />
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  body: {
    flex: 1,
    marginHorizontal: spacing.md,
  },
  name: {
    fontFamily: fonts.display,
    fontSize: 15.5,
    color: colors.text.primary,
  },
  role: {
    fontFamily: fonts.semibold,
    fontSize: 11.5,
    color: colors.brand[500],
    marginTop: 1,
    marginBottom: 3,
  },
  last: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.text.secondary,
  },
  lastUnread: {
    fontFamily: fonts.medium,
    color: colors.text.primary,
  },
  right: {
    alignItems: 'flex-end',
    gap: 8,
    alignSelf: 'flex-start',
  },
  time: {
    fontFamily: fonts.medium,
    fontSize: 11.5,
    color: colors.text.muted,
  },
  timeUnread: {
    color: colors.brand[600],
    fontFamily: fonts.semibold,
  },
  badge: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.coral[500],
  },
  badgeText: {
    fontFamily: fonts.bold,
    fontSize: 11.5,
    color: colors.white,
  },
  badgePlaceholder: {
    height: 22,
  },
});
