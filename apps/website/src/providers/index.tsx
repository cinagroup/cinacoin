'use client';

import { I18nProvider } from './I18nProvider';
import { ThemeProvider } from './ThemeProvider';
import { WalletProvider } from './WalletProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <I18nProvider>
        <WalletProvider>{children}</WalletProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
