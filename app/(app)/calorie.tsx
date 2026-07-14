import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppHeader } from '@/components/ui/AppHeader';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { useApp } from '@/context/AppContext';
import { analyzeFoodPhoto, isAiVisionEnabled } from '@/services/aiVision';
import { analyzeFoodText, formatAnalysisReply } from '@/services/calorieChat';
import {
  memberHasManualCalorieAccess,
  memberHasPhotoCalorieAccess,
} from '@/utils/memberPackages';
import { colors, fonts, radius, spacing } from '@/constants/theme';

type Mode = 'text' | 'photo';

async function pickImageUri(): Promise<string | null> {
  try {
    // Lazy load — Expo Go / native module yoksa ekran çökmesin
    const ImagePicker = await import('expo-image-picker');
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('İzin gerekli', 'Fotoğraf seçmek için galeri izni verin.');
      return null;
    }
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (picked.canceled || !picked.assets[0]?.uri) return null;
    return picked.assets[0].uri;
  } catch {
    Alert.alert(
      'Fotoğraf kullanılamıyor',
      'Bu ortamda galeri modülü yok. Metin analizi kullanın veya uygulamayı yeniden başlatın (Expo Go güncel olmalı).',
    );
    return null;
  }
}

export default function CalorieScreen() {
  const { member, updateProfile } = useApp();
  const [mode, setMode] = useState<Mode>('text');
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultText, setResultText] = useState<string | null>(null);

  const canManual = memberHasManualCalorieAccess(member);
  const canPhoto = memberHasPhotoCalorieAccess(member) && isAiVisionEnabled();

  const persistHistory = async (entry: string) => {
    if (!member) return;
    const prev = (Array.isArray(member.calorieHistory) ? member.calorieHistory : []) as unknown[];
    const next = [{ at: new Date().toISOString(), summary: entry }, ...prev].slice(0, 40);
    await updateProfile({ calorieHistory: next });
  };

  const onAnalyzeText = async () => {
    if (!canManual) {
      Alert.alert('Erişim yok', 'Metin kalori analizi paketinizde yok.');
      return;
    }
    const trimmed = text.trim();
    if (!trimmed) {
      Alert.alert('Eksik bilgi', 'Analiz için yediğiniz yiyecekleri yazın.');
      return;
    }
    setLoading(true);
    setResultText(null);
    try {
      const result = await analyzeFoodText(trimmed);
      if (!result.ok) {
        Alert.alert('Analiz başarısız', result.error);
        return;
      }
      const formatted = formatAnalysisReply(result);
      setResultText(formatted);
      await persistHistory(formatted);
    } finally {
      setLoading(false);
    }
  };

  const onAnalyzePhoto = async () => {
    if (!canPhoto) {
      Alert.alert('Erişim yok', 'Fotoğraflı kalori analizi paketinizde yok.');
      return;
    }
    const uri = await pickImageUri();
    if (!uri) return;
    setLoading(true);
    setResultText(null);
    try {
      const result = await analyzeFoodPhoto(uri);
      if (!result.ok) {
        Alert.alert('Analiz başarısız', result.error);
        return;
      }
      const formatted = formatAnalysisReply(result);
      setResultText(formatted);
      await persistHistory(formatted);
    } finally {
      setLoading(false);
    }
  };

  if (!canManual && !canPhoto) {
    return (
      <Screen contentStyle={styles.screen}>
        <StatusBar style="dark" />
        <AppHeader showBack title="Kalori Hesapla" />
        <View style={styles.content}>
          <EmptyState
            subtitle="Kalori analizi için uygun bir üyelik paketiniz yok. Üyeliğim’den yükseltebilirsiniz."
            title="Paket gerekli"
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll contentStyle={styles.screen}>
      <StatusBar style="dark" />
      <AppHeader showBack subtitle="Metin veya fotoğraf ile tahmini kalori" title="Kalori Hesapla" />

      <View style={styles.content}>
        <View style={styles.chips}>
          {canManual ? (
            <Chip active={mode === 'text'} label="Metin" onPress={() => setMode('text')} />
          ) : null}
          {canPhoto ? (
            <Chip active={mode === 'photo'} label="Fotoğraf" onPress={() => setMode('photo')} />
          ) : null}
        </View>

        {mode === 'text' && canManual ? (
          <>
            <Text style={styles.label}>Ne yediniz?</Text>
            <TextInput
              cursorColor={colors.text.primary}
              multiline
              onChangeText={setText}
              placeholder="Örn: 2 yumurta, 1 dilim ekmek, 1 kase yoğurt"
              placeholderTextColor={colors.text.muted}
              style={styles.input}
              textAlignVertical="top"
              value={text}
            />
            <Button label="Analiz Et" loading={loading} onPress={() => void onAnalyzeText()} rightIcon="sparkles" />
          </>
        ) : null}

        {mode === 'photo' && canPhoto ? (
          <Button
            label="Galeriden fotoğraf seç"
            loading={loading}
            onPress={() => void onAnalyzePhoto()}
            rightIcon="camera"
          />
        ) : null}

        {resultText ? (
          <View style={styles.result}>
            <Text style={styles.resultTitle}>Sonuç</Text>
            <Text style={styles.resultBody}>{resultText}</Text>
          </View>
        ) : (
          <EmptyState
            subtitle="Analiz sonuçları tahmini değerlerdir ve geçmişinize kaydedilir."
            title="Henüz analiz yok"
          />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { paddingHorizontal: 0, paddingBottom: spacing.xxl },
  content: { paddingHorizontal: spacing.lg, gap: spacing.md },
  chips: { flexDirection: 'row', gap: spacing.sm },
  label: { fontFamily: fonts.semibold, fontSize: 14, color: colors.text.primary },
  input: {
    minHeight: 120,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.text.primary,
    backgroundColor: colors.surface,
  },
  result: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  resultTitle: {
    fontFamily: fonts.displaySemibold,
    fontSize: 16,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  resultBody: {
    fontFamily: fonts.regular,
    fontSize: 14.5,
    lineHeight: 22,
    color: colors.text.secondary,
  },
});
