import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { PanelScaffold } from '@/components/panel/PanelScaffold';
import { EmptyState } from '@/components/ui/EmptyState';
import { FadeIn } from '@/components/ui/FadeIn';
import { InlineSpinner } from '@/components/ui/InlineSpinner';
import { isUiOnly } from '@/config/runtime';
import { useToast } from '@/context/ToastContext';
import { fetchExercisesPage } from '@/services/exerciseLibrary';
import { requireSupabase, supabase } from '@/services/supabase';
import { colors, fonts, radius, spacing } from '@/theme';

const DIFFICULTY: Record<string, { label: string; bg: string; fg: string }> = {
  beginner: { label: 'Başlangıç', bg: colors.sage[100], fg: colors.sage[700] },
  intermediate: { label: 'Orta', bg: colors.brand[100], fg: colors.brand[700] },
  advanced: { label: 'İleri', bg: colors.warm[100], fg: colors.warm[500] },
};

const LOCATIONS: Record<string, string> = {
  home: 'Ev',
  gym: 'Salon',
  office: 'Ofis',
};

const BODY_PARTS = ['Göğüs', 'Sırt', 'Bacak', 'Kol', 'Karın', 'Omuz', 'Tüm Vücut'];
const DIFFICULTY_OPTIONS = ['beginner', 'intermediate', 'advanced'];

