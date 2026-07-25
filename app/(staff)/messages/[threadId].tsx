import { useLocalSearchParams } from 'expo-router';
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
import { useData } from '@/context/DataContext';
import { useToast } from '@/context/ToastContext';
import {
  CONTACT_INFO_BLOCK_MESSAGE,
  detectExternalContactInfo,
} from '@/utils/contactInfoGuard';
import { colors, fonts, radius, spacing } from '@/theme';

/** LOCK: staff messages thread */
export default function StaffThread() {
  const { threadId } = useLocalSearchParams<{ threadId: string }>();
  const { staffClients } = useData();
  const client = staffClients.find((c) => String(c.id) === String(threadId));
  const insets = useSafeAreaInsets();
  const { toast } = useToast();
  const [text, setText] = useState('');
  const [msgs, setMsgs] = useState<
    { id: string; from: 'member' | 'staff'; text: string }[]
  >([
    {
      id: '1',
      from: 'member',
      text: 'Merhaba koçum, programı aldım.',
    },
  ]);

  const initial = String(client?.name || '?').charAt(0).toUpperCase();

  const send = () => {
    const t = text.trim();
    if (!t) {
      toast('Mesaj boş.', 'error');
      return;
    }
    if (detectExternalContactInfo(t)) {
      toast(CONTACT_INFO_BLOCK_MESSAGE, 'error');
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
          <Text style={styles.title}>{client ? String(client.name) : 'Sohbet'}</Text>
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
                  <Text style={styles.peerAvatarText}>{initial}</Text>
                </View>
              ) : null}
              <View
                style={[
                  styles.bubble,
                  item.from === 'staff' ? styles.mine : styles.other,
                ]}>
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
    backgroundColor: colors.warm[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  peerAvatarText: { fontFamily: fonts.sansSemi, fontSize: 11, color: colors.white },
  bubble: {
    maxWidth: '82%',
    borderRadius: radius.lg,
    padding: 12,
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
  bubbleText: { fontFamily: fonts.sans, fontSize: 14, color: colors.cream[900] },
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
