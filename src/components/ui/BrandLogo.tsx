import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts, spacing } from '@/theme';

type Props = {
  size?: 'sm' | 'md' | 'lg';
  showWordmark?: boolean;
  /** Tam logo görseli (brand-logo.png) — panel topbar/drawer */
  variant?: 'mark' | 'logo';
};

const MARK_SIZES = { sm: 28, md: 40, lg: 56 };
const LOGO_HEIGHT = { sm: 28, md: 36, lg: 48 };
const LOGO_WIDTH = { sm: 108, md: 140, lg: 180 };

/** B-component-map BrandLogo — assets/brand */
export function BrandLogo({
  size = 'md',
  showWordmark = true,
  variant = 'mark',
}: Props) {
  if (variant === 'logo') {
    const h = LOGO_HEIGHT[size];
    const w = LOGO_WIDTH[size];
    return (
      <Image
        accessibilityLabel="Yeni Form"
        contentFit="contain"
        source={require('../../../assets/brand/brand-logo.png')}
        style={{ width: w, height: h }}
      />
    );
  }

  const dim = MARK_SIZES[size];
  return (
    <View style={styles.row} accessibilityRole="image" accessibilityLabel="Yeni Form">
      <Image
        contentFit="contain"
        source={require('../../../assets/brand/brand-mark.png')}
        style={{ width: dim, height: dim }}
      />
      {showWordmark ? (
        <Text style={[styles.word, size === 'lg' && styles.wordLg]}>Yeni Form</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  word: {
    fontFamily: fonts.displayBold,
    fontSize: 18,
    color: colors.cream[900],
  },
  wordLg: { fontSize: 26 },
});
