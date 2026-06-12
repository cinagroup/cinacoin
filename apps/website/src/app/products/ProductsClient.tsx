'use client';

import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { useI18n } from '@/providers/I18nProvider';

export default function ProductsPage() {
  const { t } = useI18n();

  return (
    <main className="min-h-screen bg-[var(--cc-canvas-soft)] text-[var(--cc-ink)]">
      <Navbar />
      <Breadcrumbs />
      
      {/* Hero - Left aligned for variety */}
      <section className="max-w-[1200px] mx-auto px-6 py-20 md:py-28">
        <div className="max-w-2xl">
          <h1 className="text-5xl md:text-[64px] font-semibold mb-6 tracking-tight text-[var(--cc-ink)] leading-[1.05]">
            {t('products-hero-title')}
          </h1>
          <p className="text-body-lg text-[var(--cc-body)] leading-relaxed">
            {t('products-hero-subtitle')}
          </p>
        </div>
      </section>

      {/* Products - Varied Layout */}
      <section className="max-w-[1200px] mx-auto px-6 pb-20 md:pb-28">
        {/* Wallet - Featured, full width with visual */}
        <div id="wallet" className="grid md:grid-cols-2 gap-8 items-center mb-12 p-8 md:p-12 bg-[var(--cc-canvas)] border border-[var(--cc-hairline)] rounded-lg">
          <div>
            <p className="font-mono text-xs text-[var(--cc-muted)] mb-2 tracking-wide">Wallet</p>
            <h2 className="text-display-lg font-semibold mb-4 text-[var(--cc-ink)]">{t('products-wallet-title')}</h2>
            <p className="text-[var(--cc-body)] text-body-lg leading-relaxed mb-6">
              {t('products-wallet-desc')}
            </p>
            <ul className="space-y-2 mb-6">
              {['products-wallet-f1', 'products-wallet-f2', 'products-wallet-f3', 'products-wallet-f4'].map((f) => (
                <li key={f} className="flex items-center gap-2 text-body-sm text-[var(--cc-body)]">
                  <span className="text-[var(--cc-link)]">✓</span> {t(f)}
                </li>
              ))}
            </ul>
            <Link href="/products#wallet" className="inline-flex items-center justify-center px-5 py-2.5 bg-[var(--cc-ink)] hover:bg-[var(--cc-primary-hover)] text-[var(--cc-canvas)] rounded-full font-medium text-body-sm transition-colors duration-200">
              {t('products-wallet-cta')}
            </Link>
          </div>
          {/* Wallet visual */}
          <div className="bg-[var(--cc-ink)] rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="font-mono text-xs text-white/40">Dashboard</span>
              <span className="flex items-center gap-1.5 text-xs text-[var(--cc-muted)]">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                Connected
              </span>
            </div>
            <div className="space-y-3 font-mono text-sm">
              <div className="flex justify-between">
                <span className="text-white/50">CINA Balance</span>
                <span className="text-white">12,450.00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Staked</span>
                <span className="text-white">8,200.00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">APY</span>
                <span className="text-green-400">+5.2%</span>
              </div>
              <div className="pt-2 border-t border-white/10">
                <div className="flex justify-between">
                  <span className="text-white/50">Portfolio Value</span>
                  <span className="text-white">$1,054.52</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Exchange and Staking - Side by side, different styles */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Exchange - Dark card */}
          <div id="exchange" className="p-8 bg-[var(--cc-ink)] text-[var(--cc-canvas)] rounded-lg">
            <p className="font-mono text-xs text-[var(--cc-muted)] mb-2 tracking-wide">Exchange</p>
            <h2 className="text-display-lg font-semibold mb-4">{t('products-exchange-title')}</h2>
            <p className="text-white/60 text-body-lg leading-relaxed mb-6">
              {t('products-exchange-desc')}
            </p>
            <ul className="space-y-2 mb-6">
              {['products-exchange-f1', 'products-exchange-f2', 'products-exchange-f3', 'products-exchange-f4'].map((f) => (
                <li key={f} className="flex items-center gap-2 text-body-sm text-white/70">
                  <span className="text-[var(--cc-cyan)]">✓</span> {t(f)}
                </li>
              ))}
            </ul>
            <Link href="/products#exchange" className="inline-flex items-center justify-center px-5 py-2.5 bg-white text-[var(--cc-ink)] rounded-full font-medium text-body-sm transition-opacity duration-200 hover:opacity-90">
              {t('products-exchange-cta')}
            </Link>
          </div>

          {/* Staking - Light card */}
          <div id="staking" className="p-8 bg-[var(--cc-canvas)] border border-[var(--cc-hairline)] rounded-lg">
            <p className="font-mono text-xs text-[var(--cc-muted)] mb-2 tracking-wide">Staking</p>
            <h2 className="text-display-lg font-semibold mb-4 text-[var(--cc-ink)]">{t('products-staking-title')}</h2>
            <p className="text-[var(--cc-body)] text-body-lg leading-relaxed mb-6">
              {t('products-staking-desc')}
            </p>
            <ul className="space-y-2 mb-6">
              {['products-staking-f1', 'products-staking-f2', 'products-staking-f3', 'products-staking-f4'].map((f) => (
                <li key={f} className="flex items-center gap-2 text-body-sm text-[var(--cc-body)]">
                  <span className="text-[var(--cc-link)]">✓</span> {t(f)}
                </li>
              ))}
            </ul>
            <Link href="/products#staking" className="inline-flex items-center justify-center px-5 py-2.5 border border-[var(--cc-hairline)] hover:border-[var(--cc-hairline-strong)] rounded-full font-medium text-body-sm transition-colors duration-200 text-[var(--cc-ink)] bg-[var(--cc-canvas)]">
              {t('products-staking-cta')}
            </Link>
          </div>
        </div>

        {/* Explorer - Full width, compact */}
        <div id="explorer" className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 p-8 bg-[var(--cc-canvas-soft-2)] border border-[var(--cc-hairline)] rounded-lg">
          <div>
            <p className="font-mono text-xs text-[var(--cc-muted)] mb-2 tracking-wide">Explorer</p>
            <h2 className="text-display-lg font-semibold mb-2 text-[var(--cc-ink)]">{t('products-explorer-title')}</h2>
            <p className="text-[var(--cc-body)] text-body-lg leading-relaxed">
              {t('products-explorer-desc')}
            </p>
          </div>
          <Link href="/products#explorer" className="inline-flex items-center justify-center px-5 py-2.5 bg-[var(--cc-ink)] hover:bg-[var(--cc-primary-hover)] text-[var(--cc-canvas)] rounded-full font-medium text-body-sm transition-colors duration-200 flex-shrink-0">
            {t('products-explorer-cta')}
          </Link>
        </div>
      </section>
      <Footer />
    </main>
  );
}
