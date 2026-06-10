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
        <h1 className="text-5xl md:text-[64px] font-semibold mb-6 tracking-tight text-[var(--cc-ink)] leading-[1.05]">
          {t('resources-hero-title')}
        </h1>
        <p className="text-[18px] text-[var(--cc-body)] max-w-2xl mx-auto leading-relaxed">
          {t('resources-hero-subtitle')}
        </p>
      </section>

      {/* Resources Grid */}
      <section className="max-w-[1200px] mx-auto px-6 pb-24">
        <div className="grid md:grid-cols-2 gap-6">
          <div id="whitepaper" className="p-6 bg-[var(--cc-canvas)] border border-[var(--cc-hairline)] rounded-[var(--cc-radius-md)] shadow-[var(--cc-level1)]">
            <h2 className="text-[24px] font-semibold mb-3 text-[var(--cc-ink)]">{t('resources-whitepaper-title')}</h2>
            <p className="text-[var(--cc-body)] text-[14px] leading-relaxed mb-4">
              {t('resources-whitepaper-desc')}
            </p>
            <span className="inline-flex items-center text-[14px] font-medium text-[var(--cc-link)]">
              {t('resources-whitepaper-cta')}
            </span>
          </div>

          <div id="blog" className="p-6 bg-[var(--cc-canvas)] border border-[var(--cc-hairline)] rounded-[var(--cc-radius-md)] shadow-[var(--cc-level1)]">
            <h2 className="text-[24px] font-semibold mb-3 text-[var(--cc-ink)]">{t('resources-blog-title')}</h2>
            <p className="text-[var(--cc-body)] text-[14px] leading-relaxed mb-4">
              {t('resources-blog-desc')}
            </p>
            <span className="inline-flex items-center text-[14px] font-medium text-[var(--cc-link)]">
              {t('resources-blog-cta')}
            </span>
          </div>

          <div id="community" className="p-6 bg-[var(--cc-canvas)] border border-[var(--cc-hairline)] rounded-[var(--cc-radius-md)] shadow-[var(--cc-level1)]">
            <h2 className="text-[24px] font-semibold mb-3 text-[var(--cc-ink)]">{t('resources-community-title')}</h2>
            <p className="text-[var(--cc-body)] text-[14px] leading-relaxed mb-4">
              {t('resources-community-desc')}
            </p>
            <div className="flex gap-3">
              <span className="px-3 py-1 bg-[var(--cc-canvas-soft-2)] rounded-[4px] text-[12px] font-medium text-[var(--cc-body)]">Discord</span>
              <span className="px-3 py-1 bg-[var(--cc-canvas-soft-2)] rounded-[4px] text-[12px] font-medium text-[var(--cc-body)]">Twitter</span>
              <span className="px-3 py-1 bg-[var(--cc-canvas-soft-2)] rounded-[4px] text-[12px] font-medium text-[var(--cc-body)]">Telegram</span>
            </div>
          </div>

          <div id="support" className="p-6 bg-[var(--cc-canvas)] border border-[var(--cc-hairline)] rounded-[var(--cc-radius-md)] shadow-[var(--cc-level1)]">
            <h2 className="text-[24px] font-semibold mb-3 text-[var(--cc-ink)]">{t('resources-support-title')}</h2>
            <p className="text-[var(--cc-body)] text-[14px] leading-relaxed mb-4">
              {t('resources-support-desc')}
            </p>
            <span className="inline-flex items-center text-[14px] font-medium text-[var(--cc-link)]">
              {t('resources-support-cta')}
            </span>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
