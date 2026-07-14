import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';

import { AdminFormModal } from '@/components/admin/AdminFormModal';
import { AppHeader } from '@/components/ui/AppHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { useApp } from '@/context/AppContext';
import { fetchMemberById } from '@/services/db/members';
import {
  createProgram,
  fetchMemberPrograms,
  updateProgramDescription,
  type DbProgram,
} from '@/services/db/programs';
import type { MemberProfile } from '@/types/session';
import { colors, fonts, spacing } from '@/constants/theme';

export default function StaffClientProgramScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { staff } = useApp();
  const [member, setMember] = useState<MemberProfile | null>(null);
  const [programs, setPrograms] = useState<DbProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'assign' | 'note' | null>(null);
  const [noteTarget, setNoteTarget] = useState<DbProgram | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [m, list] = await Promise.all([fetchMemberById(id), fetchMemberPrograms(id)]);
      setMember(m);
      setPrograms(list);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const onAssign = async (values: Record<string, string>) => {
    if (!id || !member) return;
    const title = values.title?.trim();
    if (!title) {
      Alert.alert('Eksik bilgi', 'Program başlığı gerekli.');
      return;
    }
    setSaving(true);
    try {
      const result = await createProgram({
        memberId: id,
        staffId: staff?.id || null,
        type: values.type === 'nutrition' ? 'nutrition' : 'workout',
        title,
        description: values.description?.trim() || '',
        memberName: member.name,
        staffName: staff?.name || '',
      });
      if (!result.success) {
        Alert.alert('Hata', result.error);
        return;
      }
      setModal(null);
      await load();
    } finally {
      setSaving(false);
    }
  };

  const onNote = async (values: Record<string, string>) => {
    if (!noteTarget) return;
    setSaving(true);
    try {
      const result = await updateProgramDescription(noteTarget.id, values.description?.trim() || '');
      if (!result.success) {
        Alert.alert('Hata', result.error);
        return;
      }
      setModal(null);
      setNoteTarget(null);
      await load();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen scroll contentStyle={styles.content} edges={{ top: true, bottom: true }}>
      <AppHeader
        showBack
        subtitle={member?.name ? `${member.name} için programlar` : 'Danışan programları'}
        title="Program"
      />

      {loading ? (
        <ActivityIndicator color={colors.teal[600]} size="large" style={styles.loader} />
      ) : (
        <View style={styles.body}>
          <Button label="Program ata" onPress={() => setModal('assign')} style={styles.cta} />
          {programs.length > 0 ? (
            programs.map((program) => (
              <Card key={program.id} padding={spacing.lg} style={styles.card}>
                <Text style={styles.type}>
                  {program.type === 'nutrition' ? 'Beslenme' : 'Antrenman'}
                </Text>
                <Text style={styles.title}>{program.title || 'İsimsiz program'}</Text>
                {program.description ? <Text style={styles.desc}>{program.description}</Text> : null}
                <Text style={styles.meta}>
                  {program.entries.length} madde · {program.staffName || 'Personel'}
                </Text>
                <Button
                  label="Not ekle / düzenle"
                  onPress={() => {
                    setNoteTarget(program);
                    setModal('note');
                  }}
                  size="sm"
                  style={styles.noteBtn}
                  variant="secondary"
                />
              </Card>
            ))
          ) : (
            <EmptyState
              subtitle="Bu danışana henüz atanmış bir program yok. Yukarıdan yeni program atayabilirsiniz."
              title="Program bulunamadı"
            />
          )}
        </View>
      )}

      {modal === 'assign' ? (
        <AdminFormModal
          fields={[
            { key: 'title', label: 'Başlık', placeholder: 'Örn. 4 haftalık plan' },
            {
              key: 'type',
              label: 'Tür (workout / nutrition)',
              placeholder: 'workout',
              autoCapitalize: 'none',
            },
            { key: 'description', label: 'Açıklama / not', multiline: true },
          ]}
          loading={saving}
          onClose={() => setModal(null)}
          onSubmit={onAssign}
          submitLabel="Ata"
          title="Program ata"
          visible
        />
      ) : null}

      {modal === 'note' && noteTarget ? (
        <AdminFormModal
          fields={[{ key: 'description', label: 'Program notu', multiline: true }]}
          initialValues={{ description: noteTarget.description || '' }}
          loading={saving}
          onClose={() => {
            setModal(null);
            setNoteTarget(null);
          }}
          onSubmit={onNote}
          title="Program notu"
          visible
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 0 },
  body: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  loader: { marginTop: spacing.xxl },
  cta: { marginBottom: spacing.md },
  card: { marginBottom: spacing.md },
  type: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: colors.champagne[600],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 17,
    color: colors.text.primary,
    marginTop: 4,
  },
  desc: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: spacing.sm,
    lineHeight: 20,
  },
  meta: {
    fontFamily: fonts.medium,
    fontSize: 12.5,
    color: colors.text.muted,
    marginTop: spacing.sm,
  },
  noteBtn: { marginTop: spacing.md },
});
