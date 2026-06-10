'use client';

import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { useI18n } from '@/providers/I18nProvider';

export default function DevelopersPage() {
  const { t } = useI18n();

  return (
    <main className="min-h-screen bg-[var(--cc-canvas-soft)] text-[var(--cc-ink)]">
      <Navbar />
      <Breadcrumbs />
      {/* Hero */}
      <section className="max-w-[1200px] mx-auto px-6 py-24 text-center">
        <h1 className="text-5xl md:text-[64px] font-semibold mb-6 tracking-tight text-[var(--cc-ink)] leading-[1.05]">
          {t('dev-hero-title')}
        </h1>
        <p className="text-lg text-[var(--cc-body)] max-w-2xl mx-auto leading-relaxed">
          {t('dev-hero-subtitle')}
        </p>
      </section>

      {/* Quick Start */}
      <section className="max-w-[1200px] mx-auto px-6 pb-16">
        <div className="p-8 bg-[var(--cc-canvas)] border border-[var(--cc-hairline)] rounded-[var(--cc-radius-lg)] shadow-[var(--cc-level1)]">
          <h2 className="text-[24px] font-semibold mb-4 text-[var(--cc-ink)]">{t('dev-quickstart-title')}</h2>
          <p className="text-[var(--cc-body)] text-[14px] leading-relaxed mb-6">
            {t('dev-quickstart-desc')}
          </p>
          <div className="text-code bg-[var(--cc-canvas-soft-2)] border border-[var(--cc-hairline)] rounded-[var(--cc-radius-md)] p-4 text-[var(--cc-ink)] overflow-x-auto">
            <p className="text-[var(--cc-muted)]">{t('dev-quickstart-comment1')}</p>
            <p>npm install @cinacoin/sdk</p>
            <br />
            <p className="text-[var(--cc-muted)]">{t('dev-quickstart-comment2')}</p>
            <p>{`import { CinaCoin } from '@cinacoin/sdk'`}</p>
            <p>{`const client = new CinaCoin({ network: 'mainnet' })`}</p>
            <p>{`const balance = await client.getBalance(address)`}</p>
          </div>
        </div>
      </section>

      {/* Resources Grid */}
      <section className="max-w-[1200px] mx-auto px-6 pb-24">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div id="api" className="p-6 bg-[var(--cc-canvas)] border border-[var(--cc-hairline)] rounded-[var(--cc-radius-md)] shadow-[var(--cc-level1)]">
            <h3 className="text-[20px] font-semibold mb-2 text-[var(--cc-ink)]">{t('dev-api-title')}</h3>
            <p className="text-[var(--cc-body)] text-[14px] leading-relaxed mb-4">
              {t('dev-api-desc')}
            </p>
            <span className="text-[14px] font-medium text-[var(--cc-link)]">{t('dev-api-cta')}</span>
          </div>

          <div id="sdks" className="p-6 bg-[var(--cc-canvas)] border border-[var(--cc-hairline)] rounded-[var(--cc-radius-md)] shadow-[var(--cc-level1)]">
            <h3 className="text-[20px] font-semibold mb-2 text-[var(--cc-ink)]">{t('dev-sdks-title')}</h3>
            <p className="text-[var(--cc-body)] text-[14px] leading-relaxed mb-4">
              {t('dev-sdks-desc')}
            </p>
            <span className="text-[14px] font-medium text-[var(--cc-link)]">{t('dev-sdks-cta')}</span>
          </div>

          <div id="github" className="p-6 bg-[var(--cc-canvas)] border border-[var(--cc-hairline)] rounded-[var(--cc-radius-md)] shadow-[var(--cc-level1)]">
            <h3 className="text-[20px] font-semibold mb-2 text-[var(--cc-ink)]">{t('dev-github-title')}</h3>
            <p className="text-[var(--cc-body)] text-[14px] leading-relaxed mb-4">
              {t('dev-github-desc')}
            </p>
            <span className="text-[14px] font-medium text-[var(--cc-link)]">{t('dev-github-cta')}</span>
          </div>

          <div className="p-6 bg-[var(--cc-canvas)] border border-[var(--cc-hairline)] rounded-[var(--cc-radius-md)] shadow-[var(--cc-level1)]">
            <h3 className="text-[20px] font-semibold mb-2 text-[var(--cc-ink)]">{t('dev-tutorials-title')}</h3>
            <p className="text-[var(--cc-body)] text-[14px] leading-relaxed mb-4">
              {t('dev-tutorials-desc')}
            </p>
            <span className="text-[14px] font-medium text-[var(--cc-link)]">{t('dev-tutorials-cta')}</span>
          </div>

          <div className="p-6 bg-[var(--cc-canvas)] border border-[var(--cc-hairline)] rounded-[var(--cc-radius-md)] shadow-[var(--cc-level1)]">
            <h3 className="text-[20px] font-semibold mb-2 text-[var(--cc-ink)]">{t('dev-contracts-title')}</h3>
            <p className="text-[var(--cc-body)] text-[14px] leading-relaxed mb-4">
              {t('dev-contracts-desc')}
            </p>
            <span className="text-[14px] font-medium text-[var(--cc-link)]">{t('dev-contracts-cta')}</span>
          </div>

          <div className="p-6 bg-[var(--cc-canvas)] border border-[var(--cc-hairline)] rounded-[var(--cc-radius-md)] shadow-[var(--cc-level1)]">
            <h3 className="text-[20px] font-semibold mb-2 text-[var(--cc-ink)]">{t('dev-testnet-title')}</h3>
            <p className="text-[var(--cc-body)] text-[14px] leading-relaxed mb-4">
              {t('dev-testnet-desc')}
            </p>
            <span className="text-[14px] font-medium text-[var(--cc-link)]">{t('dev-testnet-cta')}</span>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
