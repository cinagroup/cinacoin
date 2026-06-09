/**
 * @cinacoin/design-tokens
 *
 * Vercel-inspired design token system for Cinacoin UI.
 * Single source of truth for colors, typography, spacing, shadows, and more.
 *
 * @example
 * ```ts
 * import { colors, typography, spacing, shadows, generateCSSVariables } from '@cinacoin/design-tokens';
 *
 * // Direct token access
 * const primary = colors.primary; // '#171717'
 * const heading = typography.displayXl; // { fontFamily, fontSize, ... }
 *
 * // CSS variables
 * const css = generateCSSVariables({ prefix: 'cc' });
 * ```
 *
 * @packageDocumentation
 */

// ---------------------------------------------------------------------------
// Token definitions (canonical source)
// ---------------------------------------------------------------------------

export {
  tokens,
  colors,
  typography,
  spacing,
  rounded,
  shadows,
  gradients,
  fontFamily,
} from './tokens.js';

// Types
export type {
  DesignTokens,
  ColorToken,
  TypographyToken,
  TypographyTokenName,
  SpacingToken,
  RoundedToken,
  ShadowToken,
  GradientToken,
} from './tokens.js';

// ---------------------------------------------------------------------------
// CSS variable generators
// ---------------------------------------------------------------------------

export {
  generateCSSVariables,
  generateCSSTheme,
  generateCSSVariableMap,
} from './css-variables.js';

export type { GenerateOptions } from './css-variables.js';

// ---------------------------------------------------------------------------
// Convenience: pre-generated CSS string for immediate use
// ---------------------------------------------------------------------------

import { generateCSSVariables, generateCSSTheme } from './css-variables.js';

/**
 * Pre-generated CSS variables string with default prefix 'cinacoin'.
 * Inject this into your app's <head> or import the generated CSS file.
 *
 * @example
 * ```ts
 * import { cssVariables } from '@cinacoin/design-tokens';
 * document.head.insertAdjacentHTML('beforeend', `<style>${cssVariables}</style>`);
 * ```
 */
export const cssVariables: string = generateCSSVariables({ prefix: 'cinacoin' });

/**
 * Pre-generated CSS variables with short prefix 'cc'.
 */
export const cssVariablesShort: string = generateCSSVariables({ prefix: 'cc' });

/**
 * Pre-generated CSS with light + dark theme support.
 */
export const cssTheme: string = generateCSSTheme({ prefix: 'cinacoin' });
