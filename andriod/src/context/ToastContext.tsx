import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useScaledTheme } from '@/hooks/useScaledTheme';
import { enteringNative } from '@/utils/reanimatedEntering';
import { colors, fonts, radius, spacing } from '@/theme';

type ToastKind = 'info' | 'success' | 'warning' | 'error';

type ToastContextValue = {
  toast: (message: string, kind?: ToastKind, durationMs?: number) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const t = useScaledTheme();
  const [msg, setMsg] = useState<{ text: string; kind: ToastKind; id: number } | null>(null);

  const toast = useCallback((message: string, kind: ToastKind = 'info', durationMs = 2800) => {
    const id = Date.now();
    setMsg({ text: message, kind, id });
    setTimeout(() => {
      setMsg((cur) => (cur?.id === id ? null : cur));
    }, durationMs);
  }, []);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {msg ? (
        <Animated.View
          entering={enteringNative(FadeInUp.duration(280))}
          exiting={enteringNative(FadeOutUp.duration(200))}
          pointerEvents="none"
          style={[
            styles.banner,
            styles[msg.kind],
            { top: insets.top + t.ss(52), left: t.spacing.md, right: t.spacing.md },
          ]}>
          <Text style={[styles.text, { fontSize: t.type.sm }]}>{msg.text}</Text>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast within ToastProvider');
  return ctx;
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 56,
    left: spacing.md,
    right: spacing.md,
    zIndex: 100,
    borderRadius: radius.lg,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
  },
  info: { backgroundColor: colors.brand[700] },
  success: { backgroundColor: colors.sage[600] },
  warning: { backgroundColor: colors.gold[500] },
  error: { backgroundColor: colors.danger[600] },
  text: {
    fontFamily: fonts.sansSemi,
    fontSize: 14,
    color: colors.white,
    textAlign: 'center',
  },
});
