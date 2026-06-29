import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import type { ComponentProps } from 'react';

import { gradients, radius, type Gradient } from '@/constants/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

type IconTileProps = {
  icon: IconName;
  gradient?: Gradient;
  size?: number;
  iconSize?: number;
  cornerRadius?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
};

/** Gradient dolgulu, yuvarlatılmış kare ikon kutusu. */
export function IconTile({
  icon,
  gradient = gradients.brand,
  size = 52,
  iconSize,
  cornerRadius,
  color = '#ffffff',
  style,
}: IconTileProps) {
  return (
    <LinearGradient
      colors={gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.tile,
        { width: size, height: size, borderRadius: cornerRadius ?? size * 0.32 },
        style,
      ]}>
      <Ionicons color={color} name={icon} size={iconSize ?? size * 0.5} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  tile: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
  },
});
