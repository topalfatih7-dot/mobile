/**
 * LOCK: docs/mobile/screens/admin/blog.md — Blog create / edit screen
 * Route: /(admin)/blog/[id]  — id = 'new' for create, else post id.
 */
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { InlineSpinner } from '@/components/ui/InlineSpinner';
import { isUiOnly } from '@/config/runtime';
import { useData } from '@/context/DataContext';
import { useToast } from '@/context/ToastContext';
import { requireSupabase, supabase } from '@/services/supabase';
import { colors, fonts, radius, spacing } from '@/theme';

const CATEGORIES = ['Sağlık', 'Beslenme', 'Egzersiz', 'Motivasyon', 'Yaşam Tarzı'];

async function upsertPost(payload: {
  id?: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  published: boolean;
}): Promise<{ success: boolean; error?: string }> {
  if (isUiOnly() || !supabase) return { success: false, error: 'Demo modda kayıt yok.' };
  const client = requireSupabase();
  const now = new Date().toISOString();
  if (payload.id && payload.id !== 'new') {
    const { error } = await client
      .from('posts')
      .update({
        title: payload.title,
        excerpt: payload.excerpt,
        content: payload.content,
        category: payload.category,
        published: payload.published,
        updated_at: now,
      })
      .eq('id', payload.id);
    if (error) return { success: false, error: error.message };
  } else {
    const { error } = await client.from('posts').insert({
      title: payload.title,
      excerpt: payload.excerpt,
      content: payload.content,
      category: payload.category,
      published: payload.published,
      created_at: now,
      updated_at: now,
    });
    if (error) return { success: false, error: error.message };
  }
  return { success: true };
}

