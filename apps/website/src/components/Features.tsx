'use client'

import FadeIn from '@/components/FadeIn'
import { useI18n } from '@/providers/I18nProvider'

const featureIcons = [
  // 🔗 Universal Wallet
  <svg key="0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
    <path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-6.054 4.422-7.678C19.422-.678 22 1 22 4.5c0 1.657-1 3.333-1.5 4" />
    <path d="M15.5 9.5A2.5 2.5 0 0118 12c0 1.38.5 2 1 3 1.072 2.143.224 6.054-4.422 7.678C9.578 24.678 7 23 7 19.5c0-1.657 1-3.333 1.5-4" />
  </svg>,
  // 🌐 Chain Abstraction
  <svg key="1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
    <circle cx="12" cy="12" r="10" />
    <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
  </svg>,
  // 🔐 Secure
  <svg key="2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0110 0v4" />
  </svg>,
  // 🔔 Push Notifications
  <svg key="3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 01-3.46 0" />
  </svg>,
  // ⚡ Fast
  <svg key="4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>,
  // 🛡️ Shield
  <svg key="5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="M12 8v4M12 16h.01" />
  </svg>,
]

export default function Features() {
  const { t } = useI18n()

  const featureKeys = [
    { titleKey: 'f1-title', descKey: 'f1-desc', icon: 0 },
    { titleKey: 'f2-title', descKey: 'f2-desc', icon: 1 },
    { titleKey: 'f3-title', descKey: 'f3-desc', icon: 2 },
    { titleKey: 'f4-title', descKey: 'f4-desc', icon: 3 },
    { titleKey: 'f5-title', descKey: 'f5-desc', icon: 4 },
    { titleKey: 'f6-title', descKey: 'f6-desc', icon: 5 },
  ]

  return (
    <section id="features" className="relative bg-[var(--cc-canvas)] py-24 sm:py-32 lg:py-40" aria-labelledby="features-heading">
      <div className="cc-container">
        <FadeIn>
          <div className="mb-16 max-w-3xl">
            <p className="cc-caption-mono text-[var(--cc-muted)] mb-3">{t('features-label')}</p>
            <h2 id="features-heading" className="cc-display-lg text-[var(--cc-ink)]">
              {t('features-title')}
            </h2>
            <p className="mt-4 cc-body-lg text-[var(--cc-body)]">
              {t('features-subtitle')}
            </p>
          </div>
        </FadeIn>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {featureKeys.map((f, i) => (
            <FadeIn key={i} delay={i * 100} direction="up" duration={600}>
              <article className="cc-card">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-[var(--cc-canvas-soft-2)] text-[var(--cc-ink)]" aria-hidden="true">
                  {featureIcons[f.icon]}
                </div>
                <h3 className="cc-display-sm text-[var(--cc-ink)]">{t(f.titleKey)}</h3>
                <p className="mt-2 cc-body-sm text-[var(--cc-body)]">{t(f.descKey)}</p>
              </article>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}
