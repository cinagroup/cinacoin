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
      {/* Hero */}
      <section className="max-w-[1200px] mx-auto px-6 py-24 text-center">
        <h1 className="text-5xl md:text-[64px] font-semibold mb-6 tracking-tight text-[#171717] leading-[1.05]">
          {t('products-hero-title')}
        </h1>
        <p className="text-lg text-[#4d4d4d] max-w-2xl mx-auto leading-relaxed">
          {t('products-hero-subtitle')}
        </p>
      </section>

      {/* Products Grid */}
      <section className="max-w-[1200px] mx-auto px-6 pb-24">
        <div className="grid md:grid-cols-2 gap-6">
          <div id="wallet" className="p-8 bg-white border border-[#ebebeb] rounded-[12px] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <h2 className="text-[24px] font-semibold mb-3 text-[#171717]">{t('products-wallet-title')}</h2>
            <p className="text-[#4d4d4d] text-[14px] leading-relaxed mb-6">
              {t('products-wallet-desc')}
            </p>
            <ul className="space-y-2 mb-6">
              {['products-wallet-f1', 'products-wallet-f2', 'products-wallet-f3', 'products-wallet-f4'].map((f) => (
                <li key={f} className="flex items-center gap-2 text-[14px] text-[#4d4d4d]">
                  <span className="text-[#0070f3]">✓</span> {t(f)}
                </li>
              ))}
            </ul>
            <Link href="/products#wallet" className="inline-flex items-center justify-center px-4 py-2 bg-[#171717] hover:bg-[#2a2a2a] text-white rounded-[6px] font-medium text-[14px] transition-colors duration-150 h-10">
              {t('products-wallet-cta')}
            </Link>
          </div>

          <div id="exchange" className="p-8 bg-white border border-[#ebebeb] rounded-[12px] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <h2 className="text-[24px] font-semibold mb-3 text-[#171717]">{t('products-exchange-title')}</h2>
            <p className="text-[#4d4d4d] text-[14px] leading-relaxed mb-6">
              {t('products-exchange-desc')}
            </p>
            <ul className="space-y-2 mb-6">
              {['products-exchange-f1', 'products-exchange-f2', 'products-exchange-f3', 'products-exchange-f4'].map((f) => (
                <li key={f} className="flex items-center gap-2 text-[14px] text-[#4d4d4d]">
                  <span className="text-[#0070f3]">✓</span> {t(f)}
                </li>
              ))}
            </ul>
            <Link href="/products#exchange" className="inline-flex items-center justify-center px-4 py-2 border border-[#ebebeb] hover:border-[#a1a1a1] rounded-[6px] font-medium text-[14px] transition-colors duration-150 text-[#171717] bg-white h-10">
              {t('products-exchange-cta')}
            </Link>
          </div>

          <div id="staking" className="p-8 bg-white border border-[#ebebeb] rounded-[12px] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <h2 className="text-[24px] font-semibold mb-3 text-[#171717]">{t('products-staking-title')}</h2>
            <p className="text-[#4d4d4d] text-[14px] leading-relaxed mb-6">
              {t('products-staking-desc')}
            </p>
            <ul className="space-y-2 mb-6">
              {['products-staking-f1', 'products-staking-f2', 'products-staking-f3', 'products-staking-f4'].map((f) => (
                <li key={f} className="flex items-center gap-2 text-[14px] text-[#4d4d4d]">
                  <span className="text-[#0070f3]">✓</span> {t(f)}
                </li>
              ))}
            </ul>
            <Link href="/products#staking" className="inline-flex items-center justify-center px-4 py-2 bg-[#171717] hover:bg-[#2a2a2a] text-white rounded-[6px] font-medium text-[14px] transition-colors duration-150 h-10">
              {t('products-staking-cta')}
            </Link>
          </div>

          <div id="explorer" className="p-8 bg-white border border-[#ebebeb] rounded-[12px] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <h2 className="text-[24px] font-semibold mb-3 text-[#171717]">{t('products-explorer-title')}</h2>
            <p className="text-[#4d4d4d] text-[14px] leading-relaxed mb-6">
              {t('products-explorer-desc')}
            </p>
            <ul className="space-y-2 mb-6">
              {['products-explorer-f1', 'products-explorer-f2', 'products-explorer-f3', 'products-explorer-f4'].map((f) => (
                <li key={f} className="flex items-center gap-2 text-[14px] text-[#4d4d4d]">
                  <span className="text-[#0070f3]">✓</span> {t(f)}
                </li>
              ))}
            </ul>
            <Link href="/products#explorer" className="inline-flex items-center justify-center px-4 py-2 border border-[#ebebeb] hover:border-[#a1a1a1] rounded-[6px] font-medium text-[14px] transition-colors duration-150 text-[#171717] bg-white h-10">
              {t('products-explorer-cta')}
            </Link>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
