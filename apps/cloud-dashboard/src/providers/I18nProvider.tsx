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
    'nav-projects': 'Projects',
    'nav-settings': 'Settings',
    'nav-api-keys': 'API Keys',
    'nav-billing': 'Billing',
    'nav-compute': 'Compute',
    'nav-vms': 'Virtual Machines',
    'nav-containers': 'Containers',
    'nav-serverless': 'Serverless',
    'nav-storage': 'Storage',
    'nav-databases': 'Databases',
    'nav-network': 'Network',
    'nav-load-balancers': 'Load Balancers',
    'nav-dns': 'DNS',
    'nav-cdn': 'CDN',
    'nav-postgresql': 'PostgreSQL',
    'nav-redis': 'Redis',
    'nav-mongodb': 'MongoDB',
    'nav-object': 'Object Storage',
    'nav-block': 'Block Storage',
    'nav-file': 'File Storage',
  },
  zh: {
    'nav-home': '首页',
    'nav-projects': '项目',
    'nav-settings': '设置',
    'nav-api-keys': 'API 密钥',
    'nav-billing': '账单',
    'nav-compute': '计算',
    'nav-vms': '虚拟机',
    'nav-containers': '容器',
    'nav-serverless': '无服务器',
    'nav-storage': '存储',
    'nav-databases': '数据库',
    'nav-network': '网络',
    'nav-load-balancers': '负载均衡',
    'nav-dns': 'DNS',
    'nav-cdn': 'CDN',
    'nav-postgresql': 'PostgreSQL',
    'nav-redis': 'Redis',
    'nav-mongodb': 'MongoDB',
    'nav-object': '对象存储',
    'nav-block': '块存储',
    'nav-file': '文件存储',
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
