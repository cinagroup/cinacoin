'use client'

import FadeIn from '@/components/FadeIn'
import { useI18n } from '@/providers/I18nProvider'
import { sanitizeHtml } from '@/lib/sanitize'

function Section({ titleId, contentId, disclaimer }: { titleId: string; contentId: string; disclaimer?: boolean }) {
  const { t } = useI18n()
  return (
    <div className="mb-12">
      <h2 className="cc-display-sm text-[var(--cc-ink)] mb-4">{t(titleId)}</h2>
      <div
        className={`cc-body-md ${disclaimer ? 'text-[var(--cc-muted)] italic' : 'text-[var(--cc-body)]'}`}
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(t(contentId)) }}
      />
    </div>
  )
}

function SectionWithList({
  titleId,
  paragraphId,
  listItems,
}: {
  titleId: string
  paragraphId: string
  listItems: string[]
}) {
  const { t } = useI18n()
  return (
    <div className="mb-12">
      <h2 className="cc-display-sm text-[var(--cc-ink)] mb-4">{t(titleId)}</h2>
      <p className="cc-body-md text-[var(--cc-body)] mb-4" dangerouslySetInnerHTML={{ __html: sanitizeHtml(t(paragraphId)) }} />
      <ul className="cc-body-md text-[var(--cc-body)] list-disc pl-6 space-y-2">
        {listItems.map((key) => (
          <li key={key}>{t(key)}</li>
        ))}
      </ul>
    </div>
  )
}

export default function TermsContent() {
  const { t } = useI18n()

  return (
    <>
      {/* Hero */}
      <section className="relative pt-32 pb-16 sm:pt-40 sm:pb-20">
        <FadeIn>
          <div id="main-content" className="mx-auto max-w-3xl px-6">
            <h1 className="cc-display-xl text-[var(--cc-ink)]">
              {t('terms-title')}
            </h1>
            <p className="mt-4 cc-body-lg text-[var(--cc-muted)]">
              {t('terms-updated')}
            </p>
          </div>
        </FadeIn>
      </section>

      {/* Divider */}
      <div className="mx-auto max-w-3xl px-6">
        <div className="h-px w-full bg-[var(--cc-hairline-strong)]" />
      </div>

      {/* Content */}
      <section className="pb-32">
        <FadeIn>
          <div className="mx-auto max-w-3xl px-6 pt-16">
            <Section titleId="terms-s1-title" contentId="terms-s1-p" />

            <SectionWithList
              titleId="terms-s2-title"
              paragraphId="terms-s2-p"
              listItems={['terms-s2-l1', 'terms-s2-l2', 'terms-s2-l3', 'terms-s2-l4', 'terms-s2-l5']}
            />

            <Section titleId="terms-s3-title" contentId="terms-s3-p" />

            <SectionWithList
              titleId="terms-s4-title"
              paragraphId="terms-s4-p"
              listItems={['terms-s4-l1', 'terms-s4-l2', 'terms-s4-l3', 'terms-s4-l4', 'terms-s4-l5', 'terms-s4-l6']}
            />

            <Section titleId="terms-s5-title" contentId="terms-s5-p" />

            <Section titleId="terms-s6-title" contentId="terms-s6-p" />

            <Section titleId="terms-s7-title" contentId="terms-s7-p" disclaimer />

            <Section titleId="terms-s8-title" contentId="terms-s8-p" disclaimer />

            <Section titleId="terms-s9-title" contentId="terms-s9-p" />

            <Section titleId="terms-s10-title" contentId="terms-s10-p" />

            <Section titleId="terms-s11-title" contentId="terms-s11-p" />

            <Section titleId="terms-s12-title" contentId="terms-s12-p" />

            <Section titleId="terms-s13-title" contentId="terms-s13-p" />

            <Section titleId="terms-s14-title" contentId="terms-s14-p" />
          </div>
        </FadeIn>
      </section>
    </>
  )
}
