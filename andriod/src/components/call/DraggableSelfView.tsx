import { useEffect, useMemo, type ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';

import { clamp } from '@/theme/scale';

type Props = {
  width: number;
  height: number;
  stageWidth: number;
  stageHeight: number;
  padding?: number;
  style?: ViewStyle;
  children: ReactNode;
};

export function selfViewPipSize(opts: {
  screenWidth: number;
  screenHeight: number;
  isCompact: boolean;
  ss: (n: number, factor?: number) => number;
}) {
  const shortest = Math.min(opts.screenWidth, opts.screenHeight);
  const isTablet = shortest >= 768;
  const minW = opts.isCompact ? 84 : 96;
  const maxW = isTablet
    ? 168
    : opts.isCompact
      ? Math.round(opts.screenWidth * 0.34)
      : Math.round(opts.screenWidth * 0.3);
  const width = clamp(Math.round(opts.ss(110)), minW, maxW);
  const height = Math.round(width * (150 / 110));
  return { width, height };
}

/**
 * Local self-view — drag within the remote stage, clamped so it never
 * covers chrome or leaves the screen. Default: bottom-right.
 */
export function DraggableSelfView({
  width,
  height,
  stageWidth,
  stageHeight,
  padding = 10,
  style,
  children,
}: Props) {
  const x = useSharedValue(padding);
  const y = useSharedValue(padding);
  const startX = useSharedValue(padding);
  const startY = useSharedValue(padding);
  const minX = useSharedValue(padding);
  const minY = useSharedValue(padding);
  const maxX = useSharedValue(padding);
  const maxY = useSharedValue(padding);
  const placed = useSharedValue(false);

  useEffect(() => {
    if (stageWidth < width + padding * 2 || stageHeight < height + padding * 2) {
      return;
    }
    const nextMinX = padding;
    const nextMinY = padding;
    const nextMaxX = Math.max(nextMinX, stageWidth - width - padding);
    const nextMaxY = Math.max(nextMinY, stageHeight - height - padding);
    minX.value = nextMinX;
    minY.value = nextMinY;
    maxX.value = nextMaxX;
    maxY.value = nextMaxY;
    if (!placed.value) {
      x.value = nextMaxX;
      y.value = nextMaxY;
      placed.value = true;
      return;
    }
    x.value = clamp(x.value, nextMinX, nextMaxX);
    y.value = clamp(y.value, nextMinY, nextMaxY);
  }, [
    stageWidth,
    stageHeight,
    width,
    height,
    padding,
    maxX,
    maxY,
    minX,
    minY,
    placed,
    x,
    y,
  ]);

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .minDistance(4)
        .activeOffsetX([-8, 8])
        .activeOffsetY([-8, 8])
        .onStart(() => {
          startX.value = x.value;
          startY.value = y.value;
        })
        .onUpdate((event) => {
          const nextX = startX.value + event.translationX;
          const nextY = startY.value + event.translationY;
          x.value = Math.min(maxX.value, Math.max(minX.value, nextX));
          y.value = Math.min(maxY.value, Math.max(minY.value, nextY));
        }),
    [maxX, maxY, minX, minY, startX, startY, x, y],
  );

  const anim = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }, { translateY: y.value }],
  }));

  if (stageWidth <= 0 || stageHeight <= 0) return null;

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        accessibilityHint="Sürükleyerek konumunu değiştirin"
        accessibilityLabel="Kendi görüntünüz"
        style={[
          styles.pip,
          { width, height },
          style,
          anim,
        ]}>
        {children}
        <View pointerEvents="box-only" style={styles.dragShield} />
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  pip: {
    position: 'absolute',
    left: 0,
    top: 0,
    zIndex: 5,
    overflow: 'hidden',
  },
  dragShield: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
});
