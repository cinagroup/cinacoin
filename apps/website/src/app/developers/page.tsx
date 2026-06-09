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
        <h1 className="text-5xl md:text-[64px] font-semibold mb-6 tracking-tight text-[#171717] leading-[1.05]">
          {t('dev-hero-title')}
        </h1>
        <p className="text-lg text-[#4d4d4d] max-w-2xl mx-auto leading-relaxed">
          {t('dev-hero-subtitle')}
        </p>
      </section>

      {/* Quick Start */}
      <section className="max-w-[1200px] mx-auto px-6 pb-16">
        <div className="p-8 bg-white border border-[#ebebeb] rounded-[12px] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <h2 className="text-[24px] font-semibold mb-4 text-[#171717]">{t('dev-quickstart-title')}</h2>
          <p className="text-[#4d4d4d] text-[14px] leading-relaxed mb-6">
            {t('dev-quickstart-desc')}
          </p>
          <div className="bg-[#f5f5f5] border border-[#ebebeb] rounded-[8px] p-4 font-mono text-[14px] text-[#171717] overflow-x-auto">
            <p className="text-[#888888]">{t('dev-quickstart-comment1')}</p>
            <p>npm install @cinacoin/sdk</p>
            <br />
            <p className="text-[#888888]">{t('dev-quickstart-comment2')}</p>
            <p>{`import { CinaCoin } from '@cinacoin/sdk'`}</p>
            <p>{`const client = new CinaCoin({ network: 'mainnet' })`}</p>
            <p>{`const balance = await client.getBalance(address)`}</p>
          </div>
        </div>
      </section>

      {/* Resources Grid */}
      <section className="max-w-[1200px] mx-auto px-6 pb-24">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div id="api" className="p-6 bg-white border border-[#ebebeb] rounded-[8px] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <h3 className="text-[20px] font-semibold mb-2 text-[#171717]">{t('dev-api-title')}</h3>
            <p className="text-[#4d4d4d] text-[14px] leading-relaxed mb-4">
              {t('dev-api-desc')}
            </p>
            <span className="text-[14px] font-medium text-[#0070f3]">{t('dev-api-cta')}</span>
          </div>

          <div id="sdks" className="p-6 bg-white border border-[#ebebeb] rounded-[8px] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <h3 className="text-[20px] font-semibold mb-2 text-[#171717]">{t('dev-sdks-title')}</h3>
            <p className="text-[#4d4d4d] text-[14px] leading-relaxed mb-4">
              {t('dev-sdks-desc')}
            </p>
            <span className="text-[14px] font-medium text-[#0070f3]">{t('dev-sdks-cta')}</span>
          </div>

          <div id="github" className="p-6 bg-white border border-[#ebebeb] rounded-[8px] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <h3 className="text-[20px] font-semibold mb-2 text-[#171717]">{t('dev-github-title')}</h3>
            <p className="text-[#4d4d4d] text-[14px] leading-relaxed mb-4">
              {t('dev-github-desc')}
            </p>
            <span className="text-[14px] font-medium text-[#0070f3]">{t('dev-github-cta')}</span>
          </div>

          <div className="p-6 bg-white border border-[#ebebeb] rounded-[8px] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <h3 className="text-[20px] font-semibold mb-2 text-[#171717]">{t('dev-tutorials-title')}</h3>
            <p className="text-[#4d4d4d] text-[14px] leading-relaxed mb-4">
              {t('dev-tutorials-desc')}
            </p>
            <span className="text-[14px] font-medium text-[#0070f3]">{t('dev-tutorials-cta')}</span>
          </div>

          <div className="p-6 bg-white border border-[#ebebeb] rounded-[8px] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <h3 className="text-[20px] font-semibold mb-2 text-[#171717]">{t('dev-contracts-title')}</h3>
            <p className="text-[#4d4d4d] text-[14px] leading-relaxed mb-4">
              {t('dev-contracts-desc')}
            </p>
            <span className="text-[14px] font-medium text-[#0070f3]">{t('dev-contracts-cta')}</span>
          </div>

          <div className="p-6 bg-white border border-[#ebebeb] rounded-[8px] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <h3 className="text-[20px] font-semibold mb-2 text-[#171717]">{t('dev-testnet-title')}</h3>
            <p className="text-[#4d4d4d] text-[14px] leading-relaxed mb-4">
              {t('dev-testnet-desc')}
            </p>
            <span className="text-[14px] font-medium text-[#0070f3]">{t('dev-testnet-cta')}</span>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
