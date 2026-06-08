/**
 * @cinacoin/design-tokens — Canonical Token Definitions
 *
 * Vercel-inspired design token system for Cinacoin UI.
 * These values are the single source of truth. CSS variables,
 * theme objects, and component tokens all derive from here.
 *
 * @see DESIGN_SYSTEM.md
 */

// ---------------------------------------------------------------------------
// Colors
// ---------------------------------------------------------------------------

export const colors = {
  // Brand
  primary: '#171717',
  onPrimary: '#ffffff',

  // Surface
  canvas: '#ffffff',
  canvasSoft: '#fafafa',
  canvasSoft2: '#f5f5f5',

  // Text
  ink: '#171717',
  body: '#4d4d4d',
  mute: '#888888',

  // Border
  hairline: '#ebebeb',
  hairlineStrong: '#a1a1a1',

  // Link
  link: '#0070f3',
  linkDeep: '#0761d1',
  linkBgSoft: '#d3e5ff',

  // Semantic
  success: '#0070f3',
  error: '#ee0000',
  errorSoft: '#f7d4d6',
  errorDeep: '#c50000',
  warning: '#f5a623',
  warningSoft: '#ffefcf',
  warningDeep: '#ab570a',

  // Accent
  violet: '#7928ca',
  cyan: '#50e3c2',
  highlightPink: '#ff0080',

  // Gradient
  gradientDevelopStart: '#007cf0',
  gradientDevelopEnd: '#00dfd8',
  gradientPreviewStart: '#7928ca',
  gradientPreviewEnd: '#ff0080',
  gradientShipStart: '#ff4d4d',
  gradientShipEnd: '#f9cb28',
} as const;

export type ColorToken = keyof typeof colors;

// ---------------------------------------------------------------------------
// Typography
// ---------------------------------------------------------------------------

export interface TypographyToken {
  fontFamily: string;
  fontSize: string;
  fontWeight: number | string;
  lineHeight: string;
  letterSpacing?: string;
}

const SANS = 'Geist, Inter, system-ui, -apple-system, sans-serif';
const MONO = 'Geist Mono, ui-monospace, SFMono-Regular, Menlo, Monaco, monospace';

export const typography: Record<string, TypographyToken> = {
  displayXl: {
    fontFamily: SANS,
    fontSize: '48px',
    fontWeight: 600,
    lineHeight: '48px',
    letterSpacing: '-2.4px',
  },
  displayLg: {
    fontFamily: SANS,
    fontSize: '32px',
    fontWeight: 600,
    lineHeight: '40px',
    letterSpacing: '-1.28px',
  },
  displayMd: {
    fontFamily: SANS,
    fontSize: '24px',
    fontWeight: 600,
    lineHeight: '32px',
    letterSpacing: '-0.96px',
  },
  displaySm: {
    fontFamily: SANS,
    fontSize: '20px',
    fontWeight: 600,
    lineHeight: '28px',
    letterSpacing: '-0.6px',
  },
  bodyLg: {
    fontFamily: SANS,
    fontSize: '18px',
    fontWeight: 400,
    lineHeight: '28px',
    letterSpacing: '0px',
  },
  bodyMd: {
    fontFamily: SANS,
    fontSize: '16px',
    fontWeight: 400,
    lineHeight: '24px',
    letterSpacing: '0px',
  },
  bodyMdStrong: {
    fontFamily: SANS,
    fontSize: '16px',
    fontWeight: 500,
    lineHeight: '24px',
    letterSpacing: '0px',
  },
  bodySm: {
    fontFamily: SANS,
    fontSize: '14px',
    fontWeight: 400,
    lineHeight: '20px',
    letterSpacing: '-0.28px',
  },
  bodySmStrong: {
    fontFamily: SANS,
    fontSize: '14px',
    fontWeight: 500,
    lineHeight: '20px',
    letterSpacing: '-0.28px',
  },
  caption: {
    fontFamily: SANS,
    fontSize: '12px',
    fontWeight: 400,
    lineHeight: '16px',
    letterSpacing: '0px',
  },
  captionMono: {
    fontFamily: MONO,
    fontSize: '12px',
    fontWeight: 400,
    lineHeight: '16px',
    letterSpacing: '0px',
  },
  code: {
    fontFamily: MONO,
    fontSize: '13px',
    fontWeight: 400,
    lineHeight: '20px',
    letterSpacing: '0px',
  },
  buttonMd: {
    fontFamily: SANS,
    fontSize: '14px',
    fontWeight: 500,
    lineHeight: '20px',
    letterSpacing: '0px',
  },
  buttonLg: {
    fontFamily: SANS,
    fontSize: '16px',
    fontWeight: 500,
    lineHeight: '24px',
    letterSpacing: '0px',
  },
} as const;

