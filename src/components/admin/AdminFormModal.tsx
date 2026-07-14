import { useEffect, useState, type ReactNode } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { colors, fonts, radius, spacing } from '@/constants/theme';

export type AdminFormField = {
  key: string;
  label: string;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'number-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words';
};

type AdminFormModalProps = {
  visible: boolean;
  title: string;
  fields: AdminFormField[];
  initialValues?: Record<string, string>;
  submitLabel?: string;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (values: Record<string, string>) => void | Promise<void>;
  extra?: ReactNode;
};

function seedValues(fields: AdminFormField[], initialValues: Record<string, string>) {
  const seed: Record<string, string> = {};
  fields.forEach((f) => {
    seed[f.key] = initialValues[f.key] || '';
  });
  return seed;
}

/** Basit admin ekle/düzenle modal — Alert.prompt yerine çapraz platform TextInput. */
export function AdminFormModal({
  visible,
  title,
  fields,
  initialValues = {},
  submitLabel = 'Kaydet',
  loading,
  onClose,
  onSubmit,
  extra,
}: AdminFormModalProps) {
  const [values, setValues] = useState(() => seedValues(fields, initialValues));

  useEffect(() => {
    if (visible) setValues(seedValues(fields, initialValues));
    // fields/initialValues reset only when modal opens
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const setField = (key: string, v: string) => setValues((prev) => ({ ...prev, [key]: v }));

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>{title}</Text>
          <ScrollView keyboardShouldPersistTaps="handled" style={styles.scroll}>
            {fields.map((field) => (
              <Input
                key={field.key}
                autoCapitalize={field.autoCapitalize}
                keyboardType={field.keyboardType}
                label={field.label}
                multiline={field.multiline}
                onChangeText={(t) => setField(field.key, t)}
                placeholder={field.placeholder}
                style={field.multiline ? styles.multi : undefined}
                value={values[field.key] || ''}
              />
            ))}
            {extra}
          </ScrollView>
          <View style={styles.actions}>
            <Button label="İptal" onPress={onClose} style={styles.flex} variant="secondary" />
            <Button
              label={submitLabel}
              loading={loading}
              onPress={() => void onSubmit(values)}
              style={styles.flex}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 22, 0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    maxHeight: '88%',
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 20,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  scroll: { maxHeight: 420 },
  multi: { minHeight: 88, textAlignVertical: 'top' },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  flex: { flex: 1 },
});
