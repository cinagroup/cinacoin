/**
 * @fileoverview Intl API integration for @cinacoin/i18n.
 *
 * Provides locale-aware formatting using the native Intl API:
 * - Date/time formatting (Intl.DateTimeFormat)
 * - Number formatting (Intl.NumberFormat)
 * - Currency formatting (Intl.NumberFormat with currency)
 * - Relative time formatting (Intl.RelativeTimeFormat)
 * - List formatting (Intl.ListFormat)
 *
 * These utilities replace manual string concatenation with
 * locale-aware formatting that respects regional conventions.
 *
 * @example
 * ```ts
 * import { formatDate, formatCurrency, formatRelativeTime } from '@cinacoin/i18n';
 *
 * formatDate(new Date(), 'zh-CN'); // "2026年6月15日"
 * formatCurrency(1234.56, 'USD', 'en-US'); // "$1,234.56"
 * formatRelativeTime(-1, 'day', 'ja'); // "1日前"
 * ```
 */

// ============================================================================
// Types
// ============================================================================

/**
 * Options for date formatting.
 */
export interface DateFormatOptions {
  /** Date style preset. */
  dateStyle?: 'full' | 'long' | 'medium' | 'short';
  /** Time style preset. */
  timeStyle?: 'full' | 'long' | 'medium' | 'short';
  /** Custom year format. */
  year?: 'numeric' | '2-digit';
  /** Custom month format. */
  month?: 'numeric' | '2-digit' | 'long' | 'short' | 'narrow';
  /** Custom day format. */
  day?: 'numeric' | '2-digit';
  /** Custom weekday format. */
  weekday?: 'long' | 'short' | 'narrow';
  /** Hour format. */
  hour?: 'numeric' | '2-digit';
  /** Minute format. */
  minute?: 'numeric' | '2-digit';
  /** Second format. */
  second?: 'numeric' | '2-digit';
  /** Time zone (e.g. 'UTC', 'America/New_York'). */
  timeZone?: string;
  /** Hour cycle (12h or 24h). */
  hour12?: boolean;
}

/**
 * Options for number formatting.
 */
export interface NumberFormatOptions {
  /** Number style. */
  style?: 'decimal' | 'percent' | 'scientific' | 'unit';
  /** Unit for 'unit' style (e.g. 'kilometer', 'megabyte'). */
  unit?: string;
  /** Unit display style. */
  unitDisplay?: 'long' | 'short' | 'narrow';
  /** Minimum integer digits. */
  minimumIntegerDigits?: number;
  /** Minimum fraction digits. */
  minimumFractionDigits?: number;
  /** Maximum fraction digits. */
  maximumFractionDigits?: number;
  /** Minimum significant digits. */
  minimumSignificantDigits?: number;
  /** Maximum significant digits. */
  maximumSignificantDigits?: number;
  /** Whether to use grouping separators (e.g. 1,000). */
  useGrouping?: boolean;
  /** Notation style. */
  notation?: 'standard' | 'scientific' | 'engineering' | 'compact';
  /** Sign display. */
  signDisplay?: 'auto' | 'never' | 'always' | 'exceptZero';
}

/**
 * Options for currency formatting.
 */
export interface CurrencyFormatOptions extends NumberFormatOptions {
  /** ISO 4217 currency code (e.g. 'USD', 'EUR', 'CNY'). */
  currency: string;
  /** Currency display style. */
  currencyDisplay?: 'symbol' | 'narrowSymbol' | 'code' | 'name';
  /** Currency sign style. */
  currencySign?: 'standard' | 'accounting';
}

/**
 * Options for relative time formatting.
 */
export interface RelativeTimeFormatOptions {
  /** Numeric display preference. */
  numeric?: 'always' | 'auto';
  /** Style of the output. */
  style?: 'long' | 'short' | 'narrow';
  /** Locale matcher. */
  localeMatcher?: 'lookup' | 'best fit';
}

/**
 * Options for list formatting.
 */
export interface ListFormatOptions {
  /** List type. */
  type?: 'conjunction' | 'disjunction' | 'unit';
  /** Style of the output. */
  style?: 'long' | 'short' | 'narrow';
  /** Locale matcher. */
  localeMatcher?: 'lookup' | 'best fit';
}

/**
 * Options for date/time range formatting.
 */
export interface DateTimeRangeFormatOptions extends DateFormatOptions {
  // Inherits all DateFormatOptions
}

/**
 * Formatter instance with bound locale.
 */
