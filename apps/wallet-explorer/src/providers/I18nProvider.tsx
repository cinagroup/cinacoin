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
    'nav.send': 'Send',
    'nav.receive': 'Receive',
    'nav.tokens': 'Tokens',
    'nav.history': 'History',
    'nav.swap': 'Swap',
    'nav.settings': 'Settings',
    'nav.language': 'Language',
    'wallet.connect': 'Connect Wallet',
    'wallet.disconnect': 'Disconnect',
    'theme.toggle': 'Toggle theme',
  },
  zh: {
    'nav.home': '首页',
    'nav.send': '发送',
    'nav.receive': '接收',
    'nav.tokens': '代币',
    'nav.history': '历史',
    'nav.swap': '兑换',
    'nav.settings': '设置',
    'nav.language': '语言',
    'wallet.connect': '连接钱包',
    'wallet.disconnect': '断开连接',
    'theme.toggle': '切换主题',
  },
  ja: {
    'nav.home': 'ホーム',
    'nav.send': '送信',
    'nav.receive': '受信',
    'nav.tokens': 'トークン',
    'nav.history': '履歴',
    'nav.swap': 'スワップ',
    'nav.settings': '設定',
    'nav.language': '言語',
    'wallet.connect': 'ウォレット接続',
    'wallet.disconnect': '切断',
    'theme.toggle': 'テーマ切替',
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
