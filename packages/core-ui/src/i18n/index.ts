/**
 * i18n System for OnChainUI
 *
 * Provides translation engine, locale registration, and a Lit mixin
 * for consuming translations in web components.
 */

// Re-export everything from translator
export {
  t,
  setLocale,
  setFallbackLocale,
  getLocale,
  getAvailableLocales,
  has,
  isRTL,
  isLocaleRTL,
  registerLocale,
  registerLocales,
  lazyLocale,
} from './translator.js';

export type { TranslationMessages, LocaleLoader, LocaleRegistry } from './translator.js';

// ─── Pre-registered Locales ─────────────────────────────────────────

import {
  registerLocales,
  setFallbackLocale,
  setLocale,
  getAvailableLocales,
  lazyLocale,
} from './translator.js';

/**
 * Register all built-in locales with lazy loading.
 * Call `initI18n()` to eagerly load the default locale.
 */
export function registerAllLocales(): void {
  registerLocales({
    'en': lazyLocale(() => import('./locales/en.json')),
    'zh-CN': lazyLocale(() => import('./locales/zh-CN.json')),
    'zh': lazyLocale(() => import('./locales/zh-CN.json')),
    'ja': lazyLocale(() => import('./locales/ja.json')),
    'ko': lazyLocale(() => import('./locales/ko.json')),
    'es': lazyLocale(() => import('./locales/es.json')),
    'fr': lazyLocale(() => import('./locales/fr.json')),
    'de': lazyLocale(() => import('./locales/de.json')),
    'ru': lazyLocale(() => import('./locales/ru.json')),
    'ar': lazyLocale(() => import('./locales/ar.json')),
    'pt': lazyLocale(() => import('./locales/pt.json')),
  });

  setFallbackLocale('en');
}

/**
 * Initialize i18n with the browser's detected locale or a specified default.
 * @param defaultLocale - Fallback locale if detection fails (default: 'en').
 */
export async function initI18n(defaultLocale: string = 'en'): Promise<void> {
  registerAllLocales();

  // Detect from browser
  const browserLocale = detectBrowserLocale();
  const target = browserLocale || defaultLocale;

  await setLocale(target);
}

/**
 * Detect the user's preferred locale from the browser.
 */
export function detectBrowserLocale(): string | null {
  if (typeof navigator === 'undefined') return null;

  const langs = navigator.languages || [navigator.language];
  const available = getAvailableLocales();

  for (const lang of langs) {
    const normalized = normalizeLocale(lang);
    if (available.includes(normalized)) return normalized;

    // Try base locale
    const base = normalized.split('-')[0];
    if (available.includes(base)) return base;
  }

  return null;
}

function normalizeLocale(lang: string): string {
  const parts = lang.toLowerCase().split('-');
  if (parts.length === 1) return parts[0];
  return `${parts[0]}-${parts[1].toUpperCase()}`;
}

// ─── Lit i18n Mixin ─────────────────────────────────────────────────

import type { LitElement } from 'lit';
import { t as translateFn, isRTL as isRTLCheck } from './translator.js';

/**
 * Mixin that adds i18n support to a LitElement.
 *
 * Usage:
 *   class MyComponent extends I18nMixin(BaseLitElement) {
 *     render() {
 *       return html`<p>${this.t('hello_world')}</p>`;
 *     }
 *   }
 *
 * The mixin also sets `dir="rtl"` on the host element when the current
 * locale is RTL (Arabic, Hebrew, etc.).
 */
/**
 * Creates a mixin that adds i18n translation support to a LitElement class.
 *
 * @param Base - The LitElement base class to extend.
 * @returns A new class with `t()` translation method and RTL auto-detection.
 *
 * @example
 * ```ts
 * class MyComponent extends I18nMixin(BaseLitElement) {
 *   render() {
 *     return html`<p>${this.t('hello_world')}</p>`;
 *   }
 * }
 * ```
 */
// Mixin constructor rest params must be `any[]` per TypeScript spec.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function I18nMixin<TBase extends new (...args: any[]) => LitElement>(Base: TBase) {
  abstract class I18nElement extends Base {
    /**
     * Translate a key. Calls the global t() function.
     */
    t(key: string, params?: Record<string, unknown>): string {
      return translateFn(key, params);
    }

    /** Whether the current locale is RTL. */
    get i18nIsRTL(): boolean {
      return isRTLCheck();
    }

    override connectedCallback(): void {
      super.connectedCallback();
      // Apply RTL direction if needed
      if (isRTLCheck()) {
        this.setAttribute('dir', 'rtl');
      } else {
        this.removeAttribute('dir');
      }
    }
  }

  return I18nElement as TBase;
}
