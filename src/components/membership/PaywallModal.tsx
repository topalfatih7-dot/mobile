/**
 * PaywallModal — RevenueCat native paywall wrapper.
 * Expo Go'da RC native modülü yoksa bilgi modalı gösterir.
 */
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';

import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { getIapConfigStatus, presentPaywall } from '@/services/iap';
import { colors, fonts, radius, spacing } from '@/theme';

export interface PaywallModalProps {
  visible: boolean;
  onDismiss: () => void;
  offeringIdentifier?: string;
}

export function PaywallModal({ visible, onDismiss, offeringIdentifier }: PaywallModalProps) {
  const { toast } = useToast();
  const { userId } = useAuth();
  const [loading, setLoading] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const presented = useRef(false);

  useEffect(() => {
    if (!visible) {
      presented.current = false;
      setUnavailable(false);
      setLoading(false);
      return;
    }
    if (presented.current) return;
    presented.current = true;

    const status = getIapConfigStatus();
    if (!status.ready) {
      setUnavailable(true);
      return;
    }

    setLoading(true);
    void presentPaywall(userId ?? '', offeringIdentifier).then((result) => {
      setLoading(false);
      if (!result.ok) {
        if (result.error.includes('native') || result.error.includes('unavailable')) {
          setUnavailable(true);
        } else {
          toast(result.error, 'error');
          onDismiss();
        }
        return;
      }
      if (result.purchased) {
        toast('Aboneliğiniz başarıyla güncellendi!', 'success');
      }
      onDismiss();
    });
  }, [visible, offeringIdentifier, onDismiss, toast]);

  if (!visible) return null;

  if (loading) {
    return (
      <Modal animationType="fade" transparent visible>
        <View style={styles.overlay}>
          <View style={styles.loaderCard}>
            <ActivityIndicator color={colors.brand[600]} size="large" />
            <Text style={styles.loaderText}>Ödeme ekranı açılıyor…</Text>
          </View>
        </View>
      </Modal>
    );
  }

  if (unavailable) {
    return (
      <Modal animationType="slide" transparent visible onRequestClose={onDismiss}>
        <View style={styles.overlay}>
          <View style={styles.card}>
            <Text style={styles.title}>Abonelik Yönetimi</Text>
            <Text style={styles.body}>
              Abonelik yönetimi yakında aktif olacak. App Store / Google Play'den güncelleme
              bekleniyor.
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={onDismiss}
              style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}>
              <Text style={styles.btnText}>Tamam</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  } as ViewStyle,
  loaderCard: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.md,
    alignItems: 'center',
    minWidth: 200,
  },
  loaderText: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.cream[800],
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.md,
    width: '100%',
  },
  title: {
    fontFamily: fonts.displayBold,
    fontSize: 20,
    color: colors.cream[900],
  },
  body: {
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 22,
    color: colors.cream[800],
  },
  btn: {
    backgroundColor: colors.brand[600],
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  btnPressed: {
    backgroundColor: colors.brand[700],
  },
  btnText: {
    fontFamily: fonts.sansSemi,
    fontSize: 15,
    color: colors.white,
  },
});
