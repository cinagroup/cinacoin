'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useI18n } from '@/providers/I18nProvider';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { t } = useI18n();

  return (
    <header className="sticky top-0 z-50 bg-[var(--cc-canvas)]/80 backdrop-blur-md border-b border-[var(--cc-hairline)]">
      <div className="max-w-[1200px] mx-auto px-6 flex items-center justify-between h-16">
        <Link href="/" className="flex items-center gap-2 text-[var(--cc-ink)] font-semibold text-body-md tracking-tight hover:opacity-70 transition-opacity duration-150">
          <img src="/logo.png" alt="Cinacoin logo" width={24} height={24} style={{ height: 24, width: 24 }} />
          Cinacoin
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {[
            { href: '/products', label: t('nav-products') },
            { href: '/solutions', label: t('nav-solutions') },
            { href: '/developers', label: t('nav-developers') },
            { href: '/resources', label: t('nav-resources') },
            { href: '/pricing', label: t('nav-pricing') },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-3 py-2 text-body-sm font-medium text-[var(--cc-body)] hover:text-[var(--cc-ink)] rounded-[var(--cc-radius-sm)] hover:bg-[var(--cc-canvas-soft-2)] transition-all duration-150"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          <Link
            href="/login"
            className="px-4 py-2 text-body-sm font-medium text-[var(--cc-body)] hover:text-[var(--cc-ink)] transition-colors duration-150"
          >
            {t('nav-login')}
          </Link>
          <Link
            href="/register"
            className="px-4 py-2 text-body-sm font-medium bg-[var(--cc-ink)] text-[var(--cc-canvas)] rounded-[var(--cc-radius-sm)] hover:opacity-90 transition-colors duration-150"
          >
            {t('nav-signup')}
          </Link>
        </div>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-[var(--cc-ink)] hover:bg-[var(--cc-canvas-soft-2)] rounded-[var(--cc-radius-sm)] transition-colors duration-150"
          aria-label="Toggle menu"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
          </svg>
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[var(--cc-hairline)] bg-[var(--cc-canvas)]">
          <div className="max-w-[1200px] mx-auto px-6 py-4 flex flex-col gap-2">
            {[
              { href: '/products', label: t('nav-products') },
              { href: '/solutions', label: t('nav-solutions') },
              { href: '/developers', label: t('nav-developers') },
              { href: '/resources', label: t('nav-resources') },
              { href: '/pricing', label: t('nav-pricing') },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-2 text-body-sm font-medium text-[var(--cc-body)] hover:text-[var(--cc-ink)] rounded-[var(--cc-radius-sm)] hover:bg-[var(--cc-canvas-soft-2)] transition-all duration-150"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-4 pt-4 border-t border-[var(--cc-hairline)] flex flex-col gap-2">
              <Link
                href="/login"
                className="px-3 py-2 text-body-sm font-medium text-[var(--cc-body)] hover:text-[var(--cc-ink)] rounded-[var(--cc-radius-sm)] hover:bg-[var(--cc-canvas-soft-2)] transition-all duration-150"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('nav-login')}
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 text-body-sm font-medium bg-[var(--cc-ink)] text-[var(--cc-canvas)] rounded-[var(--cc-radius-sm)] hover:opacity-90 transition-colors duration-150 text-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('nav-signup')}
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
