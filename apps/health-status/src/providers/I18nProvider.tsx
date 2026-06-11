'use client';

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';

export type Locale = 'en' | 'zh';

type TranslationKey =
  | 'siteName'
  | 'pageTitle'
  | 'allOperational'
  | 'someDegraded'
  | 'systemOutage'
  | 'statusUnknown'
  | 'lastChecked'
  | 'checking'
  | 'refreshing'
  | 'activeIncidents'
  | 'resolvedIncidents'
  | 'services'
  | 'loadingConfig'
  | 'autoRefresh'
  | 'refresh'
  | 'statusOperational'
  | 'statusDegraded'
  | 'statusDown'
  | 'responseTime'
  | 'uptime'
  | 'lastCheck'
  | 'last6Hours'
  | 'affected'
  | 'healthChecksInfo'
  | 'incidentsApi'
  | 'poweredBy'
  | 'never'
  | 'sev_critical'
  | 'sev_major'
  | 'sev_minor'
  | 'sev_maintenance'
  | 'inc_investigating'
  | 'inc_identified'
  | 'inc_monitoring'
  | 'inc_resolved';

const translations: Record<Locale, Record<TranslationKey, string>> = {
  en: {
    siteName: 'CinaCoin',
    pageTitle: 'Service status.',
    allOperational: 'All systems operational.',
    someDegraded: 'Some systems degraded.',
    systemOutage: 'System outage.',
    lastChecked: 'Last checked at',
    checking: 'Checking...',
    refreshing: 'Refreshing.',
    activeIncidents: 'Active incidents.',
    resolvedIncidents: 'Resolved incidents.',
    services: 'Services.',
    loadingConfig: 'Loading service configuration...',
    autoRefresh: 'Auto-refresh.',
    refresh: 'Refresh.',
    statusOperational: 'Operational.',
    statusDegraded: 'Degraded.',
    statusDown: 'Down.',
    statusUnknown: 'Unknown.',
    responseTime: 'Response time.',
    uptime: 'Uptime (7d).',
    lastCheck: 'Last check.',
    last6Hours: 'Last ~6 hours.',
    affected: 'Affected.',
    healthChecksInfo: 'Health checks run client-side every 5 minutes.',
    incidentsApi: 'Incidents API.',
    poweredBy: 'Powered by CinaCoin.',
    never: 'Never',
    sev_critical: 'Critical.',
    sev_major: 'Major.',
    sev_minor: 'Minor.',
    sev_maintenance: 'Maintenance.',
    inc_investigating: 'Investigating.',
    inc_identified: 'Identified.',
    inc_monitoring: 'Monitoring.',
    inc_resolved: 'Resolved.',
  },
  zh: {
    siteName: 'CinaCoin',
    pageTitle: '服务状态。',
    allOperational: '所有系统正常运行。',
    someDegraded: '部分系统降级。',
    systemOutage: '系统故障。',
    lastChecked: '最后检查于',
    checking: '检查中...',
    refreshing: '刷新中。',
    activeIncidents: '活跃事件。',
    resolvedIncidents: '已解决事件。',
    services: '服务。',
    loadingConfig: '正在加载服务配置...',
    autoRefresh: '自动刷新。',
    refresh: '刷新。',
    statusOperational: '正常。',
    statusDegraded: '降级。',
    statusDown: '故障。',
    statusUnknown: '未知。',
    responseTime: '响应时间。',
    uptime: '可用率 (7天)。',
    lastCheck: '最后检查。',
    last6Hours: '最近约6小时。',
    affected: '受影响。',
    healthChecksInfo: '健康检查每5分钟在客户端运行。',
    incidentsApi: '事件 API。',
    poweredBy: '由 CinaCoin 提供支持。',
    never: '从未',
    sev_critical: '严重。',
    sev_major: '重要。',
    sev_minor: '轻微。',
    sev_maintenance: '维护。',
    inc_investigating: '调查中。',
    inc_identified: '已定位。',
    inc_monitoring: '监控中。',
    inc_resolved: '已解决。',
  },
};

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey) => string;
}

const I18nContext = createContext<I18nContextValue>({
  locale: 'en',
  setLocale: () => {},
  t: (key: TranslationKey) => key,
});

function getStoredLocale(): Locale | null {
  if (typeof window === 'undefined') return null;
  const v = localStorage.getItem('cc-locale');
  if (v === 'en' || v === 'zh') return v;
  return null;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>('en');
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const stored = getStoredLocale();
    if (stored) setLocale(stored);
    setInitialized(true);
  }, []);

  const setLocaleAndStore = useCallback((l: Locale) => {
    setLocale(l);
    if (typeof window !== 'undefined') {
      localStorage.setItem('cc-locale', l);
    }
  }, []);

  const t = useCallback(
    (key: TranslationKey) => translations[locale][key] ?? key,
    [locale],
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale: setLocaleAndStore, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}

export type { TranslationKey };
