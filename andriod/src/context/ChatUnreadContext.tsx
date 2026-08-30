/**
 * Thin chat unread slice — layout badges without full Data/Auth re-renders.
 */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

export type ChatUnreadSummary = {
  memberUnreadTotal: number;
  staffClientUnread: number;
  collabUnread: number;
  adminStaffUnread: number;
  supportOpenCount: number;
};

type ChatUnreadContextValue = ChatUnreadSummary & {
  setFromSummary: (partial: Partial<ChatUnreadSummary>) => void;
  /** Increment generation so layouts debounce-reload badges */
  bump: () => void;
  bumpGeneration: number;
  subscribeBump: (fn: () => void) => () => void;
};

const EMPTY: ChatUnreadSummary = {
  memberUnreadTotal: 0,
  staffClientUnread: 0,
  collabUnread: 0,
  adminStaffUnread: 0,
  supportOpenCount: 0,
};

const ChatUnreadContext = createContext<ChatUnreadContextValue | null>(null);

export function ChatUnreadProvider({ children }: { children: ReactNode }) {
  const [summary, setSummary] = useState<ChatUnreadSummary>(EMPTY);
  const [bumpGeneration, setBumpGeneration] = useState(0);
  const listenersRef = useRef(new Set<() => void>());

  const setFromSummary = useCallback((partial: Partial<ChatUnreadSummary>) => {
    setSummary((prev) => ({ ...prev, ...partial }));
  }, []);

  const bump = useCallback(() => {
    setBumpGeneration((g) => g + 1);
    listenersRef.current.forEach((fn) => {
      try {
        fn();
      } catch {
        /* ignore */
      }
    });
  }, []);

  const subscribeBump = useCallback((fn: () => void) => {
    listenersRef.current.add(fn);
    return () => {
      listenersRef.current.delete(fn);
    };
  }, []);

  const value = useMemo<ChatUnreadContextValue>(
    () => ({
      ...summary,
      setFromSummary,
      bump,
      bumpGeneration,
      subscribeBump,
    }),
    [summary, setFromSummary, bump, bumpGeneration, subscribeBump],
  );

  return (
    <ChatUnreadContext.Provider value={value}>{children}</ChatUnreadContext.Provider>
  );
}

export function useChatUnread() {
  const ctx = useContext(ChatUnreadContext);
  if (!ctx) throw new Error('useChatUnread outside ChatUnreadProvider');
  return ctx;
}
