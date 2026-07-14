import { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { AdminFormModal } from '@/components/admin/AdminFormModal';
import { AdminPanelScreen } from '@/components/admin/AdminPanelScreen';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import {
  addExercise,
  editExercise,
  fetchLibraryExercises,
  removeExercise,
  type LibraryExercise,
} from '@/services/db/exercises';
import { colors, fonts, spacing } from '@/constants/theme';

export default function AdminLibraryScreen() {
  const [exercises, setExercises] = useState<LibraryExercise[]>([]);
  const [modal, setModal] = useState(false);
  const [edit, setEdit] = useState<LibraryExercise | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setExercises(await fetchLibraryExercises(120));
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const onSave = async (values: Record<string, string>) => {
    const name = values.name?.trim();
    if (!name) {
      Alert.alert('Eksik bilgi', 'Egzersiz adı zorunlu.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name,
        description: values.description || '',
        bodyPart: values.bodyPart || 'Tüm Vücut',
        sportType: values.sportType || 'Fitness',
        category: values.bodyPart || 'Tüm Vücut',
      };
      const result = edit
        ? await editExercise(edit.id, payload)
        : await addExercise(payload);
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
    <AdminPanelScreen subtitle={`${exercises.length} egzersiz`} title="Kütüphane">
      <Button
        label="Egzersiz ekle"
        onPress={() => {
          setEdit(null);
          setModal(true);
        }}
        style={styles.cta}
      />
      {exercises.map((ex) => (
        <Card key={ex.id} padding={spacing.md} style={styles.card}>
          <Text style={styles.name}>{ex.name}</Text>
          <Text style={styles.meta}>
            {ex.bodyPart} · {ex.sportType}
          </Text>
          <View style={styles.row}>
            <Button
              label="Düzenle"
              onPress={() => {
                setEdit(ex);
                setModal(true);
              }}
              size="sm"
              style={styles.flex}
              variant="secondary"
            />
            <Button
              label="Sil"
              onPress={() => {
                Alert.alert('Sil', `"${ex.name}" silinsin mi?`, [
                  { text: 'İptal', style: 'cancel' },
                  {
                    text: 'Sil',
                    style: 'destructive',
                    onPress: () => {
                      void (async () => {
                        const r = await removeExercise(ex.id);
                        if (!r.success) Alert.alert('Hata', r.error);
                        else await load();
                      })();
                    },
                  },
                ]);
              }}
              size="sm"
              style={styles.flex}
              variant="danger"
            />
          </View>
        </Card>
      ))}

      {modal ? (
        <AdminFormModal
          fields={[
            { key: 'name', label: 'Ad' },
            { key: 'bodyPart', label: 'Bölge', placeholder: 'Tüm Vücut' },
            { key: 'sportType', label: 'Spor türü', placeholder: 'Fitness' },
            { key: 'description', label: 'Açıklama', multiline: true },
          ]}
          initialValues={
            edit
              ? {
                  name: edit.name,
                  bodyPart: edit.bodyPart,
                  sportType: edit.sportType,
                  description: edit.description || '',
                }
              : { bodyPart: 'Tüm Vücut', sportType: 'Fitness' }
          }
          loading={saving}
          onClose={() => {
            setModal(false);
            setEdit(null);
          }}
          onSubmit={onSave}
          title={edit ? 'Egzersizi düzenle' : 'Yeni egzersiz'}
          visible
        />
      ) : null}
    </AdminPanelScreen>
  );
}

const styles = StyleSheet.create({
  cta: { marginBottom: spacing.md },
  card: { marginBottom: spacing.sm },
  name: { fontFamily: fonts.semibold, fontSize: 15, color: colors.text.primary },
  meta: { fontFamily: fonts.medium, fontSize: 12, color: colors.teal[600], marginTop: 4 },
  row: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  flex: { flex: 1 },
});
