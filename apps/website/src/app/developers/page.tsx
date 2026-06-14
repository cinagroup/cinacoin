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
      
      {/* Hero - Left-aligned for variety */}
      <section className="max-w-[1200px] mx-auto px-6 py-20 md:py-28">
        <div className="max-w-2xl">
          <p className="font-mono text-xs text-[var(--cc-muted)] mb-3 tracking-wide">For developers</p>
          <h1 className="text-5xl md:text-[64px] font-semibold mb-6 tracking-tight text-[var(--cc-ink)] leading-[1.05]">
            {t('dev-hero-title')}
          </h1>
          <p className="text-body-lg text-[var(--cc-body)] leading-relaxed">
            {t('dev-hero-subtitle')}
          </p>
        </div>
      </section>

      {/* Quick Start - Terminal style */}
      <section className="max-w-[1200px] mx-auto px-6 pb-16">
        <div className="grid md:grid-cols-2 gap-8 items-start">
          <div>
            <p className="font-mono text-xs text-[var(--cc-muted)] mb-3 tracking-wide">Quick start</p>
            <h2 className="text-display-lg font-semibold mb-4 text-[var(--cc-ink)]">{t('dev-quickstart-title')}</h2>
            <p className="text-[var(--cc-body)] text-body-lg leading-relaxed mb-6">
              {t('dev-quickstart-desc')}
            </p>
          </div>
          <div className="bg-[var(--cc-canvas-soft-2)] rounded-sm border border-[var(--cc-hairline)] overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/5 bg-[var(--cc-canvas)]/[0.02]">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-[#ff5f57]" />
                <div className="w-3 h-3 rounded-sm bg-[#febc2e]" />
                <div className="w-3 h-3 rounded-sm bg-[#28c840]" />
              </div>
              <span className="ml-2 font-mono text-xs text-white/40">terminal</span>
            </div>
            <div className="p-5 overflow-x-auto">
              <pre className="font-mono text-sm leading-6">
                <code>
                  <span className="text-[#8b949e]"># Install the SDK</span>{'\n'}
                  <span className="text-white/40">$</span> <span className="text-[#79c0ff]">npm</span> <span className="text-white">install</span> <span className="text-[#a5d6ff]">@cinacoin/sdk</span>{'\n'}
                  {'\n'}
                  <span className="text-[#8b949e]"># Import and initialize</span>{'\n'}
                  <span className="text-[#ff7b72]">import</span> <span className="text-white">{'{ Cinacoin }'}</span> <span className="text-[#ff7b72]">from</span> <span className="text-[#a5d6ff]">'@cinacoin/sdk'</span>{'\n'}
                  <span className="text-[#ff7b72]">const</span> <span className="text-white">client</span> = <span className="text-[#ff7b72]">new</span> <span className="text-[#79c0ff]">Cinacoin</span>({'{'} <span className="text-white">network:</span> <span className="text-[#a5d6ff]">'mainnet'</span> {'}'}){'\n'}
                  <span className="text-[#ff7b72]">const</span> <span className="text-white">balance</span> = <span className="text-[#ff7b72]">await</span> <span className="text-white">client.</span><span className="text-[#d2a8ff]">getBalance</span><span className="text-white">(address)</span>
                </code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Resources Grid - Varied card sizes */}
      <section className="max-w-[1200px] mx-auto px-6 pb-20 md:pb-28">
        <p className="font-mono text-xs text-[var(--cc-muted)] mb-6 tracking-wide">Resources</p>
        <div className="grid md:grid-cols-12 gap-6">
          {/* API Reference - Large card */}
          <div id="api" className="md:col-span-7 p-8 bg-[var(--cc-canvas)] border border-[var(--cc-hairline)] rounded-sm">
            <h3 className="text-display-md font-semibold mb-2 text-[var(--cc-ink)]">{t('dev-api-title')}</h3>
            <p className="text-[var(--cc-body)] text-body-lg leading-relaxed mb-6">
              {t('dev-api-desc')}
            </p>
            <Link href="/developers#api" className="inline-flex items-center text-body-sm font-medium text-[var(--cc-link)] hover:gap-2 gap-1 transition-all duration-200">
              {t('dev-api-cta')} <span>→</span>
            </Link>
          </div>

          {/* SDKs - Dark card */}
          <div id="sdks" className="md:col-span-5 p-8 bg-[var(--cc-ink)] text-[var(--cc-canvas)] rounded-sm">
            <h3 className="text-display-md font-semibold mb-2">{t('dev-sdks-title')}</h3>
            <p className="text-white/60 text-body-lg leading-relaxed mb-6">
              {t('dev-sdks-desc')}
            </p>
            <Link href="/developers#sdks" className="inline-flex items-center text-body-sm font-medium text-[var(--cc-cyan)] hover:gap-2 gap-1 transition-all duration-200">
              {t('dev-sdks-cta')} <span>→</span>
            </Link>
          </div>

          {/* GitHub */}
          <div id="github" className="md:col-span-4 p-6 bg-[var(--cc-canvas)] border border-[var(--cc-hairline)] rounded-sm">
            <h3 className="text-display-sm font-semibold mb-2 text-[var(--cc-ink)]">{t('dev-github-title')}</h3>
            <p className="text-[var(--cc-body)] text-body-sm leading-relaxed mb-4">
              {t('dev-github-desc')}
            </p>
            <Link href="/developers#github" className="inline-flex items-center text-body-sm font-medium text-[var(--cc-link)] hover:gap-2 gap-1 transition-all duration-200">
              {t('dev-github-cta')} <span>→</span>
            </Link>
          </div>

          {/* Tutorials */}
          <div className="md:col-span-4 p-6 bg-[var(--cc-canvas)] border border-[var(--cc-hairline)] rounded-sm">
            <h3 className="text-display-sm font-semibold mb-2 text-[var(--cc-ink)]">{t('dev-tutorials-title')}</h3>
            <p className="text-[var(--cc-body)] text-body-sm leading-relaxed mb-4">
              {t('dev-tutorials-desc')}
            </p>
            <Link href="/developers#tutorials" className="inline-flex items-center text-body-sm font-medium text-[var(--cc-link)] hover:gap-2 gap-1 transition-all duration-200">
              {t('dev-tutorials-cta')} <span>→</span>
            </Link>
          </div>

          {/* Smart Contracts */}
          <div className="md:col-span-4 p-6 bg-[var(--cc-canvas)] border border-[var(--cc-hairline)] rounded-sm">
            <h3 className="text-display-sm font-semibold mb-2 text-[var(--cc-ink)]">{t('dev-contracts-title')}</h3>
            <p className="text-[var(--cc-body)] text-body-sm leading-relaxed mb-4">
              {t('dev-contracts-desc')}
            </p>
            <Link href="/developers#contracts" className="inline-flex items-center text-body-sm font-medium text-[var(--cc-link)] hover:gap-2 gap-1 transition-all duration-200">
              {t('dev-contracts-cta')} <span>→</span>
            </Link>
          </div>

          {/* Testnet - Full width */}
          <div className="md:col-span-12 p-8 bg-[var(--cc-canvas-soft-2)] border border-[var(--cc-hairline)] rounded-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h3 className="text-display-sm font-semibold mb-1 text-[var(--cc-ink)]">{t('dev-testnet-title')}</h3>
              <p className="text-[var(--cc-body)] text-body-sm leading-relaxed">
                {t('dev-testnet-desc')}
              </p>
            </div>
            <Link href="/developers#testnet" className="inline-flex items-center justify-center px-5 py-2.5 bg-[var(--cc-ink)] hover:bg-[var(--cc-primary-hover)] text-[var(--cc-canvas)] rounded-sm font-medium text-body-sm transition-colors duration-200 flex-shrink-0">
              {t('dev-testnet-cta')}
            </Link>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
