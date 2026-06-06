'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'light',
  toggle: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // The brand (DESIGN.md) is a light, ink-on-near-white system — light only.
  const [theme] = useState<Theme>('light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'light');
    // Clear any stale dark preference cached from the old dark-theme era so
    // returning visitors are not stuck on dark.
    try { localStorage.removeItem('cc-theme'); } catch {}
  }, []);

  const toggle = useCallback(() => {
    /* Light-only brand — toggle is intentionally a no-op. */
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}
