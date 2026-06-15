/**
 * @cinacoin/design-system — RTL (Right-to-Left) Layout Support
 *
 * Provides CSS logical properties utilities and RTL layout management
 * for internationalization (Arabic, Hebrew, etc.).
 *
 * Uses CSS logical properties (margin-inline-start, padding-inline-end, etc.)
 * to automatically mirror layouts when dir="rtl" is set on the document.
 *
 * @example
 * ```ts
 * import { setDirection, getDirection, onDirectionChange } from '@cinacoin/design-system';
 *
 * // Set RTL direction
 * setDirection('rtl');
 *
 * // Listen for direction changes
 * const unsubscribe = onDirectionChange((dir) => {
 *   console.log('Direction changed to:', dir);
 * });
 * ```
 */

export type TextDirection = 'ltr' | 'rtl';

/**
 * Get the current text direction from the document.
 * Defaults to 'ltr' if not set or in SSR context.
 */
export function getDirection(): TextDirection {
  if (typeof document === 'undefined') return 'ltr';
  const dir = document.documentElement.getAttribute('dir');
  return dir === 'rtl' ? 'rtl' : 'ltr';
}

/**
 * Set the text direction on the document element.
 *
 * Updates the `dir` attribute and dispatches a custom event
 * `cinacoin:directionchange` for components to react.
 *
 * @param direction - 'ltr' or 'rtl'
 */
export function setDirection(direction: TextDirection): void {
  if (typeof document === 'undefined') return;

  const current = getDirection();
  if (current === direction) return;

  document.documentElement.setAttribute('dir', direction);

  // Dispatch custom event for components that need to react
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('cinacoin:directionchange', {
        detail: { direction },
      }),
    );
  }
}

/**
 * Toggle between LTR and RTL directions.
 */
export function toggleDirection(): TextDirection {
  const newDir = getDirection() === 'ltr' ? 'rtl' : 'ltr';
  setDirection(newDir);
  return newDir;
}

/**
 * Listen for direction changes.
 *
 * @param callback - Called with the new direction when it changes.
 * @returns Unsubscribe function.
 */
export function onDirectionChange(callback: (direction: TextDirection) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handler = (e: Event) => {
    const customEvent = e as CustomEvent<{ direction: TextDirection }>;
    callback(customEvent.detail.direction);
  };

  window.addEventListener('cinacoin:directionchange', handler);
  return () => window.removeEventListener('cinacoin:directionchange', handler);
}

/**
 * Detect if the user's preferred language requires RTL layout.
 *
 * @param locale - BCP 47 locale code (e.g., 'ar', 'he', 'fa', 'ur')
 * @returns true if the locale is RTL
 */
export function isRTLLocale(locale: string): boolean {
  const rtlLanguages = ['ar', 'he', 'fa', 'ur', 'ps', 'sd', 'yi', 'ckb'];
  const lang = locale.split('-')[0].toLowerCase();
  return rtlLanguages.includes(lang);
}

/**
 * Automatically set direction based on locale.
 *
 * @param locale - BCP 47 locale code
 */
export function setDirectionFromLocale(locale: string): void {
  setDirection(isRTLLocale(locale) ? 'rtl' : 'ltr');
}

/**
 * CSS logical properties mapping.
 *
 * These utilities help convert physical CSS properties to logical ones
 * for automatic RTL support.
 *
 * Physical → Logical mapping:
 * - margin-left → margin-inline-start
 * - margin-right → margin-inline-end
 * - padding-left → padding-inline-start
 * - padding-right → padding-inline-end
 * - left → inset-inline-start
 * - right → inset-inline-end
 * - border-left → border-inline-start
 * - border-right → border-inline-end
 * - border-top-left-radius → border-start-start-radius
 * - border-top-right-radius → border-start-end-radius
 * - border-bottom-left-radius → border-end-start-radius
 * - border-bottom-right-radius → border-end-end-radius
 * - text-align: left → text-align: start
 * - text-align: right → text-align: end
 * - float: left → float: inline-start
 * - float: right → float: inline-end
 */
