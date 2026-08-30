import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { getExerciseThumbUrl } from '@/services/exerciseMedia';
import { colors, radius } from '@/theme';

export function ExerciseVideoThumbnail({
  videoUrl,
  size = 56,
  pending,
}: {
  videoUrl?: string | null;
  size?: number;
  pending?: boolean;
}) {
  const thumb = getExerciseThumbUrl(videoUrl);
  return (
    <View style={[styles.wrap, { width: size, height: size, borderRadius: radius.lg }]}>
      {thumb && !pending ? (
        <Image contentFit="cover" source={{ uri: thumb }} style={StyleSheet.absoluteFill} />
      ) : (
        <Ionicons
          color={colors.cream[800]}
          name={pending ? 'time-outline' : 'play-circle-outline'}
          size={size * 0.45}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.cream[100],
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
