import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeIn as ReFadeIn, SlideInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PanelScaffold } from '@/components/panel/PanelScaffold';
import { Button } from '@/components/ui/Button';
import { FadeIn } from '@/components/ui/FadeIn';
import { TextField } from '@/components/ui/TextField';
import { useToast } from '@/context/ToastContext';
import { ALL_PLANS, formatTry, type PlanCard } from '@/data/membershipPlans';
import { colors, fonts, radius, spacing } from '@/theme';

/** LOCK: docs/mobile/screens/admin/plans.md */
export default function AdminPlans() {
  const insets = useSafeAreaInsets();
  const { toast } = useToast();
  const [plans, setPlans] = useState<PlanCard[]>(() => ALL_PLANS.map((p) => ({ ...p })));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [priceDraft, setPriceDraft] = useState('');
  const [blurbDraft, setBlurbDraft] = useState('');

  const editing = plans.find((p) => p.id === editingId);
  const parsedPrice = Number(priceDraft.replace(',', '.'));
  const priceValid = priceDraft.trim() !== '' && !Number.isNaN(parsedPrice) && parsedPrice >= 0;

  const openEdit = (plan: PlanCard) => {
    setPriceDraft(String(plan.price));
    setBlurbDraft(plan.blurb);
    setEditingId(plan.id);
  };

  const save = () => {
    if (!editing || !priceValid) return;
    const name = editing.name;
    setPlans((prev) =>
      prev.map((p) =>
        p.id === editing.id ? { ...p, price: parsedPrice, blurb: blurbDraft.trim() } : p,
      ),
    );
    setEditingId(null);
    toast(`${name} güncellendi.`, 'success');
  };

  return (
    <PanelScaffold showBack subtitle="Paket tanımları" title="Planlar">
      {plans.map((p, i) => {
        const isVip = p.id === 'vip';
        const inner = (
          <>
            {isVip ? (
              <View style={styles.vipBadge}>
                <Text style={styles.vipBadgeText}>En kapsamlı</Text>
              </View>
            ) : null}
            <View style={styles.cardTop}>
              <Text style={styles.title}>{p.name}</Text>
              <Pressable
                hitSlop={6}
                onPress={() => openEdit(p)}
                style={({ pressed }) => [styles.editBtn, pressed && styles.editBtnPressed]}>
                <Ionicons color={colors.brand[600]} name="create-outline" size={20} />
              </Pressable>
            </View>
            <Animated.View
              entering={ReFadeIn.duration(200)}
              key={`${p.price}-${p.blurb}`}>
              <View style={styles.priceRow}>
                <Text style={styles.price}>{formatTry(p.price)}</Text>
                {p.price > 0 ? (
                  <Text style={styles.period}>/ {p.period.toLocaleLowerCase('tr-TR')}</Text>
                ) : null}
              </View>
              <Text style={styles.blurb}>{p.blurb}</Text>
            </Animated.View>
          </>
        );
        return (
          <FadeIn delay={i * 40} key={p.id}>
            {isVip ? (
              <LinearGradient
                colors={[colors.warm[50], colors.white]}
                end={{ x: 0.5, y: 1 }}
                start={{ x: 0.5, y: 0 }}
                style={[styles.card, styles.cardVip]}>
                {inner}
              </LinearGradient>
            ) : (
              <View style={styles.card}>{inner}</View>
            )}
          </FadeIn>
        );
      })}

      <Modal
        animationType="none"
        onRequestClose={() => setEditingId(null)}
        transparent
        visible={Boolean(editing)}>
        <View style={styles.sheetRoot}>
          <Animated.View entering={ReFadeIn.duration(180)} style={StyleSheet.absoluteFill}>
            <Pressable onPress={() => setEditingId(null)} style={styles.scrim} />
          </Animated.View>
          {editing ? (
            <Animated.View
              entering={SlideInDown.springify().damping(18)}
              style={[styles.sheet, { paddingBottom: insets.bottom + spacing.md }]}>
              <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <View style={styles.grabber} />
                <Text style={styles.sheetTitle}>{editing.name} düzenle</Text>
                <ScrollView contentContainerStyle={styles.sheetBody} keyboardShouldPersistTaps="handled">
                  <TextField
                    keyboardType="numeric"
                    label="Fiyat (₺)"
                    onChangeText={setPriceDraft}
                    value={priceDraft}
                  />
                  <TextField
                    label="Açıklama"
                    multiline
                    onChangeText={setBlurbDraft}
                    style={styles.blurbInput}
                    value={blurbDraft}
                  />
                  <Button disabled={!priceValid} label="Kaydet" onPress={save} />
                  <Button label="Vazgeç" onPress={() => setEditingId(null)} variant="ghost" />
                </ScrollView>
              </KeyboardAvoidingView>
            </Animated.View>
          ) : null}
        </View>
      </Modal>
    </PanelScaffold>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.cream[200],
    overflow: 'hidden',
  },
  cardVip: {
    backgroundColor: undefined,
    borderColor: `${colors.gold[400]}66`,
  },
  vipBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: colors.gold[400],
    borderBottomLeftRadius: radius.lg,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  vipBadgeText: { fontFamily: fonts.sansSemi, fontSize: 10, color: colors.white },
  cardTop: { flexDirection: 'row', alignItems: 'center' },
  title: { flex: 1, fontFamily: fonts.sansSemi, fontSize: 16, color: colors.cream[900] },
  editBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBtnPressed: { backgroundColor: colors.cream[100] },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  price: { fontFamily: fonts.displayExtra, fontSize: 22, color: colors.brand[700] },
  period: { fontFamily: fonts.sans, fontSize: 12, color: colors.cream[800] },
  blurb: { fontFamily: fonts.sans, fontSize: 12, color: colors.cream[800], marginTop: 4 },
  sheetRoot: { flex: 1, justifyContent: 'flex-end' },
  scrim: { flex: 1, backgroundColor: 'rgba(26,35,50,0.4)' },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    maxHeight: '85%',
  },
  grabber: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: radius.full,
    backgroundColor: colors.cream[300],
    marginBottom: spacing.sm,
  },
  sheetTitle: { fontFamily: fonts.displayExtra, fontSize: 18, color: colors.cream[900] },
  sheetBody: { gap: spacing.md, paddingTop: spacing.md },
  blurbInput: { minHeight: 80, textAlignVertical: 'top' },
});
