/**
 * i18n System for OnChainUI
 *
 * Provides translation engine, locale registration, and a Lit mixin
 * for consuming translations in web components.
 */
export { translate as t, setLocaleInternal as setLocale, setFallbackInternal as setFallbackLocale, getLocaleInternal as getLocale, getAvailableInternal as getAvailableLocales, hasInternal as has, isRTLInternal as isRTL, isLocaleRTLInternal as isLocaleRTL, registerLocaleInternal as registerLocale, registerLocalesInternal as registerLocales, lazyLocaleFactory as lazyLocale, } from './translator.js';
export type { TranslationMessages, LocaleLoader, LocaleRegistry } from './translator.js';
/**
 * Register all built-in locales with lazy loading.
 * Call `initI18n()` to eagerly load the default locale.
 */
export declare function registerAllLocales(): void;
/**
 * Initialize i18n with the browser's detected locale or a specified default.
 * @param defaultLocale - Fallback locale if detection fails (default: 'en').
 */
export declare function initI18n(defaultLocale?: string): Promise<void>;
/**
 * Detect the user's preferred locale from the browser.
 */
export declare function detectBrowserLocale(): string | null;
import type { LitElement } from 'lit';
import type { Constructor } from '../foundation/base-element.js';
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
export declare function I18nMixin<TBase extends Constructor<LitElement>>(Base: TBase): Constructor<{
    /**
     * Translate a key. Calls the global t() function.
     */
    t(key: string, params?: Record<string, unknown>): string;
    /** Whether the current locale is RTL. */
    get i18nIsRTL(): boolean;
    connectedCallback(): void;
}> & TBase;
//# sourceMappingURL=index.d.ts.map