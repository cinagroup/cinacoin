'use client'

import FadeIn from '@/components/FadeIn'
import { useI18n } from '@/providers/I18nProvider'

export default function CTA() {
  const { t } = useI18n()

  return (
    <section
      className="relative overflow-hidden bg-[var(--cc-primary)] py-24 sm:py-32"
      aria-labelledby="cta-heading"
    >
      {/* Mesh gradient */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] cc-mesh-gradient-strong opacity-[0.08]"
        />
      </div>

      <div className="relative cc-container text-center">
        <FadeIn>
          <h2 id="cta-heading" className="cc-display-lg text-[var(--cc-on-primary)]">
            {t('cta-title')}
          </h2>
        </FadeIn>
        <FadeIn delay={200}>
          <p className="mt-4 cc-body-lg text-[var(--cc-on-primary)] opacity-70">
            {t('cta-subtitle')}
          </p>
        </FadeIn>
        <FadeIn delay={400}>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href="https://docs.cinacoin.com"
              className="cc-btn-primary bg-[var(--cc-on-primary)] text-[var(--cc-primary)]"
              target="_blank" rel="noopener noreferrer"
            >
              {t('cta-start')}
            </a>
            <a
              href="https://github.com/cinagroup/cinacoin"
              className="cc-btn-secondary no-underline bg-transparent text-[var(--cc-on-primary)] border-[rgba(255,255,255,0.4)]"
            >
              {t('cta-github')}
            </a>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
