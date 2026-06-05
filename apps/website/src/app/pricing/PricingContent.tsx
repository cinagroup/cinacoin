'use client'

import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import FadeIn from '@/components/FadeIn'
import { useI18n } from '@/providers/I18nProvider'

const tiers = [
  {
    nameKey: 'pricing-tier-free',
    price: '$0',
    periodKey: 'pricing-tier-free-period',
    descKey: 'pricing-tier-free-desc',
    features: [
      '10,000 API calls/month',
      '2 projects',
      'Core SDK access',
      'Community support',
      'Basic analytics',
    ],
    ctaKey: 'pricing-tier-free-cta',
    href: 'https://dash.cinacoin.com',
    popular: false,
  },
  {
    nameKey: 'pricing-tier-pro',
    price: '$49',
    periodKey: 'pricing-tier-pro-period',
    descKey: 'pricing-tier-pro-desc',
    features: [
      '1M API calls/month',
      'Unlimited projects',
      'All SDKs + framework adapters',
      'Priority email support',
      'Advanced analytics dashboard',
      'Custom domain support',
      'Webhook integrations',
    ],
    ctaKey: 'pricing-tier-pro-cta',
    href: 'https://dash.cinacoin.com',
    popular: true,
  },
  {
    nameKey: 'pricing-tier-enterprise',
    price: '',
    periodKey: '',
    descKey: 'pricing-tier-enterprise-desc',
    features: [
      'Unlimited API calls',
      'Dedicated infrastructure',
      '99.99% SLA guarantee',
      'Dedicated account manager',
      'Custom integrations',
      'SOC 2 compliance',
      'On-premise deployment option',
      '24/7 phone support',
    ],
    ctaKey: 'pricing-tier-enterprise-cta',
    href: '/contact',
    popular: false,
  },
]

const faqData = [
  { qKey: 'pricing-faq1-q', aKey: 'pricing-faq1-a' },
  { qKey: 'pricing-faq2-q', aKey: 'pricing-faq2-a' },
  { qKey: 'pricing-faq3-q', aKey: 'pricing-faq3-a' },
  { qKey: 'pricing-faq4-q', aKey: 'pricing-faq4-a' },
  { qKey: 'pricing-faq5-q', aKey: 'pricing-faq5-a' },
]

export default function PricingContent() {
  const { t } = useI18n()

  return (
    <>
      <Navbar />

      {/* Hero */}
      <section className="relative pt-32 pb-16 sm:pt-40 sm:pb-20">
        <FadeIn>
          <div className="cc-container mx-auto max-w-4xl px-6 text-center">
            <h1 className="cc-display-xl">
              {t('pricing-hero-title')}{' '}
              <span className="text-[var(--cc-link)]">{t('pricing-hero-title-highlight')}</span>
            </h1>
            <p className="mt-6 cc-body-lg text-[var(--cc-body)] max-w-2xl mx-auto">
              {t('pricing-hero-subtitle')}
            </p>
          </div>
        </FadeIn>
      </section>

      {/* Pricing Tiers */}
      <section className="pb-20 sm:pb-32">
        <div className="cc-container mx-auto max-w-7xl px-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {tiers.map((tier, i) => (
              <FadeIn key={tier.nameKey} delay={i * 150} direction="up" duration={600}>
                {tier.popular ? (
                  <div className="cc-card-featured relative h-full">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="cc-badge" style={{ background: 'var(--cc-on-primary)', color: 'var(--cc-primary)' }}>
                        {t('pricing-tier-pro-badge')}
                      </span>
                    </div>

                    <h3 className="cc-display-sm">{t(tier.nameKey)}</h3>
                    <p className="mt-1 cc-body-sm" style={{ opacity: 0.8 }}>{t(tier.descKey)}</p>

                    <div className="mt-6 flex items-baseline gap-1">
                      <span className="cc-display-lg">{tier.price}</span>
                      {tier.periodKey && (
                        <span className="cc-body-sm" style={{ opacity: 0.7 }}>{t(tier.periodKey)}</span>
                      )}
                    </div>

                    <a
                      href={tier.href}
                      className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-[var(--cc-on-primary)] text-[var(--cc-primary)] px-6 py-3 cc-button-md transition-opacity hover:opacity-85"
                    >
                      {t(tier.ctaKey)}
                    </a>

                    <ul className="mt-8 space-y-3">
                      {tier.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-3 cc-body-sm" style={{ opacity: 0.85 }}>
                          <span className="mt-0.5" aria-hidden="true">✓</span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="cc-card h-full">
                    <h3 className="cc-display-sm">{t(tier.nameKey)}</h3>
                    <p className="mt-1 cc-body-sm text-[var(--cc-body)]">{t(tier.descKey)}</p>

                    <div className="mt-6 flex items-baseline gap-1">
                      {tier.price ? (
                        <>
                          <span className="cc-display-lg">{tier.price}</span>
                          <span className="cc-body-sm text-[var(--cc-muted)]">{t(tier.periodKey)}</span>
                        </>
                      ) : (
                        <span className="cc-display-lg">{t('pricing-tier-enterprise-price')}</span>
                      )}
                    </div>

                    <a
                      href={tier.href}
                      className="cc-btn-secondary mt-6 w-full"
                    >
                      {t(tier.ctaKey)}
                    </a>

                    <ul className="mt-8 space-y-3">
                      {tier.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-3 cc-body-sm text-[var(--cc-body)]">
                          <span className="mt-0.5 text-[var(--cc-success)]" aria-hidden="true">✓</span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-[var(--cc-hairline)] py-20 sm:py-28">
        <div className="cc-container mx-auto max-w-3xl px-6">
          <FadeIn>
            <h2 className="cc-display-md text-center mb-12">{t('pricing-faq-title')}</h2>
          </FadeIn>

          {faqData.map((faq, i) => (
            <FadeIn key={i} delay={i * 100}>
              <details className="group border-b border-[var(--cc-hairline)] py-6 last:border-b-0">
                <summary className="flex cursor-pointer items-center justify-between cc-body-md-strong transition-colors hover:text-[var(--cc-link)] focus:outline-none rounded">
                  {t(faq.qKey)}
                  <span
                    className="ml-4 text-[var(--cc-muted)] transition-transform group-open:rotate-45 text-xl"
                    aria-hidden="true"
                  >
                    +
                  </span>
                </summary>
                <p className="mt-3 cc-body-sm text-[var(--cc-body)] leading-relaxed">
                  {t(faq.aKey)}
                </p>
              </details>
            </FadeIn>
          ))}
        </div>
      </section>

      <Footer />
    </>
  )
}
