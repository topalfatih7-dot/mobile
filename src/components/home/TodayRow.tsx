import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { IconTile } from '@/components/ui/IconTile';
import type { TodayItem } from '@/data/dashboard';
import { colors, fonts, spacing } from '@/constants/theme';

export function TodayRow({ item, onToggle }: { item: TodayItem; onToggle?: (id: string) => void }) {
  return (
    <Card
      contentStyle={styles.row}
      onPress={() => onToggle?.(item.id)}
      padding={spacing.md}
      style={styles.card}>
      <IconTile gradient={item.gradient} icon={item.icon} size={46} />

      <View style={styles.body}>
        <Text numberOfLines={1} style={[styles.title, item.done && styles.titleDone]}>
          {item.title}
        </Text>
        <Text numberOfLines={1} style={styles.subtitle}>
          {item.subtitle}
        </Text>
      </View>

      <View style={styles.right}>
        <Text style={styles.time}>{item.time}</Text>
        <Ionicons
          color={item.done ? colors.success : colors.ink[300]}
          name={item.done ? 'checkmark-circle' : 'ellipse-outline'}
          size={22}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  body: {
    flex: 1,
    marginHorizontal: spacing.md,
  },
  title: {
    fontFamily: fonts.semibold,
    fontSize: 14.5,
    color: colors.text.primary,
  },
  titleDone: {
    color: colors.text.muted,
    textDecorationLine: 'line-through',
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 12.5,
    color: colors.text.secondary,
    marginTop: 2,
  },
  right: {
    alignItems: 'flex-end',
    gap: 6,
  },
  time: {
    fontFamily: fonts.semibold,
    fontSize: 12.5,
    color: colors.text.secondary,
  },
});
