/**
 * Web parity: Adsız UnpaidMemberGate.jsx
 * MOBILE DIFF: CTA → /(member)/profile/payments (web /plans)
 */
import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { colors, fonts, radius, spacing } from '@/theme';

export function UnpaidMemberGate({
  title = 'Bu özellik paket gerektirir',
  description = 'Sayfayı gezebilirsiniz; mesaj, randevu, program ve benzeri ücretli işlemler için bir plan seçin.',
}: {
  title?: string;
  description?: string;
}) {
  return (
    <View style={styles.wrap}>
      <View style={styles.card}>
        <View style={styles.icon}>
          <Ionicons color={colors.gold[500]} name="diamond" size={28} />
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.desc}>{description}</Text>
        <Button
          label="Plan Seç"
          onPress={() => router.push('/(member)/profile/payments' as Href)}
          rightIcon="diamond"
          style={{ alignSelf: 'stretch' }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.sm,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.warm[200],
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  icon: {
    width: 56,
    height: 56,
    borderRadius: radius.xl,
    backgroundColor: colors.warm[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: {
    fontFamily: fonts.displayBold,
    fontSize: 20,
    color: colors.cream[900],
    textAlign: 'center',
  },
  desc: {
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 21,
    color: colors.cream[800],
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
});
