/**
 * Theme presets for Cinacoin UI.
 *
 * Pre-configured themes for light and dark modes.
 *
 * @example
 * ```ts
 * import { lightTheme, darkTheme, applyTheme } from '@cinacoin/design-system';
 *
 * applyTheme(darkTheme);
 * ```
 */

import type { DesignTokens, ColorTokens } from './tokens.js';
import { lightColors, darkColors, typography, spacing, borderRadius, shadows, transitions } from './tokens.js';

// ============================================================================
// Theme Types
// ============================================================================

export type ThemeMode = 'light' | 'dark' | 'auto';

export interface Theme {
  mode: 'light' | 'dark';
  tokens: DesignTokens;
}

// ============================================================================
// Theme Presets
// ============================================================================

export const lightTheme: Theme = {
  mode: 'light',
  tokens: {
    colors: lightColors,
    typography,
    spacing,
    borderRadius,
    shadows,
    transitions,
  },
};

export const darkTheme: Theme = {
  mode: 'dark',
  tokens: {
    colors: darkColors,
    typography,
    spacing,
    borderRadius,
    shadows,
    transitions,
  },
};

// ============================================================================
// Theme Utilities
// ============================================================================

/**
 * Get the system preferred color scheme.
 */
export function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Resolve theme mode to actual theme.
 */
export function resolveTheme(mode: ThemeMode): Theme {
  if (mode === 'auto') {
    return getSystemTheme() === 'dark' ? darkTheme : lightTheme;
  }
  return mode === 'dark' ? darkTheme : lightTheme;
}

/**
 * Apply theme to document.
 */
export function applyTheme(theme: Theme): void {
  if (typeof document === 'undefined') return;

  // Set data attribute for CSS selectors
  document.documentElement.setAttribute('data-theme', theme.mode);

  // Apply CSS custom properties
  const root = document.documentElement;
  const colors = theme.tokens.colors;

  root.style.setProperty('--cc-primary', colors.primary);
  root.style.setProperty('--cc-accent', colors.accent);
  root.style.setProperty('--cc-success', colors.success);
  root.style.setProperty('--cc-warning', colors.warning);
  root.style.setProperty('--cc-error', colors.error);
  root.style.setProperty('--cc-info', colors.info);

  root.style.setProperty('--cc-bg-primary', colors.background.primary);
  root.style.setProperty('--cc-bg-secondary', colors.background.secondary);
  root.style.setProperty('--cc-bg-tertiary', colors.background.tertiary);

  root.style.setProperty('--cc-text-primary', colors.text.primary);
  root.style.setProperty('--cc-text-secondary', colors.text.secondary);
  root.style.setProperty('--cc-text-muted', colors.text.muted);
  root.style.setProperty('--cc-text-inverse', colors.text.inverse);

  root.style.setProperty('--cc-border-primary', colors.border.primary);
  root.style.setProperty('--cc-border-secondary', colors.border.secondary);
  root.style.setProperty('--cc-border-focus', colors.border.focus);

  root.style.setProperty('--cc-surface-primary', colors.surface.primary);
  root.style.setProperty('--cc-surface-secondary', colors.surface.secondary);
  root.style.setProperty('--cc-surface-overlay', colors.surface.overlay);

  // Typography
  root.style.setProperty('--cc-font-sans', theme.tokens.typography.fontFamily.sans);
  root.style.setProperty('--cc-font-mono', theme.tokens.typography.fontFamily.mono);

  // Transitions
  root.style.setProperty('--cc-transition-fast', theme.tokens.transitions.fast);
  root.style.setProperty('--cc-transition-base', theme.tokens.transitions.base);
  root.style.setProperty('--cc-transition-slow', theme.tokens.transitions.slow);
}

/**
 * Create custom theme by merging with base theme.
 */
export function createTheme(overrides: Partial<{
  colors: Partial<ColorTokens>;
  mode: 'light' | 'dark';
}>): Theme {
  const base = overrides.mode === 'dark' ? darkTheme : lightTheme;
  
  return {
    mode: overrides.mode || base.mode,
    tokens: {
      ...base.tokens,
      colors: {
        ...base.tokens.colors,
        ...overrides.colors,
      },
    },
  };
}

/**
 * Listen for system theme changes.
 */
export function onSystemThemeChange(callback: (theme: 'light' | 'dark') => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const handler = (e: MediaQueryListEvent) => {
    callback(e.matches ? 'dark' : 'light');
  };

  mediaQuery.addEventListener('change', handler);
  return () => mediaQuery.removeEventListener('change', handler);
}

/**
 * Generate CSS variables from theme.
 */
export function generateCSSVariables(theme: Theme): string {
  const colors = theme.tokens.colors;
  
  return `
:root[data-theme="${theme.mode}"] {
  --cc-primary: ${colors.primary};
  --cc-accent: ${colors.accent};
  --cc-success: ${colors.success};
  --cc-warning: ${colors.warning};
  --cc-error: ${colors.error};
  --cc-info: ${colors.info};
  
  --cc-bg-primary: ${colors.background.primary};
  --cc-bg-secondary: ${colors.background.secondary};
  --cc-bg-tertiary: ${colors.background.tertiary};
  
  --cc-text-primary: ${colors.text.primary};
  --cc-text-secondary: ${colors.text.secondary};
  --cc-text-muted: ${colors.text.muted};
  --cc-text-inverse: ${colors.text.inverse};
  
  --cc-border-primary: ${colors.border.primary};
  --cc-border-secondary: ${colors.border.secondary};
  --cc-border-focus: ${colors.border.focus};
  
  --cc-surface-primary: ${colors.surface.primary};
  --cc-surface-secondary: ${colors.surface.secondary};
  --cc-surface-overlay: ${colors.surface.overlay};
  
  --cc-font-sans: ${theme.tokens.typography.fontFamily.sans};
  --cc-font-mono: ${theme.tokens.typography.fontFamily.mono};
  
  --cc-transition-fast: ${theme.tokens.transitions.fast};
  --cc-transition-base: ${theme.tokens.transitions.base};
  --cc-transition-slow: ${theme.tokens.transitions.slow};
}
`.trim();
}
