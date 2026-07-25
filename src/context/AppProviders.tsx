import type { ReactNode } from 'react';

import { ActionsProvider } from './ActionsContext';
import { AuthProvider } from './AuthContext';
import { DataProvider } from './DataContext';
import { ToastProvider } from './ToastContext';

/** Sıra: Toast → Auth → Data → Actions */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <AuthProvider>
        <DataProvider>
          <ActionsProvider>{children}</ActionsProvider>
        </DataProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
