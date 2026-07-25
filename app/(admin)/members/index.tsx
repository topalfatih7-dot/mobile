import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { PanelScaffold } from '@/components/panel/PanelScaffold';
import { EmptyState } from '@/components/ui/EmptyState';
import { FadeIn } from '@/components/ui/FadeIn';
import { InlineSpinner } from '@/components/ui/InlineSpinner';
import { useData } from '@/context/DataContext';
import { getPlanLabel } from '@/data/membershipPlans';
import { colors, fonts, radius, spacing } from '@/theme';

/** LOCK: docs/mobile/screens/admin/members.md */
export default function AdminMembers() {
  const { loading, platform } = useData();
  const members = platform.members;
  const [q, setQ] = useState('');
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return members;
    return members.filter(
      (c) =>
        String(c.name).toLowerCase().includes(s) || String(c.email).toLowerCase().includes(s),
    );
  }, [q, members]);

  return (
    <PanelScaffold showBack subtitle="Üye listesi" title="Üyeler">
      <View style={styles.search}>
        <Ionicons color={colors.brand[600]} name="search" size={18} />
        <TextInput
          onChangeText={setQ}
          placeholder="Ara…"
          placeholderTextColor={colors.cream[300]}
          style={styles.searchInput}
          value={q}
        />
      </View>
      {loading && members.length === 0 ? (
        <InlineSpinner fill />
      ) : (
        <>
          {list.map((c, i) => {
            const female = String(c.gender) === 'female';
            const plan = String(c.membership || 'free');
            return (
              <FadeIn delay={i * 40} key={String(c.id)}>
                <Pressable
                  onPress={() => router.push(`/(admin)/members/${c.id}` as Href)}
                  style={styles.row}>
                  <View
                    style={[
                      styles.avatar,
                      { backgroundColor: female ? colors.warm[100] : colors.brand[100] },
                    ]}>
                    <Text
                      style={[
                        styles.avatarText,
                        { color: female ? colors.warm[500] : colors.brand[600] },
                      ]}>
                      {String(c.name).charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.rowInfo}>
                    <Text style={styles.name}>{String(c.name)}</Text>
                    <Text numberOfLines={1} style={styles.meta}>
                      {String(c.email)}
                    </Text>
                  </View>
                  <View style={[styles.planBadge, plan === 'free' && styles.planBadgeBasic]}>
                    <Text
                      style={[styles.planBadgeText, plan === 'free' && styles.planBadgeTextBasic]}>
                      {getPlanLabel(plan)}
                    </Text>
                  </View>
                  <Ionicons color={colors.cream[300]} name="chevron-forward" size={18} />
                </Pressable>
              </FadeIn>
            );
          })}
          {!loading && list.length === 0 ? <EmptyState title="Aramanla eşleşen üye yok." /> : null}
        </>
      )}
    </PanelScaffold>
  );
}

const styles = StyleSheet.create({
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cream[200],
    paddingHorizontal: 14,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.cream[900],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 4,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.cream[200],
    minHeight: 56,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: fonts.sansSemi, fontSize: 16 },
  rowInfo: { flex: 1, gap: 2 },
  name: { fontFamily: fonts.sansSemi, fontSize: 16, color: colors.cream[900] },
  meta: { fontFamily: fonts.sans, fontSize: 12, color: colors.cream[800] },
  planBadge: {
    backgroundColor: colors.brand[50],
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  planBadgeBasic: { backgroundColor: colors.cream[100] },
  planBadgeText: { fontFamily: fonts.sansSemi, fontSize: 11, color: colors.brand[700] },
  planBadgeTextBasic: { color: colors.cream[800] },
});
