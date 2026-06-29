import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts, gradients, type Gradient } from '@/constants/theme';

type AvatarProps = {
  name?: string;
  uri?: string;
  size?: number;
  gradient?: Gradient;
  online?: boolean;
  ring?: boolean;
};

function initialsOf(name?: string) {
  if (!name) return '?';
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function Avatar({ name, uri, size = 48, gradient = gradients.brand, online, ring }: AvatarProps) {
  const dotSize = Math.max(10, size * 0.28);

  return (
    <View style={{ width: size, height: size }}>
      <View
        style={[
          styles.frame,
          { width: size, height: size, borderRadius: size / 2 },
          ring && styles.ring,
        ]}>
        {uri ? (
          <Image source={uri} style={styles.image} contentFit="cover" transition={200} />
        ) : (
          <LinearGradient
            colors={gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.fill}>
            <Text style={[styles.initials, { fontSize: size * 0.36 }]}>{initialsOf(name)}</Text>
          </LinearGradient>
        )}
      </View>

      {online ? (
        <View
          style={[
            styles.dot,
            { width: dotSize, height: dotSize, borderRadius: dotSize / 2 },
          ]}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    overflow: 'hidden',
    backgroundColor: colors.ink[100],
  },
  ring: {
    borderWidth: 2.5,
    borderColor: colors.white,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  fill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontFamily: fonts.display,
    color: colors.white,
  },
  dot: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.white,
  },
});
