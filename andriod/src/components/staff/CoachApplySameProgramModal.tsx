import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { Button } from '@/components/ui/Button';
import { useToast } from '@/context/ToastContext';
import {
  cloneCartEntries,
  weekdayFullLabel,
  type CartEntry,
} from '@/utils/coachProgram';
import { colors, fonts, radius, spacing } from '@/theme';

type Props = {
  open: boolean;
  onClose: () => void;
  workoutWeekdays?: number[];
  sourceCart?: CartEntry[];
  onApply: (next: { dayCarts: Record<number, CartEntry[]> }) => void;
};

/**
 * Web parity: CoachApplySameProgramModal — seçili gün sepetini tüm müsait günlere kopyala.
 */
export function CoachApplySameProgramModal({
  open,
  onClose,
  workoutWeekdays = [],
  sourceCart = [],
  onApply,
}: Props) {
  const { toast } = useToast();
  const insets = useSafeAreaInsets();

  const handleApply = () => {
    if (!sourceCart.length) {
      toast(
        'Önce bir güne hareket ekleyin; o program tüm müsait günlere kopyalanır',
        'error',
      );
      return;
    }
    if (!workoutWeekdays.length) {
      toast('Danışanın müsait antrenman günü yok', 'error');
      return;
    }

    const nextCarts: Record<number, CartEntry[]> = {};
    workoutWeekdays.forEach((day) => {
      nextCarts[day] = cloneCartEntries(sourceCart);
    });
    onApply({ dayCarts: nextCarts });
    toast(`${workoutWeekdays.length} müsait güne aynı program uygulandı`, 'success');
    onClose();
  };

  const dayNames = workoutWeekdays.map(weekdayFullLabel).join(', ');

  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={open}>
      <Pressable onPress={onClose} style={styles.backdrop}>
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={[styles.sheet, { paddingBottom: insets.bottom + spacing.md }]}>
          <View style={styles.handle} />
          <Text style={styles.title}>Tüm günlere aynı program</Text>

          <LinearGradient
            colors={[colors.brand[500], colors.brand[600], colors.sage[500]]}
            end={{ x: 1, y: 1 }}
            start={{ x: 0, y: 0 }}
            style={styles.hero}>
            <Text style={styles.heroEyebrow}>Seçili gün kopyalanacak</Text>
            <Text style={styles.heroBody}>
              {sourceCart.length} hareket → {dayNames || '—'}
            </Text>
          </LinearGradient>

          <ScrollView style={styles.list}>
            {sourceCart.map((e, i) => (
              <View key={e.id || String(i)} style={styles.row}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{i + 1}</Text>
                </View>
                <Text numberOfLines={1} style={styles.exName}>
                  {e.exerciseName}
                </Text>
              </View>
            ))}
            {!sourceCart.length ? (
              <Text style={styles.empty}>Kaynak günde henüz hareket yok</Text>
            ) : null}
          </ScrollView>

          <Button
            disabled={!sourceCart.length || !workoutWeekdays.length}
            label="Tüm müsait günlere uygula"
            onPress={handleApply}
            rightIcon="copy-outline"
            size="md"
          />
          <Pressable onPress={onClose} style={styles.cancel}>
            <Ionicons color={colors.cream[800]} name="close" size={18} />
            <Text style={styles.cancelText}>Vazgeç</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(26,35,50,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.cream[50],
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    maxHeight: '85%',
    gap: spacing.md,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.cream[300],
  },
  title: { fontFamily: fonts.displayBold, fontSize: 20, color: colors.cream[900] },
  hero: { borderRadius: radius.xl, padding: spacing.md, gap: 6 },
  heroEyebrow: {
    fontFamily: fonts.sansSemi,
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heroBody: { fontFamily: fonts.sans, fontSize: 14, color: colors.white, lineHeight: 20 },
  list: {
    maxHeight: 180,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.cream[200],
    backgroundColor: colors.white,
    padding: spacing.md,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  badge: {
    width: 24,
    height: 24,
    borderRadius: radius.full,
    backgroundColor: colors.brand[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontFamily: fonts.sansSemi, fontSize: 11, color: colors.brand[700] },
  exName: { flex: 1, fontFamily: fonts.sansSemi, fontSize: 14, color: colors.cream[900] },
  empty: { fontFamily: fonts.sans, fontSize: 13, color: colors.cream[800], opacity: 0.5 },
  cancel: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 44,
  },
  cancelText: { fontFamily: fonts.sansSemi, fontSize: 14, color: colors.cream[800] },
});