export type TypographyTokenName = keyof typeof typography;

// ---------------------------------------------------------------------------
// Spacing
// ---------------------------------------------------------------------------

export const spacing = {
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
} as const;

export type SpacingToken = keyof typeof spacing;

// ---------------------------------------------------------------------------
// Rounded (border-radius)
// ---------------------------------------------------------------------------

export const rounded = {
  none: '0px',
  xs: '4px',
  sm: '6px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  pillSm: '64px',
  pill: '100px',
  full: '9999px',
} as const;

export type RoundedToken = keyof typeof rounded;

// ---------------------------------------------------------------------------
// Shadows (stacked, Vercel-style — never a single heavy drop)
// ---------------------------------------------------------------------------

export const shadows = {
  level0: 'none',
  level1: '0 0 0 1px #00000014 inset',
  level2:
    '0px 1px 1px #00000005, 0px 2px 2px #0000000a, 0 0 0 1px #00000014 inset',
  level3:
    '0px 2px 2px #0000000a, 0px 8px 8px -8px #0000000a, 0 0 0 1px #00000014 inset',
  level4:
    '0px 2px 2px #0000000a, 0px 8px 16px -4px #0000000a, 0 0 0 1px #00000014 inset',
  level5:
    '0px 1px 1px #00000005, 0px 8px 16px -4px #0000000a, 0px 24px 32px -8px #0000000f, 0 0 0 1px #00000014 inset',
} as const;

export type ShadowToken = keyof typeof shadows;

// ---------------------------------------------------------------------------
// Gradients (convenience — composed from color tokens)
// ---------------------------------------------------------------------------

export const gradients = {
  develop: `linear-gradient(180deg, ${colors.gradientDevelopStart} 0%, ${colors.gradientDevelopEnd} 100%)`,
  preview: `linear-gradient(180deg, ${colors.gradientPreviewStart} 0%, ${colors.gradientPreviewEnd} 100%)`,
  ship: `linear-gradient(180deg, ${colors.gradientShipStart} 0%, ${colors.gradientShipEnd} 100%)`,
  mesh: `radial-gradient(ellipse at 20% 0%, ${colors.gradientDevelopStart}33 0%, transparent 50%), radial-gradient(ellipse at 80% 0%, ${colors.gradientPreviewStart}33 0%, transparent 50%), radial-gradient(ellipse at 50% 100%, ${colors.gradientShipStart}33 0%, transparent 50%)`,
} as const;

export type GradientToken = keyof typeof gradients;

// ---------------------------------------------------------------------------
// Font families (standalone exports for CSS-in-JS / tailwind configs)
// ---------------------------------------------------------------------------

export const fontFamily = {
  sans: SANS,
  mono: MONO,
} as const;

// ---------------------------------------------------------------------------
// Aggregate export
// ---------------------------------------------------------------------------

export const tokens = {
  colors,
  typography,
  spacing,
  rounded,
  shadows,
  gradients,
  fontFamily,
} as const;

export type DesignTokens = typeof tokens;
