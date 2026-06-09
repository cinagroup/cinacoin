/**
 * @cinacoin/design-tokens — CSS Variable Generator
 *
 * Converts token objects into CSS custom property declarations.
 * Supports custom prefixes, selectors, and typography expansion.
 *
 * Usage:
 *   import { generateCSSVariables } from '@cinacoin/design-tokens/css-variables';
 *   const css = generateCSSVariables({ prefix: 'cc' });
 */

import {
  colors,
  typography,
  spacing,
  rounded,
  shadows,
  gradients,
  fontFamily,
  type TypographyToken,
} from './tokens.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GenerateOptions {
  /** CSS variable prefix. Default: 'cinacoin' → --cinacoin-color-primary */
  prefix?: string;
  /** CSS selector to wrap variables in. Default: ':root' */
  selector?: string;
  /** Whether to expand typography tokens into individual properties. Default: false */
  expandTypography?: boolean;
  /** Whether to include gradient tokens. Default: true */
  includeGradients?: boolean;
  /** Whether to include font-family tokens. Default: true */
  includeFontFamily?: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Convert camelCase to kebab-case.
 * "canvasSoft2" → "canvas-soft-2"
 */
function toKebab(str: string): string {
  return str
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .toLowerCase();
}

/**
 * Flatten a token object into CSS variable declarations.
 */
function flattenTokens(
  obj: Record<string, unknown>,
  prefix: string,
  category: string,
): string[] {
  const lines: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const varName = `--${prefix}-${category}-${toKebab(key)}`;
    lines.push(`  ${varName}: ${value};`);
  }
  return lines;
}

/**
 * Expand a typography token into individual CSS properties.
 */
function expandTypographyToken(
  name: string,
  token: TypographyToken,
  prefix: string,
): string[] {
  const base = `--${prefix}-typography-${toKebab(name)}`;
  const lines: string[] = [];
  lines.push(`  ${base}-font-family: ${token.fontFamily};`);
  lines.push(`  ${base}-font-size: ${token.fontSize};`);
  lines.push(`  ${base}-font-weight: ${token.fontWeight};`);
  lines.push(`  ${base}-line-height: ${token.lineHeight};`);
  if (token.letterSpacing && token.letterSpacing !== '0px') {
    lines.push(`  ${base}-letter-spacing: ${token.letterSpacing};`);
  }
  return lines;
}

// ---------------------------------------------------------------------------
// Main Generator
// ---------------------------------------------------------------------------

/**
 * Generate CSS custom property declarations from design tokens.
 *
 * @example
 * ```ts
 * const css = generateCSSVariables({ prefix: 'cc' });
 * // Returns:
 * // :root {
 * //   --cc-color-primary: #171717;
 * //   --cc-color-on-primary: #ffffff;
 * //   ...
 * // }
 * ```
 */
export function generateCSSVariables(options: GenerateOptions = {}): string {
  const {
    prefix = 'cinacoin',
    selector = ':root',
    expandTypography = false,
    includeGradients = true,
    includeFontFamily = true,
  } = options;

  const lines: string[] = [];

  // Colors
  lines.push(...flattenTokens(colors as Record<string, unknown>, prefix, 'color'));

  // Typography
  if (expandTypography) {
    for (const [name, token] of Object.entries(typography)) {
      lines.push(...expandTypographyToken(name, token, prefix));
    }
  } else {
    // Compact: store as CSS shorthand or individual variables
    for (const [name, token] of Object.entries(typography)) {
      const base = `--${prefix}-typography-${toKebab(name)}`;
      lines.push(`  ${base}-font-family: ${token.fontFamily};`);
      lines.push(`  ${base}-font-size: ${token.fontSize};`);
      lines.push(`  ${base}-font-weight: ${token.fontWeight};`);
      lines.push(`  ${base}-line-height: ${token.lineHeight};`);
      if (token.letterSpacing && token.letterSpacing !== '0px') {
        lines.push(`  ${base}-letter-spacing: ${token.letterSpacing};`);
      }
    }
  }

  // Spacing
  lines.push(...flattenTokens(spacing as Record<string, unknown>, prefix, 'spacing'));

  // Rounded
  lines.push(...flattenTokens(rounded as Record<string, unknown>, prefix, 'rounded'));

  // Shadows
  lines.push(...flattenTokens(shadows as Record<string, unknown>, prefix, 'shadow'));

  // Gradients
  if (includeGradients) {
    lines.push(...flattenTokens(gradients as Record<string, unknown>, prefix, 'gradient'));
  }

  // Font families
  if (includeFontFamily) {
    lines.push(...flattenTokens(fontFamily as Record<string, unknown>, prefix, 'font-family'));
  }

  // Wrap in selector
  const css = `${selector} {\n${lines.join('\n')}\n}\n`;
  return css;
}

/**
 * Generate a complete CSS file with all variables and optional dark mode.
 */
export function generateCSSTheme(options: GenerateOptions = {}): string {
  const lightCSS = generateCSSVariables({
    ...options,
    selector: ':root',
  });

  // Dark mode: invert canvas/ink for demonstration
  // In production, you'd define a full dark token set
  const darkOverrides = [
    `  --${options.prefix ?? 'cinacoin'}-color-canvas: #0a0a0a;`,
    `  --${options.prefix ?? 'cinacoin'}-color-canvas-soft: #111111;`,
    `  --${options.prefix ?? 'cinacoin'}-color-canvas-soft-2: #1a1a1a;`,
    `  --${options.prefix ?? 'cinacoin'}-color-ink: #ededed;`,
    `  --${options.prefix ?? 'cinacoin'}-color-body: #a1a1a1;`,
    `  --${options.prefix ?? 'cinacoin'}-color-mute: #666666;`,
    `  --${options.prefix ?? 'cinacoin'}-color-hairline: #2a2a2a;`,
    `  --${options.prefix ?? 'cinacoin'}-color-hairline-strong: #444444;`,
  ].join('\n');

  const darkCSS = `[data-theme="dark"] {\n${darkOverrides}\n}\n`;

  return `${lightCSS}\n${darkCSS}`;
}

/**
 * Generate a JavaScript object mapping CSS variable names to values.
 * Useful for CSS-in-JS libraries.
 */
export function generateCSSVariableMap(options: GenerateOptions = {}): Record<string, string> {
  const prefix = options.prefix ?? 'cinacoin';
  const map: Record<string, string> = {};

  // Colors
  for (const [key, value] of Object.entries(colors)) {
    map[`--${prefix}-color-${toKebab(key)}`] = value;
  }

  // Spacing
  for (const [key, value] of Object.entries(spacing)) {
    map[`--${prefix}-spacing-${toKebab(key)}`] = value;
  }

  // Rounded
  for (const [key, value] of Object.entries(rounded)) {
    map[`--${prefix}-rounded-${toKebab(key)}`] = value;
  }

  // Shadows
  for (const [key, value] of Object.entries(shadows)) {
    map[`--${prefix}-shadow-${toKebab(key)}`] = value;
  }

  return map;
}
