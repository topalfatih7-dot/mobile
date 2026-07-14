import { router, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/ui/AppHeader';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { useApp } from '@/context/AppContext';
import {
  getCompletedSections,
  HEALTH_SECTIONS_META,
  type HealthTestProgress,
} from '@/data/healthTestSections';
import { colors, fonts, radius, spacing } from '@/constants/theme';

export default function HealthTestFinishScreen() {
  const { member, updateProfile } = useApp();
  const [saving, setSaving] = useState(false);

  const completed = useMemo(() => getCompletedSections(member?.healthTest), [member?.healthTest]);
  const total = HEALTH_SECTIONS_META.length;
  const allDone = completed.length >= total;

  const onFinish = async () => {
    setSaving(true);
    try {
      const prev = (member?.healthTest as HealthTestProgress | undefined) || {};
      const result = await updateProfile({
        healthTest: {
          ...prev,
          completedSections: completed,
          finishedAt: new Date().toISOString(),
        },
        healthAck: true,
      });
      if (!result.success) {
        Alert.alert('Kayıt başarısız', result.error || 'Tamamlama kaydedilemedi.');
        return;
      }
      Alert.alert(
        allDone ? 'Test tamamlandı' : 'İlerleme kaydedildi',
        allDone
          ? 'Sağlık testi hub’ındaki tüm bölümler işaretlendi.'
          : `${completed.length}/${total} bölüm tamamlandı. Kalan bölümlere daha sonra dönebilirsiniz.`,
      );
      router.replace('/health-test' as Href);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen scroll contentStyle={styles.screen}>
      <StatusBar style="dark" />
      <AppHeader showBack subtitle="Özet ve kayıt" title="Testi Bitir" />

      <View style={styles.content}>
      <View style={styles.card}>
        <Text style={styles.stat}>
          {completed.length} / {total}
        </Text>
        <Text style={styles.label}>tamamlanan bölüm</Text>
        <Text style={styles.body}>
          {allDone
            ? 'Tüm bölümler tamamlandı. Kaydetmek için aşağıdaki butonu kullanın.'
            : 'Eksik bölümler varsa hub’dan devam edebilirsiniz. Yine de mevcut ilerlemeyi kaydedebilirsiniz.'}
        </Text>
      </View>

      <Button label="Kaydet ve çık" loading={saving} onPress={() => void onFinish()} />
      <Button
        label="Bölümlere dön"
        onPress={() => router.replace('/health-test' as Href)}
        variant="secondary"
      />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingHorizontal: 0,
    paddingBottom: spacing.xxl,
  },
  content: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  card: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  stat: {
    fontFamily: fonts.displayExtra,
    fontSize: 36,
    color: colors.teal[700],
  },
  label: {
    marginTop: 4,
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.text.secondary,
  },
  body: {
    marginTop: spacing.md,
    fontFamily: fonts.regular,
    fontSize: 14.5,
    lineHeight: 22,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
