import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandLogo } from '@/components/ui/BrandLogo';
import { colors, spacing } from '@/theme';

type Accent = 'member' | 'staff' | 'admin';

type Props = {
  onMenuPress: () => void;
  accent?: Accent;
  headerRight?: React.ReactNode;
};

/** Ana proje PanelMobileMenu sticky header — hamburger + logo + sağ slot */
export function PanelTopBar({ onMenuPress, headerRight }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { paddingTop: insets.top + 8 }]}>
      <View style={styles.left}>
        <Pressable
          accessibilityLabel="Menüyü aç"
          accessibilityRole="button"
          hitSlop={8}
          onPress={onMenuPress}
          style={({ pressed }) => [styles.menuBtn, pressed && styles.pressed]}>
          <Ionicons color={colors.cream[800]} name="menu" size={22} />
        </Pressable>
        <BrandLogo size="sm" variant="logo" />
      </View>
      <View style={styles.right}>{headerRight}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: 10,
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.cream[200],
    zIndex: 40,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
  right: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  menuBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.cream[200],
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  pressed: { opacity: 0.85, backgroundColor: colors.cream[50] },
});
