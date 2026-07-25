import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts, radius, spacing } from '@/theme';

type Props = {
  steps: string[];
  activeIndex: number;
};

export function Stepper({ steps, activeIndex }: Props) {
  return (
    <View style={styles.row}>
      {steps.map((step, i) => {
        const done = i < activeIndex;
        const active = i === activeIndex;
        return (
          <View key={step} style={styles.item}>
            <View
              style={[
                styles.dot,
                done && styles.dotDone,
                active && styles.dotActive,
              ]}>
              <Text style={[styles.num, (done || active) && styles.numOn]}>{i + 1}</Text>
            </View>
            <Text style={[styles.label, active && styles.labelActive]}>{step}</Text>
            {i < steps.length - 1 ? <View style={[styles.line, done && styles.lineDone]} /> : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    backgroundColor: colors.cream[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotDone: { backgroundColor: colors.sage[500] },
  dotActive: { backgroundColor: colors.brand[600] },
  num: {
    fontFamily: fonts.sansSemi,
    fontSize: 13,
    color: colors.cream[800],
  },
  numOn: { color: colors.white },
  label: {
    fontFamily: fonts.sansSemi,
    fontSize: 14,
    color: colors.cream[800],
  },
  labelActive: { color: colors.brand[700] },
  line: {
    width: 28,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.cream[200],
    marginLeft: 4,
  },
  lineDone: { backgroundColor: colors.sage[400] },
});
