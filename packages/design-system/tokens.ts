/**
 * Design tokens for Cinacoin UI.
 *
 * Core design tokens for colors, typography, spacing, and more.
 * These tokens are framework-agnostic and can be used with any CSS-in-JS solution.
 */

// ============================================================================
// Color Tokens
// ============================================================================

export interface ColorTokens {
  /** Primary brand color */
  primary: string;
  /** Secondary accent color */
  accent: string;
  /** Success state */
  success: string;
  /** Warning state */
  warning: string;
  /** Error state */
  error: string;
  /** Info state */
  info: string;
  
  /** Background colors */
  background: {
    primary: string;
    secondary: string;
    tertiary: string;
  };
  
  /** Text colors */
  text: {
    primary: string;
    secondary: string;
    muted: string;
    inverse: string;
  };
  
  /** Border colors */
  border: {
    primary: string;
    secondary: string;
    focus: string;
  };
  
  /** Surface colors (cards, modals) */
  surface: {
    primary: string;
    secondary: string;
    overlay: string;
  };
}

export const lightColors: ColorTokens = {
  primary: '#58a6ff',
  accent: '#3fb950',
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
  
  background: {
    primary: '#ffffff',
    secondary: '#f6f8fa',
    tertiary: '#eaeef2',
  },
  
  text: {
    primary: '#1f2328',
    secondary: '#656d76',
    muted: '#8b949e',
    inverse: '#ffffff',
  },
  
  border: {
    primary: '#d0d7de',
    secondary: '#eaeef2',
    focus: '#58a6ff',
  },
  
  surface: {
    primary: '#ffffff',
    secondary: '#f6f8fa',
    overlay: 'rgba(0, 0, 0, 0.5)',
  },
};

export const darkColors: ColorTokens = {
  primary: '#58a6ff',
  accent: '#3fb950',
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
  
  background: {
    primary: '#0d1117',
    secondary: '#161b22',
    tertiary: '#21262d',
  },
  
  text: {
    primary: '#e6edf3',
    secondary: '#8b949e',
    muted: '#6e7681',
    inverse: '#0d1117',
  },
  
  border: {
    primary: '#30363d',
    secondary: '#21262d',
    focus: '#58a6ff',
  },
  
  surface: {
    primary: '#161b22',
    secondary: '#21262d',
    overlay: 'rgba(0, 0, 0, 0.7)',
  },
};

// ============================================================================
// Typography Tokens
// ============================================================================

export interface TypographyTokens {
  fontFamily: {
    sans: string;
    mono: string;
  };
  fontSize: {
    xs: string;
    sm: string;
    base: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
  };
  fontWeight: {
    normal: number;
    medium: number;
    semibold: number;
    bold: number;
  };
  lineHeight: {
    tight: number;
    normal: number;
    relaxed: number;
  };
}

export const typography: TypographyTokens = {
  fontFamily: {
    sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    mono: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
  },
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
};

// ============================================================================
// Spacing Tokens
// ============================================================================

export interface SpacingTokens {
  px: string;
  0.5: string;
  1: string;
  1.5: string;
  2: string;
  2.5: string;
  3: string;
  4: string;
  5: string;
  6: string;
  8: string;
  10: string;
  12: string;
  16: string;
  20: string;
  24: string;
}

export const spacing: SpacingTokens = {
  px: '1px',
  0.5: '0.125rem',  // 2px
  1: '0.25rem',     // 4px
  1.5: '0.375rem',  // 6px
  2: '0.5rem',      // 8px
  2.5: '0.625rem',  // 10px
  3: '0.75rem',     // 12px
  4: '1rem',        // 16px
  5: '1.25rem',     // 20px
  6: '1.5rem',      // 24px
  8: '2rem',        // 32px
  10: '2.5rem',     // 40px
  12: '3rem',       // 48px
  16: '4rem',       // 64px
  20: '5rem',       // 80px
  24: '6rem',       // 96px
};

// ============================================================================
// Border Radius Tokens
// ============================================================================

export interface BorderRadiusTokens {
  none: string;
  sm: string;
  base: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  full: string;
}

export const borderRadius: BorderRadiusTokens = {
  none: '0',
  sm: '0.125rem',   // 2px
  base: '0.25rem',  // 4px
  md: '0.375rem',   // 6px
  lg: '0.5rem',     // 8px
  xl: '0.75rem',    // 12px
  '2xl': '1rem',    // 16px
  full: '9999px',
};

// ============================================================================
// Shadow Tokens
// ============================================================================

export interface ShadowTokens {
  sm: string;
  base: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
}

export const shadows: ShadowTokens = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
};

// ============================================================================
// Transition Tokens
// ============================================================================

export interface TransitionTokens {
  fast: string;
  base: string;
  slow: string;
}

export const transitions: TransitionTokens = {
  fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
  base: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
  slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
};

// ============================================================================
// Combined Design Tokens
// ============================================================================

export interface DesignTokens {
  colors: ColorTokens;
  typography: TypographyTokens;
  spacing: SpacingTokens;
  borderRadius: BorderRadiusTokens;
  shadows: ShadowTokens;
  transitions: TransitionTokens;
}

export const designTokens: DesignTokens = {
  colors: lightColors,
  typography,
  spacing,
  borderRadius,
  shadows,
  transitions,
};
