import { ActivityIndicator, Modal, StyleSheet, Text, View } from 'react-native';

import { MeshBackground } from '@/components/ui/MeshBackground';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { BrandMark } from '@/components/brand/BrandMark';
import { colors, fonts, spacing } from '@/theme';

type Props = {
  label?: string;
  /** Tam ekran (auth boot) — varsayılan */
  fullScreen?: boolean;
  /** Modal overlay (blur arka plan) */
  overlay?: boolean;
};

/**
 * Ana proje LoadingScreen — logo + spinner.
 * fullScreen: auth hydrate; overlay: yavaş işlem maskesi.
 */
export function LoadingScreen({
  label = 'Yükleniyor…',
  fullScreen = true,
  overlay = false,
}: Props) {
  const body = (
    <View style={styles.center}>
      {overlay ? <BrandMark size={56} /> : <BrandLogo size="lg" variant="logo" />}
      <ActivityIndicator color={colors.brand[600]} style={styles.spinner} />
      <Text style={styles.label}>{label}</Text>
    </View>
  );

  if (overlay) {
    return (
      <Modal animationType="fade" transparent visible>
        <View style={styles.overlayRoot}>{body}</View>
      </Modal>
    );
  }

  if (fullScreen) {
    return <MeshBackground style={styles.root}>{body}</MeshBackground>;
  }

  return <View style={styles.inlineRoot}>{body}</View>;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  inlineRoot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cream[50],
  },
  overlayRoot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(250,251,252,0.88)',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  spinner: { marginTop: spacing.lg },
  label: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.cream[800],
  },
});
