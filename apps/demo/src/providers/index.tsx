'use client';

import { type ReactNode } from 'react';
import { ThemeProvider } from './ThemeProvider';
import { I18nProvider } from './I18nProvider';
import { ToastProvider } from '@/lib/toast';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <I18nProvider>
        <ToastProvider>
          {children}
        </ToastProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}

export { useTheme, ThemeProvider } from './ThemeProvider';
export { useI18n, I18nProvider } from './I18nProvider';
export type { Locale } from './I18nProvider';
