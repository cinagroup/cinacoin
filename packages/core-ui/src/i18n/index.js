/**
 * i18n System for OnChainUI
 *
 * Provides translation engine, locale registration, and a Lit mixin
 * for consuming translations in web components.
 */
import { t as translate, getAvailableLocales as getAvailableInternal, lazyLocale as lazyLocaleFactory, } from './translator.js';
export { translate as t, setLocaleInternal as setLocale, setFallbackInternal as setFallbackLocale, getLocaleInternal as getLocale, getAvailableInternal as getAvailableLocales, hasInternal as has, isRTLInternal as isRTL, isLocaleRTLInternal as isLocaleRTL, registerLocaleInternal as registerLocale, registerLocalesInternal as registerLocales, lazyLocaleFactory as lazyLocale, } from './translator.js';
// ─── Pre-registered Locales ─────────────────────────────────────────
import { registerLocales, setFallbackLocale, setLocale, isRTL, } from './translator.js';
/**
 * Register all built-in locales with lazy loading.
 * Call `initI18n()` to eagerly load the default locale.
 */
export function registerAllLocales() {
    registerLocales({
        'en': lazyLocaleFactory(() => import('./locales/en.json')),
        'zh-CN': lazyLocaleFactory(() => import('./locales/zh-CN.json')),
        'zh': lazyLocaleFactory(() => import('./locales/zh-CN.json')),
        'ja': lazyLocaleFactory(() => import('./locales/ja.json')),
        'ko': lazyLocaleFactory(() => import('./locales/ko.json')),
        'es': lazyLocaleFactory(() => import('./locales/es.json')),
        'fr': lazyLocaleFactory(() => import('./locales/fr.json')),
        'de': lazyLocaleFactory(() => import('./locales/de.json')),
        'ru': lazyLocaleFactory(() => import('./locales/ru.json')),
        'ar': lazyLocaleFactory(() => import('./locales/ar.json')),
        'pt': lazyLocaleFactory(() => import('./locales/pt.json')),
    });
    setFallbackLocale('en');
}
/**
 * Initialize i18n with the browser's detected locale or a specified default.
 * @param defaultLocale - Fallback locale if detection fails (default: 'en').
 */
export async function initI18n(defaultLocale = 'en') {
    registerAllLocales();
    // Detect from browser
    const browserLocale = detectBrowserLocale();
    const target = browserLocale || defaultLocale;
    await setLocale(target);
}
/**
 * Detect the user's preferred locale from the browser.
 */
export function detectBrowserLocale() {
    if (typeof navigator === 'undefined')
        return null;
    const langs = navigator.languages || [navigator.language];
    const available = getAvailableInternal();
    for (const lang of langs) {
        const normalized = normalizeLocale(lang);
        if (available.includes(normalized))
            return normalized;
        // Try base locale
        const base = normalized.split('-')[0];
        if (available.includes(base))
            return base;
    }
    return null;
}
function normalizeLocale(lang) {
    const parts = lang.toLowerCase().split('-');
    if (parts.length === 1)
        return parts[0];
    return `${parts[0]}-${parts[1].toUpperCase()}`;
}
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
export function I18nMixin(Base) {
    class I18nElement extends Base {
        /**
         * Translate a key. Calls the global t() function.
         */
        t(key, params) {
            return translate(key, params);
        }
        /** Whether the current locale is RTL. */
        get i18nIsRTL() {
            return isRTL();
        }
        connectedCallback() {
            super.connectedCallback();
            // Apply RTL direction if needed
            if (isRTL()) {
                this.setAttribute('dir', 'rtl');
            }
            else {
                this.removeAttribute('dir');
            }
        }
    }
    return I18nElement;
}
//# sourceMappingURL=index.js.map