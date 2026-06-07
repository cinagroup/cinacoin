'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Brand } from '@cinacoin/ui'
import { useTheme } from '@/providers/ThemeProvider'
import { useI18n, type Locale } from '@/providers/I18nProvider'

export default function Navbar() {
  const { theme, toggle } = useTheme()
  const { t, locale, setLocale } = useI18n()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const mobileMenuRef = useRef<HTMLDivElement>(null)

  const handleScroll = useCallback(() => {
    setScrolled(window.scrollY > 10)
  }, [])

  useEffect(() => {
    let ticking = false
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => { handleScroll(); ticking = false })
        ticking = true
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [handleScroll])

  // Close dropdowns on outside click (mousedown to avoid React synthetic event timing issues)
  const langRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!langOpen) return
    const handler = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [langOpen])

  const closeMobile = () => setMobileOpen(false)

  const locales: { code: Locale; label: string }[] = [
    { code: 'en', label: 'English' },
    { code: 'zh', label: '中文' },
  ]

  return (
    <nav
      aria-label="Main navigation"
      className={`fixed top-0 left-0 right-0 z-50 h-16 transition-all duration-300 ${
        scrolled
          ? 'border-b border-[var(--cc-hairline)] bg-[var(--cc-canvas)]/90 backdrop-blur-md'
          : 'border-b border-[var(--cc-hairline)] bg-[var(--cc-canvas)]'
      }`}
    >
      <div className="cc-container flex h-full items-center justify-between">
        {/* Logo — shared Brand lockup from @cinacoin/ui */}
        <Brand href="/" logoSrc="/logo.svg" />

        {/* Desktop links */}
        <div className="hidden items-center gap-1 md:flex">
          <a href="#products" className="cc-navbar-link">{t('nav-products')}</a>
          <a href="/pricing" className="cc-navbar-link">{t('nav-pricing')}</a>
          <a href="/docs/" className="cc-navbar-link">{t('nav-docs')}</a>
          <a href="https://github.com/cinagroup" className="cc-navbar-link">{t('nav-github')}</a>
        </div>

        {/* Desktop actions */}
        <div className="flex items-center gap-1">
          <a href="/dashboard/" className="hidden text-[var(--cc-body)] transition-colors hover:text-[var(--cc-ink)] cc-body-sm sm:inline">
            {t('nav-dashboard')}
          </a>

          {/* Theme toggle */}
          <button
            type="button"
            onClick={toggle}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--cc-body)] transition-colors hover:text-[var(--cc-ink)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cc-link)] focus-visible:ring-offset-2"
          >
            {theme === 'dark' ? (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="12" r="5" />
                <path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
              </svg>
            )}
          </button>

          {/* Language selector */}
          <div ref={langRef} className="relative">
            <button
              type="button"
              onClick={() => setLangOpen((v) => !v)}
              aria-haspopup="listbox"
              aria-expanded={langOpen}
              aria-label="Select language"
              className="flex h-8 items-center gap-1 rounded-md px-2 text-[var(--cc-body)] transition-colors hover:text-[var(--cc-ink)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cc-link)] focus-visible:ring-offset-2 cc-body-sm"
            >
              {locale === 'zh' ? '中文' : 'EN'}
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {langOpen && (
              <div className="absolute right-0 top-full mt-2 w-36 rounded-md border border-[var(--cc-hairline)] bg-[var(--cc-canvas)] py-1 shadow-[var(--cc-level5)]">
                {locales.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => { setLocale(l.code); setLangOpen(false) }}
                    className={`flex w-full items-center gap-2 px-3 py-2 cc-body-sm transition-colors ${
                      locale === l.code
                        ? 'text-[var(--cc-ink)] bg-[var(--cc-canvas-soft-2)]'
                        : 'text-[var(--cc-body)] hover:text-[var(--cc-ink)] hover:bg-[var(--cc-canvas-soft-2)]'
                    }`}
                  >
                    {locale === l.code && (
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    {l.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* CTA */}
          <a href="/docs/" className="hidden sm:inline-flex ml-1 cc-btn-primary-sm">
            {t('nav-get-started')}
          </a>

          {/* Mobile toggle */}
          <button
            type="button"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            className="rounded-full p-2 text-[var(--cc-body)] transition-colors hover:text-[var(--cc-ink)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cc-link)] focus-visible:ring-offset-2 md:hidden"
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div ref={mobileMenuRef} className="border-t border-[var(--cc-hairline)] bg-[var(--cc-canvas)] md:hidden" role="dialog" aria-modal="true" aria-label="Mobile navigation">
          <div className="flex flex-col gap-1 px-6 py-4">
            <a href="/" onClick={closeMobile} className="cc-navbar-link">Home</a>
            <a href="#products" onClick={closeMobile} className="cc-navbar-link">{t('nav-products')}</a>
            <a href="/pricing" onClick={closeMobile} className="cc-navbar-link">{t('nav-pricing')}</a>
            <a href="/about" onClick={closeMobile} className="cc-navbar-link">{t('footer-about')}</a>
            <a href="/changelog" onClick={closeMobile} className="cc-navbar-link">{t('footer-changelog')}</a>
            <a href="/contact" onClick={closeMobile} className="cc-navbar-link">{t('footer-contact')}</a>
            <a href="/docs/" className="cc-navbar-link">{t('nav-docs')}</a>
            <a href="https://github.com/cinagroup" className="cc-navbar-link">{t('nav-github')}</a>
            <a href="/dashboard/" className="cc-navbar-link">{t('nav-dashboard')}</a>

            {/* Mobile theme toggle */}
            <button onClick={() => { toggle(); closeMobile() }} className="cc-navbar-link">
              {theme === 'dark' ? (
                <>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <circle cx="12" cy="12" r="5" />
                    <path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                  </svg>
                  Light Mode
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
                  </svg>
                  Dark Mode
                </>
              )}
            </button>

            {/* Mobile language toggle */}
            <div className="flex gap-2 px-3 pt-1">
              {locales.map((l) => (
                <button
                  key={l.code}
                  onClick={() => { setLocale(l.code); closeMobile() }}
                  className={`rounded-full px-3 py-1 text-xs transition-colors ${
                    locale === l.code
                      ? 'bg-[var(--cc-primary)] text-[var(--cc-on-primary)]'
                      : 'bg-[var(--cc-canvas-soft-2)] text-[var(--cc-body)] hover:text-[var(--cc-ink)]'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>

            <a href="/contact" onClick={closeMobile} className="mt-2 cc-btn-primary-sm text-center">
              {t('nav-get-started')}
            </a>
          </div>
        </div>
      )}
    </nav>
  )
}
