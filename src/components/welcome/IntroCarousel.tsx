import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandMark } from '@/components/brand/BrandMark';
import { ResponsiveCenter } from '@/components/layout/ResponsiveCenter';
import { IntroSlide } from '@/components/welcome/IntroSlide';
import { WelcomeBackground } from '@/components/welcome/WelcomeBackground';
import { WelcomeFooter } from '@/components/welcome/WelcomeFooter';
import { WELCOME_SLIDES } from '@/data/welcomeSlides';
import { useResponsive } from '@/hooks/useResponsive';
import { colors, fonts, spacing } from '@/constants/theme';

type IntroCarouselProps = {
  onStart: () => void;
  onLogin: () => void;
};

export function IntroCarousel({ onStart, onLogin }: IntroCarouselProps) {
  const insets = useSafeAreaInsets();
  const { width: slideWidth } = useWindowDimensions();
  const { isLandscape, isTablet } = useResponsive();
  const scrollX = useSharedValue(0);
  const [index, setIndex] = useState(0);
  const [viewport, setViewport] = useState(0);
  const scrollRef = useRef<Animated.ScrollView>(null);

  const isLast = index === WELCOME_SLIDES.length - 1;

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollX.value = e.contentOffset.x;
    },
  });

  const onMomentumEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      setIndex(Math.round(e.nativeEvent.contentOffset.x / slideWidth));
    },
    [slideWidth],
  );

  const goTo = useCallback(
    (target: number) => {
      const clamped = Math.max(0, Math.min(target, WELCOME_SLIDES.length - 1));
      scrollRef.current?.scrollTo({ x: clamped * slideWidth, animated: true });
      setIndex(clamped);
    },
    [slideWidth],
  );

  useEffect(() => {
    if (viewport <= 0) return;
    scrollRef.current?.scrollTo({ x: index * slideWidth, animated: false });
  }, [slideWidth, viewport, index]);

  const onViewportLayout = useCallback((e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    if (h > 0) setViewport(h);
  }, []);

  const footerPad = isLandscape ? spacing.sm : spacing.md;
  const headerPad = isTablet ? spacing.xl : spacing.lg;

  return (
    <View style={styles.root}>
      <WelcomeBackground scrollWidth={slideWidth} scrollX={scrollX} />

      <View style={[styles.header, { paddingTop: insets.top + spacing.sm, paddingHorizontal: headerPad }]}>
        <View style={styles.brandRow}>
          <BrandMark size={isTablet ? 38 : 34} />
          <Text style={styles.brandName}>Yeni Form</Text>
        </View>

        <Pressable accessibilityRole="button" hitSlop={12} onPress={onStart} style={styles.skip}>
          <Text style={styles.skipText}>Atla</Text>
        </Pressable>
      </View>

      <View style={styles.scrollArea} onLayout={onViewportLayout}>
        {viewport > 0 ? (
          <>
            <Animated.ScrollView
              ref={scrollRef}
              bounces={false}
              horizontal
              key={`pager-${slideWidth}`}
              onMomentumScrollEnd={onMomentumEnd}
              onScroll={scrollHandler}
              pagingEnabled
              scrollEventThrottle={16}
              showsHorizontalScrollIndicator={false}
              style={styles.pager}>
              {WELCOME_SLIDES.map((slide, i) => (
                <IntroSlide
                  key={slide.id}
                  index={i}
                  isLandscape={isLandscape}
                  scrollX={scrollX}
                  slide={slide}
                  slideHeight={viewport}
                  slideWidth={slideWidth}
                />
              ))}
            </Animated.ScrollView>

            <Pressable
              accessibilityLabel="Önceki"
              accessibilityRole="button"
              disabled={index === 0}
              hitSlop={10}
              onPress={() => goTo(index - 1)}
              style={[
                styles.arrow,
                styles.arrowLeft,
                { top: viewport * (isLandscape ? 0.2 : 0.26), left: headerPad },
                index === 0 && styles.arrowDisabled,
              ]}>
              <Ionicons color={colors.white} name="chevron-back" size={24} />
            </Pressable>

            <Pressable
              accessibilityLabel="Sonraki"
              accessibilityRole="button"
              disabled={isLast}
              hitSlop={10}
              onPress={() => goTo(index + 1)}
              style={[
                styles.arrow,
                styles.arrowRight,
                { top: viewport * (isLandscape ? 0.2 : 0.26), right: headerPad },
                isLast && styles.arrowDisabled,
              ]}>
              <Ionicons color={colors.white} name="chevron-forward" size={24} />
            </Pressable>
          </>
        ) : null}
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + footerPad }]}>
        <ResponsiveCenter>
          <WelcomeFooter
            count={WELCOME_SLIDES.length}
            isLandscape={isLandscape}
            onLogin={onLogin}
            onRegister={onStart}
            scrollWidth={slideWidth}
            scrollX={scrollX}
          />
        </ResponsiveCenter>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.brand[600],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: spacing.sm,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  brandName: {
    fontFamily: fonts.displayExtra,
    fontSize: 18,
    color: colors.white,
  },
  skip: {
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  skipText: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.white,
  },
  scrollArea: {
    flex: 1,
    position: 'relative',
  },
  pager: {
    flex: 1,
  },
  arrow: {
    position: 'absolute',
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    zIndex: 20,
  },
  arrowLeft: {},
  arrowRight: {},
  arrowDisabled: {
    opacity: 0.32,
  },
  footer: {
    paddingHorizontal: 0,
  },
});
