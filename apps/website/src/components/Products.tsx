'use client'

import FadeIn from '@/components/FadeIn'
import { useI18n } from '@/providers/I18nProvider'

const productIcons = [
  // AppKit — wallet
  <svg key="0" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12V7H5a2 2 0 010-4h14v4" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5v14a2 2 0 002 2h16v-5" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M18 12a2 2 0 100 4h4v-4h-4z" />
  </svg>,
  // Auth — lock
  <svg key="1" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 11V7a5 5 0 0110 0v4" />
  </svg>,
  // Relay — link
  <svg key="2" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.678 4.422-6.3 2.5-.87 5.122.368 5.122 2.3 0 1.657-1 3.333-1.5 4" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.5 9.5A2.5 2.5 0 0118 12c0 1.38.5 2 1 3 1.072 2.143.224 4.678-4.422 6.3-2.5.87-5.122-.368-5.122-2.3 0-1.657 1-3.333 1.5-4" />
  </svg>,
  // Push — bell
  <svg key="3" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.73 21a2 2 0 01-3.46 0" />
  </svg>,
  // Keys — key
  <svg key="4" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a4 4 0 11-8 0 4 4 0 018 0zM21 21l-3.3-3.3M18.7 18.7L17 17" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.4 13.6L3 17l2 2 3.4-3.4" />
  </svg>,
  // RPC Proxy — server
  <svg key="5" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="2" width="20" height="8" rx="2" />
    <rect x="2" y="14" width="20" height="8" rx="2" />
    <circle cx="6" cy="6" r="1" fill="currentColor" />
    <circle cx="6" cy="18" r="1" fill="currentColor" />
  </svg>,
]

export default function Products() {
  const { t } = useI18n()

  const products = [
    {
      name: t('nav-products'),
      descKey: 'products-appkit-desc',
      href: '/docs/api/appkit',
      iconColor: 'var(--cc-link)',
      iconIndex: 0,
    },
    {
      name: 'Auth',
      descKey: 'products-auth-desc',
      href: '/docs/api/auth',
      iconColor: 'var(--cc-violet)',
      iconIndex: 1,
    },
    {
      name: 'Relay',
      descKey: 'relay-desc',
      href: '/docs/api/relay',
      iconColor: 'var(--cc-warning)',
      iconIndex: 2,
    },
    {
      name: 'Push',
      descKey: 'products-push-desc',
      href: '/docs/api/push',
      iconColor: 'var(--cc-cyan)',
      iconIndex: 3,
    },
    {
      name: 'Keys',
      descKey: 'products-keys-desc',
      href: '/docs/api/keys',
      iconColor: 'var(--cc-warning-deep)',
      iconIndex: 4,
    },
    {
      name: 'RPC Proxy',
      descKey: 'rpc-desc',
      href: '/docs/api/rpc',
      iconColor: 'var(--cc-link)',
      iconIndex: 5,
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
                      {productIcons[p.iconIndex]}
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
