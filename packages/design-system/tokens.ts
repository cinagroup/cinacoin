/**
 * Design tokens for Cinacoin UI.
 *
 * Core design tokens for colors, typography, spacing, and more.
 * These tokens are framework-agnostic and can be used with any CSS-in-JS solution.
 *
 * Color values follow the CINAcoin design system (DESIGN.md).
 */

// ============================================================================
// Color Tokens
// ============================================================================

export interface ColorTokens {
  /** Primary brand color */
  primary: string;
  /** On-primary (text on primary bg) */
  onPrimary: string;
  /** Secondary accent color */
  accent: string;
  /** Success state */
  success: string;
  /** Warning state */
  warning: string;
  /** Error state */
  error: string;
  /** Info / link state */
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
  primary: '#171717',
  onPrimary: '#ffffff',
  accent: '#0070f3',
  success: '#0070f3',
  warning: '#f5a623',
  error: '#ee0000',
  info: '#0070f3',

  background: {
    primary: '#ffffff',
    secondary: '#fafafa',
    tertiary: '#f5f5f5',
  },

  text: {
    primary: '#171717',
    secondary: '#4d4d4d',
    muted: '#888888',
    inverse: '#ffffff',
  },

  border: {
    primary: '#ebebeb',
    secondary: '#f5f5f5',
    focus: '#0070f3',
  },

  surface: {
    primary: '#ffffff',
    secondary: '#fafafa',
    overlay: 'rgba(0, 0, 0, 0.5)',
  },
};

export const darkColors: ColorTokens = {
  primary: '#ffffff',
  onPrimary: '#000000',
  accent: '#0070f3',
  success: '#0070f3',
  warning: '#f5a623',
  error: '#ee0000',
  info: '#0070f3',

  background: {
    primary: '#000000',
    secondary: '#0a0a0a',
    tertiary: '#111111',
  },

  text: {
    primary: '#ededed',
    secondary: '#a3a3a3',
    muted: '#737373',
    inverse: '#000000',
  },

  border: {
    primary: 'rgba(255, 255, 255, 0.08)',
    secondary: 'rgba(255, 255, 255, 0.15)',
    focus: '#0070f3',
  },

  surface: {
    primary: '#000000',
    secondary: '#0a0a0a',
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
    sans: "'Geist', 'Inter', system-ui, -apple-system, sans-serif",
    mono: "'Geist Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, monospace",
  },
  fontSize: {
    xs: '12px',
    sm: '14px',
    base: '16px',
    lg: '18px',
    xl: '24px',
    '2xl': '32px',
    '3xl': '48px',
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
  xxs: string;
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  '3xl': string;
  '4xl': string;
  '5xl': string;
  '6xl': string;
  section: string;
}

export const spacing: SpacingTokens = {
  xxs: '4px',
  xs: '8px',
  sm: '12px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  '2xl': '40px',
  '3xl': '48px',
  '4xl': '64px',
  '5xl': '96px',
  '6xl': '128px',
  section: '192px',
};

// ============================================================================
// Border Radius Tokens
// ============================================================================

export interface BorderRadiusTokens {
  none: string;
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  pillSm: string;
  pill: string;
  full: string;
}

export const borderRadius: BorderRadiusTokens = {
  none: '0px',
  xs: '4px',
  sm: '6px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  pillSm: '64px',
  pill: '100px',
  full: '9999px',
};

// ============================================================================
// Shadow Tokens
// ============================================================================

export interface ShadowTokens {
  level0: string;
  level1: string;
  level2: string;
  level3: string;
  level4: string;
  level5: string;
}

export const shadows: ShadowTokens = {
  level0: 'none',
  level1: '0 0 0 1px rgba(0, 0, 0, 0.08) inset',
  level2:
    '0px 1px 1px rgba(0, 0, 0, 0.03), 0px 2px 2px rgba(0, 0, 0, 0.06), 0 0 0 1px rgba(0, 0, 0, 0.08) inset',
  level3:
    '0px 2px 2px rgba(0, 0, 0, 0.06), 0px 8px 8px -8px rgba(0, 0, 0, 0.06), 0 0 0 1px rgba(0, 0, 0, 0.08) inset',
  level4:
    '0px 2px 2px rgba(0, 0, 0, 0.06), 0px 8px 16px -4px rgba(0, 0, 0, 0.06), 0 0 0 1px rgba(0, 0, 0, 0.08) inset',
  level5:
    '0px 1px 1px rgba(0, 0, 0, 0.03), 0px 8px 16px -4px rgba(0, 0, 0, 0.06), 0px 24px 32px -8px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.08) inset',
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
  base: '250ms cubic-bezier(0.4, 0, 0.2, 1)',
  slow: '400ms cubic-bezier(0.4, 0, 0.2, 1)',
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
