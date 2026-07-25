import { useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { MeshBackground } from '@/components/ui/MeshBackground';
import { useToast } from '@/context/ToastContext';
import { colors, fonts, radius, spacing } from '@/theme';

/** LOCK: docs/mobile/screens/staff/admin-messages.md */
export default function StaffAdminMessages() {
  const insets = useSafeAreaInsets();
  const { toast } = useToast();
  const [text, setText] = useState('');
  const [msgs, setMsgs] = useState<
    { id: string; from: 'admin' | 'staff'; text: string }[]
  >([
    {
      id: '1',
      from: 'admin',
      text: 'Merhaba, bu haftaki seans planını kontrol eder misiniz?',
    },
    {
      id: '2',
      from: 'staff',
      text: 'Kontrol ettim, plan hazır. İki danışan için saat güncellemesi gerekiyor.',
    },
  ]);

  const send = () => {
    const t = text.trim();
    if (!t) {
      toast('Mesaj boş.', 'error');
      return;
    }
    setMsgs((m) => [...m, { id: String(Date.now()), from: 'staff', text: t }]);
    setText('');
  };

  return (
    <MeshBackground style={styles.root}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}>
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <Pressable onPress={() => router.back()}>
            <Ionicons color={colors.brand[600]} name="chevron-back" size={22} />
          </Pressable>
          <View>
            <Text style={styles.title}>Admin mesajları</Text>
            <Text style={styles.subtitle}>Yönetim ile yazışma</Text>
          </View>
        </View>
        <FlatList
          contentContainerStyle={styles.list}
          data={msgs}
          keyExtractor={(m) => m.id}
          renderItem={({ item }) => (
            <Animated.View
              entering={FadeInUp.duration(200)}
              style={[styles.msgRow, item.from === 'staff' && styles.msgRowMine]}>
              {item.from !== 'staff' ? (
                <View style={styles.peerAvatar}>
                  <Ionicons color={colors.white} name="shield" size={12} />
                </View>
              ) : null}
              <View
                style={[
                  styles.bubble,
                  item.from === 'staff' ? styles.mine : styles.other,
                ]}>
                {item.from !== 'staff' ? (
                  <Text style={styles.senderLabel}>Admin</Text>
                ) : null}
                <Text
                  style={[styles.bubbleText, item.from === 'staff' && { color: colors.white }]}>
                  {item.text}
                </Text>
              </View>
            </Animated.View>
          )}
        />
        <View style={[styles.composer, { paddingBottom: insets.bottom + 10 }]}>
          <TextInput
            multiline
            onChangeText={setText}
            placeholder="Mesaj yazın…"
            placeholderTextColor={colors.cream[300]}
            style={styles.input}
            value={text}
          />
          <Pressable
            onPress={send}
            style={({ pressed }) => [styles.send, pressed && styles.sendPressed]}>
            <Ionicons color={colors.white} name="send" size={18} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </MeshBackground>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: spacing.lg,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.cream[200],
  },
  title: { fontFamily: fonts.sansSemi, fontSize: 17, color: colors.cream[900] },
  subtitle: { fontFamily: fonts.sans, fontSize: 12, color: colors.cream[800], marginTop: 1 },
  list: { padding: spacing.lg },
  msgRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginBottom: 8,
  },
  msgRowMine: { justifyContent: 'flex-end' },
  peerAvatar: {
    width: 24,
    height: 24,
    borderRadius: radius.full,
    backgroundColor: colors.brand[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubble: {
    maxWidth: '82%',
    borderRadius: radius.lg,
    padding: 12,
    gap: 2,
  },
  mine: {
    alignSelf: 'flex-end',
    backgroundColor: colors.brand[600],
    borderBottomRightRadius: 6,
  },
  other: {
    alignSelf: 'flex-start',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.cream[200],
    borderBottomLeftRadius: 6,
  },
  senderLabel: { fontFamily: fonts.sansSemi, fontSize: 12, color: colors.brand[600] },
  bubbleText: { fontFamily: fonts.sans, fontSize: 14, color: colors.cream[900], lineHeight: 20 },
  composer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: spacing.md,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.cream[200],
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cream[200],
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.cream[900],
  },
  send: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.brand[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendPressed: { transform: [{ scale: 0.92 }] },
});
