'use client';

import { useI18n } from '@/providers/I18nProvider';

export function LanguageToggle() {
  const { locale, setLocale } = useI18n();

  return (
    <button
      type="button"
      onClick={() => setLocale(locale === 'en' ? 'zh' : 'en')}
      aria-label={locale === 'en' ? '切换到中文' : 'Switch to English'}
      className="flex h-10 px-3 items-center justify-center rounded-sm text-sm font-medium text-[var(--cc-body)] transition-colors hover:text-[var(--cc-ink)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cc-link)]"
    >
      {locale === 'en' ? '中文' : 'EN'}
    </button>
  );
}
