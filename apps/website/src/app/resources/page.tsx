'use client';

import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { useI18n } from '@/providers/I18nProvider';

export default function ResourcesPage() {
  const { t } = useI18n();

  return (
    <main className="min-h-screen bg-[var(--cc-canvas-soft)] text-[var(--cc-ink)]">
      <Navbar />
      <Breadcrumbs />
      {/* Hero */}
      <section className="max-w-[1200px] mx-auto px-6 py-24 text-center">
        <h1 className="text-5xl md:text-[64px] font-semibold mb-6 tracking-tight text-[#171717] leading-[1.05]">
          {t('resources-hero-title')}
        </h1>
        <p className="text-lg text-[#4d4d4d] max-w-2xl mx-auto leading-relaxed">
          {t('resources-hero-subtitle')}
        </p>
      </section>

      {/* Resources Grid */}
      <section className="max-w-[1200px] mx-auto px-6 pb-24">
        <div className="grid md:grid-cols-2 gap-6">
          <div id="whitepaper" className="p-8 bg-white border border-[#ebebeb] rounded-[12px] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <h2 className="text-[24px] font-semibold mb-3 text-[#171717]">{t('resources-whitepaper-title')}</h2>
            <p className="text-[#4d4d4d] text-[14px] leading-relaxed mb-4">
              {t('resources-whitepaper-desc')}
            </p>
            <span className="inline-flex items-center text-[14px] font-medium text-[#0070f3]">
              {t('resources-whitepaper-cta')}
            </span>
          </div>

          <div id="blog" className="p-8 bg-white border border-[#ebebeb] rounded-[12px] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <h2 className="text-[24px] font-semibold mb-3 text-[#171717]">{t('resources-blog-title')}</h2>
            <p className="text-[#4d4d4d] text-[14px] leading-relaxed mb-4">
              {t('resources-blog-desc')}
            </p>
            <span className="inline-flex items-center text-[14px] font-medium text-[#0070f3]">
              {t('resources-blog-cta')}
            </span>
          </div>

          <div id="community" className="p-8 bg-white border border-[#ebebeb] rounded-[12px] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <h2 className="text-[24px] font-semibold mb-3 text-[#171717]">{t('resources-community-title')}</h2>
            <p className="text-[#4d4d4d] text-[14px] leading-relaxed mb-4">
              {t('resources-community-desc')}
            </p>
            <div className="flex gap-3">
              <span className="px-3 py-1 bg-[#f5f5f5] rounded-[4px] text-[12px] font-medium text-[#4d4d4d]">Discord</span>
              <span className="px-3 py-1 bg-[#f5f5f5] rounded-[4px] text-[12px] font-medium text-[#4d4d4d]">Twitter</span>
              <span className="px-3 py-1 bg-[#f5f5f5] rounded-[4px] text-[12px] font-medium text-[#4d4d4d]">Telegram</span>
            </div>
          </div>

          <div id="support" className="p-8 bg-white border border-[#ebebeb] rounded-[12px] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <h2 className="text-[24px] font-semibold mb-3 text-[#171717]">{t('resources-support-title')}</h2>
            <p className="text-[#4d4d4d] text-[14px] leading-relaxed mb-4">
              {t('resources-support-desc')}
            </p>
            <span className="inline-flex items-center text-[14px] font-medium text-[#0070f3]">
              {t('resources-support-cta')}
            </span>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
