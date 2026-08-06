import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { PanelScaffold } from '@/components/panel/PanelScaffold';
import { EmptyState } from '@/components/ui/EmptyState';
import { type MemberRecord } from '@/services/mappers';
import { getMembers } from '@/services/adminDb';
import { getPlanLabel } from '@/data/membershipPlans';
import { colors, fonts, radius, spacing } from '@/theme';

const PAGE_SIZE = 20;
const ITEM_HEIGHT = 72; // padding 16*2 + avatar 40

/** LOCK: docs/mobile/screens/admin/members.md */
export default function AdminMembers() {
  const [q, setQ] = useState('');
  const [items, setItems] = useState<MemberRecord[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const loadingMoreRef = useRef(false);

  const load = useCallback(async (pageNum: number, replace: boolean) => {
    if (pageNum === 0) {
      setLoading(true);
    } else {
      if (loadingMoreRef.current) return;
      loadingMoreRef.current = true;
      setLoadingMore(true);
    }
    try {
      const result = await getMembers(pageNum, PAGE_SIZE);
      setItems((prev) => (replace ? result.items : [...prev, ...result.items]));
      setPage(pageNum);
      setHasMore(result.hasMore);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      loadingMoreRef.current = false;
    }
  }, []);

  useEffect(() => {
    void load(0, true);
  }, [load]);

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter(
      (c) =>
        String(c.name).toLowerCase().includes(s) || String(c.email).toLowerCase().includes(s),
    );
  }, [q, items]);

  const handleEndReached = useCallback(() => {
    if (!loadingMoreRef.current && hasMore && !loading) {
      void load(page + 1, false);
    }
  }, [hasMore, loading, load, page]);

  const renderItem = useCallback(
    ({ item: c }: { item: MemberRecord }) => {
      const female = String(c.gender) === 'female';
      const plan = String(c.membership || 'free');
      return (
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
      );
    },
    [],
  );

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
      <FlatList
        data={list}
        getItemLayout={(_, index) => ({
          length: ITEM_HEIGHT,
          offset: ITEM_HEIGHT * index,
          index,
        })}
        initialNumToRender={15}
        keyExtractor={(c) => String(c.id)}
        maxToRenderPerBatch={10}
        removeClippedSubviews
        windowSize={5}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color={colors.brand[600]} style={{ marginTop: 40 }} />
          ) : (
            <EmptyState title="Aramanla eşleşen üye yok." />
          )
        }
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator
              color={colors.brand[600]}
              size="small"
              style={styles.footer}
            />
          ) : null
        }
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.4}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        style={styles.list}
      />
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
    marginBottom: spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.cream[900],
  },
  list: { flex: 1 },
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
    marginBottom: spacing.sm,
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
  footer: { marginVertical: spacing.md },
});
