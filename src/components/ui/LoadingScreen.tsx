import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { BrandMark } from '@/components/brand/BrandMark';
import { colors, fonts, spacing } from '@/constants/theme';

type LoadingScreenProps = {
  label?: string;
};

export function LoadingScreen({ label = 'Yükleniyor…' }: LoadingScreenProps) {
  return (
    <View style={styles.root}>
      <BrandMark size={48} />
      <ActivityIndicator color={colors.brand[600]} size="large" style={styles.spinner} />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
  },
  spinner: {
    marginTop: spacing.lg,
  },
  label: {
    marginTop: spacing.md,
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.text.secondary,
  },
});
