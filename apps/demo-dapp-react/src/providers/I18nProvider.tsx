'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';

export type Locale = 'en' | 'zh';

interface LocaleContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string) => string;
}

const translations: Record<Locale, Record<string, string>> = {
  en: {
    'nav-home': 'Home',
    'nav-demo': 'Demo',
    'theme-light': 'Light',
    'theme-dark': 'Dark',
    'lang-en': 'EN',
    'lang-zh': '中文',
    'connect-wallet': 'Connect Wallet',
    'disconnect': 'Disconnect',
    'loading': 'Loading...',
    'hero-title': 'Multi-chain wallet toolkit.',
    'hero-subtitle': 'The CinaCoin SDK provides a unified interface for wallet connections, transaction signing, chain switching, batch operations, and NFT management across 16+ blockchains.',
    'sdk-version': 'CinaCoin React SDK',
    'docs': 'Docs',
    'github': 'GitHub',
  },
  zh: {
    'nav-home': '首页',
    'nav-demo': '演示',
    'theme-light': '浅色',
    'theme-dark': '深色',
    'lang-en': 'EN',
    'lang-zh': '中文',
    'connect-wallet': '连接钱包',
    'disconnect': '断开',
    'loading': '加载中...',
    'hero-title': '多链钱包工具包。',
    'hero-subtitle': 'CinaCoin SDK 为钱包连接、交易签名、链切换、批量操作和 NFT 管理提供了统一接口，支持 16+ 区块链。',
    'sdk-version': 'CinaCoin React SDK',
    'docs': '文档',
    'github': 'GitHub',
  },
};

const LocaleContext = createContext<LocaleContextValue>({
  locale: 'en',
  setLocale: () => {},
  t: (key: string) => key,
});

export function useI18n() {
  return useContext(LocaleContext);
}

function getInitialLocale(): Locale {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('cc-locale') as Locale | null;
    if (stored === 'en' || stored === 'zh') return stored;
    if (navigator.language.startsWith('zh')) return 'zh';
  }
  return 'en';
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setLocaleState(getInitialLocale());
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    try { localStorage.setItem('cc-locale', locale); } catch {}
    document.documentElement.lang = locale;
  }, [locale, mounted]);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
  }, []);

  const t = useCallback(
    (key: string) => {
      return translations[locale]?.[key] ?? key;
    },
    [locale],
  );

  if (!mounted) return <>{children}</>;

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
}
