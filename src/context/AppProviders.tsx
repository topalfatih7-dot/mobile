import type { ReactNode } from 'react';

import { PresenceBootstrap } from '@/components/PresenceBootstrap';

import { ActionsProvider } from './ActionsContext';
import { AuthProvider } from './AuthContext';
import { DataProvider } from './DataContext';
import { ToastProvider } from './ToastContext';

/** Sıra: Toast → Auth → Data → Actions (+ presence heartbeat) */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <AuthProvider>
        <DataProvider>
          <ActionsProvider>
            <PresenceBootstrap />
            {children}
          </ActionsProvider>
        </DataProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
