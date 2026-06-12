'use client';

import Link from 'next/link';
import { Zap, Shield, Globe, Code } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { useI18n } from '@/providers/I18nProvider';
import { useABTest } from '@/hooks/useABTest';

export default function Home() {
  const { t } = useI18n();
  const { assignment, trackConversion } = useABTest('hero-cta-test');

  const handleCTAClick = () => {
    void trackConversion('hero_cta_click');
  };

  const ctaText = assignment?.variantName === 'variant-b'
    ? 'Start Free Trial'
    : t('home-hero-cta');

  return (
    <main className="min-h-screen bg-[var(--cc-canvas-soft)] text-[var(--cc-ink)]">
      <Navbar />
      <Breadcrumbs />
      
      {/* Hero Section - Left-aligned, asymmetric */}
      <section className="relative overflow-hidden">
        {/* Mesh gradient background using CSS custom properties */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `
              radial-gradient(ellipse at 20% 50%, var(--cc-mesh-develop) 0%, transparent 50%),
              radial-gradient(ellipse at 80% 20%, var(--cc-mesh-preview) 0%, transparent 50%),
              radial-gradient(ellipse at 60% 80%, var(--cc-mesh-highlight) 0%, transparent 50%),
              radial-gradient(ellipse at 40% 40%, var(--cc-mesh-cyan) 0%, transparent 50%)
            `,
          }}
          aria-hidden="true"
        />
        <div className="relative max-w-[1200px] mx-auto px-6 py-32 md:py-48">
          <div className="max-w-3xl">
            <h1 className="text-5xl md:text-[64px] font-semibold mb-6 tracking-tight text-[var(--cc-ink)] leading-[1.05]">
              {t('home-hero-title')}
            </h1>
            <p className="text-display-sm md:text-display-lg text-[var(--cc-body)] mb-6 leading-relaxed">
              {t('home-hero-subtitle')}
            </p>
            <p className="text-body-lg text-[var(--cc-muted)] mb-10 leading-relaxed">
              {t('home-hero-desc')}
            </p>
            <div className="flex gap-4 flex-wrap">
              <Link
                href="/products"
                onClick={handleCTAClick}
                className="inline-flex items-center justify-center px-8 py-3 bg-[var(--cc-ink)] hover:bg-[var(--cc-primary-hover)] text-[var(--cc-canvas)] rounded-full font-medium text-body-sm transition-colors duration-200"
              >
                {ctaText}
              </Link>
              <Link
                href="/developers"
                className="inline-flex items-center justify-center px-8 py-3 border border-[var(--cc-hairline)] hover:border-[var(--cc-hairline-strong)] rounded-full font-medium text-body-sm transition-colors duration-200 text-[var(--cc-ink)] bg-[var(--cc-canvas)]"
              >
                Read the docs →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Integration Partners - More realistic */}
      <section className="border-y border-[var(--cc-hairline)] bg-[var(--cc-canvas)] py-10">
        <div className="max-w-[1200px] mx-auto px-6">
          <p className="text-center text-xs font-mono text-[var(--cc-muted)] mb-6 tracking-wide">
            Integrates with your stack
          </p>
          <div className="flex items-center justify-center gap-8 md:gap-12 flex-wrap">
            {['MetaMask', 'Chainlink', 'The Graph', 'Uniswap', 'Aave'].map((name) => (
              <div
                key={name}
                className="flex items-center gap-2 opacity-50 hover:opacity-80 transition-opacity duration-200"
              >
                <div className="w-6 h-6 rounded bg-gradient-to-br from-[var(--cc-link)] to-[var(--cc-violet)] opacity-60" />
                <span className="font-medium text-sm text-[var(--cc-ink)]">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section - Asymmetric grid, varied layout */}
      <section className="bg-[var(--cc-canvas)] py-20 md:py-28">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-start mb-16">
            <div>
              <p className="font-mono text-xs text-[var(--cc-muted)] mb-3 tracking-wide">Why CinaCoin</p>
              <h2 className="text-display-lg md:text-display-xl font-semibold tracking-tight text-[var(--cc-ink)] leading-[1.1]">
                {t('home-features-title')}
              </h2>
            </div>
            <div className="md:pt-8">
              <p className="text-body-lg text-[var(--cc-body)] leading-relaxed">
                {t('home-features-subtitle')}
              </p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-12 gap-6">
            {/* Performance - spans 7 cols */}
            <Link href="/solutions#performance" className="group md:col-span-7 p-8 bg-[var(--cc-canvas-soft)] border border-[var(--cc-hairline)] rounded-lg hover:border-[var(--cc-hairline-strong)] transition-all duration-200">
              <Zap className="w-5 h-5 mb-4 text-[var(--cc-link)]" />
              <h3 className="text-display-sm font-semibold mb-2 text-[var(--cc-ink)]">{t('home-f1-title')}</h3>
              <p className="text-[var(--cc-body)] text-body-sm leading-relaxed mb-4">
                {t('home-f1-desc')}
              </p>
              <span className="inline-flex items-center text-body-sm font-medium text-[var(--cc-link)] group-hover:gap-2 gap-1 transition-all duration-200">
                Learn more <span className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
              </span>
            </Link>
            
            {/* Live Market Data - spans 5 cols, dark card */}
            <div className="md:col-span-5 p-8 bg-[var(--cc-ink)] text-[var(--cc-canvas)] rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-display-sm font-semibold">Market data</h3>
                <span className="flex items-center gap-1.5 text-xs text-[var(--cc-muted)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  Live
                </span>
              </div>
              <div className="space-y-3 font-mono text-sm">
                <div className="flex justify-between items-baseline">
                  <span className="text-[var(--cc-muted)] text-xs">CINA/USDT</span>
                  <span className="text-lg font-medium">$0.0847</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-[var(--cc-muted)] text-xs">24h Volume</span>
                  <span>$12.4M</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-[var(--cc-muted)] text-xs">Market Cap</span>
                  <span>$84.7M</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-[var(--cc-muted)] text-xs">TVL</span>
                  <span>$31.2M</span>
                </div>
              </div>
              <p className="text-xs text-[var(--cc-muted)] mt-4">
                Aggregated from 14 chains, updated every 800ms.
              </p>
            </div>
            
            {/* Security - spans 4 cols */}
            <Link href="/solutions#security" className="group md:col-span-4 p-8 bg-[var(--cc-canvas-soft)] border border-[var(--cc-hairline)] rounded-lg hover:border-[var(--cc-hairline-strong)] transition-all duration-200">
              <Shield className="w-5 h-5 mb-4 text-[var(--cc-link)]" />
              <h3 className="text-display-sm font-semibold mb-2 text-[var(--cc-ink)]">{t('home-f2-title')}</h3>
              <p className="text-[var(--cc-body)] text-body-sm leading-relaxed mb-4">
                {t('home-f2-desc')}
              </p>
              <span className="inline-flex items-center text-body-sm font-medium text-[var(--cc-link)] group-hover:gap-2 gap-1 transition-all duration-200">
                Learn more <span className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
              </span>
            </Link>
            
            {/* Global - spans 8 cols */}
            <Link href="/solutions#scale" className="group md:col-span-8 p-8 bg-[var(--cc-canvas-soft)] border border-[var(--cc-hairline)] rounded-lg hover:border-[var(--cc-hairline-strong)] transition-all duration-200">
              <Globe className="w-5 h-5 mb-4 text-[var(--cc-link)]" />
              <h3 className="text-display-sm font-semibold mb-2 text-[var(--cc-ink)]">{t('home-f3-title')}</h3>
              <p className="text-[var(--cc-body)] text-body-sm leading-relaxed mb-4">
                {t('home-f3-desc')}
              </p>
              <span className="inline-flex items-center text-body-sm font-medium text-[var(--cc-link)] group-hover:gap-2 gap-1 transition-all duration-200">
                Learn more <span className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* Dark Band - Terminal with better styling */}
      <section className="bg-[var(--cc-ink)] text-[var(--cc-canvas)] py-20 md:py-28">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center mb-12">
            <div>
              <p className="font-mono text-xs text-[var(--cc-muted)] mb-3 tracking-wide">Developer experience</p>
              <h2 className="text-display-lg md:text-display-xl font-semibold tracking-tight leading-[1.1] mb-4">
                Ship faster.
              </h2>
              <p className="text-body-lg text-white/60 leading-relaxed">
                From wallet integration to cross-chain transfers, get to production in hours not weeks.
              </p>
            </div>
          </div>
          
          {/* Terminal Mockup with proper styling */}
          <div className="bg-[#1a1a1a] rounded-lg border border-white/10 overflow-hidden">
            {/* Window chrome */}
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/5 bg-white/[0.02]">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
                <div className="w-3 h-3 rounded-full bg-[#28c840]" />
              </div>
              <span className="ml-2 font-mono text-xs text-white/40">~/projects/my-dapp</span>
            </div>
            {/* Code content with syntax highlighting */}
            <div className="p-6 overflow-x-auto">
              <pre className="font-mono text-sm leading-6">
                <code>
                  <span className="text-white/40">$</span> <span className="text-[#79c0ff]">npx</span> <span className="text-[#d2a8ff]">create-cinacoin-app@latest</span> <span className="text-white">my-dapp</span>{'\n'}
                  <span className="text-[#8b949e]">✔</span> <span className="text-white/70">Created project structure</span>{'\n'}
                  <span className="text-[#8b949e]">✔</span> <span className="text-white/70">Installed dependencies (42 packages)</span>{'\n'}
                  <span className="text-[#8b949e]">✔</span> <span className="text-white/70">Initialized wallet connection</span>{'\n'}
                  <span className="text-[#8b949e]">✔</span> <span className="text-white/70">Configured testnet</span>{'\n'}
                  {'\n'}
                  <span className="text-[#7ee787]">Ready!</span> <span className="text-white/50">cd my-dapp && npm run dev</span>
                </code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Products Section - Two column layout with visual */}
      <section className="bg-[var(--cc-canvas-soft)] py-20 md:py-28">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="mb-12">
            <p className="font-mono text-xs text-[var(--cc-muted)] mb-3 tracking-wide">Products</p>
            <h2 className="text-display-lg md:text-display-xl font-semibold tracking-tight text-[var(--cc-ink)] leading-[1.1]">
              {t('home-products-title')}
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8 items-start">
            {/* Product List */}
            <div className="space-y-6">
              {/* Wallet */}
              <Link href="/products#wallet" className="group block p-6 bg-[var(--cc-canvas)] border border-[var(--cc-hairline)] rounded-lg hover:border-[var(--cc-hairline-strong)] transition-all duration-200">
                <h3 className="text-display-md font-semibold mb-2 text-[var(--cc-ink)]">{t('home-p1-title')}</h3>
                <p className="text-[var(--cc-body)] text-body-sm leading-relaxed mb-4">
                  {t('home-p1-desc')}
                </p>
                <span className="inline-flex items-center text-body-sm font-medium text-[var(--cc-link)] group-hover:gap-2 gap-1 transition-all duration-200">
                  {t('home-p1-cta')} <span className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
                </span>
              </Link>

              {/* Exchange */}
              <Link href="/products#exchange" className="group block p-6 bg-[var(--cc-canvas)] border border-[var(--cc-hairline)] rounded-lg hover:border-[var(--cc-hairline-strong)] transition-all duration-200">
                <h3 className="text-display-md font-semibold mb-2 text-[var(--cc-ink)]">{t('home-p2-title')}</h3>
                <p className="text-[var(--cc-body)] text-body-sm leading-relaxed mb-4">
                  {t('home-p2-desc')}
                </p>
                <span className="inline-flex items-center text-body-sm font-medium text-[var(--cc-link)] group-hover:gap-2 gap-1 transition-all duration-200">
                  {t('home-p2-cta')} <span className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
                </span>
              </Link>

              {/* Staking */}
              <Link href="/products#staking" className="group block p-6 bg-[var(--cc-canvas)] border border-[var(--cc-hairline)] rounded-lg hover:border-[var(--cc-hairline-strong)] transition-all duration-200">
                <h3 className="text-display-md font-semibold mb-2 text-[var(--cc-ink)]">{t('home-p3-title')}</h3>
                <p className="text-[var(--cc-body)] text-body-sm leading-relaxed mb-4">
                  {t('home-p3-desc')}
                </p>
                <span className="inline-flex items-center text-body-sm font-medium text-[var(--cc-link)] group-hover:gap-2 gap-1 transition-all duration-200">
                  {t('home-p3-cta')} <span className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
                </span>
              </Link>
            </div>

            {/* Product Visual - Sticky */}
            <div className="md:sticky md:top-24">
              <div className="bg-[var(--cc-ink)] rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-xs text-white/40">Wallet</span>
                  <span className="flex items-center gap-1.5 text-xs text-[var(--cc-muted)]">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                    Connected
                  </span>
                </div>
                <div className="space-y-2 font-mono text-sm">
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
                </div>
              </div>
            </div>
          </div>

          {/* Developer Tools - Full Width */}
          <Link href="/developers" className="group block mt-8 p-8 bg-[var(--cc-canvas)] border border-[var(--cc-hairline)] rounded-lg hover:border-[var(--cc-hairline-strong)] transition-all duration-200">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <Code className="w-5 h-5 mb-3 text-[var(--cc-link)]" />
                <h3 className="text-display-md font-semibold mb-2 text-[var(--cc-ink)]">{t('home-p4-title')}</h3>
                <p className="text-[var(--cc-body)] text-body-sm leading-relaxed mb-4">
                  {t('home-p4-desc')}
                </p>
                <span className="inline-flex items-center text-body-sm font-medium text-[var(--cc-link)] group-hover:gap-2 gap-1 transition-all duration-200">
                  {t('home-p4-cta')} <span className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
                </span>
              </div>
              {/* Code snippet with syntax highlighting */}
              <div className="bg-[#1a1a1a] rounded-lg p-5 border border-white/10">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
                  </div>
                  <span className="ml-2 font-mono text-[10px] text-white/40">cinacoin-sdk.ts</span>
                </div>
                <pre className="font-mono text-xs leading-5 overflow-x-auto">
                  <code>
                    <span className="text-[#ff7b72]">import</span> <span className="text-white">{'{ CinaCoin }'}</span> <span className="text-[#ff7b72]">from</span> <span className="text-[#a5d6ff]">'@cinacoin/sdk'</span>;{'\n'}
                    {'\n'}
                    <span className="text-[#ff7b72]">const</span> <span className="text-white">cc</span> = <span className="text-[#ff7b72]">new</span> <span className="text-[#79c0ff]">CinaCoin</span>({'{'}{'\n'}
                    {'  '}<span className="text-white">network:</span> <span className="text-[#a5d6ff]">'mainnet'</span>,{'\n'}
                    {'  '}<span className="text-white">apiKey:</span> <span className="text-white">process.env.</span><span className="text-[#79c0ff]">CC_API_KEY</span>,{'\n'}
                    {'}'});{'\n'}
                    {'\n'}
                    <span className="text-[#ff7b72]">const</span> <span className="text-white">balance</span> = <span className="text-[#ff7b72]">await</span> <span className="text-white">cc.wallet.</span><span className="text-[#d2a8ff]">getBalance</span>();{'\n'}
                    <span className="text-[#ff7b72]">const</span> <span className="text-white">tx</span> = <span className="text-[#ff7b72]">await</span> <span className="text-white">cc.</span><span className="text-[#d2a8ff]">transfer</span>({'{'}{'\n'}
                    {'  '}<span className="text-white">to:</span> <span className="text-[#a5d6ff]">'0x742d...f83a'</span>,{'\n'}
                    {'  '}<span className="text-white">amount:</span> <span className="text-[#a5d6ff]">'100.0'</span>,{'\n'}
                    {'  '}<span className="text-white">token:</span> <span className="text-[#a5d6ff]">'CINA'</span>,{'\n'}
                    {'}'});
                  </code>
                </pre>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* CTA Section - Compact, integrated */}
      <section className="bg-[var(--cc-canvas)] border-t border-[var(--cc-hairline)] py-16 md:py-20">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h2 className="text-display-lg font-semibold tracking-tight text-[var(--cc-ink)] leading-[1.1] mb-2">
                {t('home-cta-title')}
              </h2>
              <p className="text-body-lg text-[var(--cc-body)]">
                {t('home-cta-subtitle')}
              </p>
            </div>
            <div className="flex gap-3 flex-shrink-0">
              <Link
                href="/products"
                className="inline-flex items-center justify-center px-6 py-2.5 bg-[var(--cc-ink)] hover:bg-[var(--cc-primary-hover)] text-[var(--cc-canvas)] rounded-full font-medium text-body-sm transition-colors duration-200"
              >
                {t('home-cta-primary')}
              </Link>
              <Link
                href="/developers"
                className="inline-flex items-center justify-center px-6 py-2.5 border border-[var(--cc-hairline)] hover:border-[var(--cc-hairline-strong)] rounded-full font-medium text-body-sm transition-colors duration-200 text-[var(--cc-ink)] bg-[var(--cc-canvas)]"
              >
                {t('home-cta-secondary')}
              </Link>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
