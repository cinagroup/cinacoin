'use client'

import FadeIn from '@/components/FadeIn'

export default function Features() {
  const features = [
    {
      title: 'Universal Wallet Connection',
      desc: 'Connect MetaMask, WalletConnect, Coinbase, and 50+ more wallets across 16 chains with a single SDK.',
      icon: '🔗',
      iconLabel: 'Wallet and chain connection',
    },
    {
      title: 'Chain Abstraction',
      desc: 'Let users interact with your app across EVM, Solana, Bitcoin, Cosmos, and more — without worrying about which chain.',
      icon: '🌐',
      iconLabel: 'Multi-chain abstraction',
    },
    {
      title: 'SIWE Authentication',
      desc: 'Sign-In With Ethereum (EIP-4361) with session management, wallet verification, and passkey support.',
      icon: '🔐',
      iconLabel: 'Smart account security',
    },
    {
      title: 'Real-time Notifications',
      desc: 'Push notifications for wallet activity, transaction confirmations, and cross-chain events via Push server.',
      icon: '🔔',
      iconLabel: 'Real-time notifications',
    },
    {
      title: 'Developer-First SDKs',
      desc: 'Clean TypeScript SDKs for React, Vue, Svelte, and more. Comprehensive docs and live demo examples.',
      icon: '⚡',
      iconLabel: 'Developer tools and SDKs',
    },
    {
      title: 'Fully Open Source',
      desc: 'Self-hosted, zero vendor lock-in. MIT licensed with full transparency and community contributions.',
      icon: '🛡️',
      iconLabel: 'Open source and transparent',
    },
  ];

  return (
    <section id="features" className="relative py-24 sm:py-32" aria-labelledby="features-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <FadeIn>
          <div className="mb-16 max-w-3xl">
            <h2 id="features-heading" className="text-3xl sm:text-4xl font-bold tracking-tight md:text-5xl">
              Everything you need to{' '}
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                build onchain
              </span>
            </h2>
            <p className="mt-4 text-base sm:text-lg text-zinc-400">
              A complete suite of tools and infrastructure for seamless cross-chain experiences.
            </p>
          </div>
        </FadeIn>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <FadeIn key={i} delay={i * 100} direction="up" duration={600}>
              <article
                className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.04] hover:shadow-lg hover:shadow-blue-500/5 hover:-translate-y-1 cursor-default"
              >
                <div className="mb-4 text-2xl transition-transform duration-300 group-hover:scale-110" role="img" aria-label={f.iconLabel}>{f.icon}</div>
                <h3 className="mb-2 text-lg font-semibold">{f.title}</h3>
                <p className="text-sm leading-relaxed text-zinc-400">{f.desc}</p>
              </article>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
