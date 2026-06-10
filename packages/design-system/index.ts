import { logger } from '@cinacoin/logger';
/**
 * @cinacoin/design-system — Design tokens and theme system.
 *
 * Provides design tokens, color schemes, and theme presets
 * for consistent UI across all Cinacoin components.
 *
 * @example
 * ```ts
 * import { designTokens, darkTheme, lightTheme } from '@cinacoin/design-system';
 *
 * const theme = darkTheme;
 * logger.info(theme.colors.primary); // '#58a6ff'
 * ```
 */

export * from './tokens.js';
export * from './presets.js';
