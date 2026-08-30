import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts, radius, spacing } from '@/theme';

export function ChatDateChip({ label }: { label: string }) {
  if (!label) return null;
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'center',
    marginVertical: spacing.sm,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radius.full,
    backgroundColor: colors.cream[100],
  },
  label: {
    fontFamily: fonts.sansSemi,
    fontSize: 11,
    color: colors.cream[800],
  },
});
