'use client'

import FadeIn from '@/components/FadeIn'
import { useI18n } from '@/providers/I18nProvider'

export default function Products() {
  const { t } = useI18n()

  const products = [
    {
      name: t('nav-products'),
      descKey: 'f1-desc',
      href: '/docs/api/appkit',
      iconColor: 'var(--cc-link)',
    },
    {
      name: 'Auth',
      descKey: 'f3-desc',
      href: '/docs/api/auth',
      iconColor: 'var(--cc-violet)',
    },
    {
      name: 'Relay',
      descKey: 'relay-desc',
      href: '/docs/api/relay',
      iconColor: 'var(--cc-warning)',
    },
    {
      name: 'Push',
      descKey: 'f4-desc',
      href: '/docs/api/push',
      iconColor: 'var(--cc-cyan)',
    },
    {
      name: 'Keys',
      descKey: 'keys-desc',
      href: '/docs/api/keys',
      iconColor: 'var(--cc-warning-deep)',
    },
    {
      name: 'RPC Proxy',
      descKey: 'rpc-desc',
      href: '/docs/api/rpc',
      iconColor: 'var(--cc-link)',
    },
  ]

  return (
    <section
      id="products"
      className="relative bg-[var(--cc-canvas-soft-2)] py-24 sm:py-32"
      aria-labelledby="products-heading"
    >
      <div className="cc-container">
        <FadeIn>
          <div className="mx-auto mb-16 max-w-3xl text-center">
            <p className="cc-caption-mono text-[var(--cc-muted)] mb-3">{t('products-label')}</p>
            <h2 id="products-heading" className="cc-display-lg text-[var(--cc-ink)]">
              {t('products-title')}
            </h2>
            <p className="mt-4 cc-body-lg text-[var(--cc-body)]">{t('products-subtitle')}</p>
          </div>
        </FadeIn>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {products.map((p, i) => (
            <FadeIn key={p.name} delay={i * 100} direction="up" duration={600}>
              <a
                href={p.href}
                className="group cc-card block no-underline transition-shadow hover:shadow-[var(--cc-level3)]"
              >
                <div className="relative">
                  <div className="mb-4 flex items-center gap-2">
                    <div
                      className="h-8 w-8 rounded-md flex items-center justify-center transition-transform duration-200 group-hover:scale-110"
                      style={{ backgroundColor: 'var(--cc-canvas-soft-2)', color: p.iconColor }}
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <h3 className="cc-display-sm text-[var(--cc-ink)]">{p.name}</h3>
                  </div>
                  <p className="cc-body-sm text-[var(--cc-body)]">{t(p.descKey)}</p>
                  <div className="mt-4 cc-body-sm text-[var(--cc-link)] transition-colors group-hover:text-[var(--cc-link-deep)]">
                    {t('learn-more')}
                  </div>
                </div>
              </a>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}
