import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FadeIn } from '@/components/ui/FadeIn';
import { TextField } from '@/components/ui/TextField';
import { Button } from '@/components/ui/Button';
import { useActions } from '@/context/ActionsContext';
import { useToast } from '@/context/ToastContext';
import type { MemberRecord } from '@/services/mappers';
import { calculateBMI } from '@/services/health';
import { colors, fonts, radius, spacing } from '@/theme';

const LIMITS = {
  weight: { min: 30, max: 300 },
  height: { min: 120, max: 250 },
  waist: { min: 40, max: 200 },
} as const;

function rangeError(field: keyof typeof LIMITS, value: string): string {
  if (value === '' || value == null) return '';
  const num = Number(value);
  const { min, max } = LIMITS[field];
  if (Number.isNaN(num) || num < min || num > max) return `${min}–${max} arası olmalı`;
  return '';
}

function MetricCard({
  icon,
  value,
  label,
  iconColor,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  label: string;
  iconColor: string;
}) {
  return (
    <View style={styles.metric}>
      <View style={[styles.metricIcon, { backgroundColor: colors.warm[50] }]}>
        <Ionicons color={iconColor} name={icon} size={16} />
      </View>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

type Props = { user: MemberRecord };

/** Web HealthSummarySection parity. */
export function HealthSummarySection({ user }: Props) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const wide = width >= 640;
  const { updateProfile } = useActions();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    weight: String(user.weight || ''),
    height: String(user.height || ''),
    waist: String(user.waist || ''),
  });

  const errors = {
    weight: rangeError('weight', form.weight),
    height: rangeError('height', form.height),
    waist: rangeError('waist', form.waist),
  };

  const bmi = calculateBMI(user.weight, user.height);

  const openEditor = () => {
    setForm({
      weight: String(user.weight || ''),
      height: String(user.height || ''),
      waist: String(user.waist || ''),
    });
    setOpen(true);
  };

  const handleSave = async () => {
    if (errors.weight || errors.height || errors.waist) {
      toast('Lütfen geçerli ölçüler girin', 'warning');
      return;
    }
    setSaving(true);
    try {
      await updateProfile(
        {
          weight: form.weight,
          height: form.height,
          waist: form.waist,
        },
        { toastMsg: 'Ölçüleriniz kaydedildi.' },
      );
      setOpen(false);
    } catch {
      toast('Ölçüler kaydedilemedi. Tekrar deneyin.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <FadeIn delay={80}>
        <LinearGradient
          colors={[colors.warm[50], colors.white, '#fffbeb']}
          style={styles.card}>
          <View style={[styles.header, wide ? styles.headerWide : styles.headerNarrow]}>
            <View style={styles.headerLeft}>
              <LinearGradient
                colors={[colors.gold[500], colors.warm[500]]}
                style={styles.iconBox}>
                <Ionicons color={colors.white} name="fitness" size={20} />
              </LinearGradient>
              <View style={styles.titles}>
                <Text style={styles.title}>Sağlık Özeti</Text>
                <Text style={styles.subtitle}>Vücut ölçülerinizi takip edin</Text>
              </View>
            </View>
            <Pressable
              onPress={openEditor}
              style={[styles.updateBtn, !wide && styles.updateBtnNarrow]}>
              <Text style={styles.updateBtnText}>Ölçüleri Güncelle</Text>
            </Pressable>
          </View>

          <View style={styles.grid}>
            <MetricCard
              icon="scale-outline"
              iconColor={colors.warm[500]}
              label="Kilo"
              value={user.weight ? `${user.weight} kg` : '—'}
            />
            <MetricCard
              icon="resize-outline"
              iconColor={colors.gold[500]}
              label="Boy"
              value={user.height ? `${user.height} cm` : '—'}
            />
            <MetricCard
              icon="body-outline"
              iconColor={colors.warm[500]}
              label="Bel çevresi"
              value={user.waist ? `${user.waist} cm` : '—'}
            />
            <MetricCard
              icon="speedometer-outline"
              iconColor={colors.danger[500]}
              label="VKİ"
              value={bmi != null ? String(bmi) : '—'}
            />
          </View>
        </LinearGradient>
      </FadeIn>

      <Modal animationType="slide" transparent visible={open}>
        <View style={styles.backdrop}>
          <View style={[styles.modal, { paddingBottom: insets.bottom + spacing.lg }]}>
            <View style={styles.handle} />
            <Text style={styles.modalTitle}>Vücut Ölçüleri</Text>
            <Text style={styles.modalHint}>
              Kilo, boy ve bel çevrenizi güncelleyin. VKİ otomatik hesaplanır.
            </Text>
            <TextField
              accent="warm"
              error={errors.weight}
              icon="scale-outline"
              keyboardType="decimal-pad"
              label="Kilo (kg)"
              onChangeText={(weight) => setForm((f) => ({ ...f, weight }))}
              value={form.weight}
            />
            <TextField
              accent="warm"
              error={errors.height}
              icon="resize-outline"
              keyboardType="decimal-pad"
              label="Boy (cm)"
              onChangeText={(height) => setForm((f) => ({ ...f, height }))}
              value={form.height}
            />
            <TextField
              accent="warm"
              error={errors.waist}
              icon="body-outline"
              keyboardType="decimal-pad"
              label="Bel çevresi (cm)"
              onChangeText={(waist) => setForm((f) => ({ ...f, waist }))}
              value={form.waist}
            />
            {form.weight && form.height ? (
              <View style={styles.bmiPreview}>
                <View style={styles.bmiIcon}>
                  <Ionicons color={colors.white} name="speedometer" size={16} />
                </View>
                <View>
                  <Text style={styles.bmiLabel}>Tahmini VKİ</Text>
                  <Text style={styles.bmiValue}>
                    {calculateBMI(form.weight, form.height) ?? '—'}
                  </Text>
                </View>
              </View>
            ) : null}
            <Button
              label={saving ? 'Kaydediliyor…' : 'Kaydet'}
              loading={saving}
              onPress={() => void handleSave()}
            />
            <Button
              label="Vazgeç"
              onPress={() => !saving && setOpen(false)}
              variant="ghost"
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.warm[100],
    overflow: 'hidden',
  },
  header: {
    gap: spacing.md,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.warm[100],
  },
  headerNarrow: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  headerWide: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  titles: { flex: 1, minWidth: 0, paddingRight: 4 },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  title: { fontFamily: fonts.displayBold, fontSize: 17, color: colors.cream[900] },
  subtitle: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.cream[800],
    opacity: 0.55,
    marginTop: 2,
  },
  updateBtn: {
    backgroundColor: colors.warm[500],
    borderRadius: radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexShrink: 0,
    alignSelf: 'flex-start',
  },
  updateBtnNarrow: {
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  updateBtnText: { fontFamily: fonts.sansSemi, fontSize: 12, color: colors.white },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    padding: spacing.md,
  },
  metric: {
    width: '47%',
    flexGrow: 1,
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.warm[100],
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  metricIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricValue: {
    marginTop: 8,
    fontFamily: fonts.displayBold,
    fontSize: 20,
    color: colors.cream[900],
  },
  metricLabel: {
    marginTop: 2,
    fontFamily: fonts.sans,
    fontSize: 11,
    color: colors.cream[800],
    opacity: 0.5,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(26,35,50,0.45)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: radius.full,
    backgroundColor: colors.cream[200],
    marginBottom: spacing.sm,
  },
  modalTitle: {
    fontFamily: fonts.displayBold,
    fontSize: 20,
    color: colors.cream[900],
  },
  modalHint: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.cream[800],
    opacity: 0.6,
    marginBottom: 4,
  },
  bmiPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.warm[200],
    backgroundColor: colors.warm[50],
    padding: spacing.md,
  },
  bmiIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.warm[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  bmiLabel: {
    fontFamily: fonts.sansSemi,
    fontSize: 11,
    color: colors.warm[500],
    textTransform: 'uppercase',
  },
  bmiValue: {
    fontFamily: fonts.displayBold,
    fontSize: 20,
    color: colors.cream[900],
  },
});
