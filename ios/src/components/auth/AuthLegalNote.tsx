import { StyleSheet, Text } from 'react-native';

import { openLegalDocument } from '@/data/legalSlugs';
import { colors, fonts, spacing } from '@/theme';

type Props = {
  variant: 'onDark' | 'onLight';
};

export function AuthLegalNote({ variant }: Props) {
  const base = variant === 'onDark' ? styles.onDark : styles.onLight;
  const link = variant === 'onDark' ? styles.linkOnDark : styles.linkOnLight;
  return (
    <Text style={base}>
      Devam ederek{' '}
      <Text
        onPress={() => void openLegalDocument('uyelik-ve-abonelik-sozlesmesi')}
        style={link}>
        Kullanım Koşulları
      </Text>
      {' ve '}
      <Text
        onPress={() => void openLegalDocument('gizlilik-politikasi')}
        style={link}>
        Gizlilik Politikası
      </Text>
      &apos;nı kabul edersin.
    </Text>
  );
}

const styles = StyleSheet.create({
  onDark: {
    marginTop: spacing.md,
    fontFamily: fonts.sans,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    color: 'rgba(255,255,255,0.78)',
  },
  onLight: {
    marginTop: spacing.md,
    fontFamily: fonts.sans,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    color: colors.cream[800],
  },
  linkOnDark: {
    fontFamily: fonts.sansSemi,
    textDecorationLine: 'underline',
    color: colors.white,
  },
  linkOnLight: {
    fontFamily: fonts.sansSemi,
    textDecorationLine: 'underline',
    color: colors.brand[600],
  },
});
