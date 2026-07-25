import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActionSheetIOS,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { FadeIn } from '@/components/ui/FadeIn';
import { MeshBackground } from '@/components/ui/MeshBackground';
import { useActions } from '@/context/ActionsContext';
import { useMember } from '@/context/DataContext';
import { useToast } from '@/context/ToastContext';
import { analyzeFoodText, analyzeFoodVision } from '@/services/calorieAi';
import {
  pickImageFromCamera,
  pickImageFromLibrary,
} from '@/services/memberMedia';
import { formatAnalysisReply, type CalorieAnalysis } from '@/utils/calorieFormat';
import {
  memberHasManualCalorieAccess,
  memberHasPhotoCalorieAccess,
} from '@/utils/memberPackages';
import { colors, fonts, radius, spacing } from '@/theme';

type ChatMsg = { id: string; role: 'user' | 'assistant'; text: string };

const TYPING_ID = 'typing';

function itemsTotalCal(items: { cal?: number }[] = []) {
  return items.reduce((sum, i) => sum + (Number(i.cal) || 0), 0);
}

/** Web parity: CalorieCalculatorPage.buildCalorieLogEntry + appendCalorieHistory */
function appendCalorieHistory(
  existing: unknown[] = [],
  entry: Record<string, unknown>,
) {
  return [entry, ...(Array.isArray(existing) ? existing : [])].slice(0, 100);
}

function buildCalorieLogEntry(opts: {
  mode: 'text' | 'photo';
  input: string;
  analysis: CalorieAnalysis;
}) {
  return {
    id: `cal-${Date.now()}`,
    mode: opts.mode,
    input: (opts.input || '').slice(0, 500),
    totalCal: itemsTotalCal(opts.analysis.items),
    items: (opts.analysis.items || []).slice(0, 20).map((i) => ({
      name: i.name,
      cal: i.cal,
      protein: i.protein,
      carb: i.carb,
      fat: i.fat,
    })),
    createdAt: new Date().toISOString(),
  };
}

function TypingDot({ delay }: { delay: number }) {
  const opacity = useSharedValue(0.25);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 300 }),
          withTiming(0.25, { duration: 300 }),
        ),
        -1,
      ),
    );
  }, [delay, opacity]);

  const anim = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return <Animated.View style={[styles.typingDot, anim]} />;
}

/**
 * LOCK: docs/mobile/screens/member/calorie.md
 * Web parity: CalorieCalculatorPage
 */
