import { useEffect, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { CheckboxRow } from '@/components/ui/CheckboxRow';
import { MEMBERSHIP_CANCEL_COPY } from '@/data/membershipCancelCopy';
import { colors, fonts, radius, spacing } from '@/theme';

export type CancelDialogVariant = 'period_end' | 'immediate' | 'resume';

type Props = {
  visible: boolean;
  variant: CancelDialogVariant | null;
  planLabel: string;
  dateLabel: string;
  busy?: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

export function MembershipCancelModal({
  visible,
  variant,
  planLabel,
  dateLabel,
  busy,
  onConfirm,
  onClose,
}: Props) {
  const insets = useSafeAreaInsets();
  const [acked, setAcked] = useState(false);
  const copy = MEMBERSHIP_CANCEL_COPY;
  const needsAck = variant === 'immediate';

  useEffect(() => {
    if (visible) setAcked(false);
  }, [visible, variant]);

  const title =
    variant === 'immediate'
      ? copy.immediateTitle
      : variant === 'resume'
        ? copy.resumeTitle
        : copy.periodTitle;
  const lead =
    variant === 'immediate'
      ? copy.immediateLead(planLabel, dateLabel)
      : variant === 'resume'
        ? copy.resumeLead(planLabel, dateLabel)
        : copy.periodLead(planLabel, dateLabel);
  const bullets =
    variant === 'immediate'
      ? copy.immediateBullets
      : variant === 'period_end'
        ? copy.periodBullets
        : [];
  const cta =
    variant === 'immediate'
      ? copy.immediateCta
      : variant === 'resume'
        ? copy.resumeCta
        : copy.periodCta;
  const danger = variant === 'immediate';

  return (
    <Modal
      animationType="fade"
      onRequestClose={() => {
        if (!busy) onClose();
      }}
      statusBarTranslucent
      transparent
      visible={visible}>
      <View style={[styles.backdrop, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={styles.card}>
          <ScrollView
            bounces={false}
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>{title}</Text>
            <View style={[styles.leadBox, danger && styles.leadDanger]}>
              <Text style={[styles.lead, danger && styles.leadDangerText]}>{lead}</Text>
            </View>
            {bullets.map((item) => (
              <Text key={item} style={styles.bullet}>
                {'\u2022'} {item}
              </Text>
            ))}
            {needsAck ? (
              <View style={styles.ack}>
                <CheckboxRow
                  checked={acked}
                  label={copy.immediateAck}
                  onChange={setAcked}
                />
              </View>
            ) : null}
          </ScrollView>
          <View style={styles.actions}>
            <Button
              disabled={busy || (needsAck && !acked)}
              label={cta}
              loading={busy}
              onPress={onConfirm}
            />
            <Button disabled={busy} label="Vazgeç" onPress={onClose} variant="ghost" />
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
  scroll: { padding: spacing.lg, gap: spacing.sm },
  title: {
    fontFamily: fonts.displayExtra,
    fontSize: 20,
    color: colors.cream[900],
  },
  leadBox: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cream[200],
    backgroundColor: colors.cream[50],
    padding: spacing.md,
  },
  leadDanger: {
    borderColor: colors.danger[100],
    backgroundColor: colors.danger[50],
  },
  lead: {
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 20,
    color: colors.cream[800],
  },
  leadDangerText: {
    fontFamily: fonts.sansSemi,
    color: colors.danger[800],
  },
  bullet: {
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 19,
    color: colors.cream[800],
  },
  ack: { marginTop: spacing.sm },
  actions: { padding: spacing.md, gap: spacing.xs },
});
