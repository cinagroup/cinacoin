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
      
      {/* Hero Section — Type E: Hero + mesh gradient */}
      <section className="relative overflow-hidden">
        {/* Mesh gradient background atmosphere */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at 20% 50%, #007cf033 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, #7928ca33 0%, transparent 50%), radial-gradient(ellipse at 60% 80%, #ff008033 0%, transparent 50%), radial-gradient(ellipse at 40% 40%, #50e3c233 0%, transparent 50%)',
          }}
          aria-hidden="true"
        />
        <div className="relative max-w-[1200px] mx-auto px-6 py-48 text-center">
          <p className="font-mono text-xs text-[var(--cc-muted)] mb-2">CINACOIN</p>
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
              className="inline-flex items-center justify-center px-8 py-3 bg-[var(--cc-ink)] hover:opacity-90 text-[var(--cc-canvas)] rounded-[var(--cc-radius-pill)] font-medium text-body-sm transition-colors duration-150 h-10"
            >
              {ctaText}
            </Link>
            <Link
              href="/about"
              className="inline-flex items-center justify-center px-8 py-3 border border-[var(--cc-hairline)] hover:border-[var(--cc-hairline-strong)] rounded-[var(--cc-radius-pill)] font-medium text-body-sm transition-colors duration-150 text-[var(--cc-ink)] bg-[var(--cc-canvas)] h-10"
            >
              {t('home-hero-secondary')}
            </Link>
          </div>
        </div>
      </section>

      {/* Logo Strip — Type B: Partner endorsement */}
      <section className="border-y border-[var(--cc-hairline)] bg-[var(--cc-canvas-soft)] py-12">
        <div className="max-w-[1200px] mx-auto px-6">
          <p className="text-center text-xs font-mono text-[var(--cc-muted)] mb-8">
            TRUSTED BY TEAMS AROUND THE WORLD
          </p>
          <div className="flex items-center justify-center gap-12 flex-wrap opacity-60">
            {/* Placeholder partner logos — replace with real SVGs */}
            {['Acme Corp', 'Globex', 'Initech', 'Umbrella', 'Wayne Ent'].map((name) => (
              <div
                key={name}
                className="h-6 flex items-center"
              >
                <div className="w-20 h-5 rounded bg-[var(--cc-muted)]/20 flex items-center justify-center">
                  <span className="font-mono text-[10px] text-[var(--cc-muted)]">{name}</span>
                </div>
              </div>
            ))}
          </div>
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
              <h3 className="text-display-sm font-semibold mb-4">Live data.</h3>
              <div className="bg-white/10 rounded-md p-4 font-mono text-sm mb-4">
                <p className="mb-2">CINA/USDT: $0.0847</p>
                <p className="mb-2">24h Vol: $12.4M</p>
                <p>Market Cap: $84.7M</p>
              </div>
              <p className="text-sm text-white/70">
                Real-time market data, multi-chain aggregation, sub-second updates.
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
            Compute for every workload.
          </h2>
          <p className="text-body-lg text-white/70 mb-12 max-w-2xl">
            From static sites to AI agents, CinaCoin infrastructure adapts to your needs.
          </p>
          
          {/* Terminal Mockup */}
          <div className="bg-[var(--cc-canvas-soft-2)] rounded-[var(--cc-radius-md)] overflow-hidden">
            {/* Window title bar */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
              <div className="w-3 h-3 rounded-full bg-[var(--cc-terminal-close)]" />
              <div className="w-3 h-3 rounded-full bg-[var(--cc-terminal-minimize)]" />
              <div className="w-3 h-3 rounded-full bg-[var(--cc-terminal-maximize)]" />
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

      {/* Products Preview Section — Type A: canvas */}
      <section className="bg-[var(--cc-canvas-soft)] border-y border-[var(--cc-hairline)]">
        <div className="max-w-[1200px] mx-auto px-6 py-24">
          <div className="mb-16">
            <p className="font-mono text-xs text-[var(--cc-muted)] mb-2">PRODUCTS</p>
            <h2 className="text-display-lg md:text-display-xl font-semibold mb-4 tracking-tight text-[var(--cc-ink)] leading-[1.1]">
              {t('home-products-title')}
            </h2>
            <p className="text-[var(--cc-muted)] text-body-lg max-w-2xl">
              {t('home-products-subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-[7fr_5fr] gap-6 mb-6">
            {/* Wallet — large card */}
            <Link href="/products#wallet" className="group p-8 bg-[var(--cc-canvas)] border border-[var(--cc-hairline)] rounded-[var(--cc-radius-md)] shadow-[var(--cc-level1)] hover:shadow-[var(--cc-level3)] transition-shadow duration-200">
              <h3 className="text-display-md font-semibold mb-2 text-[var(--cc-ink)]">{t('home-p1-title')}</h3>
              <p className="text-[var(--cc-body)] text-body-sm leading-relaxed mb-6">
                {t('home-p1-desc')}
              </p>
              {/* Product mockup placeholder */}
              <div className="bg-[var(--cc-primary)] rounded-[var(--cc-radius-sm)] p-4 mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-[var(--cc-terminal-maximize)]" />
                  <span className="font-mono text-[10px] text-white/50">wallet-dashboard</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between font-mono text-xs text-white/70">
                    <span>CINA Balance</span>
                    <span>12,450.00</span>
                  </div>
                  <div className="flex justify-between font-mono text-xs text-white/70">
                    <span>Staked</span>
                    <span>8,200.00</span>
                  </div>
                  <div className="flex justify-between font-mono text-xs text-[var(--cc-terminal-maximize)]">
                    <span>APY</span>
                    <span>+5.2%</span>
                  </div>
                </div>
              </div>
              <span className="inline-flex items-center text-body-sm font-medium text-[var(--cc-link)] group-hover:underline">
                {t('home-p1-cta')}
              </span>
            </Link>

            {/* Exchange — right column, spans 2 rows */}
            <div className="md:row-span-2 p-8 bg-[var(--cc-primary)] text-[var(--cc-on-primary)] rounded-[var(--cc-radius-md)]">
              <h3 className="text-display-md font-semibold mb-2">{t('home-p2-title')}</h3>
              <p className="text-white/70 text-body-sm leading-relaxed mb-6">
                {t('home-p2-desc')}
              </p>
              {/* Exchange mockup */}
              <div className="bg-white/10 rounded-[var(--cc-radius-sm)] p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-xs text-white/50">CINA/USDT</span>
                  <span className="font-mono text-xs text-[var(--cc-terminal-maximize)]">+2.4%</span>
                </div>
                <div className="space-y-1.5">
                  {[0.0847, 0.0851, 0.0843, 0.0856, 0.0849, 0.0861, 0.0854].map((price, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div
                        className="h-1.5 rounded-full bg-[var(--cc-gradient-develop-start)]/60"
                        style={{ width: `${30 + Math.random() * 70}%` }}
                      />
                      <span className="font-mono text-[10px] text-white/40 ml-auto">${price}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="bg-white/10 rounded-[var(--cc-radius-xs)] p-3">
                  <p className="font-mono text-xs text-white/50 mb-1">24h Vol</p>
                  <p className="font-mono text-sm font-medium">$12.4M</p>
                </div>
                <div className="bg-white/10 rounded-[var(--cc-radius-xs)] p-3">
                  <p className="font-mono text-xs text-white/50 mb-1">Markets</p>
                  <p className="font-mono text-sm font-medium">24</p>
                </div>
              </div>
            </div>

            {/* Staking */}
            <Link href="/products#staking" className="group p-8 bg-[var(--cc-canvas)] border border-[var(--cc-hairline)] rounded-[var(--cc-radius-md)] shadow-[var(--cc-level1)] hover:shadow-[var(--cc-level3)] transition-shadow duration-200">
              <h3 className="text-display-md font-semibold mb-2 text-[var(--cc-ink)]">{t('home-p3-title')}</h3>
              <p className="text-[var(--cc-body)] text-body-sm leading-relaxed mb-4">
                {t('home-p3-desc')}
              </p>
              <span className="inline-flex items-center text-body-sm font-medium text-[var(--cc-link)] group-hover:underline">
                {t('home-p3-cta')}
              </span>
            </Link>
          </div>

          {/* Developer tools — full width card */}
          <Link href="/developers" className="group block p-8 bg-[var(--cc-canvas)] border border-[var(--cc-hairline)] rounded-[var(--cc-radius-md)] shadow-[var(--cc-level1)] hover:shadow-[var(--cc-level3)] transition-shadow duration-200">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <Code className="w-5 h-5 mb-3 text-[var(--cc-ink)]" />
                <h3 className="text-display-md font-semibold mb-2 text-[var(--cc-ink)]">{t('home-p4-title')}</h3>
                <p className="text-[var(--cc-body)] text-body-sm leading-relaxed mb-4">
                  {t('home-p4-desc')}
                </p>
                <span className="inline-flex items-center text-body-sm font-medium text-[var(--cc-link)] group-hover:underline">
                  {t('home-p4-cta')}
                </span>
              </div>
              {/* Code snippet mockup */}
              <div className="bg-[var(--cc-primary)] rounded-[var(--cc-radius-sm)] p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-[var(--cc-terminal-close)]" />
                  <div className="w-2 h-2 rounded-full bg-[var(--cc-terminal-minimize)]" />
                  <div className="w-2 h-2 rounded-full bg-[var(--cc-terminal-maximize)]" />
                  <span className="ml-2 font-mono text-[10px] text-white/40">cinacoin-sdk.ts</span>
                </div>
                <pre className="font-mono text-xs leading-5 text-white/80"><code>{`import { CinaCoin } from '@cinacoin/sdk';

const cc = new CinaCoin({
  network: 'mainnet',
  apiKey: process.env.CC_API_KEY,
});

const balance = await cc.wallet.getBalance();
const tx = await cc.transfer({
  to: '0x742d...f83a',
  amount: '100.0',
  token: 'CINA',
});`}</code></pre>
              </div>
            </div>
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
              className="inline-flex items-center justify-center px-8 py-3 bg-[var(--cc-ink)] hover:opacity-90 text-[var(--cc-canvas)] rounded-[var(--cc-radius-pill)] font-medium text-body-sm transition-colors duration-150 h-10"
            >
              {t('home-cta-primary')}
            </Link>
            <Link
              href="/developers"
              className="inline-flex items-center justify-center px-8 py-3 border border-[var(--cc-hairline)] hover:border-[var(--cc-hairline-strong)] rounded-[var(--cc-radius-pill)] font-medium text-body-sm transition-colors duration-150 text-[var(--cc-ink)] bg-[var(--cc-canvas)] h-10"
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
