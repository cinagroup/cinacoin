'use client'

import FadeIn from '@/components/FadeIn'
import AnimatedNumber from '@/components/AnimatedNumber'
import { useI18n } from '@/providers/I18nProvider'

export default function Stats() {
  const { t } = useI18n()
  const stats = [
    { value: '16', labelKey: 's1-label' },
    { value: '52', labelKey: 's2-label' },
    { value: '5', labelKey: 's3-label' },
    { value: '100%', labelKey: 's4-label' },
  ]

  return (
    <section
      className="relative bg-[var(--cc-canvas-soft)] py-24 sm:py-32"
      aria-labelledby="stats-heading"
    >
      <FadeIn direction="none" duration={800}>
        <div
          className="mx-auto mb-16 h-px w-full max-w-7xl bg-gradient-to-r from-transparent via-[var(--cc-hairline-strong)] to-transparent"
        />
      </FadeIn>

      <h2 id="stats-heading" className="sr-only">
        Key Metrics
      </h2>

      <div className="cc-container grid grid-cols-2 gap-6 sm:gap-8 md:grid-cols-4">
        {stats.map((stat, i) => (
          <FadeIn key={i} delay={i * 150} direction="up" duration={700}>
            <div className="text-center">
              <div className="cc-display-lg text-[var(--cc-ink)]" role="status" aria-live="polite">
                <AnimatedNumber value={stat.value} duration={2000} />
              </div>
              <div className="mt-2 cc-body-sm text-[var(--cc-muted)]">{t(stat.labelKey)}</div>
            </div>
          </FadeIn>
        ))}
      </div>
    </section>
  )
}
