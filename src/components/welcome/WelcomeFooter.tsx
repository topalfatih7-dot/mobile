import { StyleSheet, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';

import { AuthLegalNote } from '@/components/auth/AuthLegalNote';
import { Button } from '@/components/ui/Button';
import { colors, spacing } from '@/constants/theme';

type WelcomeFooterProps = {
  scrollX: SharedValue<number>;
  scrollWidth: number;
  count: number;
  isLandscape?: boolean;
  onRegister: () => void;
  onLogin: () => void;
};

function Dot({
  index,
  scrollX,
  scrollWidth,
}: {
  index: number;
  scrollX: SharedValue<number>;
  scrollWidth: number;
}) {
  const style = useAnimatedStyle(() => {
    const input = [(index - 1) * scrollWidth, index * scrollWidth, (index + 1) * scrollWidth];
    return {
      width: interpolate(scrollX.value, input, [8, 26, 8], Extrapolation.CLAMP),
      opacity: interpolate(scrollX.value, input, [0.4, 1, 0.4], Extrapolation.CLAMP),
    };
  });

  return <Animated.View style={[styles.dot, style]} />;
}

export function WelcomeFooter({
  scrollX,
  scrollWidth,
  count,
  isLandscape = false,
  onRegister,
  onLogin,
}: WelcomeFooterProps) {
  return (
    <View style={[styles.wrap, isLandscape && styles.wrapLandscape]}>
      <View style={styles.dots}>
        {Array.from({ length: count }).map((_, i) => (
          <Dot key={i} index={i} scrollWidth={scrollWidth} scrollX={scrollX} />
        ))}
      </View>

      <View style={[styles.actions, isLandscape && styles.actionsLandscape]}>
        <Button
          label="Giriş Yap"
          onPress={onLogin}
          size={isLandscape ? 'md' : 'lg'}
          style={isLandscape ? styles.actionHalf : undefined}
        />
        <Button
          label="Kaydol"
          onPress={onRegister}
          size={isLandscape ? 'md' : 'lg'}
          style={isLandscape ? styles.actionHalf : styles.secondary}
          variant="glass"
        />
      </View>

      {!isLandscape ? <AuthLegalNote variant="onDark" /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  wrapLandscape: {
    paddingTop: spacing.sm,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  dot: {
    height: 8,
    borderRadius: 999,
    backgroundColor: colors.white,
  },
  actions: {
    gap: spacing.sm,
  },
  actionsLandscape: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionHalf: {
    flex: 1,
  },
  secondary: {
    marginTop: spacing.sm,
  },
});
