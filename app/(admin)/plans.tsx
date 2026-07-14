import { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { AdminFormModal } from '@/components/admin/AdminFormModal';
import { AdminPanelScreen } from '@/components/admin/AdminPanelScreen';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { getPlans, upsertPlan } from '@/services/db/plans';
import type { MembershipPlan } from '@/services/hydrateShared';
import { colors, fonts, spacing } from '@/constants/theme';

export default function AdminPlansScreen() {
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [modal, setModal] = useState(false);
  const [edit, setEdit] = useState<MembershipPlan | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setPlans(await getPlans(false));
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const onSave = async (values: Record<string, string>) => {
    const id = (values.id || edit?.id || '').trim().toLowerCase();
    const name = values.name?.trim();
    if (!id || !name) {
      Alert.alert('Eksik bilgi', 'Plan id ve adı zorunlu.');
      return;
    }
    setSaving(true);
    try {
      const result = await upsertPlan({
        id,
        name,
        price: Number(values.price) || 0,
        period: values.period || 'ay',
        badge: values.badge || null,
        isActive: values.active !== 'hayır',
        features: edit?.features || [],
        limits: edit?.limits || [],
        pricingTiers: edit?.pricingTiers || [],
        color: edit?.color || 'sage',
        sortOrder: Number(values.sortOrder) || edit?.sortOrder || 0,
      });
      if (!result.success) {
        Alert.alert('Hata', result.error);
        return;
      }
      setModal(false);
      setEdit(null);
      await load();
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminPanelScreen emptyTitle="Paket yok" subtitle="Üyelik paketleri" title="Paketler">
      <Button
        label="Paket ekle / güncelle"
        onPress={() => {
          setEdit(null);
          setModal(true);
        }}
        style={styles.cta}
      />
      {plans.map((plan) => (
        <Card
          key={plan.id}
          onPress={() => {
            setEdit(plan);
            setModal(true);
          }}
          padding={spacing.lg}
          style={styles.card}>
          <Text style={styles.name}>{plan.name}</Text>
          <Text style={styles.price}>
            {plan.price === 0 ? 'Ücretsiz' : `${plan.price.toLocaleString('tr-TR')} ₺`}
            {plan.period ? ` / ${plan.period}` : ''}
          </Text>
          <Text style={styles.meta}>
            {plan.id} · {plan.isActive ? 'Aktif' : 'Pasif'}
          </Text>
        </Card>
      ))}

      {modal ? (
        <AdminFormModal
          fields={[
            { key: 'id', label: 'Plan id', placeholder: 'eko', autoCapitalize: 'none' },
            { key: 'name', label: 'Ad' },
            { key: 'price', label: 'Fiyat (₺)', keyboardType: 'numeric' },
            { key: 'period', label: 'Periyot', placeholder: 'Aylık' },
            { key: 'badge', label: 'Rozet (opsiyonel)' },
            { key: 'sortOrder', label: 'Sıra', keyboardType: 'number-pad' },
            { key: 'active', label: 'Aktif? (evet/hayır)', placeholder: 'evet' },
          ]}
          initialValues={
            edit
              ? {
                  id: edit.id,
                  name: edit.name,
                  price: String(edit.price),
                  period: edit.period,
                  badge: edit.badge || '',
                  sortOrder: String(edit.sortOrder || 0),
                  active: edit.isActive ? 'evet' : 'hayır',
                }
              : { active: 'evet' }
          }
          loading={saving}
          onClose={() => {
            setModal(false);
            setEdit(null);
          }}
          onSubmit={onSave}
          title={edit ? 'Paketi düzenle' : 'Yeni paket'}
          visible
        />
      ) : null}
    </AdminPanelScreen>
  );
}

const styles = StyleSheet.create({
  cta: { marginBottom: spacing.md },
  card: { marginBottom: spacing.md },
  name: { fontFamily: fonts.display, fontSize: 17, color: colors.text.primary },
  price: { fontFamily: fonts.semibold, fontSize: 14, color: colors.teal[600], marginTop: 4 },
  meta: { fontFamily: fonts.medium, fontSize: 12, color: colors.text.muted, marginTop: spacing.sm },
});