export const logicalPropertyMap: Record<string, string> = {
  'margin-left': 'margin-inline-start',
  'margin-right': 'margin-inline-end',
  'padding-left': 'padding-inline-start',
  'padding-right': 'padding-inline-end',
  left: 'inset-inline-start',
  right: 'inset-inline-end',
  'border-left': 'border-inline-start',
  'border-right': 'border-inline-end',
  'border-left-width': 'border-inline-start-width',
  'border-right-width': 'border-inline-end-width',
  'border-left-color': 'border-inline-start-color',
  'border-right-color': 'border-inline-end-color',
  'border-left-style': 'border-inline-start-style',
  'border-right-style': 'border-inline-end-style',
  'border-top-left-radius': 'border-start-start-radius',
  'border-top-right-radius': 'border-start-end-radius',
  'border-bottom-left-radius': 'border-end-start-radius',
  'border-bottom-right-radius': 'border-end-end-radius',
  'text-align: left': 'text-align: start',
  'text-align: right': 'text-align: end',
  'float: left': 'float: inline-start',
  'float: right': 'float: inline-end',
};

/**
 * Generate CSS with RTL support using logical properties.
 *
 * Returns CSS string with both LTR and RTL variants using
 * [dir="ltr"] and [dir="rtl"] selectors.
 *
 * @example
 * ```ts
 * const css = generateRTLStyles({
 *   '.sidebar': { marginLeft: '16px' },
 *   '.icon': { transform: 'rotate(0deg)' },
 * });
 * ```
 */
export function generateRTLStyles(
  styles: Record<string, Record<string, string>>,
): string {
  const ltrRules: string[] = [];
  const rtlRules: string[] = [];

  for (const [selector, properties] of Object.entries(styles)) {
    const ltrProps: string[] = [];
    const rtlProps: string[] = [];

    for (const [prop, value] of Object.entries(properties)) {
      // Check if this property has an RTL counterpart
      const logicalProp = logicalPropertyMap[`${prop}: ${value}`];
      if (logicalProp) {
        ltrProps.push(`  ${prop}: ${value};`);
        rtlProps.push(`  ${logicalProp.split(': ')[0]}: ${logicalProp.split(': ')[1] || value};`);
      } else {
        // Use logical properties where possible
        const logicalKey = logicalPropertyMap[prop];
        if (logicalKey) {
          ltrProps.push(`  ${logicalKey}: ${value};`);
          rtlProps.push(`  ${logicalKey}: ${value};`);
        } else {
          ltrProps.push(`  ${prop}: ${value};`);
          rtlProps.push(`  ${prop}: ${value};`);
        }
      }
    }

    if (ltrProps.length) {
      ltrRules.push(`[dir="ltr"] ${selector} {\n${ltrProps.join('\n')}\n}`);
      rtlRules.push(`[dir="rtl"] ${selector} {\n${rtlProps.join('\n')}\n}`);
    }
  }

  return [...ltrRules, ...rtlRules].join('\n\n');
}

/**
 * CSS snippet for RTL support using logical properties.
 *
 * Inject this into your application's CSS to enable automatic
 * layout mirroring when dir="rtl" is set.
 */
export const RTL_CSS = `
/* RTL Support — CSS Logical Properties */
/* These styles automatically mirror when dir="rtl" is set on <html> */

[dir="rtl"] {
  direction: rtl;
  text-align: right;
}

[dir="ltr"] {
  direction: ltr;
  text-align: left;
}

/* Logical property examples for component authors:
 *
 * Instead of:
 *   margin-left: 16px;
 * Use:
 *   margin-inline-start: 16px;
 *
 * Instead of:
 *   padding-right: 8px;
 * Use:
 *   padding-inline-end: 8px;
 *
 * Instead of:
 *   left: 0;
 * Use:
 *   inset-inline-start: 0;
 *
 * Instead of:
 *   border-radius: 8px 0 0 8px;
 * Use:
 *   border-start-start-radius: 8px;
 *   border-end-start-radius: 8px;
 */
`.trim();
