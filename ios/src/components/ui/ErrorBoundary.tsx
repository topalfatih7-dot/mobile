import { Component, type ErrorInfo, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { MeshBackground } from '@/components/ui/MeshBackground';
import { colors, fonts, spacing } from '@/theme';

type Props = { children: ReactNode };
type State = { hasError: boolean };

/** Standalone APK kırmızı kutu yerine Türkçe kurtarma — yeni ekran/uydurma UI yok. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (__DEV__) {
      console.error(error, info.componentStack);
    }
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <MeshBackground style={styles.root}>
        <View style={styles.box}>
          <Text style={styles.title}>Bir hata oluştu</Text>
          <Text style={styles.body}>
            Uygulama beklenmeyen bir hatayla karşılaştı. Lütfen tekrar deneyin.
          </Text>
          <Button label="Tekrar dene" onPress={() => this.setState({ hasError: false })} />
        </View>
      </MeshBackground>
    );
  }
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'center' },
  box: { padding: spacing.xl, gap: spacing.md },
  title: {
    fontFamily: fonts.displayBold,
    fontSize: 22,
    color: colors.cream[900],
  },
  body: {
    fontFamily: fonts.sans,
    fontSize: 15,
    lineHeight: 22,
    color: colors.cream[800],
  },
});
