/**
 * LOCK: docs/mobile/screens/admin/content.md — site_content list + CRUD
 */
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
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
import { requireSupabase, supabase } from '@/services/supabase';
import { colors, fonts, radius, spacing } from '@/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

const KIND: Record<string, { label: string; icon: IconName; bg: string; fg: string }> = {
  success_story: {
    label: 'Başarı hikâyesi',
    icon: 'trophy',
    bg: colors.sage[100],
    fg: colors.sage[700],
  },
  faq: { label: 'SSS', icon: 'help-circle', bg: colors.brand[100], fg: colors.brand[700] },
  tip: { label: 'İpucu', icon: 'bulb', bg: colors.warm[100], fg: colors.warm[500] },
  testimonial: {
    label: 'Yorum',
    icon: 'chatbubble-ellipses',
    bg: colors.mint[50],
    fg: colors.sage[700],
  },
};

const CONTENT_TYPES = [
  { id: 'testimonial', label: 'Yorum (Testimonial)' },
  { id: 'faq', label: 'SSS (FAQ)' },
  { id: 'success_story', label: 'Başarı Hikâyesi' },
  { id: 'tip', label: 'İpucu' },
];

type ContentRow = {
  id: string;
  kind: string;
  title: string;
  rawData: Record<string, unknown>;
};

function titleFromData(kind: string, data: Record<string, unknown>): string {
  if (kind === 'faq') return String(data.q || data.question || 'SSS');
  if (kind === 'testimonial') return String(data.name || data.quote || 'Yorum');
  if (kind === 'success_story') return String(data.name || data.title || 'Başarı hikâyesi');
  return String(data.title || data.name || data.text || kind);
}

type UpsertPayload = {
  id?: string;
  kind: string;
  title: string;
  text: string;
  author: string;
};

async function upsertContent(payload: UpsertPayload): Promise<{ success: boolean; error?: string }> {
  if (isUiOnly() || !supabase) return { success: false, error: 'Demo modda kayıt yok.' };
  const client = requireSupabase();
  const data: Record<string, unknown> = {
    title: payload.title,
    text: payload.text,
    name: payload.author,
  };
  if (payload.kind === 'faq') {
    data.q = payload.title;
    data.a = payload.text;
  }
  if (payload.kind === 'testimonial') {
    data.name = payload.author;
    data.quote = payload.text;
  }
  if (payload.kind === 'success_story') {
    data.name = payload.author;
    data.title = payload.title;
  }

  if (payload.id) {
    const { error } = await client
      .from('site_content')
      .update({ kind: payload.kind, data, updated_at: new Date().toISOString() })
      .eq('id', payload.id);
    if (error) return { success: false, error: error.message };
  } else {
    const { error } = await client
      .from('site_content')
      .insert({ kind: payload.kind, data, sort: Date.now() });
    if (error) return { success: false, error: error.message };
  }
  return { success: true };
}

