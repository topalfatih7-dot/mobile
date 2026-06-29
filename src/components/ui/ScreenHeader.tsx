import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fonts, spacing } from '@/constants/theme';
import type { IoniconName } from '@/types';

type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
  actionIcon?: IoniconName;
  onActionPress?: () => void;
};

/** Sekme ekranları için sade üst başlık (güvenli alan dahil). */
export function ScreenHeader({ title, subtitle, actionIcon, onActionPress }: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrap, { paddingTop: insets.top + spacing.md }]}>
      <View style={styles.flex}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>

      {actionIcon ? (
        <Pressable accessibilityRole="button" hitSlop={8} onPress={onActionPress} style={styles.action}>
          <Ionicons color={colors.brand[600]} name={actionIcon} size={20} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  flex: {
    flex: 1,
  },
  title: {
    fontFamily: fonts.displayExtra,
    fontSize: 27,
    color: colors.text.primary,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: 3,
  },
  action: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
