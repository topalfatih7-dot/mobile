import { Image } from 'expo-image';
import type { StyleProp, ImageStyle } from 'react-native';

import { BRAND } from '@/config/brand';

type LogoProps = {
  width?: number;
  height?: number;
  style?: StyleProp<ImageStyle>;
};

/** Yatay marka logosu (ikon + "Yeni Form" yazısı). */
export function Logo({ width = 168, height = 44, style }: LogoProps) {
  return (
    <Image
      accessibilityLabel={BRAND.name}
      contentFit="contain"
      source={BRAND.assets.logo}
      style={[{ width, height }, style]}
      transition={200}
    />
  );
}
