import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { ComponentProps } from 'react';

import { PanelScaffold } from '@/components/panel/PanelScaffold';
import { EmptyState } from '@/components/ui/EmptyState';
import { FadeIn } from '@/components/ui/FadeIn';
import { InlineSpinner } from '@/components/ui/InlineSpinner';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { getPlanLabel } from '@/data/membershipPlans';
import { colors, fonts, radius, spacing } from '@/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

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

function ActionBtn({
  label,
  icon,
  color,
  onPress,
}: {
  label: string;
  icon: IconName;
  color: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}>
      <Ionicons color={color} name={icon} size={18} />
      <Text style={[styles.actionLabel, { color }]}>{label}</Text>
    </Pressable>
  );
}

/** LOCK: docs/mobile/screens/staff/clients.md */
export default function StaffClients() {
  const { staff } = useAuth();
  const { loading, staffClients } = useData();
  const role = String(staff?.role || 'coach');
  const [q, setQ] = useState('');

  const list = useMemo(() => {
    let items = staffClients.slice();
    const s = q.trim().toLowerCase();
    if (s) {
      items = items.filter(
        (c) =>
          String(c.name || '')
            .toLowerCase()
            .includes(s) ||
          String(c.email || '')
            .toLowerCase()
            .includes(s),
      );
    }
    return items;
  }, [q, staffClients]);

  return (
    <PanelScaffold subtitle="Atanmış danışanlarınız" title="Danışanlar">
      <View style={styles.searchWrap}>
        <Ionicons color={colors.cream[800]} name="search" size={18} />
        <TextInput
          onChangeText={setQ}
          placeholder="Ara…"
          placeholderTextColor={colors.cream[300]}
          style={styles.searchInput}
          value={q}
        />
      </View>
      {loading && staffClients.length === 0 ? (
        <InlineSpinner fill />
      ) : list.length === 0 ? (
        <EmptyState
          description="Atama sonrası burada görünür."
          icon="people"
          iconBg={colors.sage[100]}
          iconColor={colors.sage[600]}
          iconSize={64}
          title="Danışan yok"
        />
      ) : (
        list.map((c, i) => {
          const plan = String(c.membership || '');
          const badge = PLAN_BADGE[plan] || { bg: colors.cream[100], fg: colors.cream[800] };
          return (
            <FadeIn key={String(c.id)} delay={40 + i * 30}>
              <View style={styles.card}>
                <View style={styles.identityRow}>
                  <View
                    style={[
                      styles.avatar,
                      { backgroundColor: AVATAR_BG[plan] || colors.cream[300] },
                    ]}>
                    <Text style={styles.avatarText}>{initials(String(c.name))}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.nameRow}>
                      <Text numberOfLines={1} style={styles.name}>
                        {String(c.name)}
                      </Text>
                      <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                        <Text style={[styles.badgeText, { color: badge.fg }]}>
                          {getPlanLabel(plan)}
                        </Text>
                      </View>
                    </View>
                    <Text numberOfLines={1} style={styles.email}>
                      {String(c.email)}
                    </Text>
                  </View>
                </View>
                <View style={styles.cardDivider} />
                <View style={styles.actionRow}>
                  <ActionBtn
                    color={colors.sage[600]}
                    icon="fitness"
                    label="Sağlık"
                    onPress={() => router.push(`/(staff)/clients/${c.id}/health` as Href)}
                  />
                  {role === 'dietitian' ? (
                    <ActionBtn
                      color={colors.sage[600]}
                      icon="restaurant"
                      label="Liste"
                      onPress={() => router.push('/(staff)/lists' as Href)}
                    />
                  ) : (
                    <ActionBtn
                      color={colors.brand[600]}
                      icon="barbell"
                      label="Program"
                      onPress={() => router.push(`/(staff)/clients/${c.id}/program` as Href)}
                    />
                  )}
                  <ActionBtn
                    color={colors.warm[500]}
                    icon="chatbubble"
                    label="Mesaj"
                    onPress={() => router.push(`/(staff)/messages/${c.id}` as Href)}
                  />
                </View>
              </View>
            </FadeIn>
          );
        })
      )}
    </PanelScaffold>
  );
}

const styles = StyleSheet.create({
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 48,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.cream[200],
    paddingHorizontal: 14,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.cream[900],
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.cream[200],
  },
  identityRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: fonts.sansSemi, fontSize: 15, color: colors.white },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { flexShrink: 1, fontFamily: fonts.sansSemi, fontSize: 16, color: colors.cream[900] },
  badge: {
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: { fontFamily: fonts.sansSemi, fontSize: 11 },
  email: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.cream[800],
    opacity: 0.65,
    marginTop: 2,
  },
  cardDivider: { height: 1, backgroundColor: colors.cream[100], marginVertical: 10 },
  actionRow: { flexDirection: 'row', gap: 8 },
  action: {
    flex: 1,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.cream[50],
    borderRadius: radius.md,
  },
  actionPressed: { transform: [{ scale: 0.94 }] },
  actionLabel: { fontFamily: fonts.sansSemi, fontSize: 12 },
});
