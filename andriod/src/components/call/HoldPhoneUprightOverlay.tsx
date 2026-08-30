import { Ionicons } from '@expo/vector-icons';
import { Platform, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { colors, fonts, spacing } from '@/theme';

const LANDSCAPE_SLACK = 24;

/** Canlı görüşmede yatay çevirince dik tutma uyarısı — ses/görüntü kesilmez. */
export function HoldPhoneUprightOverlay() {
  const { width, height } = useWindowDimensions();
  if (Platform.OS === 'web') return null;
  if (width <= height + LANDSCAPE_SLACK) return null;

  return (
    <View
      accessibilityRole="alert"
      accessibilityViewIsModal
      accessibilityLabel="Telefonu dik tutun. Görüntülü görüşme için telefonu dikey tutmanız gerekir."
      pointerEvents="auto"
      style={styles.overlay}>
      <View style={styles.iconWrap}>
        <Ionicons color={colors.white} name="phone-portrait-outline" size={40} />
      </View>
      <Text style={styles.title}>Telefonu dik tutun</Text>
      <Text style={styles.body}>
        Görüntülü görüşme için telefonu dikey tutmanız gerekir.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 100,
    backgroundColor: 'rgba(15,23,32,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: fonts.displayExtra,
    fontSize: 22,
    color: colors.white,
    textAlign: 'center',
  },
  body: {
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 21,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
    maxWidth: 360,
  },
});
