'use client';

import Link from 'next/link';
import { Zap, Shield, Globe, Code } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { NewsletterForm } from '@/components/NewsletterForm';
import { useI18n } from '@/providers/I18nProvider';
import { useABTest } from '@/hooks/useABTest';

export default function Home() {
  const { t } = useI18n();
  const { assignment, trackConversion } = useABTest('hero-cta-test');

  const handleCTAClick = () => {
    trackConversion('hero_cta_click');
  };

  const ctaText = assignment?.variantName === 'variant-b'
    ? 'Start Free Trial'
    : t('home-hero-cta');

  return (
    <main className="min-h-screen bg-[var(--cc-canvas-soft)] text-[var(--cc-ink)]">
      <Navbar />
      <Breadcrumbs />
      
      {/* Hero Section */}
      <section className="max-w-[1200px] mx-auto px-6 py-48 text-center">
        <h1 className="text-5xl md:text-[64px] font-semibold mb-6 tracking-tight text-[var(--cc-ink)] leading-[1.05]">
          {t('home-hero-title')}
        </h1>
        <p className="text-display-sm md:text-display-md text-[var(--cc-body)] mb-8 max-w-3xl mx-auto leading-relaxed">
          {t('home-hero-subtitle')}
        </p>
        <p className="text-body-lg text-[var(--cc-muted)] mb-12 max-w-2xl mx-auto leading-relaxed">
          {t('home-hero-desc')}
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link
            href="/products"
            onClick={handleCTAClick}
            className="inline-flex items-center justify-center px-8 py-3 bg-[var(--cc-ink)] hover:opacity-90 text-[var(--cc-canvas)] rounded-[var(--cc-radius-sm)] font-medium text-body-sm transition-colors duration-150 h-10"
          >
            {ctaText}
          </Link>
          <Link
            href="/about"
            className="inline-flex items-center justify-center px-8 py-3 border border-[var(--cc-hairline)] hover:border-[var(--cc-hairline-strong)] rounded-[var(--cc-radius-sm)] font-medium text-body-sm transition-colors duration-150 text-[var(--cc-ink)] bg-[var(--cc-canvas)] h-10"
          >
            {t('home-hero-secondary')}
          </Link>
        </div>
      </section>

      {/* Features Section - Asymmetric Layout */}
      <section className="bg-[var(--cc-canvas)] border-y border-[var(--cc-hairline)]">
        <div className="max-w-[1200px] mx-auto px-6 py-24">
          <div className="mb-16">
            <p className="font-mono text-xs text-[var(--cc-muted)] mb-2">INFRASTRUCTURE</p>
            <h2 className="text-display-lg md:text-display-xl font-semibold mb-4 tracking-tight text-[var(--cc-ink)] leading-[1.1]">
              {t('home-features-title')}
            </h2>
            <p className="text-[var(--cc-muted)] text-body-lg max-w-2xl">
              {t('home-features-subtitle')}
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {/* First column */}
            <Link href="/solutions#performance" className="group p-6 bg-[var(--cc-canvas)] border border-[var(--cc-hairline)] rounded-[var(--cc-radius-md)] shadow-[var(--cc-level1)] hover:shadow-[var(--cc-level3)] transition-shadow duration-200">
              <Zap className="w-5 h-5 mb-4 text-[var(--cc-ink)]" />
              <h3 className="text-display-sm font-semibold mb-2 text-[var(--cc-ink)]">{t('home-f1-title')}</h3>
              <p className="text-[var(--cc-body)] text-body-sm leading-relaxed">
                {t('home-f1-desc')}
              </p>
              <span className="inline-block mt-4 text-body-sm font-medium text-[var(--cc-link)] group-hover:underline">
                {t('home-learn-more')}
              </span>
            </Link>
            
            {/* Second column - spans 2 rows with mockup */}
            <div className="md:row-span-2 p-6 bg-[var(--cc-primary)] text-[var(--cc-on-primary)] rounded-[var(--cc-radius-md)]">
              <h3 className="text-display-sm font-semibold mb-4">实时数据</h3>
              <div className="bg-white/10 rounded-md p-4 font-mono text-sm mb-4">
                <p className="mb-2">CINA/USDT: $0.0847</p>
                <p className="mb-2">24h Vol: $12.4M</p>
                <p>Market Cap: $84.7M</p>
              </div>
              <p className="text-sm text-white/70">
                实时市场数据，多链聚合，亚秒级更新.
              </p>
            </div>
            
            {/* Third column */}
            <Link href="/solutions#security" className="group p-6 bg-[var(--cc-canvas)] border border-[var(--cc-hairline)] rounded-[var(--cc-radius-md)] shadow-[var(--cc-level1)] hover:shadow-[var(--cc-level3)] transition-shadow duration-200">
              <Shield className="w-5 h-5 mb-4 text-[var(--cc-ink)]" />
              <h3 className="text-display-sm font-semibold mb-2 text-[var(--cc-ink)]">{t('home-f2-title')}</h3>
              <p className="text-[var(--cc-body)] text-body-sm leading-relaxed">
                {t('home-f2-desc')}
              </p>
              <span className="inline-block mt-4 text-body-sm font-medium text-[var(--cc-link)] group-hover:underline">
                {t('home-learn-more')}
              </span>
            </Link>
            
            {/* Fourth column - fills under first */}
            <Link href="/solutions#scale" className="group p-6 bg-[var(--cc-canvas)] border border-[var(--cc-hairline)] rounded-[var(--cc-radius-md)] shadow-[var(--cc-level1)] hover:shadow-[var(--cc-level3)] transition-shadow duration-200">
              <Globe className="w-5 h-5 mb-4 text-[var(--cc-ink)]" />
              <h3 className="text-display-sm font-semibold mb-2 text-[var(--cc-ink)]">{t('home-f3-title')}</h3>
              <p className="text-[var(--cc-body)] text-body-sm leading-relaxed">
                {t('home-f3-desc')}
              </p>
              <span className="inline-block mt-4 text-body-sm font-medium text-[var(--cc-link)] group-hover:underline">
                {t('home-learn-more')}
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* Dark Band - Technical Manifesto */}
      <section className="bg-[var(--cc-primary)] text-[var(--cc-on-primary)] py-24">
        <div className="max-w-[1200px] mx-auto px-6">
          <p className="font-mono text-xs text-white/50 mb-2">TECHNOLOGY</p>
          <h2 className="text-display-lg md:text-display-xl font-semibold mb-6 tracking-tight leading-[1.1]">
            为所有工作负载设计的计算模型.
          </h2>
          <p className="text-body-lg text-white/70 mb-12 max-w-2xl">
            从静态站点到 AI 代理，Cinacoin 的基础设施自动适配你的需求.
          </p>
          
          {/* Terminal Mockup */}
          <div className="bg-[var(--cc-canvas-soft-2)] rounded-[var(--cc-radius-md)] overflow-hidden">
            {/* Window title bar */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
              <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
              <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
              <div className="w-3 h-3 rounded-full bg-[#28c840]" />
              <span className="ml-2 font-mono text-xs text-white/50">terminal</span>
            </div>
            {/* Code content */}
            <div className="p-6">
              <pre className="font-mono text-sm leading-6 text-[var(--cc-ink)]">
                <code>{`$ npx create-cinacoin-app@latest my-dapp
✓ Created project structure
✓ Installed dependencies (42 packages)
✓ Initialized wallet connection
✓ Configured testnet

  Ready! cd my-dapp && npm run dev`}</code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Products Preview Section */}
      <section className="max-w-[1200px] mx-auto px-6 py-24">
        <div className="mb-16">
          <p className="font-mono text-xs text-[var(--cc-muted)] mb-2">PRODUCTS</p>
          <h2 className="text-display-lg md:text-display-xl font-semibold mb-4 tracking-tight text-[var(--cc-ink)] leading-[1.1]">
            {t('home-products-title')}
          </h2>
          <p className="text-[var(--cc-muted)] text-body-lg max-w-2xl">
            {t('home-products-subtitle')}
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          <Link href="/products#wallet" className="group p-6 bg-[var(--cc-canvas)] border border-[var(--cc-hairline)] rounded-[var(--cc-radius-md)] shadow-[var(--cc-level1)] hover:shadow-[var(--cc-level3)] transition-shadow duration-200">
            <h3 className="text-display-md font-semibold mb-2 text-[var(--cc-ink)]">{t('home-p1-title')}</h3>
            <p className="text-[var(--cc-body)] text-body-sm leading-relaxed mb-4">
              {t('home-p1-desc')}
            </p>
            <span className="inline-flex items-center text-body-sm font-medium text-[var(--cc-link)] group-hover:underline">
              {t('home-p1-cta')}
            </span>
          </Link>
          <Link href="/products#exchange" className="group p-6 bg-[var(--cc-canvas)] border border-[var(--cc-hairline)] rounded-[var(--cc-radius-md)] shadow-[var(--cc-level1)] hover:shadow-[var(--cc-level3)] transition-shadow duration-200">
            <h3 className="text-display-md font-semibold mb-2 text-[var(--cc-ink)]">{t('home-p2-title')}</h3>
            <p className="text-[var(--cc-body)] text-body-sm leading-relaxed mb-4">
              {t('home-p2-desc')}
            </p>
            <span className="inline-flex items-center text-body-sm font-medium text-[var(--cc-link)] group-hover:underline">
              {t('home-p2-cta')}
            </span>
          </Link>
          <Link href="/products#staking" className="group p-6 bg-[var(--cc-canvas)] border border-[var(--cc-hairline)] rounded-[var(--cc-radius-md)] shadow-[var(--cc-level1)] hover:shadow-[var(--cc-level3)] transition-shadow duration-200">
            <h3 className="text-display-md font-semibold mb-2 text-[var(--cc-ink)]">{t('home-p3-title')}</h3>
            <p className="text-[var(--cc-body)] text-body-sm leading-relaxed mb-4">
              {t('home-p3-desc')}
            </p>
            <span className="inline-flex items-center text-body-sm font-medium text-[var(--cc-link)] group-hover:underline">
              {t('home-p3-cta')}
            </span>
          </Link>
          <Link href="/developers" className="group p-6 bg-[var(--cc-canvas)] border border-[var(--cc-hairline)] rounded-[var(--cc-radius-md)] shadow-[var(--cc-level1)] hover:shadow-[var(--cc-level3)] transition-shadow duration-200">
            <Code className="w-5 h-5 mb-3 text-[var(--cc-ink)]" />
            <h3 className="text-display-md font-semibold mb-2 text-[var(--cc-ink)]">{t('home-p4-title')}</h3>
            <p className="text-[var(--cc-body)] text-body-sm leading-relaxed mb-4">
              {t('home-p4-desc')}
            </p>
            <span className="inline-flex items-center text-body-sm font-medium text-[var(--cc-link)] group-hover:underline">
              {t('home-p4-cta')}
            </span>
          </Link>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="bg-[var(--cc-canvas-soft-2)] border-y border-[var(--cc-hairline)]">
        <div className="max-w-[1200px] mx-auto px-6 py-24">
          <div className="max-w-2xl mx-auto">
            <p className="font-mono text-xs text-[var(--cc-muted)] mb-2 text-center">UPDATES</p>
            <h2 className="text-display-lg md:text-display-xl font-semibold text-center mb-4 tracking-tight text-[var(--cc-ink)] leading-[1.1]">
              {t('newsletter.title')}
            </h2>
            <p className="text-center text-[var(--cc-muted)] text-body-lg mb-12">
              {t('newsletter.subtitle')}
            </p>
            <NewsletterForm source="homepage" />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-[var(--cc-canvas)] border-y border-[var(--cc-hairline)]">
        <div className="max-w-[1200px] mx-auto px-6 py-24 text-center">
          <p className="font-mono text-xs text-[var(--cc-muted)] mb-2">GET STARTED</p>
          <h2 className="text-display-lg md:text-display-xl font-semibold mb-6 tracking-tight text-[var(--cc-ink)] leading-[1.1]">
            {t('home-cta-title')}
          </h2>
          <p className="text-body-lg text-[var(--cc-body)] mb-8 max-w-xl mx-auto leading-relaxed">
            {t('home-cta-subtitle')}
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href="/products"
              className="inline-flex items-center justify-center px-8 py-3 bg-[var(--cc-ink)] hover:opacity-90 text-[var(--cc-canvas)] rounded-[var(--cc-radius-sm)] font-medium text-body-sm transition-colors duration-150 h-10"
            >
              {t('home-cta-primary')}
            </Link>
            <Link
              href="/developers"
              className="inline-flex items-center justify-center px-8 py-3 border border-[var(--cc-hairline)] hover:border-[var(--cc-hairline-strong)] rounded-[var(--cc-radius-sm)] font-medium text-body-sm transition-colors duration-150 text-[var(--cc-ink)] bg-[var(--cc-canvas)] h-10"
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
