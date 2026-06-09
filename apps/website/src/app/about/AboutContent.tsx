'use client'

import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import FadeIn from '@/components/FadeIn'
import AnimatedNumber from '@/components/AnimatedNumber'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { useI18n } from '@/providers/I18nProvider'

const timelineData = [
  { date: '2024 Q1', event: 'Project founded', detail: 'Started as an internal toolkit for cross-chain dApps' },
  { date: '2024 Q2', event: 'Core SDK v1.0', detail: 'Released @cinacoin/core-sdk with EVM wallet support' },
  { date: '2024 Q3', event: 'Multi-chain expansion', detail: 'Added Solana, Bitcoin, Cosmos adapters' },
  { date: '2024 Q4', event: 'React + framework adapters', detail: 'Released 9 framework adapters including React, Vue, Svelte' },
  { date: '2025 Q1', event: 'SDK v2.0', detail: 'Unified API, SIWE auth, push notifications, chain abstraction' },
  { date: '2025 Q2', event: 'Open source launch', detail: '52+ packages, fully MIT licensed, community contributions' },
]

export default function AboutContent() {
  const { t } = useI18n()

  return (
    <>
      <Navbar />
      <Breadcrumbs />

      {/* Hero */}
      <section className="relative pt-32 pb-16 sm:pt-40 sm:pb-20">
        <FadeIn>
          <div id="main-content" className="cc-container mx-auto max-w-4xl px-6 text-center">
            <h1 className="cc-display-xl">
              {t('about-hero-title')}{' '}
              <span className="text-[var(--cc-link)]">{t('about-hero-title-highlight')}</span>
              {', '}{t('about-hero-by')}
            </h1>
            <p
              className="mt-6 cc-body-lg text-[var(--cc-body)] max-w-2xl mx-auto"
              dangerouslySetInnerHTML={{ __html: t('about-hero-subtitle') }}
            />
          </div>
        </FadeIn>
      </section>

      {/* Principles */}
      <section className="pb-20 sm:pb-28">
        <div className="cc-container mx-auto max-w-7xl px-6">
          <FadeIn>
            <h2 className="cc-display-md text-center mb-12">{t('about-principles-title')}</h2>
          </FadeIn>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              { iconKey: 'about-p1-icon', titleKey: 'about-p1-title', descKey: 'about-p1-desc' },
              { iconKey: 'about-p2-icon', titleKey: 'about-p2-title', descKey: 'about-p2-desc' },
              { iconKey: 'about-p3-icon', titleKey: 'about-p3-title', descKey: 'about-p3-desc' },
              { iconKey: 'about-p4-icon', titleKey: 'about-p4-title', descKey: 'about-p4-desc' },
            ].map((p, i) => (
              <FadeIn key={p.titleKey} delay={i * 100} direction="up" duration={600}>
                <article className="cc-card h-full">
                  <div className="text-2xl mb-3" role="img" aria-label={t(p.titleKey)}>
                    {t(p.iconKey)}
                  </div>
                  <h3 className="cc-display-sm mb-2">{t(p.titleKey)}</h3>
                  <p className="cc-body-sm text-[var(--cc-body)]">{t(p.descKey)}</p>
                </article>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="border-t border-[var(--cc-hairline)] py-20 sm:py-28">
        <div className="cc-container mx-auto max-w-3xl px-6">
          <FadeIn>
            <h2 className="cc-display-md text-center mb-12">{t('about-timeline-title')}</h2>
          </FadeIn>
          <div className="space-y-0">
            {timelineData.map((item, i) => (
              <FadeIn key={item.date} delay={i * 80}>
                <div className="flex gap-6 pb-8 last:pb-0">
                  <div className="flex flex-col items-center">
                    <div
                      className="h-3 w-3 rounded-full bg-[var(--cc-link)]"
                      style={{ boxShadow: '0 0 0 4px var(--cc-link-bg-soft)' }}
                    />
                    {i < timelineData.length - 1 && (
                      <div className="mt-1 w-px flex-1 bg-[var(--cc-hairline)]" />
                    )}
                  </div>
                  <div>
                    <span className="cc-caption-mono text-[var(--cc-link)]">{item.date}</span>
                    <h3 className="cc-body-md-strong mt-1">{item.event}</h3>
                    <p className="cc-body-sm mt-1 text-[var(--cc-body)]">{item.detail}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-t border-[var(--cc-hairline)] py-16 sm:py-20">
        <div className="cc-container mx-auto max-w-5xl px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '52+', labelKey: 'about-stat-packages-label' },
              { value: '16', labelKey: 'about-stat-chains-label' },
              { value: 'MIT', labelKey: 'about-stat-license-label' },
              { value: '0', labelKey: 'about-stat-lockin-label' },
            ].map((stat, i) => (
              <FadeIn key={stat.labelKey} delay={i * 100}>
                <div>
                  <div className="cc-display-lg text-[var(--cc-link)]">
                    <AnimatedNumber value={stat.value} />
                  </div>
                  <div className="mt-1 cc-caption text-[var(--cc-muted)]">{t(stat.labelKey)}</div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </>
  )
}
