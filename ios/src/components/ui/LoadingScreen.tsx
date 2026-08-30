import { Modal, StyleSheet, View } from 'react-native';

import { MeshBackground } from '@/components/ui/MeshBackground';
import { BrandLoader } from '@/components/ui/BrandLoader';
import { colors, spacing } from '@/theme';

type Props = {
  label?: string;
  /** Tam ekran (auth boot) — varsayılan */
  fullScreen?: boolean;
  /** Modal overlay (yavaş işlem maskesi) — işlem bitince kaldır */
  overlay?: boolean;
};

/**
 * Web LoadingScreen parity — çift halka + marka.
 * fullScreen: auth hydrate; overlay: gönder/çek maskesi; inline: liste boş hali.
 */
export function LoadingScreen({
  label = 'Yükleniyor…',
  fullScreen = true,
  overlay = false,
}: Props) {
  const body = (
    <View style={styles.center}>
      <BrandLoader label={label} size={overlay ? 'md' : 'lg'} />
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
  },
});
