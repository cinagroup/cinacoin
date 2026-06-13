import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type Locale = 'en' | 'zh'

interface I18nContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string) => string
}

// 基础翻译（每个应用可以根据需要扩展）
const translations: Record<Locale, Record<string, string>> = {
  en: {
    'nav-home': 'Home',
    'nav-about': 'About',
    'nav-docs': 'Docs',
    'theme-toggle': 'Toggle theme',
    'lang-toggle': 'Switch language',
  },
  zh: {
    'nav-home': '首页',
    'nav-about': '关于',
    'nav-docs': '文档',
    'theme-toggle': '切换主题',
    'lang-toggle': '切换语言',
  },
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>('en')

  const t = (key: string): string => {
    return translations[locale][key] || translations.en[key] || key
  }

  useEffect(() => {
    const savedLocale = localStorage.getItem('locale') as Locale
    if (savedLocale && (savedLocale === 'en' || savedLocale === 'zh')) {
      setLocale(savedLocale)
    }
  }, [])

  const handleSetLocale = (newLocale: Locale) => {
    setLocale(newLocale)
    localStorage.setItem('locale', newLocale)
  }

  return (
    <I18nContext.Provider value={{ locale, setLocale: handleSetLocale, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider')
  }
  return context
}
export type { Locale }
