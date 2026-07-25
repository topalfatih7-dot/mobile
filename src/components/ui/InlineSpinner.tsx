import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { colors } from '@/theme';

type Props = {
  size?: 'sm' | 'md' | 'lg';
  /** Tam alan ortala (flex:1) */
  fill?: boolean;
};

const RING = { sm: 24, md: 32, lg: 48 };

/**
 * Ana proje RouteFallback — küçük dönen halka.
 * Veri çeken ekranlarda içerik yerine göster.
 */
export function InlineSpinner({ size = 'md', fill = false }: Props) {
  const dim = RING[size];
  return (
    <View style={[styles.wrap, fill && styles.fill]} accessibilityLabel="Yükleniyor">
      <View style={[styles.ring, { width: dim, height: dim, borderRadius: dim / 2 }]}>
        <ActivityIndicator color={colors.brand[600]} size={size === 'lg' ? 'large' : 'small'} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', padding: 16 },
  fill: { flex: 1 },
  ring: {
    borderWidth: 2,
    borderColor: colors.brand[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
});
