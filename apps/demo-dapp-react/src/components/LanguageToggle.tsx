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
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '44px',
        height: '44px',
        background: 'var(--cc-surface)',
        border: '1px solid var(--cc-hairline)',
        borderRadius: 'var(--cc-radius-md)',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        color: 'var(--cc-ink)',
        fontSize: 12,
        fontWeight: 600,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--cc-hairline-strong)';
        e.currentTarget.style.background = 'var(--cc-canvas-soft-2)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--cc-hairline)';
        e.currentTarget.style.background = 'var(--cc-surface)';
      }}
    >
      {locale === 'en' ? '中' : 'EN'}
    </button>
  );
}
