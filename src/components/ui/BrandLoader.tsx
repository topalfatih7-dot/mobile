import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { BrandMark } from '@/components/brand/BrandMark';
import { colors, fonts, spacing } from '@/theme';

type Size = 'xs' | 'sm' | 'md' | 'lg';
type Tone = 'brand' | 'onDark';

type Props = {
  size?: Size;
  tone?: Tone;
  /** Marka ikonu — xs’te kapalı (buton/satır). */
  mark?: boolean;
  label?: string;
};

const DIM: Record<Size, { outer: number; mark: number; thickness: number; inset: number }> = {
  xs: { outer: 22, mark: 0, thickness: 2, inset: 5 },
  sm: { outer: 36, mark: 16, thickness: 2.5, inset: 6 },
  md: { outer: 72, mark: 36, thickness: 3.5, inset: 8 },
  lg: { outer: 112, mark: 56, thickness: 4, inset: 8 },
};

/**
 * Web LoadingScreen parity — çift yönlü dönen halka + marka.
 * İşlem bitene kadar göster; içerik hazır olunca kaldır.
 */
export function BrandLoader({
  size = 'md',
  tone = 'brand',
  mark,
  label,
}: Props) {
  const spec = DIM[size];
  const showMark = mark ?? size !== 'xs';
  const onDark = tone === 'onDark';

  return (
    <View
      accessibilityLabel={label || 'Yükleniyor'}
      accessibilityRole="progressbar"
      accessibilityState={{ busy: true }}
      style={styles.wrap}>
      <View style={{ width: spec.outer, height: spec.outer, alignItems: 'center', justifyContent: 'center' }}>
        <SpinRing
          borderBottomColor="transparent"
          borderLeftColor="transparent"
          borderRightColor={onDark ? 'rgba(255,255,255,0.28)' : `${colors.brand[400]}66`}
          borderTopColor={onDark ? colors.white : colors.brand[500]}
          duration={1100}
          reverse={false}
          size={spec.outer}
          thickness={spec.thickness}
        />
        <SpinRing
          borderBottomColor={onDark ? colors.mint[400] : colors.sage[500]}
          borderLeftColor={onDark ? 'rgba(52,211,153,0.35)' : `${colors.sage[400]}66`}
          borderRightColor="transparent"
          borderTopColor="transparent"
          duration={1600}
          reverse
          size={spec.outer - spec.inset * 2}
          thickness={spec.thickness}
        />
        {showMark && spec.mark > 0 ? <BrandMark size={spec.mark} /> : null}
      </View>
      {label ? (
        <Text style={[styles.label, onDark && styles.labelOnDark]}>{label}</Text>
      ) : null}
    </View>
  );
}

function SpinRing({
  size,
  thickness,
  duration,
  reverse,
  borderTopColor,
  borderRightColor,
  borderBottomColor,
  borderLeftColor,
}: {
  size: number;
  thickness: number;
  duration: number;
  reverse?: boolean;
  borderTopColor: string;
  borderRightColor: string;
  borderBottomColor: string;
  borderLeftColor: string;
}) {
  const rot = useSharedValue(0);

  useEffect(() => {
    rot.value = 0;
    rot.value = withRepeat(
      withTiming(reverse ? -360 : 360, { duration, easing: Easing.linear }),
      -1,
      false,
    );
  }, [duration, reverse, rot]);

  const style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rot.value}deg` }],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: thickness,
          borderTopColor,
          borderRightColor,
          borderBottomColor,
          borderLeftColor,
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  label: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.cream[800],
    textAlign: 'center',
  },
  labelOnDark: {
    color: colors.white,
  },
});
