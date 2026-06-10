/**
 * Design tokens for programmatic access.
 * Mirrors the CSS custom properties in variables.css.
 */

export const colors = {
  fg: '#171717',
  bg: '#ffffff',
  bgSoft: '#fafafa',
  border: '#ebebeb',
  textSecondary: '#4d4d4d',
  link: '#0070f3',
  white: '#ffffff',
} as const;

export const shadows = {
  none: 'none',
  level1: 'inset 0 0 0 1px rgba(0,0,0,0.08)',
  level2:
    '0px 1px 1px rgba(0,0,0,0.02), 0px 2px 2px rgba(0,0,0,0.04), inset 0 0 0 1px rgba(0,0,0,0.08)',
  level3:
    '0px 2px 2px rgba(0,0,0,0.04), 0px 8px 8px -8px rgba(0,0,0,0.04), inset 0 0 0 1px rgba(0,0,0,0.08)',
  level4:
    '0px 2px 2px rgba(0,0,0,0.04), 0px 8px 16px -4px rgba(0,0,0,0.04), inset 0 0 0 1px rgba(0,0,0,0.08)',
  level5:
    '0px 1px 1px rgba(0,0,0,0.02), 0px 8px 16px -4px rgba(0,0,0,0.04), 0px 24px 32px -8px rgba(0,0,0,0.06), inset 0 0 0 1px rgba(0,0,0,0.08)',
} as const;

export const radii = {
  pill: '100px',
  full: '9999px',
  sm: '6px',
  md: '8px',
  lg: '12px',
} as const;

export const fonts = {
  sans: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  mono: "'Geist Mono', 'Fira Code', 'JetBrains Mono', 'SF Mono', Menlo, Consolas, monospace",
} as const;

export const typography = {
  displayXL: { fontSize: 48, fontWeight: "var(--weight-semibold)", lineHeight: 48, letterSpacing: -2.4 },
  displayLG: { fontSize: 32, fontWeight: "var(--weight-semibold)", lineHeight: 40, letterSpacing: -1.28 },
  displayMD: { fontSize: 24, fontWeight: "var(--weight-semibold)", lineHeight: 32, letterSpacing: -0.96 },
  displaySM: { fontSize: 20, fontWeight: "var(--weight-semibold)", lineHeight: 28, letterSpacing: -0.6 },
  bodyLG: { fontSize: 18, fontWeight: "var(--weight-regular)", lineHeight: 28 },
  bodyMD: { fontSize: 16, fontWeight: "var(--weight-regular)", lineHeight: 24 },
  bodySM: { fontSize: 14, fontWeight: "var(--weight-regular)", lineHeight: 20, letterSpacing: -0.28 },
  caption: { fontSize: 12, fontWeight: "var(--weight-regular)", lineHeight: 16 },
  buttonMD: { fontSize: 14, fontWeight: "var(--weight-medium)" },
  buttonLG: { fontSize: 16, fontWeight: "var(--weight-medium)" },
} as const;
