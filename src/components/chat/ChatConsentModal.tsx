import { Ionicons } from '@expo/vector-icons';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { CHAT_CONSENT_TEXT } from '@/utils/chatContacts';
import { colors, fonts, radius, spacing } from '@/theme';

type Props = {
  visible: boolean;
  accepting?: boolean;
  onAccept: () => void;
  onClose: () => void;
};

/**
 * Web ChatConsentModal parity — scroll + sabit CTA (küçük ekranda buton kesilmesin).
 */
export function ChatConsentModal({ visible, accepting, onAccept, onClose }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
      transparent
      visible={visible}>
      <View style={[styles.backdrop, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={styles.card}>
          <ScrollView
            bounces={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
            showsVerticalScrollIndicator={false}
            style={styles.scroll}>
            <View style={styles.badge}>
              <Ionicons color={colors.brand[600]} name="shield-checkmark" size={24} />
            </View>
            <Text style={styles.title}>Mesajlaşma Bilgilendirmesi</Text>
            <View style={styles.bodyCard}>
              <Text style={styles.body}>{CHAT_CONSENT_TEXT}</Text>
            </View>
          </ScrollView>
          <View style={styles.actions}>
            <Button
              label="Okudum, mesajlaşmaya başla"
              loading={accepting}
              onPress={onAccept}
            />
            <Button
              disabled={accepting}
              label="Vazgeç"
              onPress={onClose}
              variant="ghost"
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(26,35,50,0.45)',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  card: {
    maxHeight: '88%',
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  scroll: { flexGrow: 1, flexShrink: 1 },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.sm,
    gap: spacing.md,
  },
  badge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.brand[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontFamily: fonts.displayBold, fontSize: 20, color: colors.cream[900] },
  bodyCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.warm[200],
    backgroundColor: colors.warm[50],
    padding: spacing.md,
  },
  body: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.cream[800],
    lineHeight: 21,
  },
  actions: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.cream[200],
    backgroundColor: colors.white,
  },
});
