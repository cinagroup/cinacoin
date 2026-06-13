'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type Locale = 'en' | 'zh' | 'ja';

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const translations: Record<Locale, Record<string, string>> = {
  en: {
    'nav.home': 'Home',
    'nav.basics': 'Web3 Basics',
    'nav.wallet': 'Wallet Integration',
    'nav.multichain': 'Multichain',
    'nav.best-practices': 'Best Practices',
    'nav.language': 'Language',
    'theme.toggle': 'Toggle theme',
    'sidebar.fundamentals': 'Fundamentals',
    'sidebar.advanced': 'Advanced',
    'sidebar.back': '← Back to CinaCoin',
  },
  zh: {
    'nav.home': '首页',
    'nav.basics': 'Web3 基础',
    'nav.wallet': '钱包集成',
    'nav.multichain': '多链开发',
    'nav.best-practices': '最佳实践',
    'nav.language': '语言',
    'theme.toggle': '切换主题',
    'sidebar.fundamentals': '基础',
    'sidebar.advanced': '进阶',
    'sidebar.back': '← 返回 CinaCoin',
  },
  ja: {
    'nav.home': 'ホーム',
    'nav.basics': 'Web3 基礎',
    'nav.wallet': 'ウォレット統合',
    'nav.multichain': 'マルチチェーン',
    'nav.best-practices': 'ベストプラクティス',
    'nav.language': '言語',
    'theme.toggle': 'テーマ切替',
    'sidebar.fundamentals': '基礎',
    'sidebar.advanced': '応用',
    'sidebar.back': '← CinaCoin に戻る',
  },
};

const I18nContext = createContext<I18nContextValue>({
  locale: 'en',
  setLocale: () => {},
  t: (key) => key,
});

function getStoredLocale(): Locale | null {
  if (typeof window === 'undefined') return null;
  const v = localStorage.getItem('cc-locale');
  if (v === 'en' || v === 'zh' || v === 'ja') return v;
  return null;
}

function getBrowserLocale(): Locale {
  if (typeof navigator === 'undefined') return 'en';
  const lang = navigator.language.split('-')[0];
  if (lang === 'zh' || lang === 'ja') return lang;
  return 'en';
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const initial = getStoredLocale() ?? getBrowserLocale();
    setLocaleState(initial);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem('cc-locale', locale);
    document.documentElement.lang = locale;
  }, [locale, mounted]);

  const setLocale = (newLocale: Locale) => setLocaleState(newLocale);

  const t = (key: string): string => {
    return translations[locale][key] || translations.en[key] || key;
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}

export function LanguageToggle() {
  const { locale, setLocale } = useI18n();

  const languages: { code: Locale; label: string; flag: string }[] = [
    { code: 'en', label: 'EN', flag: '🇺🇸' },
    { code: 'zh', label: '中文', flag: '🇨🇳' },
    { code: 'ja', label: '日本語', flag: '🇯🇵' },
  ];

  return (
    <div className="flex items-center gap-1" role="group" aria-label="Language selector">
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => setLocale(lang.code)}
          className={`px-2 py-1 text-xs rounded transition-colors ${
            locale === lang.code
              ? 'bg-[var(--cc-link-bg-soft)] text-[var(--cc-link)] font-medium'
              : 'text-[var(--cc-body)] hover:bg-[var(--cc-canvas-soft-2)]'
          }`}
          aria-pressed={locale === lang.code}
          title={lang.label}
        >
          <span className="mr-1" aria-hidden="true">{lang.flag}</span>
          {lang.label}
        </button>
      ))}
    </div>
  );
}
