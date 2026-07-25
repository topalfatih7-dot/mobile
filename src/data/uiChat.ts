/**
 * UI-only in-memory chat — DB bağlanınca gerçek chat_threads kullanılır.
 */
import type { ChatContact } from '@/utils/chatContacts';
import {
  CONTACT_INFO_BLOCK_MESSAGE,
  detectExternalContactInfo,
} from '@/utils/contactInfoGuard';
import { DEMO_USER_ID } from '@/data/uiDemo';

export type UiChatThread = {
  id: string;
  memberId: string;
  staffId: string;
  staffRole: 'coach' | 'dietitian' | 'doctor';
  lastMessageAt: string | null;
  memberName: string;
  staffName: string;
  lastPreview: string;
  memberUnread: number;
  staffUnread: number;
  memberConsentAt: string | null;
  createdAt: string;
  data: Record<string, unknown>;
};

export type UiChatMessage = {
  id: string;
  threadId: string;
  senderType: 'member' | 'staff' | 'system';
  senderId: string | null;
  text: string;
  createdAt: string;
};

type Store = {
  memberId: string;
  threads: UiChatThread[];
  messages: Record<string, UiChatMessage[]>;
};

let store: Store | null = null;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

export function subscribeChatUi(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function ensureStore(
  contacts: ChatContact[],
  memberName: string,
  memberId = DEMO_USER_ID,
): Store {
  if (store && store.memberId === memberId) return store;
  const now = new Date().toISOString();
  const threads: UiChatThread[] = contacts.map((c, i) => {
    const id = `ui-thread-${memberId}-${c.staffRole}`;
    return {
      id,
      memberId,
      staffId: c.staffId,
      staffRole: c.staffRole,
      lastMessageAt: i === 0 ? now : null,
      memberName,
      staffName: c.name,
      lastPreview: i === 0 ? 'Merhaba! Programınızı kontrol ettiniz mi?' : '',
      memberUnread: i === 0 ? 1 : 0,
      staffUnread: 0,
      memberConsentAt: null,
      createdAt: now,
      data: {},
    };
  });
  const messages: Record<string, UiChatMessage[]> = {};
  if (threads[0]) {
    messages[threads[0].id] = [
      {
        id: 'ui-msg-1',
        threadId: threads[0].id,
        senderType: 'staff',
        senderId: threads[0].staffId,
        text: 'Merhaba! Programınızı kontrol ettiniz mi?',
        createdAt: now,
      },
    ];
  }
  store = { memberId, threads, messages };
  return store;
}

export function getChatSnapshot(
  contacts: ChatContact[],
  memberName: string,
  memberId?: string,
) {
  return ensureStore(contacts, memberName, memberId || DEMO_USER_ID);
}

export function recordChatConsent(threadId: string) {
  if (!store) return;
  const iso = new Date().toISOString();
  store.threads = store.threads.map((t) =>
    t.id === threadId ? { ...t, memberConsentAt: iso } : t,
  );
  notify();
}

export function markChatThreadRead(threadId: string) {
  if (!store) return;
  store.threads = store.threads.map((t) =>
    t.id === threadId ? { ...t, memberUnread: 0 } : t,
  );
  notify();
}

export function sendChatMessage(
  threadId: string,
  memberId: string,
  text: string,
): { success: true } | { success: false; error: string } {
  if (!store) return { success: false, error: 'Randevu oluşturulamadı.' };
  const trimmed = text.trim();
  if (!trimmed) return { success: false, error: 'Mesaj boş.' };
  if (detectExternalContactInfo(trimmed)) {
    return { success: false, error: CONTACT_INFO_BLOCK_MESSAGE };
  }
  const thread = store.threads.find((t) => t.id === threadId);
  if (!thread) return { success: false, error: 'Mesaj gönderilemedi.' };

  const createdAt = new Date().toISOString();
  const msg: UiChatMessage = {
    id: `ui-msg-${Date.now()}`,
    threadId,
    senderType: 'member',
    senderId: memberId,
    text: trimmed,
    createdAt,
  };
  const list = store.messages[threadId] || [];
  store.messages = { ...store.messages, [threadId]: [...list, msg] };
  const preview = trimmed.length > 120 ? `${trimmed.slice(0, 120)}…` : trimmed;
  store.threads = store.threads.map((t) =>
    t.id === threadId
      ? {
          ...t,
          lastMessageAt: createdAt,
          lastPreview: preview,
          staffUnread: (t.staffUnread || 0) + 1,
        }
      : t,
  );
  notify();
  return { success: true };
}

export function resetChatUi() {
  store = null;
  notify();
}
