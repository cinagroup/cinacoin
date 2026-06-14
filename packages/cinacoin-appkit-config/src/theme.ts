/**
 * Cinacoin Brand Theme Configuration
 *
 * Defines the visual identity for Cinacoin AppKit integration.
 * Maps Cinacoin brand colors to Reown AppKit theme variables.
 */

export interface CinacoinTheme {
  /** Primary brand color */
  primary: string;
  /** Secondary/accent color */
  accent: string;
  /** Background colors */
  background: {
    light: string;
    dark: string;
  };
  /** Text colors */
  text: {
    primary: string;
    secondary: string;
  };
  /** Border colors */
  border: {
    light: string;
    dark: string;
  };
}

/**
 * Cinacoin brand colors
 */
export const CINACOIN_COLORS: CinacoinTheme = {
  primary: '#0066FF', // Cinacoin Blue
  accent: '#00D4FF', // Cinacoin Cyan
  background: {
    light: '#FFFFFF',
    dark: '#0A0B0D',
  },
  text: {
    primary: '#1A1B1F',
    secondary: '#6B7280',
  },
  border: {
    light: '#E5E7EB',
    dark: '#272A2F',
  },
};

/**
 * Reown AppKit theme variables for light mode
 */
export const LIGHT_THEME_VARIABLES = {
  '--w3m-color-mix': CINACOIN_COLORS.primary,
  '--w3m-color-mix-strength': 20,
  '--w3m-font-family':
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, sans-serif',
  '--w3m-border-radius-master': '12px',
  '--w3m-accent': CINACOIN_COLORS.primary,
  '--w3m-background': CINACOIN_COLORS.background.light,
};

/**
 * Reown AppKit theme variables for dark mode
 */
export const DARK_THEME_VARIABLES = {
  '--w3m-color-mix': CINACOIN_COLORS.primary,
  '--w3m-color-mix-strength': 15,
  '--w3m-font-family':
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, sans-serif',
  '--w3m-border-radius-master': '12px',
  '--w3m-accent': CINACOIN_COLORS.accent,
  '--w3m-background': CINACOIN_COLORS.background.dark,
};

/**
 * Complete theme configuration for Reown AppKit
 */
export const CINACOIN_THEME = {
  light: LIGHT_THEME_VARIABLES,
  dark: DARK_THEME_VARIABLES,
};

/**
 * Get theme variables based on mode
 */
export function getThemeVariables(mode: 'light' | 'dark') {
  return mode === 'light' ? LIGHT_THEME_VARIABLES : DARK_THEME_VARIABLES;
}
