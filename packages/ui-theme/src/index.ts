/**
 * @cinaconnect/ui-theme
 *
 * Theme tokens and base components for CinaConnect UI.
 */

// ─── Theme Tokens ────────────────────────────────────────────────────────────

export interface ColorToken {
  primary: string;
  primaryHover: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  error: string;
  success: string;
  warning: string;
}

export interface SpacingToken {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  xxl: string;
}

export interface ThemeToken {
  colors: ColorToken;
  spacing: SpacingToken;
  radius: string;
  fontFamily: string;
}

export const defaultTheme: ThemeToken = {
  colors: {
    primary: '#6366f1',
    primaryHover: '#4f46e5',
    secondary: '#64748b',
    background: '#ffffff',
    surface: '#f8fafc',
    text: '#0f172a',
    textSecondary: '#64748b',
    border: '#e2e8f0',
    error: '#ef4444',
    success: '#22c55e',
    warning: '#f59e0b',
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px',
  },
  radius: '8px',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
};

export const darkTheme: ThemeToken = {
  ...defaultTheme,
  colors: {
    ...defaultTheme.colors,
    primary: '#818cf8',
    primaryHover: '#6366f1',
    background: '#0f172a',
    surface: '#1e293b',
    text: '#f1f5f9',
    textSecondary: '#94a3b8',
    border: '#334155',
  },
};

// ─── Theme Context ───────────────────────────────────────────────────────────

import React, { createContext, useContext, useState, useCallback } from 'react';

interface ThemeContextValue {
  theme: ThemeToken;
  mode: 'light' | 'dark';
  toggle: () => void;
  setTheme: (theme: ThemeToken) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: defaultTheme,
  mode: 'light',
  toggle: () => {},
  setTheme: () => {},
});

export interface ThemeProviderProps {
  children: React.ReactNode;
  initialMode?: 'light' | 'dark';
}

export function ThemeProvider({ children, initialMode = 'light' }: ThemeProviderProps) {
  const [mode, setMode] = useState<'light' | 'dark'>(initialMode);
  const [theme, setTheme] = useState<ThemeToken>(initialMode === 'dark' ? darkTheme : defaultTheme);

  const toggle = useCallback(() => {
    setMode((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      setTheme(next === 'dark' ? darkTheme : defaultTheme);
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, mode, toggle, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
