import { useEvent } from 'expo';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { BrandLoader } from '@/components/ui/BrandLoader';
import { getExerciseThumbUrl, invalidateExerciseVideoUrl } from '@/services/exerciseMedia';
import { colors, fonts, radius, spacing } from '@/theme';

type Props = {
  /** Signed HTTPS URL — yoksa placeholder. */
  url: string | null;
  videoPending?: boolean;
  /** Storage path / ref — poster + retry invalidate. */
  videoRef?: unknown;
  title?: string;
  /** Signed URL henüz çözülmedi. */
  loading?: boolean;
  emptyMessage?: string;
  style?: StyleProp<ViewStyle>;
  onRetry?: () => void;
};

/**
 * Native egzersiz oynatıcı (expo-video).
 * Overlay, signed URL + ilk kare gelene kadar kalır — siyah kare yok.
 */
export function VideoPlayer({
  url,
  videoPending = false,
  videoRef,
  title,
  loading = false,
  emptyMessage,
  style,
  onRetry,
}: Props) {
  const [loadError, setLoadError] = useState(false);
  const [hasFrame, setHasFrame] = useState(false);
  const poster = getExerciseThumbUrl(videoRef);

  const player = useVideoPlayer(null, (p) => {
    p.loop = true;
    p.muted = true;
  });

  const { status } = useEvent(player, 'statusChange', { status: player.status });

  useEffect(() => {
    setLoadError(false);
    setHasFrame(false);
    if (!url) return;

    let cancelled = false;
    void (async () => {
      try {
        await player.replaceAsync(url);
        if (cancelled) return;
        player.loop = true;
        player.muted = true;
        player.play();
      } catch {
        if (!cancelled) setLoadError(true);
      }
    })();

    return () => {
      cancelled = true;
      try {
        player.pause();
      } catch {
        /* unmount race */
      }
    };
  }, [url, player]);

  useEffect(() => {
    if (status === 'error') setLoadError(true);
  }, [status]);

  useEffect(() => {
    if (status !== 'readyToPlay' || hasFrame || loadError) return;
    const t = setTimeout(() => setHasFrame(true), 600);
    return () => clearTimeout(t);
  }, [status, hasFrame, loadError]);

  useEffect(() => {
    if (!url || hasFrame || loadError) return;
    const t = setTimeout(() => setHasFrame(true), 2800);
    return () => clearTimeout(t);
  }, [url, hasFrame, loadError]);

  const waiting = (loading || (Boolean(url) && !hasFrame)) && !loadError && !videoPending;

  if (videoPending) {
    return (
      <View style={[styles.frame, style]} accessibilityLabel={title || 'Video'}>
        {poster ? (
          <Image contentFit="cover" source={{ uri: poster }} style={StyleSheet.absoluteFill} />
        ) : null}
        <View style={styles.overlay}>
          <BrandLoader label="Video henüz yüklenmedi…" size="sm" tone="onDark" />
        </View>
      </View>
    );
  }

  if (loadError) {
    return (
      <View style={[styles.frame, style]}>
        <View style={styles.overlay}>
          <Ionicons color={colors.cream[800]} name="alert-circle-outline" size={28} />
          <Text style={styles.hint}>Video açılamadı</Text>
          <Pressable
            accessibilityLabel="Tekrar dene"
            accessibilityRole="button"
            onPress={() => {
              invalidateExerciseVideoUrl(videoRef);
              setLoadError(false);
              setHasFrame(false);
              onRetry?.();
            }}
            style={styles.retryBtn}>
            <Text style={styles.retryText}>Tekrar dene</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (!url && !loading) {
    return (
      <View style={[styles.frame, style]}>
        <View style={styles.overlay}>
          <Ionicons color={colors.cream[300]} name="videocam-off-outline" size={28} />
          <Text style={styles.hint}>{emptyMessage || 'Bu harekete henüz video eklenmemiş'}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.frame, style]} accessibilityLabel={title || 'Video'}>
      {poster ? (
        <Image contentFit="cover" source={{ uri: poster }} style={StyleSheet.absoluteFill} />
      ) : null}
      {url ? (
        <VideoView
          contentFit="contain"
          fullscreenOptions={{ enable: true }}
          nativeControls
          onFirstFrameRender={() => setHasFrame(true)}
          player={player}
          style={[styles.video, !hasFrame && styles.videoHidden]}
        />
      ) : null}
      {waiting ? (
        <Animated.View
          entering={FadeIn.duration(160)}
          exiting={FadeOut.duration(220)}
          pointerEvents="none"
          style={styles.overlay}>
          <BrandLoader label="Video yükleniyor…" size="md" tone="onDark" />
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.cream[900],
    alignItems: 'center',
    justifyContent: 'center',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  videoHidden: {
    opacity: 0,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(26,35,50,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  hint: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.white,
    textAlign: 'center',
    lineHeight: 18,
  },
  retryBtn: {
    marginTop: spacing.xs,
    minHeight: 44,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
  },
  retryText: {
    fontFamily: fonts.sansSemi,
    fontSize: 14,
    color: colors.brand[300],
  },
});
