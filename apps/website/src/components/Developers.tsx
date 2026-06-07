'use client'

import FadeIn from '@/components/FadeIn'
import { useI18n } from '@/providers/I18nProvider'

export default function Developers() {
  const { t } = useI18n()

  const points = ['d1', 'd2', 'd3', 'd4']

  return (
    <section
      id="developers"
      className="relative bg-[var(--cc-canvas)] py-24 sm:py-32"
      aria-labelledby="developers-heading"
    >
      <div className="cc-container">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Left: Text */}
          <FadeIn direction="right" duration={800}>
            <div>
              <p className="cc-caption-mono text-[var(--cc-muted)] mb-3">{t('dev-label')}</p>
              <h2 id="developers-heading" className="cc-display-lg text-[var(--cc-ink)]">
                {t('dev-title')}
              </h2>
              <p className="mt-4 cc-body-lg text-[var(--cc-body)]">{t('dev-subtitle')}</p>

              <div className="mt-8 space-y-4">
                {points.map((key, i) => (
                  <FadeIn key={i} delay={200 + i * 100} direction="right" duration={500}>
                    <div className="flex items-start gap-3">
                      <span
                        className="mt-1"
                        style={{ color: 'var(--cc-cyan)' }}
                        aria-hidden="true"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      </span>
                      <span className="cc-body-sm text-[var(--cc-body)]">{t(key)}</span>
                    </div>
                  </FadeIn>
                ))}
              </div>

              <FadeIn delay={600}>
                <div className="mt-8 flex gap-4">
                  <a href="/docs/" className="cc-btn-primary">
                    {t('dev-docs')}
                  </a>
                  <a href="https://github.com/cinagroup/cinacoin" className="cc-btn-secondary">
                    {t('nav-github')}
                  </a>
                </div>
              </FadeIn>
            </div>
          </FadeIn>

          {/* Right: Code preview */}
          <FadeIn direction="left" duration={800}>
            <div className="cc-code-block">
              <div
                className="flex items-center gap-2 pb-3 mb-3"
                style={{ borderBottom: '1px solid var(--cc-hairline-strong)' }}
              >
                {['#ff5f57', '#febc2e', '#28c840'].map((color, dot) => (
                  <div
                    key={dot}
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                ))}
                <span
                  className="ml-2 text-[12px] font-mono"
                  style={{ color: 'var(--cc-muted)' }}
                >
                  example.tsx
                </span>
              </div>
              <pre className="font-mono text-sm leading-relaxed">
                <code>
                  <span style={{ color: 'var(--cc-violet)' }}>import</span>{' '}
                  <span style={{ color: 'var(--cc-cyan)' }}>{'{ useCinacoin, ConnectButton }'}</span>{' '}
                  <span style={{ color: 'var(--cc-violet)' }}>from</span>{' '}
                  <span style={{ color: 'var(--cc-highlight-pink)' }}>&apos;@cinacoin/react&apos;</span>
                  {'\n\n'}
                  <span style={{ color: 'var(--cc-violet)' }}>function</span>{' '}
                  <span style={{ color: 'var(--cc-highlight-pink)' }}>MyApp</span>
                  <span style={{ color: 'var(--cc-muted)' }}>() {'{'}</span>
                  {'\n'}
                  {'  '}<span style={{ color: 'var(--cc-violet)' }}>const</span>{' '}
                  <span style={{ color: 'var(--cc-muted)' }}>{'{'}</span>
                  <span style={{ color: 'var(--cc-cyan)' }}> address</span>
                  <span style={{ color: 'var(--cc-muted)' }}>,</span>{' '}
                  <span style={{ color: 'var(--cc-cyan)' }}> isConnected</span>
                  <span style={{ color: 'var(--cc-muted)' }}>,</span>{' '}
                  <span style={{ color: 'var(--cc-cyan)' }}> chain</span>
                  <span style={{ color: 'var(--cc-muted)' }}> {'}'} =</span>{' '}
                  <span style={{ color: 'var(--cc-highlight-pink)' }}>useCinacoin</span>
                  <span style={{ color: 'var(--cc-muted)' }}>()</span>
                  {'\n\n'}
                  {'  '}<span style={{ color: 'var(--cc-violet)' }}>return</span>{' '}
                  <span style={{ color: 'var(--cc-muted)' }}>(</span>
                  {'\n'}
                  {'    '}<span style={{ color: 'var(--cc-muted)' }}>{'<'}</span>
                  <span style={{ color: 'var(--cc-highlight-pink)' }}>div</span>
                  <span style={{ color: 'var(--cc-muted)' }}>{'>'}</span>
                  {'\n'}
                  {'      '}<span style={{ color: 'var(--cc-muted)' }}>{'<'}</span>
                  <span style={{ color: 'var(--cc-highlight-pink)' }}>ConnectButton</span>{' '}
                  <span style={{ color: 'var(--cc-muted)' }}>{'/>'}</span>
                  {'\n'}
                  {'      '}<span style={{ color: 'var(--cc-muted)' }}>{'{'}</span>
                  <span style={{ color: 'var(--cc-cyan)' }}>isConnected</span>
                  <span style={{ color: 'var(--cc-muted)' }}>{' ?'}</span>{' '}
                  <span style={{ color: 'var(--cc-highlight-pink)' }}>{`Connected: \${address}`}</span>
                  <span style={{ color: 'var(--cc-muted)' }}>{' :'}</span>{' '}
                  <span style={{ color: 'var(--cc-highlight-pink)' }}>&apos;Not connected&apos;</span>
                  <span style={{ color: 'var(--cc-muted)' }}>{'}'}</span>
                  {'\n'}
                  {'    '}<span style={{ color: 'var(--cc-muted)' }}>{'<'}/</span>
                  <span style={{ color: 'var(--cc-highlight-pink)' }}>div</span>
                  <span style={{ color: 'var(--cc-muted)' }}>{'>'}</span>
                  {'\n'}
                  {'  '}<span style={{ color: 'var(--cc-muted)' }}>)</span>
                  {'\n'}
                  <span style={{ color: 'var(--cc-muted)' }}>{'}'}</span>
                </code>
              </pre>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  )
}
