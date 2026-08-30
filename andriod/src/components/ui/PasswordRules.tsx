import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { PASSWORD_RULES } from '@/utils/password';
import { colors, fonts, spacing } from '@/theme';

export function PasswordRules({ password }: { password: string }) {
  return (
    <View style={styles.wrap}>
      {PASSWORD_RULES.map((rule) => {
        const ok = rule.test(password);
        return (
          <View key={rule.id} style={styles.row}>
            <Ionicons
              color={ok ? colors.sage[600] : colors.cream[300]}
              name={ok ? 'checkmark-circle' : 'ellipse-outline'}
              size={16}
            />
            <Text style={[styles.text, ok && styles.textOk]}>{rule.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 4, marginTop: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  text: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.cream[800],
  },
  textOk: { color: colors.sage[700], fontFamily: fonts.sansSemi },
});
