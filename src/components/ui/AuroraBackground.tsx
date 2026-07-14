import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, gradients } from '@/constants/theme';

/** Lumina aurora mist — auth / welcome atmosfer. */
export function AuroraBackground({ children, deep = false }: { children?: ReactNode; deep?: boolean }) {
  return (
    <View style={styles.root}>
      <LinearGradient
        colors={deep ? gradients.auroraDeep : gradients.aurora}
        end={{ x: 1, y: 1 }}
        start={{ x: 0, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.glow, styles.glowTeal]} />
      <View style={[styles.glow, styles.glowChampagne]} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  glow: {
    position: 'absolute',
    borderRadius: 999,
  },
  glowTeal: {
    width: 280,
    height: 280,
    top: -80,
    right: -60,
    backgroundColor: 'rgba(20, 184, 166, 0.22)',
  },
  glowChampagne: {
    width: 320,
    height: 320,
    bottom: -100,
    left: -80,
    backgroundColor: 'rgba(196, 165, 116, 0.18)',
  },
});
