import { useEvent } from 'expo';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { getExerciseThumbUrl, invalidateExerciseVideoUrl } from '@/services/exerciseMedia';
import { colors, fonts, radius, spacing } from '@/theme';

type Props = {
  /** Signed HTTPS URL — yoksa placeholder. */
  url: string | null;
  videoPending?: boolean;
  /** Storage path / ref — poster + retry invalidate. */
  videoRef?: unknown;
  title?: string;
  loading?: boolean;
  emptyMessage?: string;
  style?: StyleProp<ViewStyle>;
  onRetry?: () => void;
};

/**
 * Native egzersiz oynatıcı (expo-video).
 * Web parity: sessiz + loop + otomatik; poster = public webp thumb.
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
  const poster = getExerciseThumbUrl(videoRef);

  const player = useVideoPlayer(null, (p) => {
    p.loop = true;
    p.muted = true;
  });

  const { status } = useEvent(player, 'statusChange', { status: player.status });

  useEffect(() => {
    setLoadError(false);
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

  if (videoPending) {
    return (
      <View style={[styles.frame, style]} accessibilityLabel={title || 'Video'}>
        {poster ? (
          <Image contentFit="cover" source={{ uri: poster }} style={StyleSheet.absoluteFill} />
        ) : null}
        <View style={styles.overlay}>
          <ActivityIndicator color={colors.brand[600]} />
          <Text style={styles.hint}>Video henüz yüklenmedi…</Text>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.frame, style]}>
        {poster ? (
          <Image contentFit="cover" source={{ uri: poster }} style={StyleSheet.absoluteFill} />
        ) : null}
        <View style={styles.overlay}>
          <ActivityIndicator color={colors.brand[600]} />
          <Text style={styles.hint}>Video yükleniyor…</Text>
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
              onRetry?.();
            }}
            style={styles.retryBtn}>
            <Text style={styles.retryText}>Tekrar dene</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (!url) {
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
      <VideoView
        contentFit="contain"
        fullscreenOptions={{ enable: true }}
        nativeControls
        player={player}
        style={styles.video}
      />
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
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(26,35,50,0.55)',
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
