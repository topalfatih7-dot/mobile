import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, fonts, radius, spacing } from '@/theme';

export function EmptyState({
  title,
  description,
  icon = 'folder-open-outline',
  iconSize = 56,
  iconBg = colors.brand[50],
  iconColor = colors.brand[500],
}: {
  title: string;
  description?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconSize?: number;
  iconBg?: string;
  iconColor?: string;
}) {
  return (
    <View style={styles.wrap}>
      <View
        style={[
          styles.icon,
          { width: iconSize, height: iconSize, backgroundColor: iconBg },
        ]}>
        <Ionicons color={iconColor} name={icon} size={28} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.desc}>{description}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.cream[200],
    gap: spacing.sm,
  },
  icon: {
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: {
    fontFamily: fonts.displayBold,
    fontSize: 18,
    color: colors.cream[900],
    textAlign: 'center',
  },
  desc: {
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 21,
    color: colors.cream[800],
    opacity: 0.7,
    textAlign: 'center',
  },
});
