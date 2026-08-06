/**
 * Web parity: Adsız `HealthProfileGateForm.jsx`
 * Boy/kilo/doğum (+ cinsiyet) zorunlu — sağlık testi öncesi inline gate.
 */
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { BirthDateField } from '@/components/ui/BirthDateField';
import { Button } from '@/components/ui/Button';
import { GenderSelect } from '@/components/ui/GenderSelect';
import { TextField } from '@/components/ui/TextField';
import { isValidMemberGender } from '@/data/genders';
import { ageFromBirthDate, birthDateError } from '@/utils/birthDate';
import { getMissingAnalysisProfileFields } from '@/utils/healthProfile';
import { colors, fonts, radius, spacing } from '@/theme';

const LIMITS = {
  weight: { min: 30, max: 300 },
  height: { min: 120, max: 250 },
};

function rangeError(field: 'weight' | 'height', value: unknown): string {
  if (value === '' || value == null) return 'Zorunlu';
  const num = Number(value);
  const { min, max } = LIMITS[field];
  if (Number.isNaN(num) || num < min || num > max) return `${min}–${max} arası olmalı`;
  return '';
}

type Props = {
  profile: Record<string, unknown> | null | undefined;
  onSave: (patch: Record<string, unknown>) => Promise<void>;
  saving?: boolean;
};

export function HealthProfileGateForm({ profile, onSave, saving = false }: Props) {
  const missing = getMissingAnalysisProfileFields(profile);
  const needsGender = missing.some((f) => f.key === 'gender');

  const [form, setForm] = useState(() => ({
    birthDate: String(profile?.birthDate || ''),
    weight: String(profile?.weight ?? ''),
    height: String(profile?.height ?? ''),
    gender: String(profile?.gender || '') as '' | 'female' | 'male',
  }));
  const [showErrors, setShowErrors] = useState(false);

  const errors = {
    birthDate: birthDateError(form.birthDate) || (!form.birthDate ? 'Zorunlu' : ''),
    weight: rangeError('weight', form.weight),
    height: rangeError('height', form.height),
    gender:
      needsGender && !isValidMemberGender(form.gender) ? 'Cinsiyet seçin' : '',
  };
  const hasErrors = Boolean(
    errors.birthDate || errors.weight || errors.height || errors.gender,
  );

  const handleSubmit = async () => {
    if (hasErrors) {
      setShowErrors(true);
      return;
    }
    const patch: Record<string, unknown> = {
      birthDate: form.birthDate,
      weight: form.weight,
      height: form.height,
      age: form.birthDate ? ageFromBirthDate(form.birthDate) : '',
    };
    if (needsGender) patch.gender = form.gender;
    await onSave(patch);
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.banner}>
        <View style={styles.bannerAccent} />
        <View style={styles.bannerBody}>
          <View style={styles.bannerIcon}>
            <Ionicons color={colors.warm[500]} name="scale-outline" size={24} />
          </View>
          <View style={styles.bannerText}>
            <Text style={styles.bannerEyebrow}>Başlamadan önce</Text>
            <Text style={styles.bannerTitle}>
              Boy, kilo ve yaş bilgileriniz gerekli
            </Text>
            <Text style={styles.bannerSub}>
              Sağlık testine ve uzman analizine başlamadan önce bu bilgileri
              girmeniz zorunludur. Analiz sonuçlarınız bu ölçümlere göre
              kişiselleştirilir.
            </Text>
            {missing.length > 0 ? (
              <View style={styles.chips}>
                {missing.map((field) => (
                  <View key={field.key} style={styles.chip}>
                    <Text style={styles.chipText}>{field.label}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        </View>
      </View>

      <View style={styles.form}>
        <BirthDateField
          error={showErrors ? errors.birthDate : ''}
          onChange={(birthDate) => setForm((f) => ({ ...f, birthDate }))}
          value={form.birthDate}
        />
        {needsGender ? (
          <GenderSelect
            error={showErrors ? errors.gender : ''}
            onChange={(gender) => setForm((f) => ({ ...f, gender }))}
            value={form.gender}
          />
        ) : null}
        <TextField
          error={showErrors ? errors.weight : ''}
          keyboardType="decimal-pad"
          label="Kilo (kg)"
          onChangeText={(weight) => setForm((f) => ({ ...f, weight }))}
          placeholder="Örn. 72"
          value={form.weight}
        />
        <TextField
          error={showErrors ? errors.height : ''}
          keyboardType="number-pad"
          label="Boy (cm)"
          onChangeText={(height) => setForm((f) => ({ ...f, height }))}
          placeholder="Örn. 170"
          value={form.height}
        />
        <Button
          label={saving ? 'Kaydediliyor…' : 'Kaydet ve devam et'}
          loading={saving}
          onPress={() => void handleSubmit()}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
  banner: {
    borderRadius: radius.xl,
    borderWidth: 2,
    borderColor: colors.warm[200],
    backgroundColor: colors.warm[50],
    overflow: 'hidden',
    flexDirection: 'row',
  },
  bannerAccent: {
    width: 6,
    backgroundColor: colors.warm[500],
  },
  bannerBody: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
  },
  bannerIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: colors.warm[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerText: { flex: 1, gap: 4 },
  bannerEyebrow: {
    fontFamily: fonts.sansBold,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.warm[500],
  },
  bannerTitle: {
    fontFamily: fonts.displayBold,
    fontSize: 18,
    color: colors.cream[900],
  },
  bannerSub: {
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 19,
    color: colors.cream[800],
    opacity: 0.85,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.warm[200],
    backgroundColor: colors.white,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chipText: {
    fontFamily: fonts.sansSemi,
    fontSize: 12,
    color: colors.cream[900],
  },
  form: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.cream[200],
    backgroundColor: colors.white,
    padding: spacing.md,
    gap: spacing.md,
  },
});
