import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { colors, fonts, radius, shadows, spacing } from '@/constants/theme';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

type ToastItem = {
  id: number;
  message: string;
  type: ToastType;
};

type ToastContextValue = {
  toast: (message: string, type?: ToastType, duration?: number) => void;
  dismiss: (id: number) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const TOAST_META: Record<
  ToastType,
  { icon: keyof typeof Ionicons.glyphMap; bg: string; border: string; color: string }
> = {
  success: { icon: 'checkmark-circle', bg: colors.sage[50], border: colors.sage[200], color: colors.sage[700] },
  error: { icon: 'close-circle', bg: '#fef2f2', border: '#fecaca', color: colors.danger },
  warning: { icon: 'warning', bg: colors.amber[50], border: colors.amber[100], color: colors.amber[600] },
  info: { icon: 'information-circle', bg: colors.brand[50], border: colors.brand[200], color: colors.brand[700] },
};

function ToastCard({
  item,
  onDismiss,
}: {
  item: ToastItem;
  onDismiss: (id: number) => void;
}) {
  const meta = TOAST_META[item.type];
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }).start();
  }, [opacity]);

  return (
    <Animated.View style={[styles.card, { opacity, backgroundColor: meta.bg, borderColor: meta.border }]}>
      <Ionicons color={meta.color} name={meta.icon} size={20} />
      <Text style={[styles.message, { color: meta.color }]}>{item.message}</Text>
      <Pressable hitSlop={8} onPress={() => onDismiss(item.id)}>
        <Ionicons color={meta.color} name="close" size={18} />
      </Pressable>
    </Animated.View>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<ToastItem[]>([]);
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: number) => {
    const timer = timers.current.get(id);
    if (timer) clearTimeout(timer);
    timers.current.delete(id);
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, type: ToastType = 'success', duration = 3500) => {
      const id = Date.now() + Math.floor(Math.random() * 1000);
      setItems((prev) => [...prev, { id, message, type }]);
      const timer = setTimeout(() => dismiss(id), duration);
      timers.current.set(id, timer);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <View pointerEvents="box-none" style={[styles.host, { bottom: Math.max(insets.bottom, 16) + 8 }]}>
        {items.map((item) => (
          <ToastCard key={item.id} item={item} onDismiss={dismiss} />
        ))}
      </View>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    zIndex: 500,
    gap: spacing.sm,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    ...shadows.card,
  },
  message: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 20,
  },
});
