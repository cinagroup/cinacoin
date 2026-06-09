'use client';

import { useState, useEffect } from 'react';

export interface Theme {
  mode: 'light' | 'dark';
  resolved: 'light' | 'dark';
}

/**
 * Hook to manage light/dark theme.
 * Reads from localStorage and prefers system setting.
 */
export function useTheme(): {
  theme: Theme;
  setTheme: (mode: 'light' | 'dark') => void;
  toggleTheme: () => void;
} {
  const [theme, setThemeState] = useState<Theme>({
    mode: 'light',
    resolved: 'light',
  });

  useEffect(() => {
    const stored = localStorage.getItem('cinacoin-theme') as 'light' | 'dark' | null;
    const system = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const mode = stored || system;

    setThemeState({ mode, resolved: mode });
    document.documentElement.classList.toggle('dark', mode === 'dark');
  }, []);

  const setTheme = (mode: 'light' | 'dark') => {
    setThemeState({ mode, resolved: mode });
    localStorage.setItem('cinacoin-theme', mode);
    document.documentElement.classList.toggle('dark', mode === 'dark');
  };

  const toggleTheme = () => {
    setTheme(theme.mode === 'light' ? 'dark' : 'light');
  };

  return { theme, setTheme, toggleTheme };
}
