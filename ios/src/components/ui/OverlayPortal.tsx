import {
  createContext,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { StyleSheet, View } from 'react-native';

type OverlayPortalValue = {
  push: (id: string, node: ReactNode | null) => void;
};

const OverlayPortalContext = createContext<OverlayPortalValue | null>(null);

/**
 * RN Modal içinde ikinci Modal iOS’ta açılmaz.
 * Editör köküne OverlayPortalProvider koy; SelectSheet/BirthDateField `embedded` ile buraya basar.
 */
export function OverlayPortalProvider({ children }: { children: ReactNode }) {
  const [layers, setLayers] = useState<Record<string, ReactNode>>({});
  const value = useMemo<OverlayPortalValue>(
    () => ({
      push: (id, node) => {
        setLayers((prev) => {
          if (node == null) {
            if (!(id in prev)) return prev;
            const next = { ...prev };
            delete next[id];
            return next;
          }
          return { ...prev, [id]: node };
        });
      },
    }),
    [],
  );
  const ids = Object.keys(layers);
  return (
    <OverlayPortalContext.Provider value={value}>
      <View style={styles.root}>
        {children}
        {ids.map((id) => (
          <View key={id} pointerEvents="box-none" style={styles.layer}>
            {layers[id]}
          </View>
        ))}
      </View>
    </OverlayPortalContext.Provider>
  );
}

export function OverlayPortalHost({
  id,
  children,
}: {
  id: string;
  children: ReactNode | null;
}) {
  const ctx = useContext(OverlayPortalContext);
  useLayoutEffect(() => {
    if (!ctx) return;
    ctx.push(id, children);
    return () => ctx.push(id, null);
    // children her render yeni — yalnız görünürlük/id değişince slot aç/kapa
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional
  }, [ctx, id, children == null]);
  if (!ctx) return <>{children}</>;
  return null;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  layer: {
    ...StyleSheet.absoluteFill,
    zIndex: 80,
  },
});