export default function CalorieScreen() {
  const insets = useSafeAreaInsets();
  const member = useMember();
  const { updateProfile } = useActions();
  const { toast } = useToast();
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Merhaba! Ne yediğinizi yazın — tahmini kalori değerlerini hesaplayalım.\nÖrnek: “2 yumurta, 1 dilim ekmek, 1 kase yoğurt”',
    },
  ]);

  const canManual = memberHasManualCalorieAccess(member as never);
  const canPhoto = memberHasPhotoCalorieAccess(member as never);

  const persistHistory = async (
    mode: 'text' | 'photo',
    input: string,
    analysis: CalorieAnalysis,
  ) => {
    const entry = buildCalorieLogEntry({ mode, input, analysis });
    const next = appendCalorieHistory(
      (member?.calorieHistory as unknown[]) || [],
      entry,
    );
    try {
      await updateProfile({ calorieHistory: next });
    } catch {
      /* swallow — web also .catch(() => {}) */
    }
  };

  const send = async () => {
    const trimmed = text.trim();
    if (trimmed.length < 2) {
      toast('Metin gerekli', 'warning');
      return;
    }
    if (trimmed.length > 2000) {
      toast('Metin çok uzun (max 2000 karakter)', 'warning');
      return;
    }
    setText('');
    const userMsg: ChatMsg = { id: `u-${Date.now()}`, role: 'user', text: trimmed };
    setMessages((m) => [...m, userMsg]);
    setBusy(true);
    const result = await analyzeFoodText(trimmed);
    if (!result.ok) {
      toast(result.error, 'error');
      setBusy(false);
      return;
    }
    void persistHistory('text', trimmed, result.analysis);
    const reply = formatAnalysisReply(result.analysis);
    setMessages((m) => [
      ...m,
      { id: `a-${Date.now()}`, role: 'assistant', text: reply },
    ]);
    setBusy(false);
  };

  const runVision = async (useCamera: boolean) => {
    if (!canPhoto || busy) return;
    const picked = useCamera
      ? await pickImageFromCamera()
      : await pickImageFromLibrary();
    if (!picked?.base64) {
      toast('Görsel seçilemedi veya izin verilmedi.', 'warning');
      return;
    }

    setMessages((m) => [
      ...m,
      { id: `u-${Date.now()}`, role: 'user', text: '📷 Fotoğraf gönderildi' },
    ]);
    setBusy(true);
    const result = await analyzeFoodVision(
      picked.base64,
      picked.mimeType || 'image/jpeg',
    );
    if (!result.ok) {
      toast(result.error, 'error');
      setBusy(false);
      return;
    }
    void persistHistory('photo', 'fotoğraf', result.analysis);
    const reply = formatAnalysisReply(result.analysis);
    setMessages((m) => [
      ...m,
      { id: `a-${Date.now()}`, role: 'assistant', text: reply },
    ]);
    setBusy(false);
  };

  const onPhotoPress = () => {
    if (!canPhoto) {
      toast('Fotoğraf analizi paketinizde yok.', 'warning');
      return;
    }
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Vazgeç', 'Kamera', 'Galeri'],
          cancelButtonIndex: 0,
        },
        (idx) => {
          if (idx === 1) void runVision(true);
          if (idx === 2) void runVision(false);
        },
      );
      return;
    }
    Alert.alert('Fotoğraf kaynağı', 'Nereden seçmek istersiniz?', [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Kamera', onPress: () => void runVision(true) },
      { text: 'Galeri', onPress: () => void runVision(false) },
    ]);
  };

  const list = useMemo(() => {
    const arr = [...messages].reverse();
    if (busy) {
      arr.unshift({ id: TYPING_ID, role: 'assistant', text: '' });
    }
    return arr;
  }, [messages, busy]);

  if (!canManual) {
    return (
      <MeshBackground style={styles.root}>
        <View style={[styles.lock, { paddingTop: insets.top + 24 }]}>
          <View style={styles.lockCard}>
            <View style={styles.lockIconCircle}>
              <Ionicons color={colors.warm[500]} name="lock-closed" size={32} />
            </View>
            <Text style={styles.lockTitle}>Kalori AI paketinizde yok</Text>
            <Text style={styles.lockDesc}>
              Metin ile kalori analizi için uygun bir plana geçin.
            </Text>
            <Button
              label="Paketleri gör"
              onPress={() => router.push('/(member)/profile/payments' as Href)}
            />
            <Button label="Geri" onPress={() => router.back()} variant="ghost" />
          </View>
        </View>
      </MeshBackground>
    );
  }

  return (
    <MeshBackground style={styles.root}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}>
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <Pressable
            accessibilityLabel="Geri"
            accessibilityRole="button"
            hitSlop={10}
            onPress={() => router.back()}>
            <Ionicons color={colors.brand[600]} name="chevron-back" size={22} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Kalori Hesapla</Text>
            <Text style={styles.sub}>
              {canPhoto
                ? 'Yazarak veya fotoğrafla tahmini kalori hesabı'
                : 'Ne yediğinizi yazın, tahmini kalori değerlerini görün'}
            </Text>
          </View>
          <Pressable
            accessibilityLabel={canPhoto ? 'Kamera' : 'Kamera kilitli'}
            accessibilityRole="button"
            disabled={!canPhoto || busy}
            onPress={onPhotoPress}
            style={[styles.camBtn, !canPhoto && styles.camLocked]}>
            <Ionicons
              color={canPhoto ? colors.brand[700] : colors.cream[300]}
              name={canPhoto ? 'camera' : 'lock-closed'}
              size={18}
            />
          </Pressable>
        </View>

        <FlatList
          contentContainerStyle={styles.list}
          data={list}
          inverted
          keyExtractor={(m) => m.id}
          renderItem={({ item }) => {
            if (item.role === 'user') {
              return (
                <Animated.View
                  entering={FadeInUp.duration(200)}
                  style={[styles.bubble, styles.bubbleUser]}>
                  <Text style={[styles.bubbleText, styles.bubbleTextUser]}>
                    {item.text}
                  </Text>
                </Animated.View>
              );
            }
            return (
              <Animated.View entering={FadeInUp.duration(200)} style={styles.aiRow}>
                <View style={styles.aiBadge}>
                  <Ionicons color={colors.brand[600]} name="sparkles" size={13} />
                </View>
                {item.id === TYPING_ID ? (
                  <View style={[styles.bubble, styles.bubbleAi, styles.typingBubble]}>
                    <TypingDot delay={0} />
                    <TypingDot delay={150} />
                    <TypingDot delay={300} />
                  </View>
                ) : (
                  <View style={[styles.bubble, styles.bubbleAi]}>
                    <Text style={styles.bubbleText}>{item.text}</Text>
                  </View>
                )}
              </Animated.View>
            );
          }}
        />

        <FadeIn>
          <View style={[styles.composer, { paddingBottom: insets.bottom + 10 }]}>
            <TextInput
              editable={!busy}
              multiline
              onChangeText={setText}
              placeholder="Örn: 2 yumurta, 1 dilim ekmek, 200g tavuk"
              placeholderTextColor={colors.cream[300]}
              style={styles.input}
              value={text}
            />
            <Pressable
              accessibilityLabel="Gönder"
              accessibilityRole="button"
              disabled={busy || !text.trim()}
              onPress={send}
              style={[styles.send, (busy || !text.trim()) && styles.sendOff]}>
              <Ionicons color={colors.white} name="send" size={18} />
            </Pressable>
          </View>
        </FadeIn>
      </KeyboardAvoidingView>
    </MeshBackground>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  title: { fontFamily: fonts.displayExtra, fontSize: 22, color: colors.cream[900] },
  sub: { fontFamily: fonts.sans, fontSize: 12, color: colors.cream[800] },
  camBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.brand[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  camLocked: { borderColor: colors.cream[200] },
  list: { padding: spacing.lg, gap: 8 },
  bubble: {
    borderRadius: radius.lg,
    padding: 12,
    marginBottom: 8,
    maxWidth: '88%',
  },
  bubbleUser: {
    alignSelf: 'flex-end',
    backgroundColor: colors.brand[600],
    borderBottomRightRadius: 6,
  },
  bubbleAi: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.cream[200],
    borderBottomLeftRadius: 6,
  },
  aiRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    alignSelf: 'flex-start',
    maxWidth: '92%',
  },
  aiBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.brand[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 16,
  },
  typingDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.cream[300],
  },
  bubbleText: { fontFamily: fonts.sans, fontSize: 14, color: colors.cream[900], lineHeight: 20 },
  bubbleTextUser: { color: colors.white },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.cream[200],
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cream[200],
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.cream[900],
  },
  send: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.brand[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendOff: { opacity: 0.45 },
  lock: {
    flex: 1,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockCard: {
    alignSelf: 'stretch',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.cream[200],
    padding: spacing.xl,
  },
  lockIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.warm[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockTitle: {
    fontFamily: fonts.displayExtra,
    fontSize: 22,
    color: colors.cream[900],
    textAlign: 'center',
  },
  lockDesc: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.cream[800],
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
});
