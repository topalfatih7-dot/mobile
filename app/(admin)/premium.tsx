import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AdminPanelScreen } from '@/components/admin/AdminPanelScreen';
import { Card } from '@/components/ui/Card';
import { isPaidMembership, getPlanLabel } from '@/data/membershipPlans';
import { fetchAllMembers } from '@/services/db/members';
import type { MemberProfile } from '@/types/session';
import { colors, fonts, spacing } from '@/constants/theme';

/** Premium üye listesi — web admin premium özeti (atama/CRUD derinliği ayrı tur). */
export default function AdminPremiumScreen() {
  const [members, setMembers] = useState<MemberProfile[]>([]);

  const load = useCallback(async () => {
    const all = await fetchAllMembers();
    setMembers(all.filter((m) => isPaidMembership(m.membership as string)));
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <AdminPanelScreen
      emptySubtitle="Premium üyelik atamaları ve süre uzatımları burada yönetilir."
      emptyTitle="Premium kaydı yok"
      subtitle={`${members.length} ücretli üye`}
      title="Premium">
      {members.length > 0
        ? members.map((m) => (
            <Card key={m.id} padding={spacing.md} style={styles.card}>
              <Text style={styles.name}>{m.name}</Text>
              <Text style={styles.plan}>{getPlanLabel(m.membership as string)}</Text>
              <Text style={styles.meta}>
                {String(m.membershipStatus || 'active')} · {m.email}
              </Text>
            </Card>
          ))
        : null}
    </AdminPanelScreen>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.sm },
  name: { fontFamily: fonts.semibold, fontSize: 15, color: colors.text.primary },
  plan: { fontFamily: fonts.semibold, fontSize: 13, color: colors.teal[600], marginTop: 2 },
  meta: { fontFamily: fonts.regular, fontSize: 12, color: colors.text.muted, marginTop: 4 },
});
