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
    'nav-wallet': 'Wallet',
    'nav-transfer': 'Transfer',
    'nav-sign': 'Sign',
    'theme-light': 'Light',
    'theme-dark': 'Dark',
    'lang-en': 'EN',
    'lang-zh': '中文',
    'balance': 'Balance',
    'send': 'Send',
    'receive': 'Receive',
    'connect': 'Connect',
    'disconnect': 'Disconnect',
    'loading': 'Loading...',
    'guest': 'Guest',
  },
  zh: {
    'nav-home': '首页',
    'nav-wallet': '钱包',
    'nav-transfer': '转账',
    'nav-sign': '签名',
    'theme-light': '浅色',
    'theme-dark': '深色',
    'lang-en': 'EN',
    'lang-zh': '中文',
    'balance': '余额',
    'send': '发送',
    'receive': '接收',
    'connect': '连接',
    'disconnect': '断开',
    'loading': '加载中...',
    'guest': '访客',
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
