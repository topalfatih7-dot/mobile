import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { BRAND } from '@/config/brand';
import { glow } from '@/constants/theme';

type BrandMarkProps = {
  size?: number;
  /** Marka renginde yumuşak parlama ekler. */
  glowing?: boolean;
};

/** Kare marka ikonu (gradient "NF"). */
export function BrandMark({ size = 56, glowing = false }: BrandMarkProps) {
  return (
    <View
      style={[
        styles.wrap,
        { width: size, height: size, borderRadius: size * 0.28 },
        glowing && glow('#2d8fc4', 0.4),
      ]}>
      <Image
        accessibilityLabel={BRAND.name}
        contentFit="contain"
        source={BRAND.assets.mark}
        style={{ width: size, height: size, borderRadius: size * 0.28 }}
        transition={200}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
