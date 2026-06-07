'use client'

import FadeIn from '@/components/FadeIn'
import { useI18n } from '@/providers/I18nProvider'

function Section({ titleId, contentId }: { titleId: string; contentId: string }) {
  const { t } = useI18n()
  return (
    <div className="mb-12">
      <h2 className="cc-display-sm text-[var(--cc-ink)] mb-4">{t(titleId)}</h2>
      <div
        className="cc-body-md text-[var(--cc-body)]"
        dangerouslySetInnerHTML={{ __html: t(contentId) }}
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
      <p className="cc-body-md text-[var(--cc-body)] mb-4" dangerouslySetInnerHTML={{ __html: t(paragraphId) }} />
      <ul className="cc-body-md text-[var(--cc-body)] list-disc pl-6 space-y-2">
        {listItems.map((key) => (
          <li key={key} dangerouslySetInnerHTML={{ __html: t(key) }} />
        ))}
      </ul>
    </div>
  )
}

export default function PrivacyContent() {
  const { t } = useI18n()

  return (
    <>
      {/* Hero */}
      <section className="relative pt-32 pb-16 sm:pt-40 sm:pb-20">
        <FadeIn>
          <div id="main-content" className="mx-auto max-w-3xl px-6">
            <h1 className="cc-display-xl text-[var(--cc-ink)]">
              {t('privacy-title')}
            </h1>
            <p className="mt-4 cc-body-lg text-[var(--cc-muted)]">
              {t('privacy-updated')}
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
            <Section titleId="privacy-s1-title" contentId="privacy-s1-p" />

            <SectionWithList
              titleId="privacy-s2-title"
              paragraphId="privacy-s2-p"
              listItems={['privacy-s2-l1', 'privacy-s2-l2', 'privacy-s2-l3', 'privacy-s2-l4']}
            />

            <SectionWithList
              titleId="privacy-s3-title"
              paragraphId="privacy-s3-p"
              listItems={['privacy-s3-l1', 'privacy-s3-l2', 'privacy-s3-l3', 'privacy-s3-l4', 'privacy-s3-l5']}
            />

            <Section titleId="privacy-s4-title" contentId="privacy-s4-p" />

            <SectionWithList
              titleId="privacy-s5-title"
              paragraphId="privacy-s5-p"
              listItems={['privacy-s5-l1', 'privacy-s5-l2', 'privacy-s5-l3', 'privacy-s5-l4']}
            />

            <Section titleId="privacy-s6-title" contentId="privacy-s6-p" />

            <Section titleId="privacy-s7-title" contentId="privacy-s7-p" />

            <SectionWithList
              titleId="privacy-s8-title"
              paragraphId="privacy-s8-p"
              listItems={['privacy-s8-l1', 'privacy-s8-l2', 'privacy-s8-l3', 'privacy-s8-l4', 'privacy-s8-l5']}
            />

            <Section titleId="privacy-s9-title" contentId="privacy-s9-p" />

            <Section titleId="privacy-s10-title" contentId="privacy-s10-p" />

            <Section titleId="privacy-s11-title" contentId="privacy-s11-p" />

            <Section titleId="privacy-s12-title" contentId="privacy-s12-p" />

            <Section titleId="privacy-s13-title" contentId="privacy-s13-p" />
          </div>
        </FadeIn>
      </section>
    </>
  )
}
