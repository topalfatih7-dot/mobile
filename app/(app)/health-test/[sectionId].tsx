import { router, useLocalSearchParams, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppHeader } from '@/components/ui/AppHeader';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { useApp } from '@/context/AppContext';
import {
  getSectionQuestions,
  isDetailVisible,
  isQuestionFullyAnswered,
  isSectionComplete,
} from '@/data/healthTest';
import { getCompletedSections, getSectionMeta, type HealthTestProgress } from '@/data/healthTestSections';
import { colors, fonts, radius, spacing } from '@/constants/theme';

type Question = {
  type: string;
  key: string;
  label: string;
  required?: boolean;
  options?: { value: string; label: string; emoji?: string }[];
  detail?: { key: string; when: string | string[]; placeholder?: string };
  placeholder?: string;
};

export default function HealthTestSectionScreen() {
  const { sectionId } = useLocalSearchParams<{ sectionId: string }>();
  const { member, updateProfile } = useApp();
  const [saving, setSaving] = useState(false);
  const [answers, setAnswers] = useState<Record<string, unknown>>(() => {
    const ht = (member?.healthTest as Record<string, unknown> | undefined) || {};
    return { ...ht };
  });

  const section = getSectionMeta(sectionId || '');
  const gender = (member?.gender as string) || (member?.sex as string) || '';
  const packageConfig = (member?.packageConfig as Record<string, unknown>) || null;

  const questions = useMemo(() => {
    return (getSectionQuestions(sectionId || '', gender, packageConfig as never) || []) as Question[];
  }, [sectionId, gender, packageConfig]);

  const setAnswer = (key: string, value: unknown) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  };

  const toggleMulti = (key: string, value: string) => {
    const cur = Array.isArray(answers[key]) ? ([...(answers[key] as string[])] as string[]) : [];
    const next = cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value];
    setAnswer(key, next);
  };

  const onSave = async (markComplete: boolean) => {
    if (!section) return;
    if (markComplete) {
      const incomplete = questions.filter((q) => !isQuestionFullyAnswered(q, answers));
      if (incomplete.length) {
        Alert.alert('Eksik cevaplar', 'Zorunlu soruları tamamlayın.');
        return;
      }
    }
    setSaving(true);
    try {
      const prev = (member?.healthTest as HealthTestProgress | undefined) || {};
      let nextCompleted = getCompletedSections(prev);
      if (markComplete && !nextCompleted.includes(section.id)) {
        nextCompleted = [...nextCompleted, section.id];
      }
      const result = await updateProfile({
        healthTest: {
          ...prev,
          ...answers,
          completedSections: nextCompleted,
        },
      });
      if (!result.success) {
        Alert.alert('Kayıt başarısız', result.error || 'İlerleme kaydedilemedi.');
        return;
      }
      router.back();
    } finally {
      setSaving(false);
    }
  };

  if (!section) {
    return (
      <Screen contentStyle={styles.screen}>
        <StatusBar style="dark" />
        <AppHeader showBack title="Bölüm bulunamadı" />
        <View style={styles.content}>
          <EmptyState subtitle="Geçersiz sağlık testi bölümü." title="Hata" />
          <Button label="Hub’a dön" onPress={() => router.replace('/health-test' as Href)} />
        </View>
      </Screen>
    );
  }

  const alreadyDone = isSectionComplete(
    { id: section.id, questions },
    answers,
  );

  return (
    <Screen scroll contentStyle={styles.screen}>
      <StatusBar style="dark" />
      <AppHeader showBack subtitle={section.subtitle} title={section.title} />

      <View style={styles.content}>
        {questions.length === 0 ? (
          <EmptyState subtitle="Bu bölüm için soru bulunamadı." title="Boş bölüm" />
        ) : (
          questions.map((q) => {
            const val = answers[q.key];
            const detailVisible = q.detail && isDetailVisible(q.detail, val);
            return (
              <View key={q.key} style={styles.card}>
                <Text style={styles.label}>
                  {q.label}
                  {q.required ? ' *' : ''}
                </Text>
                {q.type === 'text' || q.type === 'number' ? (
                  <TextInput
                    keyboardType={q.type === 'number' ? 'numeric' : 'default'}
                    onChangeText={(t) => setAnswer(q.key, t)}
                    placeholder={q.placeholder || 'Cevabınız'}
                    placeholderTextColor={colors.text.muted}
                    style={styles.input}
                    value={typeof val === 'string' ? val : ''}
                  />
                ) : null}
                {(q.type === 'single' || q.type === 'emoji') && q.options ? (
                  <View style={styles.opts}>
                    {q.options.map((opt) => (
                      <Chip
                        active={val === opt.value}
                        key={opt.value}
                        label={opt.emoji ? `${opt.emoji} ${opt.label}` : opt.label}
                        onPress={() => setAnswer(q.key, opt.value)}
                      />
                    ))}
                  </View>
                ) : null}
                {q.type === 'multi' && q.options ? (
                  <View style={styles.opts}>
                    {q.options.map((opt) => {
                      const active = Array.isArray(val) && val.includes(opt.value);
                      return (
                        <Chip
                          active={active}
                          key={opt.value}
                          label={opt.label}
                          onPress={() => toggleMulti(q.key, opt.value)}
                        />
                      );
                    })}
                  </View>
                ) : null}
                {detailVisible && q.detail ? (
                  <TextInput
                    onChangeText={(t) => setAnswer(q.detail!.key, t)}
                    placeholder={q.detail.placeholder || 'Detay'}
                    placeholderTextColor={colors.text.muted}
                    style={[styles.input, styles.detail]}
                    value={typeof answers[q.detail.key] === 'string' ? (answers[q.detail.key] as string) : ''}
                  />
                ) : null}
              </View>
            );
          })
        )}

        <Button
          label={alreadyDone ? 'Güncelle ve kaydet' : 'Bölümü tamamla'}
          loading={saving}
          onPress={() => void onSave(true)}
        />
        <Button
          label="Taslak kaydet"
          loading={saving}
          onPress={() => void onSave(false)}
          variant="secondary"
        />
        <Button label="Hub’a dön" onPress={() => router.replace('/health-test' as Href)} variant="ghost" />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { paddingHorizontal: 0, paddingBottom: spacing.xxl },
  content: { paddingHorizontal: spacing.lg, gap: spacing.md },
  card: {
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  label: { fontFamily: fonts.semibold, fontSize: 14, color: colors.text.primary, lineHeight: 20 },
  opts: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  input: {
    minHeight: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.text.primary,
    backgroundColor: colors.canvas,
  },
  detail: { marginTop: spacing.sm },
});
