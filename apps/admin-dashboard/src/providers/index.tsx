'use client';

import { ThemeProvider } from './ThemeProvider';
import { I18nProvider } from './I18nProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <I18nProvider>
        {children}
      </I18nProvider>
    </ThemeProvider>
  );
}
