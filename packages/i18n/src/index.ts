/**
 * @fileoverview Barrel exports for @cinacoin/i18n.
 *
 * Import everything from this single entry point:
 *
 *   import { useTranslation, I18nProvider, createI18n, detectLocale } from '@cinacoin/i18n';
 */

/* ---- Types ---- */
export type {
  LocaleCode,
  TranslationKeys,
  Locale,
  Namespace,
  NamespaceDict,
  NamespaceMap,
  NestedLocaleDict,
  NestedLocaleMap,
  InterpolationParams,
  LocaleInfo,
} from './types';

/* ---- i18n provider ---- */
export { createI18n, detectLocale } from './i18n';
export type { I18nInstance, I18nConfig } from './i18n';

/* ---- React hook & provider ---- */
export {
  useTranslation,
  I18nProvider,
  I18nContext,
} from './hooks/useTranslation';
export type { I18nContextValue, I18nProviderProps } from './hooks/useTranslation';

/* ---- Components ---- */
export { LocaleSelector } from './components/LocaleSelector/LocaleSelector';
export type { LocaleSelectorProps } from './components/LocaleSelector/LocaleSelector';

/* ---- Locales ---- */
export * as enUS from './locales/en-US';
export * as zhCN from './locales/zh-CN';
export * as es from './locales/es';
export * as ja from './locales/ja';
export * as ko from './locales/ko';
export * as fr from './locales/fr';
export * as de from './locales/de';
export * as ru from './locales/ru';
export * as ptBR from './locales/pt-BR';
export * as ar from './locales/ar';

/* ---- RTL Support ---- */
export {
  isRTLLocale,
  getDirectionForLocale,
  applyDirection,
  getLocaleDirectionInfo,
  enableAutoDirection,
} from './rtl';
export type { LocaleDirectionInfo } from './rtl';

/* ---- Intl Formatting ---- */
export {
  formatDate,
  formatNumber,
  formatCurrency,
  formatPercent,
  formatRelativeTime,
  formatList,
  formatDateTimeRange,
  getLocaleFromDirection,
  createFormatter,
} from './intl';
export type {
  DateFormatOptions,
  NumberFormatOptions,
  CurrencyFormatOptions,
  RelativeTimeFormatOptions,
  ListFormatOptions,
  DateTimeRangeFormatOptions,
  CinacoinFormatter,
} from './intl';
