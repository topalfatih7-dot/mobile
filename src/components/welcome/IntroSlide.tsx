import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';

import type { WelcomeSlide } from '@/data/welcomeSlides';
import { colors, fonts, radius, spacing } from '@/constants/theme';

const BUBBLE_SIZE = 42;

type IntroSlideProps = {
  slide: WelcomeSlide;
  index: number;
  scrollX: SharedValue<number>;
  slideHeight: number;
  slideWidth: number;
  isLandscape?: boolean;
};

/** Hero merkezine göre baloncuk konumları — yüzde tabanlı mutlak konum kaymasını önler. */
type BubbleOffset = {
  xRatio: number;
  yRatio: number;
  factor: number;
};

const BUBBLE_OFFSETS: BubbleOffset[] = [
  { xRatio: -0.36, yRatio: -0.34, factor: 26 },
  { xRatio: 0.38, yRatio: -0.28, factor: -30 },
  { xRatio: -0.18, yRatio: 0.34, factor: 18 },
];

export function IntroSlide({
  slide,
  index,
  scrollX,
  slideHeight,
  slideWidth,
  isLandscape = false,
}: IntroSlideProps) {
  // Kompakt hero — metin bloğunu yukarı çeker (web/mobil)
  const heroHeight = Math.min(slideHeight * (isLandscape ? 0.55 : 0.38), isLandscape ? 200 : 220);
  const heroWidth = Math.min(slideWidth - spacing.lg * 2, isLandscape ? 360 : 300);
  const ring = Math.min(heroHeight * 0.88, isLandscape ? 170 : 188);
  const core = ring * 0.7;
  const accent = slide.gradient[0];

  const inputRange = [(index - 1) * slideWidth, index * slideWidth, (index + 1) * slideWidth];

  const heroStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollX.value, inputRange, [0, 1, 0], Extrapolation.CLAMP),
    transform: [
      { scale: interpolate(scrollX.value, inputRange, [0.6, 1, 0.6], Extrapolation.CLAMP) },
    ],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollX.value, inputRange, [0, 1, 0], Extrapolation.CLAMP),
    transform: [
      { translateY: interpolate(scrollX.value, inputRange, [18, 0, 18], Extrapolation.CLAMP) },
    ],
  }));

  return (
    <View style={[styles.slide, { width: slideWidth, height: slideHeight }]}>
      <View style={[styles.hero, { height: heroHeight, width: heroWidth }]}>
        <Animated.View style={[styles.center, heroStyle]}>
          <View
            style={[
              styles.ring,
              { width: ring, height: ring, borderRadius: ring / 2 },
            ]}>
            <View
              style={[
                styles.core,
                { width: core, height: core, borderRadius: core / 2 },
              ]}>
              <Ionicons color={accent} name={slide.icon} size={core * 0.46} />
            </View>
          </View>
        </Animated.View>

        {slide.bubbles.map((bubble, i) => {
          const offset = BUBBLE_OFFSETS[i % BUBBLE_OFFSETS.length];
          return (
            <Bubble
              key={`${slide.id}-${bubble}`}
              accent={accent}
              heroHeight={heroHeight}
              heroWidth={heroWidth}
              icon={bubble}
              index={index}
              offset={offset}
              scrollX={scrollX}
              slideWidth={slideWidth}
            />
          );
        })}
      </View>

      <Animated.View style={[styles.textZone, textStyle]}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{slide.badge}</Text>
        </View>

        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.subtitle}>{slide.subtitle}</Text>

        <View style={styles.highlights}>
          {slide.highlights.map((item) => (
            <View key={item.label} style={styles.pill}>
              <Ionicons color={colors.white} name={item.icon} size={15} />
              <Text style={styles.pillText}>{item.label}</Text>
            </View>
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

function Bubble({
  icon,
  accent,
  index,
  scrollX,
  offset,
  heroWidth,
  heroHeight,
  slideWidth,
}: {
  icon: WelcomeSlide['bubbles'][number];
  accent: string;
  index: number;
  scrollX: SharedValue<number>;
  offset: BubbleOffset;
  heroWidth: number;
  heroHeight: number;
  slideWidth: number;
}) {
  const inputRange = [(index - 1) * slideWidth, index * slideWidth, (index + 1) * slideWidth];
  const left = heroWidth / 2 + offset.xRatio * heroWidth - BUBBLE_SIZE / 2;
  const top = heroHeight / 2 + offset.yRatio * heroHeight - BUBBLE_SIZE / 2;

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(scrollX.value, inputRange, [0, 1, 0], Extrapolation.CLAMP),
    transform: [
      {
        translateX: interpolate(
          scrollX.value,
          inputRange,
          [offset.factor, 0, -offset.factor],
          Extrapolation.CLAMP,
        ),
      },
      {
        translateY: interpolate(
          scrollX.value,
          inputRange,
          [offset.factor * 0.6, 0, -offset.factor * 0.6],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  return (
    <Animated.View style={[styles.bubble, { left, top }, style]}>
      <Ionicons color={accent} name={icon} size={18} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  slide: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    justifyContent: 'flex-start',
  },
  hero: {
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: spacing.md,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.32)',
  },
  core: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    shadowColor: '#06202e',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.22,
    shadowRadius: 28,
    elevation: 14,
  },
  bubble: {
    position: 'absolute',
    width: BUBBLE_SIZE,
    height: BUBBLE_SIZE,
    borderRadius: BUBBLE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    shadowColor: '#06202e',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 8,
  },
  textZone: {
    alignItems: 'center',
    paddingTop: 0,
    flexGrow: 0,
  },
  badge: {
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    marginBottom: spacing.sm,
  },
  badgeText: {
    fontFamily: fonts.semibold,
    fontSize: 11.5,
    letterSpacing: 1.4,
    color: colors.white,
  },
  title: {
    fontFamily: fonts.displayExtra,
    fontSize: 28,
    lineHeight: 34,
    textAlign: 'center',
    color: colors.white,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    color: 'rgba(255,255,255,0.9)',
    maxWidth: 340,
  },
  highlights: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.26)',
  },
  pillText: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.white,
  },
});
