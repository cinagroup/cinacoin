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

function CookieCategory({
  catTitleId,
  catParaId,
  listItems,
}: {
  catTitleId: string
  catParaId: string
  listItems: string[]
}) {
  const { t } = useI18n()
  return (
    <div className="mb-8 ml-4 border-l-2 border-[var(--cc-hairline)] pl-4">
      <h3 className="cc-display-sm text-[var(--cc-ink)] mb-3">{t(catTitleId)}</h3>
      <p className="cc-body-md text-[var(--cc-body)] mb-3" dangerouslySetInnerHTML={{ __html: t(catParaId) }} />
      <ul className="cc-body-md text-[var(--cc-body)] list-disc pl-6 space-y-2">
        {listItems.map((key) => (
          <li key={key}>{t(key)}</li>
        ))}
      </ul>
    </div>
  )
}

export default function CookiesContent() {
  const { t } = useI18n()

  return (
    <>
      {/* Hero */}
      <section className="relative pt-32 pb-16 sm:pt-40 sm:pb-20">
        <FadeIn>
          <div id="main-content" className="mx-auto max-w-3xl px-6">
            <h1 className="cc-display-xl text-[var(--cc-ink)]">
              {t('cookies-title')}
            </h1>
            <p className="mt-4 cc-body-lg text-[var(--cc-muted)]">
              {t('cookies-updated')}
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
            <Section titleId="cookies-s1-title" contentId="cookies-s1-p" />

            <div className="mb-12">
              <h2 className="cc-display-sm text-[var(--cc-ink)] mb-4">{t('cookies-s2-title')}</h2>
              <p className="cc-body-md text-[var(--cc-body)] mb-8" dangerouslySetInnerHTML={{ __html: t('cookies-s2-p') }} />

              <CookieCategory
                catTitleId="cookies-s2-cat1"
                catParaId="cookies-s2-cat1-p"
                listItems={['cookies-s2-cat1-l1', 'cookies-s2-cat1-l2', 'cookies-s2-cat1-l3', 'cookies-s2-cat1-l4']}
              />
              <CookieCategory
                catTitleId="cookies-s2-cat2"
                catParaId="cookies-s2-cat2-p"
                listItems={['cookies-s2-cat2-l1', 'cookies-s2-cat2-l2', 'cookies-s2-cat2-l3']}
              />
              <CookieCategory
                catTitleId="cookies-s2-cat3"
                catParaId="cookies-s2-cat3-p"
                listItems={['cookies-s2-cat3-l1', 'cookies-s2-cat3-l2', 'cookies-s2-cat3-l3']}
              />
            </div>

            <SectionWithList
              titleId="cookies-s3-title"
              paragraphId="cookies-s3-p"
              listItems={['cookies-s3-l1', 'cookies-s3-l2', 'cookies-s3-l3']}
            />

            <Section titleId="cookies-s4-title" contentId="cookies-s4-p" />

            <div className="mb-12">
              <h2 className="cc-display-sm text-[var(--cc-ink)] mb-4">{t('cookies-s5-title')}</h2>
              <p className="cc-body-md text-[var(--cc-body)] mb-4" dangerouslySetInnerHTML={{ __html: t('cookies-s5-p') }} />
              <ul className="cc-body-md text-[var(--cc-body)] list-disc pl-6 space-y-2 mb-6">
                {['cookies-s5-l1', 'cookies-s5-l2', 'cookies-s5-l3', 'cookies-s5-l4'].map((key) => (
                  <li key={key}>{t(key)}</li>
                ))}
              </ul>
              <p className="cc-body-md text-[var(--cc-body)]" dangerouslySetInnerHTML={{ __html: t('cookies-s5-p2') }} />
            </div>

            <div className="mb-12">
              <h2 className="cc-display-sm text-[var(--cc-ink)] mb-4">{t('cookies-s6-title')}</h2>
              <p className="cc-body-md text-[var(--cc-body)] mb-4" dangerouslySetInnerHTML={{ __html: t('cookies-s6-p') }} />
              <ul className="cc-body-md text-[var(--cc-body)] list-disc pl-6 space-y-2">
                {['cookies-s6-l1', 'cookies-s6-l2'].map((key) => (
                  <li key={key} dangerouslySetInnerHTML={{ __html: t(key) }} />
                ))}
              </ul>
            </div>

            <Section titleId="cookies-s7-title" contentId="cookies-s7-p" />

            <Section titleId="cookies-s8-title" contentId="cookies-s8-p" />
          </div>
        </FadeIn>
      </section>
    </>
  )
}