export interface CinacoinFormatter {
  locale: string;
  formatDate: (date: Date | number | string, options?: DateFormatOptions) => string;
  formatNumber: (value: number, options?: NumberFormatOptions) => string;
  formatCurrency: (value: number, currency: string, options?: Omit<CurrencyFormatOptions, 'currency'>) => string;
  formatPercent: (value: number, options?: NumberFormatOptions) => string;
  formatRelativeTime: (value: number, unit: RelativeTimeUnit, options?: RelativeTimeFormatOptions) => string;
  formatList: (items: string[], options?: ListFormatOptions) => string;
  formatDateTimeRange: (start: Date | number, end: Date | number, options?: DateTimeRangeFormatOptions) => string;
}

/**
 * Valid relative time units.
 */
export type RelativeTimeUnit =
  | 'year' | 'years'
  | 'quarter' | 'quarters'
  | 'month' | 'months'
  | 'week' | 'weeks'
  | 'day' | 'days'
  | 'hour' | 'hours'
  | 'minute' | 'minutes'
  | 'second' | 'seconds';

// ============================================================================
// Date Formatting
// ============================================================================

/**
 * Format a date using Intl.DateTimeFormat.
 *
 * @param date - Date to format (Date object, timestamp, or ISO string)
 * @param locale - BCP 47 locale code (e.g. 'en-US', 'zh-CN')
 * @param options - Formatting options
 * @returns Formatted date string
 *
 * @example
 * ```ts
 * formatDate(new Date(), 'en-US', { dateStyle: 'long' });
 * // "June 15, 2026"
 *
 * formatDate(new Date(), 'zh-CN', { dateStyle: 'long' });
 * // "2026年6月15日"
 *
 * formatDate(new Date(), 'de-DE', { dateStyle: 'full' });
 * // "Montag, 15. Juni 2026"
 * ```
 */
export function formatDate(
  date: Date | number | string,
  locale: string = 'en-US',
  options: DateFormatOptions = {},
): string {
  const dateObj = date instanceof Date ? date : new Date(date);
  
  // Build Intl.DateTimeFormatOptions
  const intlOptions: Intl.DateTimeFormatOptions = {};
  
  if (options.dateStyle) intlOptions.dateStyle = options.dateStyle;
  if (options.timeStyle) intlOptions.timeStyle = options.timeStyle;
  if (options.year) intlOptions.year = options.year;
  if (options.month) intlOptions.month = options.month;
  if (options.day) intlOptions.day = options.day;
  if (options.weekday) intlOptions.weekday = options.weekday;
  if (options.hour) intlOptions.hour = options.hour;
  if (options.minute) intlOptions.minute = options.minute;
  if (options.second) intlOptions.second = options.second;
  if (options.timeZone) intlOptions.timeZone = options.timeZone;
  if (options.hour12 !== undefined) intlOptions.hour12 = options.hour12;

  // Default to medium date style if nothing specified
  if (!options.dateStyle && !options.timeStyle && !options.year && !options.month && !options.day) {
    intlOptions.dateStyle = 'medium';
  }

  return new Intl.DateTimeFormat(locale, intlOptions).format(dateObj);
}

// ============================================================================
// Number Formatting
// ============================================================================

/**
 * Format a number using Intl.NumberFormat.
 *
 * @param value - Number to format
 * @param locale - BCP 47 locale code
 * @param options - Formatting options
 * @returns Formatted number string
 *
 * @example
 * ```ts
 * formatNumber(1234567.89, 'en-US');
 * // "1,234,567.89"
 *
 * formatNumber(1234567.89, 'de-DE');
 * // "1.234.567,89"
 *
 * formatNumber(1234567.89, 'zh-CN');
 * // "1,234,567.89"
 * ```
 */
export function formatNumber(
  value: number,
  locale: string = 'en-US',
  options: NumberFormatOptions = {},
): string {
  const intlOptions: Intl.NumberFormatOptions = {};

  if (options.style) intlOptions.style = options.style;
  if (options.unit) intlOptions.unit = options.unit;
  if (options.unitDisplay) intlOptions.unitDisplay = options.unitDisplay;
  if (options.minimumIntegerDigits !== undefined) intlOptions.minimumIntegerDigits = options.minimumIntegerDigits;
  if (options.minimumFractionDigits !== undefined) intlOptions.minimumFractionDigits = options.minimumFractionDigits;
  if (options.maximumFractionDigits !== undefined) intlOptions.maximumFractionDigits = options.maximumFractionDigits;
  if (options.minimumSignificantDigits !== undefined) intlOptions.minimumSignificantDigits = options.minimumSignificantDigits;
  if (options.maximumSignificantDigits !== undefined) intlOptions.maximumSignificantDigits = options.maximumSignificantDigits;
  if (options.useGrouping !== undefined) intlOptions.useGrouping = options.useGrouping;
  if (options.notation) intlOptions.notation = options.notation;
  if (options.signDisplay) intlOptions.signDisplay = options.signDisplay;

  return new Intl.NumberFormat(locale, intlOptions).format(value);
}

