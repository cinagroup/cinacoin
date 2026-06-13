'use client'

import { useI18n } from '@/providers'

export function LanguageToggle() {
  const { locale, setLocale } = useI18n()

  const toggle = () => {
    setLocale(locale === 'en' ? 'zh' : 'en')
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Switch language"
      className="flex h-10 items-center justify-center rounded-sm px-3 text-sm font-medium text-[var(--cc-body)] transition-colors hover:text-[var(--cc-ink)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cc-link)]"
    >
      {locale === 'en' ? '中文' : 'EN'}
    </button>
  )
}
