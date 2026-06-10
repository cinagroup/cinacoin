'use client'

import FadeIn from '@/components/FadeIn'
import { useI18n } from '@/providers/I18nProvider'

export default function Logos() {
  const { t } = useI18n()
  const logos = [
    'Ethereum', 'Polygon', 'Arbitrum', 'Optimism',
    'Base', 'BNB Chain', 'Avalanche', 'Solana',
    'Bitcoin', 'Cosmos', 'TON', 'Sui',
    'Aptos', 'Near', 'Starknet', 'XRPL',
  ]

  return (
    <section
      className="relative py-16"
      style={{ borderTop: '1px solid var(--cc-hairline)' }}
      aria-label={t('logos-label')}
    >
      <FadeIn>
        <h2 className="sr-only">Supported Chains</h2>
        <p className="mb-8 text-center cc-caption-mono text-[var(--cc-muted)]">
          {t('logos-label')}
        </p>
      </FadeIn>
      <div className="cc-container">
        <ul className="flex flex-wrap items-center justify-center gap-x-6 sm:gap-x-10 gap-y-4 sm:gap-y-6" role="list">
          {logos.map((name, i) => (
            <FadeIn key={name} delay={i * 80} direction="up" duration={500}>
              <li
                className="text-[16px] sm:text-[18px] font-medium cursor-default transition-colors hover:text-[var(--cc-body)]"
                style={{ color: 'var(--cc-hairline-strong)' }}
              >
                {name}
              </li>
            </FadeIn>
          ))}
        </ul>
      </div>
    </section>
  )
}
