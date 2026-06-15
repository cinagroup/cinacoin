/**
 * @cinacoin/theme — CSS-level prefers-color-scheme auto-detection
 *
 * Provides CSS media query support for automatic theme switching
 * based on system preferences. This works even before JavaScript loads.
 *
 * Usage:
 * 1. Import this CSS file in your app
 * 2. Or use the generateAutoThemeCSS() function to get the CSS string
 * 3. Or use the AutoThemeProvider component for React apps
 */

/**
 * Generate CSS with prefers-color-scheme media queries.
 *
 * Returns CSS that automatically switches themes based on system preferences.
 * Uses CSS custom properties for seamless transitions.
 *
 * @example
 * ```ts
 * import { generateAutoThemeCSS } from '@cinacoin/theme/auto';
 *
 * const css = generateAutoThemeCSS();
 * document.head.appendChild(<style>{css}</style>);
 * ```
 */
export function generateAutoThemeCSS(): string {
  return `
/* ==========================================================================
   Auto Theme Detection — prefers-color-scheme
   ========================================================================== */

/* Light theme (default) */
:root {
  color-scheme: light;
  
  /* Color tokens */
  --cc-primary: #171717;
  --cc-on-primary: #ffffff;
  --cc-accent: #0070f3;
  --cc-success: #0070f3;
  --cc-warning: #f5a623;
  --cc-error: #ee0000;
  --cc-info: #0070f3;
  
  /* Background colors */
  --cc-bg-primary: #ffffff;
  --cc-bg-secondary: #fafafa;
  --cc-bg-tertiary: #f5f5f5;
  
  /* Text colors */
  --cc-text-primary: #171717;
  --cc-text-secondary: #4d4d4d;
  --cc-text-muted: #888888;
  --cc-text-inverse: #ffffff;
  
  /* Border colors */
  --cc-border-primary: #ebebeb;
  --cc-border-secondary: #f5f5f5;
  --cc-border-focus: #0070f3;
  
  /* Surface colors */
  --cc-surface-primary: #ffffff;
  --cc-surface-secondary: #fafafa;
  --cc-surface-overlay: rgba(0, 0, 0, 0.5);
  
  /* Typography */
  --cc-font-sans: 'Geist', 'Inter', system-ui, -apple-system, sans-serif;
  --cc-font-mono: 'Geist Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, monospace;
  
  /* Transitions */
  --cc-transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
  --cc-transition-base: 250ms cubic-bezier(0.4, 0, 0.2, 1);
  --cc-transition-slow: 400ms cubic-bezier(0.4, 0, 0.2, 1);
}

/* Dark theme — automatic detection */
@media (prefers-color-scheme: dark) {
  :root {
    color-scheme: dark;
    
    /* Color tokens */
    --cc-primary: #ffffff;
    --cc-on-primary: #000000;
    --cc-accent: #0070f3;
    --cc-success: #0070f3;
    --cc-warning: #f5a623;
    --cc-error: #ee0000;
    --cc-info: #0070f3;
    
    /* Background colors */
    --cc-bg-primary: #000000;
    --cc-bg-secondary: #0a0a0a;
    --cc-bg-tertiary: #111111;
    
    /* Text colors */
    --cc-text-primary: #ededed;
    --cc-text-secondary: #a3a3a3;
    --cc-text-muted: #737373;
    --cc-text-inverse: #000000;
    
    /* Border colors */
    --cc-border-primary: rgba(255, 255, 255, 0.08);
    --cc-border-secondary: rgba(255, 255, 255, 0.15);
    --cc-border-focus: #0070f3;
    
    /* Surface colors */
    --cc-surface-primary: #000000;
    --cc-surface-secondary: #0a0a0a;
    --cc-surface-overlay: rgba(0, 0, 0, 0.7);
  }
}

/* Manual override — data-theme attribute takes precedence */
:root[data-theme="light"] {
  color-scheme: light;
  
  --cc-primary: #171717;
  --cc-on-primary: #ffffff;
  --cc-accent: #0070f3;
  --cc-success: #0070f3;
  --cc-warning: #f5a623;
  --cc-error: #ee0000;
  --cc-info: #0070f3;
  
  --cc-bg-primary: #ffffff;
  --cc-bg-secondary: #fafafa;
  --cc-bg-tertiary: #f5f5f5;
  
  --cc-text-primary: #171717;
  --cc-text-secondary: #4d4d4d;
  --cc-text-muted: #888888;
  --cc-text-inverse: #ffffff;
  
  --cc-border-primary: #ebebeb;
  --cc-border-secondary: #f5f5f5;
  --cc-border-focus: #0070f3;
  
  --cc-surface-primary: #ffffff;
  --cc-surface-secondary: #fafafa;
  --cc-surface-overlay: rgba(0, 0, 0, 0.5);
}

:root[data-theme="dark"] {
  color-scheme: dark;
  
  --cc-primary: #ffffff;
  --cc-on-primary: #000000;
  --cc-accent: #0070f3;
  --cc-success: #0070f3;
  --cc-warning: #f5a623;
  --cc-error: #ee0000;
  --cc-info: #0070f3;
  
  --cc-bg-primary: #000000;
  --cc-bg-secondary: #0a0a0a;
  --cc-bg-tertiary: #111111;
  
  --cc-text-primary: #ededed;
  --cc-text-secondary: #a3a3a3;
  --cc-text-muted: #737373;
  --cc-text-inverse: #000000;
  
  --cc-border-primary: rgba(255, 255, 255, 0.08);
  --cc-border-secondary: rgba(255, 255, 255, 0.15);
  --cc-border-focus: #0070f3;
  
  --cc-surface-primary: #000000;
  --cc-surface-secondary: #0a0a0a;
  --cc-surface-overlay: rgba(0, 0, 0, 0.7);
}

/* Smooth theme transitions */
:root {
  transition: background-color var(--cc-transition-base, 250ms),
              color var(--cc-transition-base, 250ms);
}

/* Prevent FOUC (Flash of Unstyled Content) */
:root:not([data-theme]) {
  visibility: hidden;
}

:root[data-theme] {
  visibility: visible;
}
`.trim();
}

