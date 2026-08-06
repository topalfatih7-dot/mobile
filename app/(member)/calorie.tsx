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
import { analyzeFoodText, analyzeFoodVision, isCalorieAiEnabled } from '@/services/calorieAi';
import {
  pickImageFromCameraDetailed,
  pickImageFromLibraryDetailed,
} from '@/services/memberMedia';
import { formatAnalysisReply, type CalorieAnalysis } from '@/utils/calorieFormat';
import {
  memberHasManualCalorieAccess,
  memberHasPhotoCalorieAccess,
} from '@/utils/memberPackages';
import { colors, fonts, radius, spacing } from '@/theme';

type ChatMsg = { id: string; role: 'user' | 'assistant'; text: string };

const TYPING_ID = 'typing';
const DAILY_GOAL = 2000;

function itemsTotalCal(items: { cal?: number }[] = []) {
  return items.reduce((sum, i) => sum + (Number(i.cal) || 0), 0);
}

/** Web parity: CalorieCalculatorPage.estimateMacros */
function estimateMacros(totalCal: number) {
  return {
    protein: Math.round((totalCal * 0.25) / 4),
    carb: Math.round((totalCal * 0.45) / 4),
    fat: Math.round((totalCal * 0.3) / 9),
  };
}

function CalorieSummaryCard({ totalCal }: { totalCal: number }) {
  const macros = estimateMacros(totalCal);
  const level =
    totalCal < 300 ? 'Az' : totalCal < 600 ? 'Orta' : totalCal < 900 ? 'Yüksek' : 'Çok Yüksek';
  const pct = Math.min(Math.round((totalCal / DAILY_GOAL) * 100), 100);

  return (
    <View style={styles.summaryCard}>
      <View style={styles.summaryTop}>
        <View style={{ flex: 1 }}>
          <Text style={styles.summaryLabel}>Toplam Kalori</Text>
          <Text style={styles.summaryCal}>{totalCal}</Text>
          <Text style={styles.summaryUnit}>kcal · {level}</Text>
        </View>
        <Ionicons color="rgba(255,255,255,0.35)" name="flame" size={36} />
      </View>
      {totalCal > 0 ? (
        <View style={styles.macroGrid}>
          {[
            { label: 'Protein', value: macros.protein },
            { label: 'Karb.', value: macros.carb },
            { label: 'Yağ', value: macros.fat },
          ].map((m) => (
            <View key={m.label} style={styles.macroCell}>
              <Text style={styles.macroVal}>{m.value}g</Text>
              <Text style={styles.macroLabel}>{m.label}</Text>
            </View>
          ))}
        </View>
      ) : null}
      {totalCal > 0 ? (
        <View style={styles.summaryFooter}>
          <Text style={styles.summaryHint}>
            Günlük 2000 kcal hedefinin{' '}
            <Text style={styles.summaryHintBold}>{Math.round((totalCal / DAILY_GOAL) * 100)}%</Text>
            &apos;i
          </Text>
          <View style={styles.summaryTrack}>
            <View style={[styles.summaryFill, { width: `${pct}%` }]} />
          </View>
        </View>
      ) : null}
    </View>
  );
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
  const [activeTotal, setActiveTotal] = useState(0);
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Merhaba! Ne yediğinizi yazın — tahmini kalori değerlerini hesaplayalım.\nÖrnek: “2 yumurta, 1 dilim ekmek, 1 kase yoğurt”',
    },
  ]);

  const canManual =
    isCalorieAiEnabled() && memberHasManualCalorieAccess(member as never);
  const canPhoto =
    isCalorieAiEnabled() && memberHasPhotoCalorieAccess(member as never);

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
    setActiveTotal(itemsTotalCal(result.analysis.items));
    const reply = formatAnalysisReply(result.analysis);
    setMessages((m) => [
      ...m,
      { id: `a-${Date.now()}`, role: 'assistant', text: reply },
    ]);
    setBusy(false);
  };

  const runVision = async (useCamera: boolean) => {
    if (!canPhoto || busy) return;
    const result = useCamera
      ? await pickImageFromCameraDetailed()
      : await pickImageFromLibraryDetailed();
    if (!result.ok) {
      if (result.code !== 'canceled') {
        toast(result.message, result.code === 'native_missing' ? 'error' : 'warning');
      }
      return;
    }
    const picked = result.image;
    if (!picked?.base64) {
      toast('Görsel seçilemedi veya izin verilmedi.', 'warning');
      return;
    }

    setMessages((m) => [
      ...m,
      { id: `u-${Date.now()}`, role: 'user', text: '📷 Fotoğraf gönderildi' },
    ]);
    setBusy(true);
    const analysis = await analyzeFoodVision(
      picked.base64,
      picked.mimeType || 'image/jpeg',
    );
    if (!analysis.ok) {
      toast(analysis.error, 'error');
      setBusy(false);
      return;
    }
    void persistHistory('photo', 'fotoğraf', analysis.analysis);
    setActiveTotal(itemsTotalCal(analysis.analysis.items));
    const reply = formatAnalysisReply(analysis.analysis);
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

        <View style={styles.summaryWrap}>
          <CalorieSummaryCard totalCal={activeTotal} />
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
  summaryWrap: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  summaryCard: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: colors.brand[600],
  },
  summaryTop: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: spacing.md,
  },
  summaryLabel: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
  },
  summaryCal: {
    fontFamily: fonts.displayExtra,
    fontSize: 40,
    color: colors.white,
    lineHeight: 44,
  },
  summaryUnit: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
  },
  macroGrid: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  macroCell: {
    flex: 1,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 8,
    alignItems: 'center',
  },
  macroVal: {
    fontFamily: fonts.sansBold,
    fontSize: 16,
    color: colors.white,
  },
  macroLabel: {
    fontFamily: fonts.sans,
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  summaryFooter: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(0,0,0,0.1)',
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    gap: 8,
  },
  summaryHint: {
    fontFamily: fonts.sans,
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
  },
  summaryHintBold: {
    fontFamily: fonts.sansSemi,
    color: colors.white,
  },
  summaryTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
  },
  summaryFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: colors.white,
  },
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