/**
 * Format a currency value using Intl.NumberFormat.
 *
 * @param value - Numeric value to format
 * @param currency - ISO 4217 currency code (e.g. 'USD', 'EUR', 'CNY')
 * @param locale - BCP 47 locale code
 * @param options - Additional formatting options
 * @returns Formatted currency string
 *
 * @example
 * ```ts
 * formatCurrency(1234.56, 'USD', 'en-US');
 * // "$1,234.56"
 *
 * formatCurrency(1234.56, 'EUR', 'de-DE');
 * // "1.234,56 €"
 *
 * formatCurrency(1234.56, 'CNY', 'zh-CN');
 * // "¥1,234.56"
 * ```
 */
export function formatCurrency(
  value: number,
  currency: string,
  locale: string = 'en-US',
  options: Omit<CurrencyFormatOptions, 'currency'> = {},
): string {
  const intlOptions: Intl.NumberFormatOptions = {
    style: 'currency',
    currency,
  };

  if (options.currencyDisplay) intlOptions.currencyDisplay = options.currencyDisplay;
  if (options.currencySign) intlOptions.currencySign = options.currencySign;
  if (options.minimumFractionDigits !== undefined) intlOptions.minimumFractionDigits = options.minimumFractionDigits;
  if (options.maximumFractionDigits !== undefined) intlOptions.maximumFractionDigits = options.maximumFractionDigits;
  if (options.notation) intlOptions.notation = options.notation;
  if (options.signDisplay) intlOptions.signDisplay = options.signDisplay;

  return new Intl.NumberFormat(locale, intlOptions).format(value);
}

/**
 * Format a percentage using Intl.NumberFormat.
 *
 * @param value - Decimal value (0.5 = 50%)
 * @param locale - BCP 47 locale code
 * @param options - Formatting options
 * @returns Formatted percentage string
 *
 * @example
 * ```ts
 * formatPercent(0.1234, 'en-US');
 * // "12%"
 *
 * formatPercent(0.1234, 'en-US', { minimumFractionDigits: 2 });
 * // "12.34%"
 * ```
 */
export function formatPercent(
  value: number,
  locale: string = 'en-US',
  options: NumberFormatOptions = {},
): string {
  return formatNumber(value, locale, {
    ...options,
    style: 'percent',
  });
}

// ============================================================================
// Relative Time Formatting
// ============================================================================

/**
 * Format a relative time value using Intl.RelativeTimeFormat.
 *
 * @param value - Numeric value (negative for past, positive for future)
 * @param unit - Time unit (e.g. 'day', 'hour', 'minute')
 * @param locale - BCP 47 locale code
 * @param options - Formatting options
 * @returns Formatted relative time string
 *
 * @example
 * ```ts
 * formatRelativeTime(-1, 'day', 'en-US');
 * // "1 day ago"
 *
 * formatRelativeTime(2, 'hour', 'zh-CN');
 * // "2小时后"
 *
 * formatRelativeTime(-3, 'day', 'ja', { numeric: 'auto' });
 * // "3日前"
 * ```
 */
export function formatRelativeTime(
  value: number,
  unit: RelativeTimeUnit,
  locale: string = 'en-US',
  options: RelativeTimeFormatOptions = {},
): string {
  const intlOptions: Intl.RelativeTimeFormatOptions = {};

  if (options.numeric) intlOptions.numeric = options.numeric;
  if (options.style) intlOptions.style = options.style;
  if (options.localeMatcher) intlOptions.localeMatcher = options.localeMatcher;

  // Normalize unit to singular
  const normalizedUnit = unit.replace(/s$/, '') as Intl.RelativeTimeFormatUnit;

  return new Intl.RelativeTimeFormat(locale, intlOptions).format(value, normalizedUnit);
}

// ============================================================================
// List Formatting
// ============================================================================

/**
 * Format a list of items using Intl.ListFormat.
 *
 * @param items - Array of strings to format
 * @param locale - BCP 47 locale code
 * @param options - Formatting options
 * @returns Formatted list string
 *
 * @example
 * ```ts
 * formatList(['Alice', 'Bob', 'Charlie'], 'en-US', { type: 'conjunction' });
 * // "Alice, Bob, and Charlie"
 *
 * formatList(['Alice', 'Bob', 'Charlie'], 'zh-CN', { type: 'conjunction' });
 * // "Alice、Bob和Charlie"
 *
 * formatList(['red', 'green', 'blue'], 'en-US', { type: 'disjunction' });
 * // "red, green, or blue"
 * ```
 */
