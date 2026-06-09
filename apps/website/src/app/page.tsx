'use client';

import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { useI18n } from '@/providers/I18nProvider';

export default function Home() {
  const { t } = useI18n();

  return (
    <main className="min-h-screen bg-[var(--cc-canvas-soft)] text-[var(--cc-ink)]">
      <Navbar />
      <Breadcrumbs />
      {/* Hero Section */}
      <section className="max-w-[1200px] mx-auto px-6 py-48 text-center">
        <h1 className="text-5xl md:text-[64px] font-semibold mb-6 tracking-tight text-[#171717] leading-[1.05]">
          {t('home-hero-title')}
        </h1>
        <p className="text-xl md:text-2xl text-[#4d4d4d] mb-8 max-w-3xl mx-auto leading-relaxed">
          {t('home-hero-subtitle')}
        </p>
        <p className="text-lg text-[#888888] mb-12 max-w-2xl mx-auto leading-relaxed">
          {t('home-hero-desc')}
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link
            href="/products"
            className="inline-flex items-center justify-center px-8 py-3 bg-[#171717] hover:bg-[#2a2a2a] text-white rounded-[6px] font-medium text-[14px] transition-colors duration-150 h-10"
          >
            {t('home-hero-cta')}
          </Link>
          <Link
            href="/about"
            className="inline-flex items-center justify-center px-8 py-3 border border-[#ebebeb] hover:border-[#a1a1a1] rounded-[6px] font-medium text-[14px] transition-colors duration-150 text-[#171717] bg-white h-10"
          >
            {t('home-hero-secondary')}
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white border-y border-[#ebebeb]">
        <div className="max-w-[1200px] mx-auto px-6 py-24">
          <h2 className="text-3xl md:text-[48px] font-semibold text-center mb-4 tracking-tight text-[#171717] leading-[1.1]">
            {t('home-features-title')}
          </h2>
          <p className="text-center text-[#888888] text-lg mb-16 max-w-2xl mx-auto">
            {t('home-features-subtitle')}
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            <Link href="/solutions#performance" className="group p-6 bg-white border border-[#ebebeb] rounded-[8px] shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] transition-shadow duration-200">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-semibold mb-2 text-[#171717]">{t('home-f1-title')}</h3>
              <p className="text-[#4d4d4d] text-[14px] leading-relaxed">
                {t('home-f1-desc')}
              </p>
              <span className="inline-block mt-4 text-[14px] font-medium text-[#0070f3] group-hover:underline">
                {t('home-learn-more')}
              </span>
            </Link>
            <Link href="/solutions#security" className="group p-6 bg-white border border-[#ebebeb] rounded-[8px] shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] transition-shadow duration-200">
              <div className="text-4xl mb-4">🔒</div>
              <h3 className="text-xl font-semibold mb-2 text-[#171717]">{t('home-f2-title')}</h3>
              <p className="text-[#4d4d4d] text-[14px] leading-relaxed">
                {t('home-f2-desc')}
              </p>
              <span className="inline-block mt-4 text-[14px] font-medium text-[#0070f3] group-hover:underline">
                {t('home-learn-more')}
              </span>
            </Link>
            <Link href="/solutions#scale" className="group p-6 bg-white border border-[#ebebeb] rounded-[8px] shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] transition-shadow duration-200">
              <div className="text-4xl mb-4">🌐</div>
              <h3 className="text-xl font-semibold mb-2 text-[#171717]">{t('home-f3-title')}</h3>
              <p className="text-[#4d4d4d] text-[14px] leading-relaxed">
                {t('home-f3-desc')}
              </p>
              <span className="inline-block mt-4 text-[14px] font-medium text-[#0070f3] group-hover:underline">
                {t('home-learn-more')}
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* Products Preview Section */}
      <section className="max-w-[1200px] mx-auto px-6 py-24">
        <h2 className="text-3xl md:text-[48px] font-semibold text-center mb-4 tracking-tight text-[#171717] leading-[1.1]">
          {t('home-products-title')}
        </h2>
        <p className="text-center text-[#888888] text-lg mb-16 max-w-2xl mx-auto">
          {t('home-products-subtitle')}
        </p>
        <div className="grid md:grid-cols-2 gap-6">
          <Link href="/products#wallet" className="group p-8 bg-white border border-[#ebebeb] rounded-[12px] shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] transition-shadow duration-200">
            <h3 className="text-[24px] font-semibold mb-2 text-[#171717]">{t('home-p1-title')}</h3>
            <p className="text-[#4d4d4d] text-[14px] leading-relaxed mb-4">
              {t('home-p1-desc')}
            </p>
            <span className="inline-flex items-center text-[14px] font-medium text-[#0070f3] group-hover:underline">
              {t('home-p1-cta')}
            </span>
          </Link>
          <Link href="/products#exchange" className="group p-8 bg-white border border-[#ebebeb] rounded-[12px] shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] transition-shadow duration-200">
            <h3 className="text-[24px] font-semibold mb-2 text-[#171717]">{t('home-p2-title')}</h3>
            <p className="text-[#4d4d4d] text-[14px] leading-relaxed mb-4">
              {t('home-p2-desc')}
            </p>
            <span className="inline-flex items-center text-[14px] font-medium text-[#0070f3] group-hover:underline">
              {t('home-p2-cta')}
            </span>
          </Link>
          <Link href="/products#staking" className="group p-8 bg-white border border-[#ebebeb] rounded-[12px] shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] transition-shadow duration-200">
            <h3 className="text-[24px] font-semibold mb-2 text-[#171717]">{t('home-p3-title')}</h3>
            <p className="text-[#4d4d4d] text-[14px] leading-relaxed mb-4">
              {t('home-p3-desc')}
            </p>
            <span className="inline-flex items-center text-[14px] font-medium text-[#0070f3] group-hover:underline">
              {t('home-p3-cta')}
            </span>
          </Link>
          <Link href="/developers" className="group p-8 bg-white border border-[#ebebeb] rounded-[12px] shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] transition-shadow duration-200">
            <h3 className="text-[24px] font-semibold mb-2 text-[#171717]">{t('home-p4-title')}</h3>
            <p className="text-[#4d4d4d] text-[14px] leading-relaxed mb-4">
              {t('home-p4-desc')}
            </p>
            <span className="inline-flex items-center text-[14px] font-medium text-[#0070f3] group-hover:underline">
              {t('home-p4-cta')}
            </span>
          </Link>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-[#f5f5f5] border-y border-[#ebebeb]">
        <div className="max-w-[1200px] mx-auto px-6 py-24 text-center">
          <h2 className="text-3xl md:text-[48px] font-semibold mb-6 tracking-tight text-[#171717] leading-[1.1]">
            {t('home-cta-title')}
          </h2>
          <p className="text-lg text-[#4d4d4d] mb-8 max-w-xl mx-auto leading-relaxed">
            {t('home-cta-subtitle')}
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href="/products"
              className="inline-flex items-center justify-center px-8 py-3 bg-[#171717] hover:bg-[#2a2a2a] text-white rounded-[6px] font-medium text-[14px] transition-colors duration-150 h-10"
            >
              {t('home-cta-primary')}
            </Link>
            <Link
              href="/developers"
              className="inline-flex items-center justify-center px-8 py-3 border border-[#ebebeb] hover:border-[#a1a1a1] rounded-[6px] font-medium text-[14px] transition-colors duration-150 text-[#171717] bg-white h-10"
            >
              {t('home-cta-secondary')}
            </Link>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
