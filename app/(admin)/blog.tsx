import { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { AdminFormModal } from '@/components/admin/AdminFormModal';
import { AdminPanelScreen } from '@/components/admin/AdminPanelScreen';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { addPost, editPost, fetchPosts, removePost, type BlogPost } from '@/services/db/blog';
import { colors, fonts, spacing } from '@/constants/theme';

export default function AdminBlogScreen() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [modal, setModal] = useState(false);
  const [edit, setEdit] = useState<BlogPost | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setPosts(await fetchPosts());
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const onSave = async (values: Record<string, string>) => {
    const title = values.title?.trim();
    if (!title) {
      Alert.alert('Eksik bilgi', 'Başlık zorunlu.');
      return;
    }
    setSaving(true);
    try {
      if (edit) {
        const result = await editPost(edit.id, {
          title,
          content: values.content || '',
          excerpt: values.excerpt || '',
          category: values.category || 'Yaşam',
        });
        if (!result.success) {
          Alert.alert('Hata', result.error);
          return;
        }
      } else {
        const result = await addPost({
          title,
          content: values.content || '',
          excerpt: values.excerpt || '',
          category: values.category || 'Yaşam',
        });
        if (!result.success) {
          Alert.alert('Hata', result.error);
          return;
        }
      }
      setModal(false);
      setEdit(null);
      await load();
    } finally {
      setSaving(false);
    }
  };

  const onDelete = (post: BlogPost) => {
    Alert.alert('Yazıyı sil', `"${post.title}" silinsin mi?`, [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            const result = await removePost(post.id);
            if (!result.success) Alert.alert('Hata', result.error);
            else await load();
          })();
        },
      },
    ]);
  };

  return (
    <AdminPanelScreen emptyTitle="Yazı yok" subtitle="Blog yönetimi" title="Blog">
      <Button
        label="Yeni yazı"
        onPress={() => {
          setEdit(null);
          setModal(true);
        }}
        style={styles.cta}
      />
      {posts.map((post) => (
        <Card key={post.id} padding={spacing.md} style={styles.card}>
          <Text style={styles.title}>{post.title || 'İsimsiz yazı'}</Text>
          <Text style={styles.meta}>
            {post.category} · {post.published ? 'Yayında' : 'Taslak'}
          </Text>
          <View style={styles.row}>
            <Button
              label="Düzenle"
              onPress={() => {
                setEdit(post);
                setModal(true);
              }}
              size="sm"
              style={styles.flex}
              variant="secondary"
            />
            <Button
              label="Sil"
              onPress={() => onDelete(post)}
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
            { key: 'title', label: 'Başlık' },
            { key: 'category', label: 'Kategori', placeholder: 'Yaşam' },
            { key: 'excerpt', label: 'Özet', multiline: true },
            { key: 'content', label: 'İçerik', multiline: true },
          ]}
          initialValues={
            edit
              ? {
                  title: edit.title,
                  category: edit.category,
                  excerpt: edit.excerpt,
                  content: edit.content,
                }
              : { category: 'Yaşam' }
          }
          loading={saving}
          onClose={() => {
            setModal(false);
            setEdit(null);
          }}
          onSubmit={onSave}
          title={edit ? 'Yazıyı düzenle' : 'Yeni yazı'}
          visible
        />
      ) : null}
    </AdminPanelScreen>
  );
}

const styles = StyleSheet.create({
  cta: { marginBottom: spacing.md },
  card: { marginBottom: spacing.sm },
  title: { fontFamily: fonts.semibold, fontSize: 15, color: colors.text.primary },
  meta: { fontFamily: fonts.regular, fontSize: 12, color: colors.text.muted, marginTop: 4 },
  row: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  flex: { flex: 1 },
});
