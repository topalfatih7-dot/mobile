/**
 * CustomerCenterButton — RevenueCat Customer Center açar.
 * Docs: docs/mobile/04-payments-iap.md
 */
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';

import { useToast } from '@/context/ToastContext';
import { getIapConfigStatus, openCustomerCenter } from '@/services/iap';
import { colors, fonts, radius, spacing } from '@/theme';

export interface CustomerCenterButtonProps {
  userId: string;
  style?: ViewStyle;
}

export function CustomerCenterButton({ userId, style }: CustomerCenterButtonProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handlePress = async () => {
    const status = getIapConfigStatus();
    if (!status.ready) {
      toast(
        status.reason === 'no_key'
          ? 'Abonelik yönetimi henüz aktif değil. App Store / Google Play güncellemesini bekleyin.'
          : 'Abonelik yönetimi bu ortamda kullanılamıyor.',
        'info',
      );
      return;
    }
    setLoading(true);
    try {
      const result = await openCustomerCenter(userId);
      if (!result.ok) toast(result.error, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Pressable
      accessibilityLabel="Aboneliğimi yönet"
      accessibilityRole="button"
      disabled={loading}
      onPress={() => void handlePress()}
      style={({ pressed }) => [styles.btn, pressed && styles.btnPressed, style]}>
      {loading ? (
        <ActivityIndicator color={colors.brand[600]} size="small" />
      ) : (
        <Text style={styles.label}>Aboneliğimi Yönet</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    borderWidth: 1,
    borderColor: colors.brand[300],
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brand[50],
    minHeight: 48,
  },
  btnPressed: {
    backgroundColor: colors.brand[100],
  },
  label: {
    fontFamily: fonts.sansSemi,
    fontSize: 15,
    color: colors.brand[700],
  },
});