async function deleteContent(id: string): Promise<{ success: boolean; error?: string }> {
  if (isUiOnly() || !supabase) return { success: false, error: 'Demo modda kayıt yok.' };
  const { error } = await requireSupabase().from('site_content').delete().eq('id', id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

type ContentFormModalProps = {
  visible: boolean;
  editing: ContentRow | null;
  onClose: () => void;
  onSaved: () => void;
};

function ContentFormModal({ visible, editing, onClose, onSaved }: ContentFormModalProps) {
  const [kind, setKind] = useState(editing?.kind || 'testimonial');
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [author, setAuthor] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (visible) {
      setKind(editing?.kind || 'testimonial');
      setTitle(String(editing?.rawData.title || editing?.rawData.q || editing?.title || ''));
      setText(String(editing?.rawData.text || editing?.rawData.a || editing?.rawData.quote || ''));
      setAuthor(String(editing?.rawData.name || editing?.rawData.author || ''));
    }
  }, [visible, editing]);

  const save = async () => {
    if (!title.trim()) {
      Alert.alert('Hata', 'Başlık boş bırakılamaz.');
      return;
    }
    setBusy(true);
    try {
      const res = await upsertContent({
        id: editing?.id,
        kind,
        title: title.trim(),
        text: text.trim(),
        author: author.trim(),
      });
      if (!res.success) {
        Alert.alert('Hata', res.error || 'Kaydedilemedi.');
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
        <Text style={styles.sheetTitle}>
          {editing ? 'İçeriği Düzenle' : 'Yeni İçerik'}
        </Text>

        <Text style={styles.fieldLabel}>Tür</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.typeRow}>
            {CONTENT_TYPES.map((ct) => (
              <Pressable
                key={ct.id}
                onPress={() => setKind(ct.id)}
                style={[styles.typeChip, kind === ct.id && styles.typeChipOn]}>
                <Text style={[styles.typeChipText, kind === ct.id && styles.typeChipTextOn]}>
                  {ct.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        <Text style={styles.fieldLabel}>
          {kind === 'faq' ? 'Soru' : 'Başlık'}
        </Text>
        <TextInput
          onChangeText={setTitle}
          placeholder={kind === 'faq' ? 'Soru giriniz…' : 'Başlık giriniz…'}
          placeholderTextColor={colors.cream[300]}
          style={styles.input}
          value={title}
        />

        <Text style={styles.fieldLabel}>
          {kind === 'faq' ? 'Cevap' : 'Metin / İçerik'}
        </Text>
        <TextInput
          multiline
          numberOfLines={4}
          onChangeText={setText}
          placeholder="İçerik giriniz…"
          placeholderTextColor={colors.cream[300]}
          style={[styles.input, styles.inputMulti]}
          value={text}
        />

        {kind !== 'faq' ? (
          <>
            <Text style={styles.fieldLabel}>Yazar / İsim</Text>
            <TextInput
              onChangeText={setAuthor}
              placeholder="Yazar adı…"
              placeholderTextColor={colors.cream[300]}
              style={styles.input}
              value={author}
            />
          </>
        ) : null}

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

export default function AdminContent() {
  const [items, setItems] = useState<ContentRow[]>([]);
  const [busy, setBusy] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<ContentRow | null>(null);

  const reload = useCallback(async () => {
    setBusy(true);
    try {
      if (isUiOnly() || !supabase) {
        setItems([]);
        return;
      }
      const client = requireSupabase();
      const { data, error } = await client
        .from('site_content')
        .select('id, kind, data, sort')
        .order('sort', { ascending: true });
      if (error) throw error;
      const rows = (data || [])
        .filter((r) =>
          ['success_story', 'faq', 'tip', 'testimonial', 'daily_tip'].includes(String(r.kind)),
        )
        .map((r) => {
          const rawData = (r.data as Record<string, unknown>) || {};
          return {
            id: String(r.id),
            kind: String(r.kind === 'daily_tip' ? 'tip' : r.kind),
            title: titleFromData(String(r.kind), rawData),
            rawData,
          };
        });
      setItems(rows);
    } catch {
      setItems([]);
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const handleDelete = (id: string, title: string) => {
    Alert.alert('Sil', `"${title}" silinecek. Emin misin?`, [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          await deleteContent(id);
          void reload();
        },
      },
    ]);
  };

  return (
    <PanelScaffold showBack subtitle="Site içerikleri" title="İçerik">
      {busy ? (
        <InlineSpinner fill />
      ) : items.length === 0 ? (
        <EmptyState title="İçerik kaydı yok." />
      ) : (
        items.map((i, idx) => {
          const kind = KIND[i.kind] || KIND.tip;
          return (
            <FadeIn delay={idx * 40} key={i.id}>
              <View style={styles.card}>
                <View style={[styles.iconBox, { backgroundColor: kind.bg }]}>
                  <Ionicons color={kind.fg} name={kind.icon} size={18} />
                </View>
                <Text numberOfLines={1} style={styles.title}>
                  {i.title}
                </Text>
                <View style={[styles.badge, { backgroundColor: kind.bg }]}>
                  <Text style={[styles.badgeText, { color: kind.fg }]}>{kind.label}</Text>
                </View>
                <Pressable
                  hitSlop={8}
                  onPress={() => {
                    setEditing(i);
                    setModalVisible(true);
                  }}>
                  <Ionicons color={colors.brand[600]} name="pencil" size={18} />
                </Pressable>
                <Pressable
                  hitSlop={8}
                  onPress={() => handleDelete(i.id, i.title)}>
                  <Ionicons color={colors.warm[500]} name="trash" size={18} />
                </Pressable>
              </View>
            </FadeIn>
          );
        })
      )}

      {/* Floating + button */}
      <Pressable
        onPress={() => {
          setEditing(null);
          setModalVisible(true);
        }}
        style={styles.fab}>
        <Ionicons color={colors.white} name="add" size={26} />
      </Pressable>

      <ContentFormModal
        editing={editing}
        onClose={() => setModalVisible(false)}
        onSaved={() => {
          setModalVisible(false);
          void reload();
        }}
        visible={modalVisible}
      />
    </PanelScaffold>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.cream[200],
    minHeight: 48,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { flex: 1, fontFamily: fonts.sansSemi, fontSize: 15, color: colors.cream[900] },
  badge: {
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: { fontFamily: fonts.sansSemi, fontSize: 11 },
  fab: {
    position: 'absolute',
    bottom: spacing.xl,
    right: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.brand[600],
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0px 4px 8px rgba(26,69,92,0.3)',
    elevation: 6,
  },
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
  typeRow: { flexDirection: 'row', gap: 8 },
  typeChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.cream[200],
    backgroundColor: colors.white,
  },
  typeChipOn: { backgroundColor: colors.brand[600], borderColor: colors.brand[600] },
  typeChipText: { fontFamily: fonts.sansSemi, fontSize: 12, color: colors.cream[800] },
  typeChipTextOn: { color: colors.white },
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
  inputMulti: {
    height: 100,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
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