export function formatList(
  items: string[],
  locale: string = 'en-US',
  options: ListFormatOptions = {},
): string {
  const intlOptions: Intl.ListFormatOptions = {};

  if (options.type) intlOptions.type = options.type;
  if (options.style) intlOptions.style = options.style;
  if (options.localeMatcher) intlOptions.localeMatcher = options.localeMatcher;

  return new Intl.ListFormat(locale, intlOptions).format(items);
}

// ============================================================================
// Date/Time Range Formatting
// ============================================================================

/**
 * Format a date/time range using Intl.DateTimeFormat.formatRange().
 *
 * @param start - Start date
 * @param end - End date
 * @param locale - BCP 47 locale code
 * @param options - Formatting options
 * @returns Formatted date range string
 *
 * @example
 * ```ts
 * formatDateTimeRange(
 *   new Date('2026-06-15'),
 *   new Date('2026-06-20'),
 *   'en-US',
 *   { dateStyle: 'medium' }
 * );
 * // "Jun 15 – 20, 2026"
 * ```
 */
export function formatDateTimeRange(
  start: Date | number,
  end: Date | number,
  locale: string = 'en-US',
  options: DateTimeRangeFormatOptions = {},
): string {
  const startObj = start instanceof Date ? start : new Date(start);
  const endObj = end instanceof Date ? end : new Date(end);

  const intlOptions: Intl.DateTimeFormatOptions = {};

  if (options.dateStyle) intlOptions.dateStyle = options.dateStyle;
  if (options.timeStyle) intlOptions.timeStyle = options.timeStyle;
  if (options.year) intlOptions.year = options.year;
  if (options.month) intlOptions.month = options.month;
  if (options.day) intlOptions.day = options.day;
  if (options.timeZone) intlOptions.timeZone = options.timeZone;

  // Default to medium date style
  if (!options.dateStyle && !options.timeStyle && !options.year && !options.month && !options.day) {
    intlOptions.dateStyle = 'medium';
  }

  const formatter = new Intl.DateTimeFormat(locale, intlOptions);

  // Use formatRange if available (ES2021+)
  if ('formatRange' in formatter) {
    return (formatter as Intl.DateTimeFormat & { formatRange: (start: Date, end: Date) => string }).formatRange(startObj, endObj);
  }

  // Fallback: format both dates separately
  return `${formatter.format(startObj)} – ${formatter.format(endObj)}`;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get the text direction for a locale.
 *
 * @param locale - BCP 47 locale code
 * @returns 'rtl' for RTL languages, 'ltr' otherwise
 */
export function getLocaleFromDirection(locale: string): 'ltr' | 'rtl' {
  const rtlLanguages = ['ar', 'he', 'fa', 'ur', 'ps', 'sd', 'yi', 'ckb'];
  const primaryLang = locale.split('-')[0].toLowerCase();
  return rtlLanguages.includes(primaryLang) ? 'rtl' : 'ltr';
}

/**
 * Create a formatter instance bound to a specific locale.
 *
 * Returns an object with all formatting methods pre-bound to the locale,
 * so you don't need to pass it on every call.
 *
 * @param locale - BCP 47 locale code
 * @returns Formatter instance with bound locale
 *
 * @example
 * ```ts
 * const fmt = createFormatter('zh-CN');
 *
 * fmt.formatDate(new Date(), { dateStyle: 'long' });
 * // "2026年6月15日"
 *
 * fmt.formatCurrency(1234.56, 'CNY');
 * // "¥1,234.56"
 *
 * fmt.formatRelativeTime(-1, 'day');
 * // "1天前"
 * ```
 */
export function createFormatter(locale: string): CinacoinFormatter {
  return {
    locale,

    formatDate(date: Date | number | string, options?: DateFormatOptions): string {
      return formatDate(date, locale, options);
    },

    formatNumber(value: number, options?: NumberFormatOptions): string {
      return formatNumber(value, locale, options);
    },

    formatCurrency(value: number, currency: string, options?: Omit<CurrencyFormatOptions, 'currency'>): string {
      return formatCurrency(value, currency, locale, options);
    },

    formatPercent(value: number, options?: NumberFormatOptions): string {
      return formatPercent(value, locale, options);
    },

    formatRelativeTime(value: number, unit: RelativeTimeUnit, options?: RelativeTimeFormatOptions): string {
      return formatRelativeTime(value, unit, locale, options);
    },

    formatList(items: string[], options?: ListFormatOptions): string {
      return formatList(items, locale, options);
    },

    formatDateTimeRange(start: Date | number, end: Date | number, options?: DateTimeRangeFormatOptions): string {
      return formatDateTimeRange(start, end, locale, options);
    },
  };
}
