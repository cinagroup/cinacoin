/**
 * @fileoverview RTL (Right-to-Left) layout support for @cinacoin/i18n.
 *
 * Automatically sets document direction (dir="rtl" or dir="ltr")
 * when locale changes, based on the script direction of the language.
 *
 * Integrates with the i18n system to provide seamless RTL support
 * for Arabic (ar), Hebrew (he), Farsi (fa), Urdu (ur), etc.
 *
 * @example
 * ```ts
 * import { createI18n } from '@cinacoin/i18n';
 * import { enableAutoDirection } from '@cinacoin/i18n/rtl';
 *
 * const i18n = createI18n({ ... }, 'en-US');
 *
 * // Automatically set dir="rtl" when switching to Arabic
 * enableAutoDirection(i18n);
 * ```
 */

/**
 * Set of RTL (right-to-left) language codes.
 * Based on Unicode Standard Annex #9 and common locale conventions.
 */
const RTL_LANGUAGES = new Set([
  'ar',  // Arabic
  'arc', // Aramaic
  'ckb', // Central Kurdish (Sorani)
  'dv',  // Divehi (Maldivian)
  'fa',  // Farsi (Persian)
  'he',  // Hebrew
  'ks',  // Kashmiri
  'ku',  // Kurdish
  'ps',  // Pashto
  'sd',  // Sindhi
  'ur',  // Urdu
  'yi',  // Yiddish
]);

/**
 * Check if a locale code requires RTL layout direction.
 *
 * @param locale - BCP 47 locale code (e.g. 'ar', 'ar-SA', 'he-IL')
 * @returns true if the locale's primary language is RTL
 */
export function isRTLLocale(locale: string): boolean {
  const primaryLang = locale.split('-')[0].toLowerCase();
  return RTL_LANGUAGES.has(primaryLang);
}

/**
 * Get the text direction for a given locale.
 *
 * @param locale - BCP 47 locale code
 * @returns 'rtl' or 'ltr'
 */
export function getDirectionForLocale(locale: string): 'rtl' | 'ltr' {
  return isRTLLocale(locale) ? 'rtl' : 'ltr';
}

/**
 * Apply text direction to the document element.
 *
 * Sets the `dir` attribute on `<html>` and updates `lang` attribute.
 *
 * @param locale - BCP 47 locale code
 */
export function applyDirection(locale: string): void {
  if (typeof document === 'undefined') return;

  const direction = getDirectionForLocale(locale);
  document.documentElement.setAttribute('dir', direction);
  document.documentElement.setAttribute('lang', locale);
}

/**
 * Locale metadata including direction info.
 */
export interface LocaleDirectionInfo {
  code: string;
  direction: 'rtl' | 'ltr';
  isRTL: boolean;
}

/**
 * Get direction info for a locale.
 */
export function getLocaleDirectionInfo(locale: string): LocaleDirectionInfo {
  const direction = getDirectionForLocale(locale);
  return {
    code: locale,
    direction,
    isRTL: direction === 'rtl',
  };
}

/**
 * Enable automatic direction switching when locale changes.
 *
 * Wraps the i18n instance's `setLocale` method to also update
 * the document's `dir` attribute whenever the locale changes.
 *
 * @param i18n - An I18nInstance from createI18n()
 * @returns A cleanup function that restores the original setLocale
 *
 * @example
 * ```ts
 * const i18n = createI18n(locales, 'en-US');
 * const cleanup = enableAutoDirection(i18n);
 *
 * i18n.setLocale('ar'); // Also sets dir="rtl" on <html>
 *
 * cleanup(); // Restore original behavior
 * ```
 */
export function enableAutoDirection(i18n: {
  setLocale: (code: string) => void;
  getLocale: () => string;
}): () => void {
  const originalSetLocale = i18n.setLocale.bind(i18n);

  // Apply direction for the current locale immediately
  applyDirection(i18n.getLocale());

  // Override setLocale to also update direction
  i18n.setLocale = (code: string) => {
    originalSetLocale(code);
    applyDirection(code);
  };

  // Return cleanup function
  return () => {
    i18n.setLocale = originalSetLocale;
  };
}
