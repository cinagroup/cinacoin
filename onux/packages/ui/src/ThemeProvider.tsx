import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';

export type Theme = 'light' | 'dark';

export interface ThemeContextValue {
  theme: Theme;
  toggle: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'light',
  toggle: () => {},
  setTheme: () => {},
});

export function useCinacoinTheme() {
  return useContext(ThemeContext);
}

function getInitialTheme(): Theme {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('cc-theme') as Theme | null;
    if (stored === 'light' || stored === 'dark') return stored;
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
  }
  return 'light';
}

export interface ThemeProviderProps {
  children: ReactNode;
  /** Force a specific theme (disables auto-detection). */
  forcedTheme?: Theme;
  /** Storage key for persisting theme. Default: 'cc-theme'. */
  storageKey?: string;
  /** Attribute to set on <html>. Default: 'data-theme'. */
  attribute?: string;
}

/**
 * Cinacoin ThemeProvider — manages light/dark theme with persistence and system preference detection.
 *
 * Usage:
 * ```tsx
 * <ThemeProvider>
 *   <App />
 * </ThemeProvider>
 * ```
 */
export function ThemeProvider({
  children,
  forcedTheme,
  storageKey = 'cc-theme',
  attribute = 'data-theme',
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(forcedTheme || 'light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (forcedTheme) {
      setThemeState(forcedTheme);
    } else {
      const stored = localStorage.getItem(storageKey) as Theme | null;
      if (stored === 'light' || stored === 'dark') {
        setThemeState(stored);
      } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        setThemeState('dark');
      }
    }
    setMounted(true);
  }, [forcedTheme, storageKey]);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.setAttribute(attribute, theme);
    try {
      localStorage.setItem(storageKey, theme);
    } catch {
      // Storage might be unavailable
    }
  }, [theme, mounted, attribute, storageKey]);

  const toggle = useCallback(() => {
    setThemeState((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
  }, []);

  // Prevent hydration mismatch
  if (!mounted) return <>{children}</>;

  return (
    <ThemeContext.Provider value={{ theme, toggle, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
