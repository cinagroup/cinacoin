import { useI18n } from '../providers/I18nProvider';

export default function LanguageToggle() {
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
        width: 32,
        height: 32,
        background: 'var(--cc-surface)',
        border: '1px solid var(--cc-border)',
        borderRadius: 'var(--cc-radius-sm)',
        cursor: 'pointer',
        color: 'var(--cc-text)',
        fontSize: 11,
        fontWeight: 600,
        padding: 0,
      }}
    >
      {locale === 'en' ? '中' : 'EN'}
    </button>
  );
}
