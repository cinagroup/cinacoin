'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export type Locale = 'en' | 'zh';

type Translations = Record<string, string>;

const en: Translations = {
  // Nav
  'nav.home': 'Home',
  'nav.swap': 'Swap',
  'nav.tokens': 'Tokens',
  'nav.multiChain': 'Multi-Chain',
  'nav.batch': 'Batch',
  'nav.aaDemo': 'AA Demo',
  'nav.onramp': 'Onramp',
  'nav.auth': 'Auth',
  'nav.activity': 'Activity',
  'nav.profile': 'Profile',
  'nav.settings': 'Settings',
  // Common
  'common.connectWallet': 'Connect Wallet',
  'common.disconnect': 'Disconnect',
  'common.connecting': 'Connecting...',
  'common.connected': 'Connected',
  'common.disconnected': 'Disconnected',
  'common.copy': 'Copy',
  'common.copied': '✓ Copied',
  // Footer
  'footer.copyright': '© {year} CinaCoin. Open source under MIT License.',
  'footer.github': 'GitHub',
  // Home page
  'home.title': 'Wallet Connection Toolkit',
  'home.subtitle': 'The open-source wallet connection toolkit',
  'home.description': 'Connect wallets, swap tokens, bridge chains across 16 networks. Fully self-hosted. Zero vendor lock-in.',
  'home.trySwap': 'Try Swap Demo →',
  'home.multiChain': 'Multi-Chain →',
  'home.getStarted': 'Get Started',
  'home.viewDocs': 'View Docs',
  'home.features': 'Everything you need to connect wallets',
  'home.readyTitle': 'Ready to get started?',
  'home.readyDesc': 'Start building with CinaCoin. Open source, self-hosted, and free forever.',
  // Swap page
  'swap.title': 'Token Swap',
  'swap.subtitle': 'Swap tokens with real DEX aggregator rates',
  'swap.from': 'From',
  'swap.to': 'To',
  'swap.slippage': 'Slippage',
  'swap.rate': 'Rate',
  'swap.priceImpact': 'Price Impact',
  'swap.minimumReceived': 'Minimum Received',
  'swap.route': 'Route',
  'swap.history': 'Swap History',
  'swap.noSwaps': 'No swaps yet. Connect your wallet and make your first swap!',
  // Tokens page
  'tokens.title': 'Token Search & Swap',
  'tokens.subtitle': 'Search tokens, view details, and swap in one place',
  'tokens.search': 'Search by name, symbol, or address...',
  // Multi-chain page
  'multichain.title': 'Multi-Chain Connectivity',
  // Batch page
  'batch.title': 'EIP-5792 Atomic Batch',
  'batch.subtitle': 'Send multiple transactions atomically via wallet_sendCalls — with real gas estimation',
  // AA Demo page
  'aa.title': 'Account Abstraction Demo',
  'aa.subtitle': 'ERC-4337 smart accounts, session keys, gas sponsorship, and batch transactions',
  // Onramp page
  'onramp.title': 'Fiat On-Ramp',
  'onramp.subtitle': 'Buy crypto with fiat — compare MoonPay, Ramp & Transak rates',
  // Auth page
  'auth.title': 'Sign-In With Ethereum',
  'auth.subtitle': 'Authenticate with your wallet or biometrics. No passwords, no accounts.',
  // Activity page
  'activity.title': 'Activity History',
  'activity.subtitle': 'Track all your wallet interactions and transactions',
  // Profile page
  'profile.title': 'Profile',
  'profile.subtitle': 'Your identity, wallets, and portfolio',
  // Settings page
  'settings.title': 'Settings',
  'settings.subtitle': 'Customize your demo experience',
  // Components page
  'components.title': 'Component Gallery',
  'components.subtitle': 'Browse all CinaCoin components with live theme previews',
  // Theme toggle
  'theme.light': 'Light',
  'theme.dark': 'Dark',
};

const zh: Translations = {
  'nav.home': '首页',
  'nav.swap': '兑换',
  'nav.tokens': '代币',
  'nav.multiChain': '多链',
  'nav.batch': '批量',
  'nav.aaDemo': '账户抽象',
  'nav.onramp': '法币入金',
  'nav.auth': '认证',
  'nav.activity': '活动',
  'nav.profile': '个人资料',
  'nav.settings': '设置',
  'common.connectWallet': '连接钱包',
  'common.disconnect': '断开',
  'common.connecting': '连接中...',
  'common.connected': '已连接',
  'common.disconnected': '未连接',
  'common.copy': '复制',
  'common.copied': '✓ 已复制',
  'footer.copyright': '© {year} CinaCoin. 开源 MIT 许可。',
  'footer.github': 'GitHub',
  'home.title': '钱包连接工具包',
  'home.subtitle': '开源钱包连接工具包',
  'home.description': '跨16个网络连接钱包、兑换代币、跨链桥接。完全自托管，零供应商锁定。',
  'home.trySwap': '体验兑换 →',
  'home.multiChain': '多链 →',
  'home.getStarted': '开始使用',
  'home.viewDocs': '查看文档',
  'home.features': '连接钱包所需的一切',
  'home.readyTitle': '准备开始了吗？',
  'home.readyDesc': '开始使用 CinaCoin。开源、自托管、永远免费。',
  'swap.title': '代币兑换',
  'swap.subtitle': '使用真实 DEX 聚合器汇率兑换代币',
  'swap.from': '从',
  'swap.to': '到',
  'swap.slippage': '滑点',
  'swap.rate': '汇率',
  'swap.priceImpact': '价格影响',
  'swap.minimumReceived': '最少收到',
  'swap.route': '路由',
  'swap.history': '兑换历史',
  'swap.noSwaps': '还没有兑换记录。连接钱包进行首次兑换！',
  'tokens.title': '代币搜索与兑换',
  'tokens.subtitle': '搜索代币、查看详情、一键兑换',
  'tokens.search': '按名称、符号或地址搜索...',
  'multichain.title': '多链连接',
  'batch.title': 'EIP-5792 原子批量',
  'batch.subtitle': '通过 wallet_sendCalls 原子发送多笔交易',
  'aa.title': '账户抽象演示',
  'aa.subtitle': 'ERC-4337 智能账户、会话密钥、Gas 赞助和批量交易',
  'onramp.title': '法币入金',
  'onramp.subtitle': '用法币购买加密货币 — 比较 MoonPay、Ramp 和 Transak 汇率',
  'auth.title': '以太坊签名登录',
  'auth.subtitle': '用钱包或生物识别认证。无需密码，无需账户。',
  'activity.title': '活动历史',
  'activity.subtitle': '追踪所有钱包交互和交易',
  'profile.title': '个人资料',
  'profile.subtitle': '您的身份、钱包和资产组合',
  'settings.title': '设置',
  'settings.subtitle': '自定义您的演示体验',
  'components.title': '组件库',
  'components.subtitle': '浏览所有 CinaCoin 组件并实时预览主题',
  'theme.light': '浅色',
  'theme.dark': '深色',
};

const translations: Record<Locale, Translations> = { en, zh };

interface I18nContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

const STORAGE_KEY = 'cinacoin_demo_locale';

function getPreferredLocale(): Locale {
  if (typeof window === 'undefined') return 'en';
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'en' || saved === 'zh') return saved;
  } catch { /* ignore */ }
  return 'en';
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(getPreferredLocale);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, locale);
    } catch { /* ignore */ }
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = (l: Locale) => setLocaleState(l);

  const t = (key: string): string => {
    const dict = translations[locale];
    return dict[key] ?? key;
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
