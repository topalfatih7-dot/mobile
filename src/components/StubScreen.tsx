import { StyleSheet, Text, View } from 'react-native';

import { MeshBackground } from '@/components/ui/MeshBackground';
import { colors, fonts, radius, spacing } from '@/theme';

/** Faz-0 / SKIP placeholder — plan: Stories/Corporate/Apply SKIP */
export function StubScreen({
  title,
  spec,
  note,
}: {
  title: string;
  spec?: string;
  note?: string;
}) {
  return (
    <MeshBackground style={styles.root}>
      <View style={styles.card}>
        <Text style={styles.kicker}>Çok yakında</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.body}>
          {note || 'Bu içerik mobil uygulamada çok yakında. Şimdilik web sitemizden ulaşabilirsiniz.'}
        </Text>
        {spec ? <Text style={styles.spec}>{spec}</Text> : null}
      </View>
    </MeshBackground>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: spacing.lg, justifyContent: 'center' },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.cream[200],
    gap: spacing.sm,
  },
  kicker: {
    fontFamily: fonts.sansSemi,
    fontSize: 11,
    color: colors.brand[600],
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  title: { fontFamily: fonts.displayExtra, fontSize: 22, color: colors.cream[900] },
  body: { fontFamily: fonts.sans, fontSize: 14, color: colors.cream[800], lineHeight: 20 },
  spec: { fontFamily: fonts.sans, fontSize: 11, color: colors.cream[300], marginTop: 8 },
});
