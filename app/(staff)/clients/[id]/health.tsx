import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { PanelScaffold } from '@/components/panel/PanelScaffold';
import { Button } from '@/components/ui/Button';
import { FadeIn } from '@/components/ui/FadeIn';
import { InlineSpinner } from '@/components/ui/InlineSpinner';
import { useData } from '@/context/DataContext';
import { useToast } from '@/context/ToastContext';
import { getPlanLabel } from '@/data/membershipPlans';
import { colors, fonts, radius, spacing } from '@/theme';

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

const AVATAR_BG: Record<string, string> = {
  vip: colors.gold[400],
  spor: colors.brand[500],
  diyet: colors.sage[500],
};

const PLAN_BADGE: Record<string, { bg: string; fg: string }> = {
  vip: { bg: colors.gold[400], fg: colors.white },
  spor: { bg: colors.brand[100], fg: colors.brand[700] },
  diyet: { bg: colors.sage[100], fg: colors.sage[700] },
};

const GENDER_TR: Record<string, string> = { female: 'Kadın', male: 'Erkek' };

/** Demo sunum verisi — sağlık testi katalog alanı değildir (UI-only). */
const DEMO_ANSWERS = [
  { label: 'Hedef', value: 'Kilo vermek ve kondisyon kazanmak' },
  { label: 'Aktivite düzeyi', value: 'Haftada 2–3 gün hafif egzersiz' },
  { label: 'Kronik rahatsızlık', value: 'Belirtilmedi' },
  { label: 'Uyku', value: 'Ortalama 6–7 saat' },
];

/** LOCK: docs/mobile/screens/staff/client-health.md */
export default function ClientHealth() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { loading, staffClients } = useData();
  const client = staffClients.find((c) => String(c.id) === String(id));
  const { toast } = useToast();
  const [note, setNote] = useState('');
  const [focused, setFocused] = useState(false);

  const plan = String(client?.membership || '');
  const badge = PLAN_BADGE[plan] || { bg: colors.cream[100], fg: colors.cream[800] };
  const genderTr = GENDER_TR[String(client?.gender || '')] || '—';

  return (
    <PanelScaffold
      showBack
      subtitle={client ? String(client.name) : 'Danışan'}
      title="Sağlık özeti">
      {loading && !client ? (
        <InlineSpinner fill />
      ) : (
        <>
      <FadeIn delay={40}>
        <View style={styles.identityCard}>
          <View
            style={[
              styles.avatar,
              { backgroundColor: AVATAR_BG[plan] || colors.cream[300] },
            ]}>
            <Text style={styles.avatarText}>
              {client ? initials(String(client.name)) : '—'}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text numberOfLines={1} style={styles.name}>
              {client ? String(client.name) : '—'}
            </Text>
            <View style={styles.identityMeta}>
              <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                <Text style={[styles.badgeText, { color: badge.fg }]}>
                  {client ? getPlanLabel(plan) : '—'}
                </Text>
              </View>
              <Text style={styles.gender}>{genderTr}</Text>
            </View>
          </View>
        </View>
      </FadeIn>

      <FadeIn delay={80}>
        <View style={styles.card}>
          <Text style={styles.cardHeading}>Sağlık testi</Text>
          {DEMO_ANSWERS.map((row, i) => (
            <View key={row.label}>
              {i > 0 ? <View style={styles.rowDivider} /> : null}
              <Text style={styles.label}>{row.label}</Text>
              <Text style={styles.val}>{row.value}</Text>
            </View>
          ))}
        </View>
      </FadeIn>

      <FadeIn delay={120}>
        <Text style={styles.label}>Not</Text>
        <TextInput
          multiline
          onBlur={() => setFocused(false)}
          onChangeText={setNote}
          onFocus={() => setFocused(true)}
          placeholder="Danışan notu…"
          placeholderTextColor={colors.cream[300]}
          style={[styles.input, focused && styles.inputFocused]}
          value={note}
        />
        <Button
          disabled={!note.trim()}
          label="Notu kaydet"
          onPress={() => toast('Not kaydedildi.', 'success')}
          style={{ marginTop: spacing.sm }}
        />
      </FadeIn>
        </>
      )}
    </PanelScaffold>
  );
}

const styles = StyleSheet.create({
  identityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.cream[200],
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: fonts.sansSemi, fontSize: 16, color: colors.white },
  name: { fontFamily: fonts.sansSemi, fontSize: 16, color: colors.cream[900] },
  identityMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  badge: {
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: { fontFamily: fonts.sansSemi, fontSize: 11 },
  gender: { fontFamily: fonts.sans, fontSize: 13, color: colors.cream[800] },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.cream[200],
    gap: 8,
  },
  cardHeading: { fontFamily: fonts.sansSemi, fontSize: 16, color: colors.cream[900] },
  rowDivider: { height: 1, backgroundColor: colors.cream[100], marginBottom: 8 },
  label: {
    fontFamily: fonts.sansSemi,
    fontSize: 12,
    color: colors.brand[600],
    textTransform: 'uppercase',
  },
  val: { fontFamily: fonts.sans, fontSize: 15, color: colors.cream[900], marginTop: 2 },
  input: {
    minHeight: 100,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cream[200],
    padding: 12,
    marginTop: 6,
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.cream[900],
    textAlignVertical: 'top',
  },
  inputFocused: { borderColor: colors.brand[300] },
});
