/**
 * Web parity: Adsız ActivationChecklist.jsx
 * MOBILE DIFF: paket CTA → /(member)/profile/payments
 */
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { router, type Href } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { isHealthTestComplete } from '@/data/healthTest';
import { isPaidMembership } from '@/data/membershipPlans';
import { colors, fonts, radius, spacing } from '@/theme';

function storageKey(userId: string) {
  return `activation_checklist_dismissed_${userId}`;
}

type Step = {
  id: string;
  label: string;
  hint: string;
  done: boolean;
  href: Href;
  icon: keyof typeof Ionicons.glyphMap;
};

export function ActivationChecklist({
  userId,
  membership,
  packageConfig,
  healthAck,
  disclaimer,
  healthTest,
  gender,
  myPrograms = [],
  coachSessions = [],
  dietitianSessions = [],
  doctorSessions = [],
}: {
  userId?: string | null;
  membership?: string | null;
  packageConfig?: Record<string, unknown> | null;
  healthAck?: unknown;
  disclaimer?: unknown;
  healthTest?: Record<string, unknown> | null;
  gender?: string | null;
  myPrograms?: unknown[];
  coachSessions?: unknown[];
  dietitianSessions?: unknown[];
  doctorSessions?: unknown[];
}) {
  const [dismissed, setDismissed] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!userId) {
      setReady(true);
      return;
    }
    let alive = true;
    void AsyncStorage.getItem(storageKey(userId)).then((v) => {
      if (!alive) return;
      setDismissed(v === '1');
      setReady(true);
    });
    return () => {
      alive = false;
    };
  }, [userId]);

  const steps = useMemo<Step[]>(() => {
    const htDone = Boolean(
      healthAck &&
        disclaimer &&
        isHealthTestComplete(healthTest, gender, packageConfig),
    );
    const paid = isPaidMembership(membership);
    const hasProgram = (myPrograms || []).length > 0;
    const hasSession =
      (coachSessions || []).length +
        (dietitianSessions || []).length +
        (doctorSessions || []).length >
      0;

    const list: Step[] = [
      {
        id: 'health_test',
        label: 'Kişisel sağlık analizini tamamla',
        hint: 'Skorlarınızın doğru hesaplanması için gerekli',
        done: htDone,
        href: '/(member)/health-test' as Href,
        icon: 'heart',
      },
    ];

    if (!paid) {
      list.push({
        id: 'plan',
        label: 'Paket seç',
        hint: 'Mesaj, takvim, program ve uzman raporları için',
        done: false,
        href: '/(member)/profile/payments' as Href,
        icon: 'diamond',
      });
    } else {
      list.push({
        id: 'session',
        label: 'İlk randevunu al',
        hint: 'Koç, diyetisyen veya doktor görüşmesi',
        done: hasSession,
        href: '/(member)/schedule' as Href,
        icon: 'calendar',
      });
      list.push({
        id: 'program',
        label: 'Programını kontrol et',
        hint: hasProgram
          ? 'Personelin gönderdiği program hazır'
          : 'Personelin program gönderince burada görünür',
        done: hasProgram,
        href: '/(member)/programs' as Href,
        icon: 'clipboard',
      });
    }

    return list;
  }, [
    healthAck,
    disclaimer,
    healthTest,
    gender,
    packageConfig,
    membership,
    myPrograms,
    coachSessions,
    dietitianSessions,
    doctorSessions,
  ]);

  const remaining = steps.filter((s) => !s.done).length;
  const allDone = remaining === 0;

  if (!ready || dismissed || allDone || !userId) return null;

  const dismiss = () => {
    void AsyncStorage.setItem(storageKey(userId), '1');
    setDismissed(true);
  };

  return (
    <LinearGradient
      colors={[colors.brand[50], colors.white, colors.sage[50]]}
      end={{ x: 1, y: 1 }}
      start={{ x: 0, y: 0 }}
      style={styles.card}>
      <View style={styles.head}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Başlangıç adımları</Text>
          <Text style={styles.sub}>
            {remaining} adım kaldı — sırayla tamamlayın
          </Text>
        </View>
        <Pressable
          accessibilityLabel="Listeyi kapat"
          hitSlop={8}
          onPress={dismiss}
          style={styles.close}>
          <Ionicons color={colors.cream[300]} name="close" size={18} />
        </Pressable>
      </View>
      {steps.map((step) => {
        const inner = (
          <>
            <View
              style={[styles.stepIcon, step.done && styles.stepIconDone]}>
              <Ionicons
                color={step.done ? colors.sage[600] : colors.brand[600]}
                name={step.icon}
                size={16}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.stepLabel, step.done && styles.stepDone]}>
                {step.label}
              </Text>
              <Text style={styles.stepHint}>{step.hint}</Text>
            </View>
            <Ionicons
              color={step.done ? colors.sage[500] : colors.cream[300]}
              name={step.done ? 'checkmark-circle' : 'ellipse-outline'}
              size={20}
            />
          </>
        );
        if (step.done) {
          return (
            <View key={step.id} style={styles.stepRow}>
              {inner}
            </View>
          );
        }
        return (
          <Pressable
            key={step.id}
            onPress={() => router.push(step.href)}
            style={({ pressed }) => [styles.stepRow, pressed && { opacity: 0.85 }]}>
            {inner}
          </Pressable>
        );
      })}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.brand[200],
    padding: spacing.md,
    gap: spacing.sm,
  },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  title: {
    fontFamily: fonts.displayBold,
    fontSize: 17,
    color: colors.cream[900],
  },
  sub: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.cream[800],
    marginTop: 2,
    opacity: 0.7,
  },
  close: { padding: 4 },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  stepIcon: {
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.cream[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepIconDone: {
    backgroundColor: colors.sage[100],
    borderColor: colors.sage[200],
  },
  stepLabel: {
    fontFamily: fonts.sansSemi,
    fontSize: 14,
    color: colors.cream[900],
  },
  stepDone: {
    color: colors.cream[800],
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  stepHint: {
    fontFamily: fonts.sans,
    fontSize: 11,
    color: colors.cream[800],
    opacity: 0.55,
    marginTop: 2,
  },
});