/**
 * Inject auto-theme CSS into the document head.
 *
 * Creates a <style> element with the auto-detection CSS and appends it
 * to <head>. Safe to call multiple times (idempotent).
 *
 * @param id - Optional ID for the style element (default: 'cinacoin-auto-theme')
 */
export function injectAutoThemeCSS(id: string = 'cinacoin-auto-theme'): void {
  if (typeof document === 'undefined') return;

  // Check if already injected
  if (document.getElementById(id)) return;

  const style = document.createElement('style');
  style.id = id;
  style.textContent = generateAutoThemeCSS();
  document.head.appendChild(style);
}

/**
 * Remove auto-theme CSS from the document head.
 *
 * @param id - ID of the style element to remove
 */
export function removeAutoThemeCSS(id: string = 'cinacoin-auto-theme'): void {
  if (typeof document === 'undefined') return;

  const style = document.getElementById(id);
  if (style) {
    style.remove();
  }
}

/**
 * Get the current system color scheme preference.
 *
 * @returns 'light' or 'dark'
 */
export function getSystemColorScheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

/**
 * Listen for system color scheme changes.
 *
 * @param callback - Called with the new color scheme ('light' or 'dark')
 * @returns Cleanup function to unsubscribe
 *
 * @example
 * ```ts
 * const cleanup = onSystemColorSchemeChange((scheme) => {
 *   console.log('System theme changed to:', scheme);
 * });
 *
 * // Later...
 * cleanup();
 * ```
 */
export function onSystemColorSchemeChange(
  callback: (scheme: 'light' | 'dark') => void
): () => void {
  if (typeof window === 'undefined') return () => {};

  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  
  const handler = (e: MediaQueryListEvent) => {
    callback(e.matches ? 'dark' : 'light');
  };

  mediaQuery.addEventListener('change', handler);
  
  return () => {
    mediaQuery.removeEventListener('change', handler);
  };
}

/**
 * Check if the system prefers dark mode.
 *
 * @returns true if system prefers dark mode
 */
export function prefersDarkMode(): boolean {
  return getSystemColorScheme() === 'dark';
}

/**
 * Check if the system prefers light mode.
 *
 * @returns true if system prefers light mode
 */
export function prefersLightMode(): boolean {
  return getSystemColorScheme() === 'light';
}

/**
 * Check if the system prefers reduced motion.
 *
 * @returns true if system prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Check if the system prefers high contrast.
 *
 * @returns true if system prefers high contrast
 */
export function prefersHighContrast(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-contrast: more)').matches;
}

/**
 * Generate CSS with reduced motion support.
 *
 * Returns CSS that disables animations when the user prefers reduced motion.
 */
export function generateReducedMotionCSS(): string {
  return `
/* Reduced Motion Support */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
`.trim();
}

/**
 * Generate CSS with high contrast support.
 *
 * Returns CSS that enhances contrast when the user prefers high contrast.
 */
export function generateHighContrastCSS(): string {
  return `
/* High Contrast Support */
@media (prefers-contrast: more) {
  :root {
    --cc-border-primary: currentColor;
    --cc-border-secondary: currentColor;
    --cc-text-muted: var(--cc-text-secondary);
  }
}
`.trim();
}

/**
 * Generate all accessibility-related CSS.
 *
 * Combines auto-theme, reduced motion, and high contrast support.
 */
export function generateAccessibilityCSS(): string {
  return [
    generateAutoThemeCSS(),
    generateReducedMotionCSS(),
    generateHighContrastCSS(),
  ].join('\n\n');
}