async function updateExercise(
  id: string,
  patch: {
    name: string;
    description: string;
    category: string;
    bodyPart: string;
    difficulty: string;
  },
): Promise<{ success: boolean; error?: string }> {
  if (isUiOnly() || !supabase) return { success: false, error: 'Demo modda kayıt yok.' };
  const client = requireSupabase();
  // TODO: Video upload requires EAS build + expo-document-picker
  const { error } = await client
    .from('exercises')
    .update({
      name: patch.name,
      description: patch.description,
      category: patch.category,
      body_part: patch.bodyPart,
      difficulty: patch.difficulty,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

type ExerciseRow = Record<string, unknown>;

type EditModalProps = {
  visible: boolean;
  exercise: ExerciseRow | null;
  onClose: () => void;
  onSaved: () => void;
};

function ExerciseEditModal({ visible, exercise, onClose, onSaved }: EditModalProps) {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [bodyPart, setBodyPart] = useState(BODY_PARTS[0]);
  const [difficulty, setDifficulty] = useState('beginner');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (visible && exercise) {
      setName(String(exercise.name || ''));
      setDescription(String(exercise.description || ''));
      setCategory(String(exercise.category || ''));
      setBodyPart(String(exercise.bodyPart || BODY_PARTS[0]));
      setDifficulty(String(exercise.difficulty || 'beginner'));
    }
  }, [visible, exercise]);

  const save = async () => {
    if (!name.trim()) {
      Alert.alert('Hata', 'Egzersiz adı boş bırakılamaz.');
      return;
    }
    if (!exercise?.id) return;
    setBusy(true);
    try {
      const res = await updateExercise(String(exercise.id), {
        name: name.trim(),
        description: description.trim(),
        category: category.trim(),
        bodyPart: bodyPart.trim(),
        difficulty,
      });
      if (!res.success) {
        toast(res.error || 'Kaydedilemedi.', 'error');
        return;
      }
      onSaved();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      <Pressable onPress={onClose} style={styles.overlay} />
      <View style={styles.sheet}>
        <View style={styles.sheetHandle} />
        <Text style={styles.sheetTitle}>Egzersiz Düzenle</Text>

        <Text style={styles.fieldLabel}>Ad</Text>
        <TextInput
          onChangeText={setName}
          placeholder="Egzersiz adı…"
          placeholderTextColor={colors.cream[300]}
          style={styles.input}
          value={name}
        />

        <Text style={styles.fieldLabel}>Açıklama</Text>
        <TextInput
          multiline
          numberOfLines={3}
          onChangeText={setDescription}
          placeholder="Kısa açıklama…"
          placeholderTextColor={colors.cream[300]}
          style={[styles.input, styles.inputMulti]}
          value={description}
        />

        <Text style={styles.fieldLabel}>Kategori</Text>
        <TextInput
          onChangeText={setCategory}
          placeholder="Kategori…"
          placeholderTextColor={colors.cream[300]}
          style={styles.input}
          value={category}
        />

        <Text style={styles.fieldLabel}>Kas Grubu</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.chipRow}>
            {BODY_PARTS.map((bp) => (
              <Pressable
                key={bp}
                onPress={() => setBodyPart(bp)}
                style={[styles.chip, bodyPart === bp && styles.chipOn]}>
                <Text style={[styles.chipText, bodyPart === bp && styles.chipTextOn]}>
                  {bp}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        <Text style={styles.fieldLabel}>Zorluk</Text>
        <View style={styles.chipRow}>
          {DIFFICULTY_OPTIONS.map((d) => (
            <Pressable
              key={d}
              onPress={() => setDifficulty(d)}
              style={[styles.chip, difficulty === d && styles.chipOn]}>
              <Text style={[styles.chipText, difficulty === d && styles.chipTextOn]}>
                {DIFFICULTY[d]?.label || d}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.modalActions}>
          <Pressable disabled={busy} onPress={onClose} style={styles.cancelBtn}>
            <Text style={styles.cancelBtnText}>İptal</Text>
          </Pressable>
          <Pressable
            disabled={busy}
            onPress={() => void save()}
            style={[styles.confirmBtn, busy && styles.confirmBtnOff]}>
            <Text style={styles.confirmBtnText}>{busy ? 'Kaydediliyor…' : 'Kaydet'}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

/** LOCK: docs/mobile/screens/admin/library.md */
export default function AdminLibrary() {
  const { toast } = useToast();
  const [exercises, setExercises] = useState<ExerciseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editTarget, setEditTarget] = useState<ExerciseRow | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchExercisesPage({ page: 1, pageSize: 200 });
      setExercises(res.items);
    } catch {
      setExercises([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <PanelScaffold showBack subtitle="Egzersiz kütüphanesi" title="Kütüphane">
      {loading && exercises.length === 0 ? (
        <InlineSpinner fill />
      ) : exercises.length === 0 ? (
        <EmptyState title="Egzersiz yok." />
      ) : (
        exercises.map((ex, i) => {
          const diff = DIFFICULTY[String(ex.difficulty)];
          const locations = (ex.locations as string[]) || [];
          const videoPending = Boolean(ex.videoPending);
          return (
            <FadeIn delay={i * 40} key={String(ex.id)}>
              <Pressable
                onPress={() => setEditTarget(ex)}
                style={({ pressed }) => [styles.card, pressed && { opacity: 0.9 }]}>
                <View style={styles.thumb}>
                  {videoPending ? (
                    <Ionicons color={colors.brand[300]} name="videocam-off" size={22} />
                  ) : (
                    <Ionicons color={colors.brand[600]} name="videocam" size={22} />
                  )}
                </View>
                <View style={styles.body}>
                  <Text numberOfLines={1} style={styles.title}>
                    {String(ex.name)}
                  </Text>
                  <View style={styles.metaRow}>
                    <Text style={styles.meta}>{String(ex.bodyPart)}</Text>
                    {diff ? (
                      <View style={[styles.badge, { backgroundColor: diff.bg }]}>
                        <Text style={[styles.badgeText, { color: diff.fg }]}>
                          {diff.label}
                        </Text>
                      </View>
                    ) : null}
                    {videoPending ? (
                      <View style={[styles.badge, styles.badgeWarn]}>
                        <Text style={[styles.badgeText, styles.badgeTextWarn]}>
                          Video bekleniyor
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  <View style={styles.chips}>
                    {locations.map((loc) => (
                      <View key={loc} style={styles.chip}>
                        <Text style={styles.chipText}>{LOCATIONS[loc] || loc}</Text>
                      </View>
                    ))}
                  </View>
                </View>
                <Ionicons color={colors.brand[400]} name="pencil" size={18} />
              </Pressable>
            </FadeIn>
          );
        })
      )}

      <ExerciseEditModal
        exercise={editTarget}
        onClose={() => setEditTarget(null)}
        onSaved={() => {
          setEditTarget(null);
          toast('Egzersiz güncellendi.', 'success');
          void load();
        }}
        visible={Boolean(editTarget)}
      />
    </PanelScaffold>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.cream[200],
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    backgroundColor: colors.cream[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1 },
  title: { fontFamily: fonts.sansSemi, fontSize: 15, color: colors.cream[900] },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: 4,
  },
  meta: { fontFamily: fonts.sans, fontSize: 12, color: colors.cream[800] },
  badge: {
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: { fontFamily: fonts.sansSemi, fontSize: 10 },
  badgeWarn: { backgroundColor: colors.warm[100] },
  badgeTextWarn: { color: colors.warm[500] },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  chip: {
    backgroundColor: colors.cream[100],
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  chipText: { fontFamily: fonts.sans, fontSize: 11, color: colors.cream[800] },
  overlay: { flex: 1, backgroundColor: 'rgba(15,23,32,0.45)' },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
    gap: spacing.sm,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: radius.full,
    backgroundColor: colors.cream[200],
    alignSelf: 'center',
    marginBottom: spacing.sm,
  },
  sheetTitle: { fontFamily: fonts.displayExtra, fontSize: 20, color: colors.cream[900] },
  fieldLabel: {
    fontFamily: fonts.sansSemi,
    fontSize: 13,
    color: colors.cream[800],
    marginTop: 4,
  },
  input: {
    height: 48,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cream[200],
    paddingHorizontal: spacing.md,
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.cream[900],
    backgroundColor: colors.white,
  },
  inputMulti: { height: 80, paddingTop: 12, textAlignVertical: 'top' },
  chipRow: { flexDirection: 'row', gap: 8 },
  chipOn: { backgroundColor: colors.brand[600], borderColor: colors.brand[600] },
  chipTextOn: { color: colors.white },
  modalActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: colors.cream[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: { fontFamily: fonts.sansSemi, fontSize: 14, color: colors.cream[800] },
  confirmBtn: {
    flex: 2,
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: colors.brand[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnOff: { opacity: 0.6 },
  confirmBtnText: { fontFamily: fonts.sansSemi, fontSize: 14, color: colors.white },
});
