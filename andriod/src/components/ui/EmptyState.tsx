import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useScaledTheme } from '@/hooks/useScaledTheme';
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
  const t = useScaledTheme();
  const box = t.ms(iconSize);
  return (
    <View style={styles.wrap}>
      <View
        style={[
          styles.icon,
          { width: box, height: box, backgroundColor: iconBg },
        ]}>
        <Ionicons color={iconColor} name={icon} size={t.ms(28)} />
      </View>
      <Text style={[styles.title, { fontSize: t.type.lg }]}>{title}</Text>
      {description ? (
        <Text style={[styles.desc, { fontSize: t.ms(14), lineHeight: t.ms(21) }]}>{description}</Text>
      ) : null}
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
