import type { ReactNode } from 'react';

import { PresenceBootstrap } from '@/components/PresenceBootstrap';

import { ActionsProvider } from './ActionsContext';
import { AuthProvider } from './AuthContext';
import { ChatUnreadProvider } from './ChatUnreadContext';
import { DataProvider } from './DataContext';
import { ToastProvider } from './ToastContext';

/** Sıra: Toast → Auth → ChatUnread → Data → Actions (+ presence heartbeat) */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <AuthProvider>
        <ChatUnreadProvider>
          <DataProvider>
            <ActionsProvider>
              <PresenceBootstrap />
              {children}
            </ActionsProvider>
          </DataProvider>
        </ChatUnreadProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
