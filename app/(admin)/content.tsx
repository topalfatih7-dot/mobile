import { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { AdminFormModal } from '@/components/admin/AdminFormModal';
import { AdminPanelScreen } from '@/components/admin/AdminPanelScreen';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import {
  addContent,
  editContent,
  fetchSiteContent,
  removeContent,
  type SiteContentItem,
} from '@/services/db/content';
import { colors, fonts, spacing } from '@/constants/theme';

const KIND_LABELS: Record<string, string> = {
  testimonial: 'Yorum',
  faq: 'SSS',
  success_story: 'Hikâye',
};

export default function AdminContentScreen() {
  const [items, setItems] = useState<SiteContentItem[]>([]);
  const [modal, setModal] = useState(false);
  const [edit, setEdit] = useState<SiteContentItem | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setItems(await fetchSiteContent(['testimonial', 'faq', 'success_story']));
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const counts = {
    testimonial: items.filter((i) => i.kind === 'testimonial').length,
    faq: items.filter((i) => i.kind === 'faq').length,
    success_story: items.filter((i) => i.kind === 'success_story').length,
  };

  const onSave = async (values: Record<string, string>) => {
    const kind = (values.kind || edit?.kind || 'faq').trim();
    const title = values.title?.trim() || values.question?.trim() || values.name?.trim();
    if (!title) {
      Alert.alert('Eksik bilgi', 'Başlık / soru / isim gerekli.');
      return;
    }
    const data: Record<string, unknown> = {
      sort: Number(values.sort) || 0,
      title,
      name: values.name || title,
      question: values.question || title,
      answer: values.answer || values.body || '',
      body: values.body || values.answer || '',
      highlight: values.highlight || '',
      story: values.story || values.body || '',
      quote: values.quote || values.body || '',
    };
    setSaving(true);
    try {
      const result = edit
        ? await editContent(edit.id, data)
        : await addContent(kind, data);
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
    <AdminPanelScreen subtitle="Site içerik yönetimi" title="İçerik">
      <View style={styles.row}>
        <Card padding={spacing.md} style={styles.stat}>
          <Text style={styles.value}>{counts.testimonial}</Text>
          <Text style={styles.label}>Yorum</Text>
        </Card>
        <Card padding={spacing.md} style={styles.stat}>
          <Text style={styles.value}>{counts.faq}</Text>
          <Text style={styles.label}>SSS</Text>
        </Card>
        <Card padding={spacing.md} style={styles.stat}>
          <Text style={styles.value}>{counts.success_story}</Text>
          <Text style={styles.label}>Hikâye</Text>
        </Card>
      </View>

      <Button
        label="İçerik ekle"
        onPress={() => {
          setEdit(null);
          setModal(true);
        }}
        style={styles.cta}
      />

      {items.map((item) => {
        const d = item.data;
        const title = String(d.title || d.question || d.name || d.highlight || 'İçerik');
        return (
          <Card key={item.id} padding={spacing.md} style={styles.card}>
            <Text style={styles.kind}>{KIND_LABELS[item.kind] || item.kind}</Text>
            <Text style={styles.title}>{title}</Text>
            <View style={styles.actions}>
              <Button
                label="Düzenle"
                onPress={() => {
                  setEdit(item);
                  setModal(true);
                }}
                size="sm"
                style={styles.flex}
                variant="secondary"
              />
              <Button
                label="Sil"
                onPress={() => {
                  Alert.alert('Sil', 'Bu içerik silinsin mi?', [
                    { text: 'İptal', style: 'cancel' },
                    {
                      text: 'Sil',
                      style: 'destructive',
                      onPress: () => {
                        void (async () => {
                          const r = await removeContent(item.id);
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
        );
      })}

      {modal ? (
        <AdminFormModal
          fields={[
            {
              key: 'kind',
              label: 'Tür (testimonial / faq / success_story)',
              placeholder: 'faq',
              autoCapitalize: 'none',
            },
            { key: 'title', label: 'Başlık / isim' },
            { key: 'body', label: 'Metin / cevap', multiline: true },
            { key: 'sort', label: 'Sıra', keyboardType: 'number-pad' },
          ]}
          initialValues={
            edit
              ? {
                  kind: edit.kind,
                  title: String(edit.data.title || edit.data.question || edit.data.name || ''),
                  body: String(edit.data.answer || edit.data.body || edit.data.story || edit.data.quote || ''),
                  sort: String(edit.sort || 0),
                }
              : { kind: 'faq', sort: '0' }
          }
          loading={saving}
          onClose={() => {
            setModal(false);
            setEdit(null);
          }}
          onSubmit={onSave}
          title={edit ? 'İçeriği düzenle' : 'Yeni içerik'}
          visible
        />
      ) : null}
    </AdminPanelScreen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  stat: { flex: 1, alignItems: 'center' },
  value: { fontFamily: fonts.displayExtra, fontSize: 24, color: colors.teal[600] },
  label: { fontFamily: fonts.medium, fontSize: 12, color: colors.text.secondary, marginTop: 4 },
  cta: { marginBottom: spacing.md },
  card: { marginBottom: spacing.sm },
  kind: { fontFamily: fonts.semibold, fontSize: 11, color: colors.champagne[600], textTransform: 'uppercase' },
  title: { fontFamily: fonts.semibold, fontSize: 15, color: colors.text.primary, marginTop: 4 },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  flex: { flex: 1 },
});
