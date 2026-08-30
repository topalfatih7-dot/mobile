import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { useScaledTheme } from '@/hooks/useScaledTheme';
import { colors, fonts, spacing } from '@/theme';

type Props = {
  size?: 'sm' | 'md' | 'lg';
  showWordmark?: boolean;
  /** Tam logo görseli (brand-logo.png) — panel topbar/drawer */
  variant?: 'mark' | 'logo';
};

const MARK_SIZES = { sm: 28, md: 40, lg: 56 };
/** Web header: 240×63 (`yeniform.com/brand-logo.png`) */
const LOGO_HEIGHT = { sm: 28, md: 36, lg: 56 };
const LOGO_WIDTH = { sm: 108, md: 140, lg: 216 };

/** B-component-map BrandLogo — assets/brand */
export function BrandLogo({
  size = 'md',
  showWordmark = true,
  variant = 'mark',
}: Props) {
  const t = useScaledTheme();
  if (variant === 'logo') {
    const h = t.ms(LOGO_HEIGHT[size]);
    const w = t.ms(LOGO_WIDTH[size]);
    return (
      <Image
        accessibilityLabel="Yeni Form"
        contentFit="contain"
        source={require('../../../assets/brand/brand-logo.png')}
        style={{ width: w, height: h, maxWidth: '100%' }}
      />
    );
  }

  const dim = t.ms(MARK_SIZES[size]);
  return (
    <View style={styles.row} accessibilityRole="image" accessibilityLabel="Yeni Form">
      <Image
        contentFit="contain"
        source={require('../../../assets/brand/brand-mark.png')}
        style={{ width: dim, height: dim }}
      />
      {showWordmark ? (
        <Text
          numberOfLines={1}
          style={[
            styles.word,
            size === 'lg' && styles.wordLg,
            { fontSize: size === 'lg' ? t.type.xl : t.type.lg, flexShrink: 1 },
          ]}>
          Yeni Form
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexShrink: 1 },
  word: {
    fontFamily: fonts.displayBold,
    fontSize: 18,
    color: colors.cream[900],
  },
  wordLg: { fontSize: 26 },
});
