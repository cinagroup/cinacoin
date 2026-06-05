'use client'

import FadeIn from '@/components/FadeIn'
import { useI18n } from '@/providers/I18nProvider'

export default function Hero() {
  const { t } = useI18n()

  return (
    <section className="relative flex flex-col items-center justify-center overflow-hidden px-6 pt-32 pb-24 md:pt-40 md:pb-32">
      {/* Mesh gradient backdrop */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] cc-mesh-gradient-strong" />
      </div>

      {/* Announcement badge */}
      <FadeIn delay={100}>
        <a
          href="https://docs.cinacoin.com"
          className="cc-badge inline-flex items-center gap-2 rounded-full px-4 py-2 no-underline transition-colors hover:text-[var(--cc-ink)]"
        >
          <span
            className="inline-block h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: 'var(--cc-success)' }}
            aria-hidden="true"
          />
          <span>{t('hero-badge')}</span>
          <span aria-hidden="true" className="ml-1">→</span>
        </a>
      </FadeIn>

      {/* Headline */}
      <FadeIn delay={200}>
        <h1 className="relative mt-8 max-w-3xl text-center cc-display-xl text-[var(--cc-ink)]">
          {t('hero-title')}
        </h1>
      </FadeIn>

      {/* Subheadline */}
      <FadeIn delay={350}>
        <p className="relative mt-6 max-w-xl text-center cc-body-lg text-[var(--cc-body)]">
          {t('hero-subtitle')}
        </p>
      </FadeIn>

      {/* CTAs */}
      <FadeIn delay={500}>
        <div className="relative mt-10 flex flex-col gap-3 sm:flex-row">
          <a href="https://docs.cinacoin.com" className="cc-btn-primary">
            {t('hero-start')}
          </a>
          <a href="https://github.com/cinagroup/cinacoin" className="cc-btn-secondary">
            {t('hero-github')}
          </a>
        </div>
      </FadeIn>

      {/* Code snippet */}
      <FadeIn delay={700}>
        <div className="relative mt-16 w-full max-w-lg">
          <div className="cc-code-block">
            <pre>
              <code>
                <span style={{ color: 'var(--cc-violet)' }}>import</span>{' '}
                <span style={{ color: 'var(--cc-cyan)' }}>{'{ CinacoinProvider }'}</span>{' '}
                <span style={{ color: 'var(--cc-violet)' }}>from</span>{' '}
                <span style={{ color: 'var(--cc-highlight-pink)' }}>&apos;@cinacoin/react&apos;</span>
                {'\n\n'}
                <span style={{ color: 'var(--cc-muted)' }}>{'<'}</span>
                <span style={{ color: 'var(--cc-highlight-pink)' }}>CinacoinProvider</span>
                {'\n'}
                {'  '}<span style={{ color: 'var(--cc-cyan)' }}>projectId</span>{' '}
                <span style={{ color: 'var(--cc-muted)' }}>=</span>{' '}
                <span style={{ color: 'var(--cc-highlight-pink)' }}>&quot;your-project-id&quot;</span>
                {'\n'}
                {'  '}<span style={{ color: 'var(--cc-cyan)' }}>theme</span>{' '}
                <span style={{ color: 'var(--cc-muted)' }}>=</span>{' '}
                <span style={{ color: 'var(--cc-highlight-pink)' }}>&quot;dark&quot;</span>
                {'\n'}
                <span style={{ color: 'var(--cc-muted)' }}>{'>'}</span>
                {'\n'}
                {'  '}<span style={{ color: 'var(--cc-muted)' }}>{'<'}</span>
                <span style={{ color: 'var(--cc-highlight-pink)' }}>App</span>{' '}
                <span style={{ color: 'var(--cc-muted)' }}>{'/>'}</span>
                {'\n'}
                <span style={{ color: 'var(--cc-muted)' }}>{'</'}</span>
                <span style={{ color: 'var(--cc-highlight-pink)' }}>CinacoinProvider</span>
                <span style={{ color: 'var(--cc-muted)' }}>{'>'}</span>
              </code>
            </pre>
          </div>
        </div>
      </FadeIn>
    </section>
  )
}
