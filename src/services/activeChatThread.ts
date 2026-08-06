/**
 * Active open chat thread — mute notification sound while viewing.
 * Web parity: useIncomingChatSound isViewingThread.
 */
let activeThreadId: string | null = null;

export function setActiveChatThreadId(threadId: string | null) {
  activeThreadId = threadId ? String(threadId) : null;
}

export function getActiveChatThreadId(): string | null {
  return activeThreadId;
}
