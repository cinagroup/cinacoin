'use client'

import FadeIn from '@/components/FadeIn'
import { useI18n } from '@/providers/I18nProvider'

export default function Features() {
  const { t } = useI18n()

  const featureKeys = [
    { icon: '🔗', titleKey: 'f1-title', descKey: 'f1-desc' },
    { icon: '🌐', titleKey: 'f2-title', descKey: 'f2-desc' },
    { icon: '🔐', titleKey: 'f3-title', descKey: 'f3-desc' },
    { icon: '🔔', titleKey: 'f4-title', descKey: 'f4-desc' },
    { icon: '⚡', titleKey: 'f5-title', descKey: 'f5-desc' },
    { icon: '🛡️', titleKey: 'f6-title', descKey: 'f6-desc' },
  ]

  return (
    <section id="features" className="relative bg-[var(--cc-canvas)] py-24 sm:py-32" aria-labelledby="features-heading">
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
                <div className="mb-4 text-2xl">{f.icon}</div>
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
