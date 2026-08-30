import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { openLegalDocument } from '@/data/legalSlugs';
import { colors, fonts, radius, spacing } from '@/theme';

type Props = {
  accepted: boolean;
  onChange: (next: boolean) => void;
  error?: string;
};

/**
 * Web `LegalConsentCheckbox` — üyelik + KVKK; Gizlilik de tıklanır (mobil).
 * Belge adına basınca web `/legal/...` açılır; kutuya basınca onay değişir.
 */
export function LegalConsentCheckbox({ accepted, onChange, error }: Props) {
  return (
    <View>
      <View
        style={[
          styles.box,
          accepted && styles.boxOn,
          error ? styles.boxError : null,
        ]}>
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: accepted }}
          hitSlop={8}
          onPress={() => onChange(!accepted)}>
          <Ionicons
            color={accepted ? colors.brand[600] : colors.cream[300]}
            name={accepted ? 'checkbox' : 'square-outline'}
            size={26}
          />
        </Pressable>
        <Text onPress={() => onChange(!accepted)} style={styles.label}>
          <Text
            onPress={() => void openLegalDocument('uyelik-ve-abonelik-sozlesmesi')}
            style={styles.link}>
            Üyelik ve Abonelik Sözleşmesi
          </Text>
          {', '}
          <Text
            onPress={() => void openLegalDocument('gizlilik-politikasi')}
            style={styles.link}>
            Gizlilik Politikası
          </Text>
          {' ve '}
          <Text onPress={() => void openLegalDocument('kvkk')} style={styles.link}>
            KVKK Aydınlatma Metni
          </Text>
          {' kapsamında kişisel verilerimin işlenmesini kabul ediyorum.'}
        </Text>
      </View>
      {error ? <Text style={styles.err}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    minHeight: 52,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cream[200],
    backgroundColor: colors.cream[50],
  },
  boxOn: {
    borderColor: colors.brand[200],
    backgroundColor: colors.brand[50],
  },
  boxError: {
    borderColor: colors.danger[500],
    backgroundColor: colors.danger[50],
  },
  label: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 21,
    color: colors.cream[800],
  },
  link: {
    fontFamily: fonts.sansSemi,
    color: colors.brand[600],
    textDecorationLine: 'underline',
  },
  err: {
    marginTop: 8,
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    color: colors.danger[500],
  },
});
