/**
 * App Store 3.1.3(f): satın alma butonu / checkout linki yok.
 * Destek: mailto + site ana sayfası (plans/membership değil).
 */
import { Linking, StyleSheet, Text, type TextStyle } from 'react-native';

import {
  IOS_OUT_OF_APP_PURCHASE_NOTICE,
  MEMBERSHIP_CANCEL_SUPPORT_EMAIL,
  MEMBERSHIP_SUPPORT_SITE_URL,
} from '@/data/membershipCancelCopy';
import { colors, fonts } from '@/theme';

async function openSupportEmail() {
  try {
    await Linking.openURL(`mailto:${MEMBERSHIP_CANCEL_SUPPORT_EMAIL}`);
  } catch {
    /* ignore */
  }
}

async function openSupportSite() {
  try {
    await Linking.openURL(MEMBERSHIP_SUPPORT_SITE_URL);
  } catch {
    /* ignore */
  }
}

type Props = {
  align?: 'left' | 'center';
  style?: TextStyle;
  /** Düz metin (toast / a11y). Varsayılan: tıklanabilir e-posta ve site. */
  plain?: boolean;
};

export function IosOutOfAppPurchaseNotice({
  align = 'left',
  style,
  plain = false,
}: Props) {
  if (plain) {
    return (
      <Text
        style={[
          styles.text,
          align === 'center' && styles.center,
          style,
        ]}>
        {IOS_OUT_OF_APP_PURCHASE_NOTICE}
      </Text>
    );
  }

  return (
    <Text
      style={[styles.text, align === 'center' && styles.center, style]}>
      Üyelik satın alımları uygulama içerisinden yapılmamaktadır. Bilgi için{' '}
      <Text onPress={() => void openSupportEmail()} style={styles.link}>
        {MEMBERSHIP_CANCEL_SUPPORT_EMAIL}
      </Text>
      {' '}
      adresine yazabilir veya{' '}
      <Text onPress={() => void openSupportSite()} style={styles.link}>
        web sitemizden
      </Text>
      {' '}
      bize ulaşabilirsiniz.
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 20,
    color: colors.cream[800],
  },
  center: { textAlign: 'center' },
  link: {
    fontFamily: fonts.sansSemi,
    color: colors.brand[700],
    textDecorationLine: 'underline',
  },
});