async function deletePost(id: string): Promise<{ success: boolean; error?: string }> {
  if (isUiOnly() || !supabase) return { success: false, error: 'Demo modda kayıt yok.' };
  const { error } = await requireSupabase().from('posts').delete().eq('id', id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export default function AdminBlogEditor() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { posts, refreshData } = useData();
  const { toast } = useToast();
  const isNew = id === 'new' || !id;

  const existingPost = isNew ? null : posts.find((p) => String(p.id) === id);

  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [published, setPublished] = useState(false);
  const [busy, setBusy] = useState(false);
  const [initializing, setInitializing] = useState(!isNew);

  const init = useCallback(async () => {
    if (isNew) return;
    if (existingPost) {
      setTitle(String(existingPost.title || ''));
      setExcerpt(String(existingPost.excerpt || ''));
      setContent(String(existingPost.content || ''));
      setCategory(String(existingPost.category || CATEGORIES[0]));
      setPublished(Boolean(existingPost.published));
      setInitializing(false);
      return;
    }
    // Fetch from DB if not in context
    try {
      if (!supabase) return;
      const { data } = await requireSupabase()
        .from('posts')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (data) {
        setTitle(String(data.title || ''));
        setExcerpt(String(data.excerpt || ''));
        setContent(String(data.content || ''));
        setCategory(String(data.category || CATEGORIES[0]));
        setPublished(Boolean(data.published));
      }
    } finally {
      setInitializing(false);
    }
  }, [isNew, existingPost, id]);

  useEffect(() => {
    void init();
  }, [init]);

  const save = async () => {
    if (!title.trim()) {
      Alert.alert('Hata', 'Başlık boş bırakılamaz.');
      return;
    }
    setBusy(true);
    try {
      const res = await upsertPost({
        id: isNew ? undefined : id,
        title: title.trim(),
        excerpt: excerpt.trim(),
        content: content.trim(),
        category,
        published,
      });
      if (!res.success) {
        toast(res.error || 'Kaydedilemedi.', 'error');
        return;
      }
      await refreshData();
      toast(isNew ? 'Yazı oluşturuldu.' : 'Yazı güncellendi.', 'success');
      router.back();
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('Sil', 'Bu yazı silinecek. Emin misin?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          if (!id || isNew) return;
          setBusy(true);
          const res = await deletePost(id);
          setBusy(false);
          if (!res.success) {
            toast(res.error || 'Silinemedi.', 'error');
            return;
          }
          await refreshData();
          toast('Yazı silindi.', 'success');
          router.back();
        },
      },
    ]);
  };

  if (initializing) {
    return <InlineSpinner fill />;
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: colors.cream[50] }}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable hitSlop={10} onPress={() => router.back()}>
          <Ionicons color={colors.brand[600]} name="chevron-back" size={22} />
        </Pressable>
        <Text style={styles.headerTitle}>
          {isNew ? 'Yeni Yazı' : 'Yazıyı Düzenle'}
        </Text>
        {!isNew ? (
          <Pressable hitSlop={10} onPress={handleDelete}>
            <Ionicons color={colors.warm[500]} name="trash" size={20} />
          </Pressable>
        ) : <View style={{ width: 22 }} />}
      </View>

      <ScrollView
        contentContainerStyle={[styles.form, { paddingBottom: insets.bottom + 80 }]}
        keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Başlık</Text>
        <TextInput
          onChangeText={setTitle}
          placeholder="Blog yazısı başlığı…"
          placeholderTextColor={colors.cream[300]}
          style={styles.input}
          value={title}
        />

        <Text style={styles.label}>Özet</Text>
        <TextInput
          multiline
          numberOfLines={3}
          onChangeText={setExcerpt}
          placeholder="Kısa özet…"
          placeholderTextColor={colors.cream[300]}
          style={[styles.input, styles.inputMulti]}
          value={excerpt}
        />

        <Text style={styles.label}>İçerik</Text>
        <TextInput
          multiline
          numberOfLines={8}
          onChangeText={setContent}
          placeholder="Yazı içeriği…"
          placeholderTextColor={colors.cream[300]}
          style={[styles.input, styles.inputContent]}
          value={content}
        />

        <Text style={styles.label}>Kategori</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.catRow}>
            {CATEGORIES.map((cat) => (
              <Pressable
                key={cat}
                onPress={() => setCategory(cat)}
                style={[styles.catChip, category === cat && styles.catChipOn]}>
                <Text style={[styles.catChipText, category === cat && styles.catChipTextOn]}>
                  {cat}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        <View style={styles.publishRow}>
          <View>
            <Text style={styles.publishLabel}>Yayında</Text>
            <Text style={styles.publishSub}>
              {published ? 'Herkese görünür' : 'Taslak olarak saklanır'}
            </Text>
          </View>
          <Switch
            onValueChange={setPublished}
            thumbColor={published ? colors.white : colors.cream[200]}
            trackColor={{ false: colors.cream[300], true: colors.brand[500] }}
            value={published}
          />
        </View>
      </ScrollView>

      {/* Save button */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <Pressable
          disabled={busy}
          onPress={() => void save()}
          style={[styles.saveBtn, busy && styles.saveBtnOff]}>
          {busy ? (
            <Ionicons color={colors.white} name="hourglass" size={18} />
          ) : null}
          <Text style={styles.saveBtnText}>
            {busy ? 'Kaydediliyor…' : isNew ? 'Yazıyı Yayınla' : 'Değişiklikleri Kaydet'}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.cream[200],
    backgroundColor: colors.white,
  },
  headerTitle: {
    flex: 1,
    fontFamily: fonts.displayBold,
    fontSize: 18,
    color: colors.cream[900],
  },
  form: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  label: {
    fontFamily: fonts.sansSemi,
    fontSize: 13,
    color: colors.cream[800],
    marginTop: spacing.sm,
  },
  input: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cream[200],
    paddingHorizontal: spacing.md,
    height: 48,
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.cream[900],
  },
  inputMulti: { height: 80, paddingTop: 12, textAlignVertical: 'top' },
  inputContent: { height: 180, paddingTop: 12, textAlignVertical: 'top' },
  catRow: { flexDirection: 'row', gap: 8 },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.cream[200],
    backgroundColor: colors.white,
  },
  catChipOn: { backgroundColor: colors.brand[600], borderColor: colors.brand[600] },
  catChipText: { fontFamily: fonts.sansSemi, fontSize: 13, color: colors.cream[800] },
  catChipTextOn: { color: colors.white },
  publishRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.cream[200],
    marginTop: spacing.sm,
  },
  publishLabel: { fontFamily: fonts.sansSemi, fontSize: 15, color: colors.cream[900] },
  publishSub: { fontFamily: fonts.sans, fontSize: 12, color: colors.cream[800], marginTop: 2 },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.cream[200],
    backgroundColor: colors.white,
  },
  saveBtn: {
    height: 52,
    borderRadius: radius.xl,
    backgroundColor: colors.brand[600],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveBtnOff: { opacity: 0.6 },
  saveBtnText: { fontFamily: fonts.sansSemi, fontSize: 16, color: colors.white },
});
