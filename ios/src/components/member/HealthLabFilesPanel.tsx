import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useCallback, useEffect, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import {
  getHealthLabResultUrl,
  pickLabFile,
  removeHealthLabResult,
  uploadHealthLabResult,
} from '@/services/memberMedia';
import {
  isHealthLabImage,
  type HealthLabFile,
} from '@/utils/healthLabFiles';
import { colors, fonts, radius, spacing } from '@/theme';

type Props = {
  memberId: string;
  files?: HealthLabFile[];
  canEdit?: boolean;
  onFilesChange?: (files: HealthLabFile[]) => Promise<void> | void;
  busy?: boolean;
};

export function HealthLabFilesPanel({
  memberId,
  files = [],
  canEdit = false,
  onFilesChange,
  busy = false,
}: Props) {
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [urlError, setUrlError] = useState<Record<string, boolean>>({});
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [removingPath, setRemovingPath] = useState('');

  useEffect(() => {
    if (!memberId || !files.length) {
      setUrls({});
      setUrlError({});
      return undefined;
    }
    let cancelled = false;
    void (async () => {
      const next: Record<string, string> = {};
      const failed: Record<string, boolean> = {};
      await Promise.all(
        files.map(async (file) => {
          const res = await getHealthLabResultUrl(file.path, memberId);
          if (res.ok && res.url) next[file.path] = res.url;
          else failed[file.path] = true;
        }),
      );
      if (!cancelled) {
        setUrls(next);
        setUrlError(failed);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [files, memberId]);

  const handlePick = useCallback(async () => {
    if (!canEdit || !memberId || !onFilesChange) return;
    setError('');
    const picked = await pickLabFile();
    if (!picked) return;
    setUploading(true);
    try {
      const res = await uploadHealthLabResult({
        userId: memberId,
        uri: picked.uri,
        fileName: picked.name,
        contentType: picked.mimeType,
      });
      if (!res.ok) {
        setError(res.error || 'Yükleme başarısız');
        return;
      }
      await onFilesChange([...files, res.meta]);
    } finally {
      setUploading(false);
    }
  }, [canEdit, files, memberId, onFilesChange]);

  const handleRemove = useCallback(
    async (path: string) => {
      if (!canEdit || !memberId || !onFilesChange) return;
      setError('');
      setRemovingPath(path);
      try {
        const res = await removeHealthLabResult(path, memberId);
        if (!res.ok) {
          setError(res.error || 'Dosya silinemedi');
          return;
        }
        await onFilesChange(files.filter((f) => f.path !== path));
      } finally {
        setRemovingPath('');
      }
    },
    [canEdit, files, memberId, onFilesChange],
  );

  const disabled = busy || uploading || Boolean(removingPath);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <Ionicons color={colors.white} name="document-text" size={16} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.title}>Kan tahlilleri</Text>
          <Text style={styles.sub}>
            {canEdit
              ? 'Yüklediklerinizi silebilir veya yenisini ekleyebilirsiniz. Uzmanlarınız sağlık profilinizde görür.'
              : 'Üyenin yüklediği laboratuvar sonuçları'}
          </Text>
        </View>
      </View>

      {files.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Henüz tahlil yüklenmedi</Text>
        </View>
      ) : (
        <View style={{ gap: spacing.sm }}>
          {files.map((file) => {
            const url = urls[file.path];
            const image = isHealthLabImage(file);
            return (
              <View key={file.path} style={styles.fileRow}>
                {image && url ? (
                  <Image contentFit="cover" source={{ uri: url }} style={styles.thumb} />
                ) : (
                  <View style={styles.thumbFallback}>
                    <Ionicons color={colors.cream[300]} name="document-text" size={20} />
                  </View>
                )}
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text numberOfLines={1} style={styles.fileName}>
                    {file.name}
                  </Text>
                  {url ? (
                    <Pressable
                      hitSlop={6}
                      onPress={() => void Linking.openURL(url)}>
                      <Text style={styles.openLink}>Aç</Text>
                    </Pressable>
                  ) : urlError[file.path] ? (
                    <Text style={styles.failText}>Dosya açılamadı</Text>
                  ) : (
                    <Text style={styles.pendingText}>Bağlantı hazırlanıyor…</Text>
                  )}
                </View>
                {canEdit ? (
                  <Pressable
                    accessibilityLabel={`${file.name} dosyasını sil`}
                    disabled={disabled}
                    hitSlop={8}
                    onPress={() => void handleRemove(file.path)}
                    style={styles.removeBtn}>
                    <Ionicons
                      color={colors.danger[600]}
                      name={removingPath === file.path ? 'hourglass-outline' : 'close'}
                      size={18}
                    />
                  </Pressable>
                ) : null}
              </View>
            );
          })}
        </View>
      )}

      {canEdit ? (
        <Pressable
          disabled={disabled || !memberId}
          onPress={() => void handlePick()}
          style={[styles.drop, disabled && { opacity: 0.55 }]}>
          <Ionicons color="#f43f5e" name="cloud-upload-outline" size={20} />
          <Text style={styles.dropTitle}>
            {uploading ? 'Yükleniyor…' : 'PDF veya fotoğraf yükleyin'}
          </Text>
          <Text style={styles.dropHint}>En fazla 8 MB · PDF, JPG, PNG, WEBP</Text>
        </Pressable>
      ) : null}

      {error ? (
        <Text style={styles.error}>
          <Ionicons name="alert-circle" size={14} /> {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#ffe4e6',
    backgroundColor: '#fff7f7',
    padding: spacing.md,
    gap: spacing.sm,
  },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#f43f5e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: fonts.displayBold,
    fontSize: 16,
    color: colors.cream[900],
  },
  sub: {
    marginTop: 2,
    fontFamily: fonts.sans,
    fontSize: 12,
    lineHeight: 17,
    color: colors.cream[800],
    opacity: 0.7,
  },
  empty: {
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#fecdd3',
    backgroundColor: 'rgba(255,255,255,0.7)',
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.cream[800],
    opacity: 0.5,
  },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.cream[200],
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  thumb: { width: 48, height: 48, borderRadius: 8 },
  thumbFallback: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: colors.cream[50],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.cream[200],
  },
  fileName: {
    fontFamily: fonts.sansSemi,
    fontSize: 14,
    color: colors.cream[900],
  },
  openLink: {
    marginTop: 2,
    fontFamily: fonts.sansSemi,
    fontSize: 12,
    color: colors.brand[600],
  },
  failText: {
    marginTop: 2,
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.danger[600],
  },
  pendingText: {
    marginTop: 2,
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.cream[800],
    opacity: 0.45,
  },
  removeBtn: { padding: 6 },
  drop: {
    marginTop: 4,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#fecdd3',
    backgroundColor: 'rgba(255,255,255,0.85)',
    paddingVertical: 20,
    paddingHorizontal: spacing.md,
  },
  dropTitle: {
    fontFamily: fonts.sansSemi,
    fontSize: 14,
    color: colors.cream[900],
  },
  dropHint: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.cream[800],
    opacity: 0.55,
  },
  error: {
    marginTop: 4,
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.danger[600],
  },
});
