/**
 * Web parity: Adsız `src/components/ui/PresenceIndicator.jsx` (sade RN)
 */
import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts } from '@/theme';
import { presenceLabel } from '@/utils/presenceStatus';

type Props = {
  online: boolean;
  lastSeenAt?: string | null;
  showLabel?: boolean;
};

export function PresenceIndicator({ online, lastSeenAt, showLabel = false }: Props) {
  const label = online ? 'Çevrimiçi' : presenceLabel(lastSeenAt);
  return (
    <View style={styles.row}>
      <View style={[styles.dot, online ? styles.dotOn : styles.dotOff]} />
      {showLabel ? (
        <Text style={[styles.label, online ? styles.labelOn : styles.labelOff]}>
          {label}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotOn: { backgroundColor: colors.sage[500] },
  dotOff: { backgroundColor: colors.cream[300] },
  label: { fontFamily: fonts.sans, fontSize: 11 },
  labelOn: { color: colors.sage[700] },
  labelOff: { color: colors.cream[800], opacity: 0.55 },
});
