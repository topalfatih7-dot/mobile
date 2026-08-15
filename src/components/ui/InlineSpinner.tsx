import { StyleSheet, View } from 'react-native';

import { BrandLoader } from '@/components/ui/BrandLoader';

type Props = {
  size?: 'sm' | 'md' | 'lg';
  /** Tam alan ortala (flex:1) */
  fill?: boolean;
};

/**
 * Liste / sayfa içi yükleme — web RouteFallback.
 * Veri gelince kaldır; tam ekran maske kullanma.
 */
export function InlineSpinner({ size = 'md', fill = false }: Props) {
  const loaderSize = size === 'lg' ? 'lg' : size === 'sm' ? 'sm' : 'md';
  return (
    <View style={[styles.wrap, fill && styles.fill]} accessibilityLabel="Yükleniyor">
      <BrandLoader size={loaderSize} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', padding: 16 },
  fill: { flex: 1, minHeight: 160 },
});
