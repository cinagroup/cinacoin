'use client'

import { useState } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import FadeIn from '@/components/FadeIn'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { useI18n } from '@/providers/I18nProvider'

type FormStatus = 'idle' | 'submitting' | 'success' | 'error'

export default function ContactContent() {
  const { t } = useI18n()
  const [status, setStatus] = useState<FormStatus>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('submitting')
    setErrorMsg('')

    const form = e.currentTarget
    const data = Object.fromEntries(new FormData(form)) as Record<string, string>

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Submission failed' }))
        throw new Error(err.error || `HTTP ${res.status}`)
      }

      setStatus('success')
      form.reset()
    } catch (err: any) {
      setStatus('error')
      setErrorMsg(err.message || 'Something went wrong')
    }
  }

  return (
    <>
      <Navbar />
      <Breadcrumbs />

      {/* Hero */}
      <section className="relative pt-32 pb-16 sm:pt-40 sm:pb-20">
        <FadeIn>
          <div id="main-content" className="cc-container text-center">
            <h1 className="cc-display-xl">{t('contact-title')}</h1>
            <p className="cc-body-lg text-[var(--cc-body)] mt-6 max-w-xl mx-auto">
              {t('contact-subtitle')}
            </p>
          </div>
        </FadeIn>
      </section>

      {/* Form + Info */}
      <section className="pb-20 sm:pb-32">
        <div className="cc-container">
          <div className="grid gap-8 md:grid-cols-2">
            {/* Contact Form */}
            <FadeIn direction="right" duration={600}>
              <div className="cc-card">
                <h2 className="cc-display-sm mb-6">{t('contact-title')}</h2>
                <form className="space-y-5" onSubmit={handleSubmit}>
                  {/* Success / Error feedback */}
                  {status === 'success' && (
                    <div className="rounded-lg border border-[var(--cc-success)]/30 bg-[var(--cc-success)]/10 px-4 py-3 cc-body-sm text-[var(--cc-success)]" role="status">
                      ✓ {t('contact-form-success') || 'Message sent successfully!'}
                    </div>
                  )}
                  {status === 'error' && (
                    <div className="rounded-lg border border-[var(--cc-error)]/30 bg-[var(--cc-error)]/10 px-4 py-3 cc-body-sm text-[var(--cc-error)]" role="alert">
                      ✗ {errorMsg}
                    </div>
                  )}
                  {/* Name */}
                  <div>
                    <label htmlFor="name" className="cc-body-sm-strong block mb-2">
                      {t('contact-form-name')}
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required
                      autoComplete="name"
                      className="cc-form-input"
                      placeholder={t('contact-form-name-placeholder')}
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="email" className="cc-body-sm-strong block mb-2">
                      {t('contact-form-email')}
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      autoComplete="email"
                      className="cc-form-input"
                      placeholder={t('contact-form-email-placeholder')}
                    />
                  </div>

                  {/* Subject */}
                  <div>
                    <label htmlFor="subject" className="cc-body-sm-strong block mb-2">
                      {t('contact-form-subject')}
                    </label>
                    <select
                      id="subject"
                      name="subject"
                      className="cc-form-input"
                      defaultValue=""
                      aria-describedby="subject-help"
                    >
                      <option value="" disabled>{t('contact-form-subject-placeholder')}</option>
                      <option value="sales">{t('contact-form-subject-sales')}</option>
                      <option value="support">{t('contact-form-subject-support')}</option>
                      <option value="partnership">{t('contact-form-subject-partnership')}</option>
                      <option value="other">{t('contact-form-subject-other')}</option>
                    </select>
                    <span id="subject-help" className="sr-only">Select a topic for your message</span>
                  </div>

                  {/* Message */}
                  <div>
                    <label htmlFor="message" className="cc-body-sm-strong block mb-2">
                      {t('contact-form-message')}
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows={5}
                      required
                      className="cc-form-input"
                      placeholder={t('contact-form-message-placeholder')}
                    />
                  </div>

                  {/* Submit */}
                  <button type="submit" className="cc-btn-primary w-full" disabled={status === 'submitting'}>
                    {status === 'submitting' ? '…' : t('contact-form-submit')}
                  </button>
                </form>
              </div>
            </FadeIn>

            {/* Contact Info */}
            <FadeIn direction="left" duration={600}>
              <div className="space-y-8">
                {/* Direct Contact */}
                <div className="cc-card">
                  <h3 className="cc-display-sm mb-5">{t('contact-info-title')}</h3>
                  <ul className="space-y-4">
                    <li>
                      <span className="cc-body-sm text-[var(--cc-muted)] block mb-1">
                        {t('contact-info-email')}
                      </span>
                      <a href="mailto:hello@cinacoin.com" className="cc-body-md-strong">
                        hello@cinacoin.com
                      </a>
                    </li>
                    <li>
                      <span className="cc-body-sm text-[var(--cc-muted)] block mb-1">
                        {t('contact-info-github')}
                      </span>
                      <a href="https://github.com/cinagroup/cinacoin" className="cc-body-md-strong">
                        github.com/cinagroup/cinacoin
                      </a>
                    </li>
                    <li>
                      <span className="cc-body-sm text-[var(--cc-muted)] block mb-1">
                        {t('contact-info-discord')}
                      </span>
                      <a href="https://discord.gg/cinacoin" className="cc-body-md-strong">
                        discord.gg/cinacoin
                      </a>
                    </li>
                    <li>
                      <span className="cc-body-sm text-[var(--cc-muted)] block mb-1">
                        {t('contact-info-twitter')}
                      </span>
                      <a href="https://x.com/cinacoin" className="cc-body-md-strong">
                        @cinacoin
                      </a>
                    </li>
                  </ul>
                </div>

                {/* Response Time */}
                <div className="cc-card">
                  <h3 className="cc-display-sm mb-4">{t('contact-response-title')}</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2 cc-body-md">
                      <span className="mt-2 h-2 w-2 rounded-full bg-[var(--cc-success)] flex-shrink-0" aria-hidden="true" />
                      <span>
                        <strong className="text-[var(--cc-ink)]">{t('contact-response-sales')}:</strong>{' '}
                        <span className="text-[var(--cc-body)]">{t('contact-response-sales-time')}</span>
                      </span>
                    </li>
                    <li className="flex items-start gap-2 cc-body-md">
                      <span className="mt-2 h-2 w-2 rounded-full bg-[var(--cc-success)] flex-shrink-0" aria-hidden="true" />
                      <span>
                        <strong className="text-[var(--cc-ink)]">{t('contact-response-support')}:</strong>{' '}
                        <span className="text-[var(--cc-body)]">{t('contact-response-support-time')}</span>
                      </span>
                    </li>
                    <li className="flex items-start gap-2 cc-body-md">
                      <span className="mt-2 h-2 w-2 rounded-full bg-[var(--cc-success)] flex-shrink-0" aria-hidden="true" />
                      <span>
                        <strong className="text-[var(--cc-ink)]">{t('contact-response-community')}:</strong>{' '}
                        <span className="text-[var(--cc-body)]">{t('contact-response-community-time')}</span>
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      <Footer />
    </>
  )
}
