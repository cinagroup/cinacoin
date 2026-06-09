'use client'

import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import FadeIn from '@/components/FadeIn'
import { useI18n } from '@/providers/I18nProvider'

const releases = [
  {
    version: 'v2.0.0',
    date: '2025-06-01',
    type: 'major' as const,
    changes: [
      'Unified API across all SDKs',
      'SIWE authentication with session management',
      'Push notifications for wallet activity',
      'Chain abstraction — automatic cross-chain routing',
      '9 framework adapters: React, Vue, Svelte, Next, Nuxt, Angular, React Native',
      '8 chain adapters: EVM, Solana, Bitcoin, Cosmos, TON, Sui, Starknet, XRPL',
      '52+ open source packages',
    ],
  },
  {
    version: 'v1.5.0',
    date: '2025-03-15',
    type: 'minor' as const,
    changes: [
      'Added Solana and Bitcoin adapters',
      'Smart account (ERC-4337) support',
      'Gas sponsorship API',
      'Batch transaction support',
    ],
  },
  {
    version: 'v1.0.0',
    date: '2024-06-20',
    type: 'major' as const,
    changes: [
      'Initial release of @cinacoin/core-sdk',
      'EVM wallet connection (MetaMask, WalletConnect, Coinbase)',
      'React adapter with ConnectButton component',
      'Basic analytics dashboard',
    ],
  },
]

export default function ChangelogContent() {
  const { t } = useI18n()

  return (
    <>
      <Navbar />

      {/* Hero */}
      <section className="relative pt-32 pb-16 sm:pt-40 sm:pb-20">
        <FadeIn>
          <div id="main-content" className="cc-container mx-auto max-w-4xl px-6 text-center">
            <h1 className="cc-display-xl">{t('changelog-hero-title')}</h1>
            <p className="mt-6 cc-body-lg text-[var(--cc-body)]">
              {t('changelog-hero-subtitle')}
            </p>
          </div>
        </FadeIn>
      </section>

      {/* Releases */}
      <section className="pb-20 sm:pb-32">
        <div className="cc-container mx-auto max-w-3xl px-6 space-y-12">
          {releases.map((release, i) => (
            <FadeIn key={release.version} delay={i * 150}>
              <article className="relative pl-8 border-l border-[var(--cc-hairline)]">
                <div
                  className="absolute -left-1.5 top-1 h-3 w-3 rounded-full"
                  style={{
                    background: release.type === 'major'
                      ? 'var(--cc-link)'
                      : 'var(--cc-muted)',
                  }}
                />
                <div className="flex items-center gap-3 mb-3">
                  <span className="cc-code text-[var(--cc-link)]">{release.version}</span>
                  <span className="cc-caption text-[var(--cc-muted)]">{release.date}</span>
                  <span
                    className="cc-caption rounded-full px-2 py-0.5"
                    style={{
                      background: release.type === 'major'
                        ? 'var(--cc-link-bg-soft)'
                        : 'var(--cc-canvas-soft-2)',
                      color: release.type === 'major'
                        ? 'var(--cc-link)'
                        : 'var(--cc-muted)',
                    }}
                  >
                    {release.type === 'major'
                      ? t('changelog-type-major')
                      : t('changelog-type-minor')}
                  </span>
                </div>
                <ul className="space-y-2">
                  {release.changes.map((change) => (
                    <li key={change} className="flex items-start gap-2 cc-body-sm text-[var(--cc-body)]">
                      <span className="mt-2 h-1 w-1 rounded-full bg-[var(--cc-hairline-strong)] flex-shrink-0" />
                      {change}
                    </li>
                  ))}
                </ul>
              </article>
            </FadeIn>
          ))}
        </div>
      </section>

      <Footer />
    </>
  )
}
