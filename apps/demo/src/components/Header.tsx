'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/providers/ThemeProvider';
import { useI18n } from '@/providers/I18nProvider';

export interface NavLink {
  label: string;
  href: string;
}

interface HeaderProps {
  links?: NavLink[];
  connectWalletLabel?: string;
  onConnectWallet?: () => void;
}

const defaultLinks: NavLink[] = [
  { label: 'Home', href: '/' },
  { label: 'Swap', href: '/swap' },
  { label: 'Tokens', href: '/tokens' },
  { label: 'Multi-Chain', href: '/multi-chain' },
  { label: 'Batch', href: '/batch' },
  { label: 'AA Demo', href: '/aa-demo' },
  { label: 'Onramp', href: '/onramp' },
  { label: 'Auth', href: '/auth' },
  { label: 'Activity', href: '/activity' },
  { label: 'Profile', href: '/profile' },
  { label: 'Settings', href: '/settings' },
];

/** Map i18n nav keys to hrefs for dynamic label resolution */
const NAV_I18N_MAP: Record<string, string> = {
  '/': 'nav.home',
  '/swap': 'nav.swap',
  '/tokens': 'nav.tokens',
  '/multi-chain': 'nav.multiChain',
  '/batch': 'nav.batch',
  '/aa-demo': 'nav.aaDemo',
  '/onramp': 'nav.onramp',
  '/auth': 'nav.auth',
  '/activity': 'nav.activity',
  '/profile': 'nav.profile',
  '/settings': 'nav.settings',
};

export default function Header({
  links = defaultLinks,
  connectWalletLabel,
  onConnectWallet,
}: HeaderProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { t, locale, setLocale } = useI18n();
  const [langOpen, setLangOpen] = useState(false);

  const walletLabel = connectWalletLabel ?? t('common.connectWallet');

  return (
    <header className="sticky top-0 z-50 bg-[var(--cc-canvas)]/80 backdrop-blur-xl border-b border-[var(--cc-hairline)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 text-display-sm font-semibold text-[var(--cc-ink)] shrink-0"
          >
            <Image src="/demo/logo.png" alt="Cinacoin" width={32} height={32} className="h-8 w-8 rounded-md" />
            Cinacoin
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {links.map((item) => {
              const i18nKey = NAV_I18N_MAP[item.href];
              const label = i18nKey ? t(i18nKey) : item.label;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={`relative px-3 py-2 rounded-[6px] text-body-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cc-link)] focus-visible:ring-offset-2 ${
                    isActive
                      ? 'text-[var(--cc-ink)]'
                      : 'text-[var(--cc-body)] hover:text-[var(--cc-ink)]'
                  }`}
                >
                  {label}
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 bg-[var(--cc-ink)] rounded-r" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-[var(--cc-body)] hover:text-[var(--cc-ink)] hover:bg-[var(--cc-hairline)]/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cc-link)] focus-visible:ring-offset-2"
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            {/* Language selector */}
            <div className="relative">
              <button
                onClick={() => setLangOpen(!langOpen)}
                className="px-2 py-2 rounded-[var(--cc-radius-lg)] text-body-sm font-medium text-[var(--cc-body)] hover:text-[var(--cc-ink)] hover:bg-[var(--cc-hairline)]/50 transition-colors"
                aria-label="Select language"
                aria-expanded={langOpen}
                aria-haspopup="listbox"
              >
                {locale === 'zh' ? '中文' : 'EN'}
              </button>
              {langOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setLangOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 z-50 w-36 bg-[var(--cc-canvas)] border border-[var(--cc-hairline)] rounded-[var(--cc-radius-lg)] shadow-[var(--cc-level5)] overflow-hidden animate-dropdown-in">
                    <button
                      onClick={() => { setLocale('en'); setLangOpen(false); }}
                      className={`w-full px-4 py-3 text-body-sm text-left transition-colors ${
                        locale === 'en' ? 'bg-[var(--cc-hairline)] text-[var(--cc-ink)]' : 'text-[var(--cc-body)] hover:bg-[var(--cc-hairline)]/50'
                      }`}
                    >
                      🇺🇸 English
                    </button>
                    <button
                      onClick={() => { setLocale('zh'); setLangOpen(false); }}
                      className={`w-full px-4 py-3 text-body-sm text-left transition-colors ${
                        locale === 'zh' ? 'bg-[var(--cc-hairline)] text-[var(--cc-ink)]' : 'text-[var(--cc-body)] hover:bg-[var(--cc-hairline)]/50'
                      }`}
                    >
                      🇨🇳 中文
                    </button>
                  </div>
                </>
              )}
            </div>

            {onConnectWallet && (
              <button
                onClick={onConnectWallet}
                className="hidden sm:inline-flex px-4 py-2 rounded-[6px] text-body-sm font-semibold bg-[var(--cc-primary)] hover:bg-[var(--cc-primary)]/80 text-[var(--cc-on-primary)] transition-all"
              >
                {walletLabel}
              </button>
            )}

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 rounded-full text-[var(--cc-body)] hover:text-[var(--cc-ink)] hover:bg-[var(--cc-hairline)]/50 transition-colors"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-[var(--cc-hairline)] bg-[var(--cc-canvas)]/95 backdrop-blur" role="dialog" aria-label="Mobile navigation">
          <nav className="px-4 py-3 space-y-1 max-h-[70vh] overflow-y-auto" aria-label="Mobile menu">
            {links.map((item) => {
              const i18nKey = NAV_I18N_MAP[item.href];
              const label = i18nKey ? t(i18nKey) : item.label;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-md text-body-sm font-medium transition-colors ${
                    pathname === item.href
                      ? 'bg-[var(--cc-hairline)] text-[var(--cc-ink)]'
                      : 'text-[var(--cc-body)] hover:text-[var(--cc-ink)] hover:bg-[var(--cc-hairline)]/50'
                  }`}
                >
                  {label}
                  {pathname === item.href && (
                    <span className="ml-auto w-2 h-2 rounded-full bg-[var(--cc-link)]" />
                  )}
                </Link>
              );
            })}
            {onConnectWallet && (
              <button
                onClick={() => {
                  onConnectWallet();
                  setMobileOpen(false);
                }}
                className="w-full mt-2 px-4 py-3 rounded-[6px] text-body-sm font-semibold bg-[var(--cc-primary)] hover:bg-[var(--cc-primary)]/80 text-[var(--cc-on-primary)] transition-all"
              >
                {walletLabel}
              </button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
