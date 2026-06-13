'use client';

import { useI18n } from '../providers/I18nProvider';

export function LanguageToggle() {
  const { locale, setLocale } = useI18n();

  const toggle = () => {
    setLocale(locale === 'en' ? 'zh' : 'en');
  };

  return (
    <button
      onClick={toggle}
      aria-label={`Switch to ${locale === 'en' ? 'Chinese' : 'English'}`}
      title={`Switch to ${locale === 'en' ? 'Chinese' : 'English'}`}
      className="flex items-center justify-center w-9 h-9 bg-[var(--cc-surface)] border border-[var(--cc-hairline)] rounded-sm cursor-pointer text-[var(--cc-ink)] text-xs font-semibold transition-colors hover:bg-[var(--cc-canvas-soft-2)]"
    >
      {locale === 'en' ? '中' : 'EN'}
    </button>
  );
}
