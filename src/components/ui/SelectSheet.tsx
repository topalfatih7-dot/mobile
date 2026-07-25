import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fonts, radius, spacing } from '@/theme';

export type SelectOption = { value: string; label: string };

type Props = {
  visible: boolean;
  title: string;
  options: SelectOption[];
  value?: string;
  onSelect: (value: string) => void;
  onClose: () => void;
};

/** Şehir/ilçe / ülke kodu gibi tek-seçim bottom sheet. */
export function SelectSheet({ visible, title, options, value, onSelect, onClose }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      <Pressable onPress={onClose} style={styles.backdrop}>
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={[styles.sheet, { paddingBottom: insets.bottom + spacing.md }]}>
          <View style={styles.handle} />
          <Text style={styles.title}>{title}</Text>
          <ScrollView keyboardShouldPersistTaps="handled" style={styles.list}>
            {options.map((opt) => {
              const selected = opt.value === value;
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => {
                    onSelect(opt.value);
                    onClose();
                  }}
                  style={[styles.row, selected && styles.rowSelected]}>
                  <Text style={[styles.rowText, selected && styles.rowTextSelected]}>
                    {opt.label}
                  </Text>
                  {selected ? (
                    <Ionicons color={colors.brand[600]} name="checkmark-circle" size={20} />
                  ) : null}
                </Pressable>
              );
            })}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(26,35,50,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '70%',
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: radius.full,
    backgroundColor: colors.cream[200],
    marginBottom: spacing.sm,
  },
  title: {
    fontFamily: fonts.displayBold,
    fontSize: 18,
    color: colors.cream[900],
    marginBottom: spacing.sm,
  },
  list: { maxHeight: 420 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.cream[100],
  },
  rowSelected: { backgroundColor: colors.brand[50] },
  rowText: { fontFamily: fonts.sans, fontSize: 15, color: colors.cream[900], flex: 1 },
  rowTextSelected: { fontFamily: fonts.sansSemi, color: colors.brand[700] },
});
