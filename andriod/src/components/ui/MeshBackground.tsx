import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View, type ViewProps } from 'react-native';

import { colors } from '@/theme';

/** docs/mobile/02-design-system — brand/sage/warm mesh (sadeleştirilmiş) */
export function MeshBackground({ children, style, ...rest }: ViewProps) {
  return (
    <View style={[styles.root, style]} {...rest}>
      <LinearGradient
        colors={[colors.brand[50], colors.cream[50], colors.sage[50]]}
        end={{ x: 1, y: 1 }}
        start={{ x: 0, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.blob, styles.blobBrand]} />
      <View style={[styles.blob, styles.blobSage]} />
      <View style={[styles.blob, styles.blobWarm]} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, overflow: 'hidden' },
  blob: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.35,
  },
  blobBrand: {
    width: 220,
    height: 220,
    top: -40,
    right: -60,
    backgroundColor: colors.brand[200],
  },
  blobSage: {
    width: 180,
    height: 180,
    bottom: 80,
    left: -50,
    backgroundColor: colors.sage[200],
  },
  blobWarm: {
    width: 140,
    height: 140,
    bottom: -20,
    right: 40,
    backgroundColor: colors.warm[200],
  },
});
