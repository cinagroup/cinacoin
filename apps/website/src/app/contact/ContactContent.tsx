'use client'

import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import FadeIn from '@/components/FadeIn'
import { useI18n } from '@/providers/I18nProvider'

export default function ContactContent() {
  const { t } = useI18n()

  return (
    <main className="min-h-screen bg-[var(--cc-canvas-soft)] text-[var(--cc-ink)]">
      <Navbar />

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
                <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); alert('Form submitted (demo)') }}>
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
                  <button type="submit" className="cc-btn-primary w-full">
                    {t('contact-form-submit')}
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
                      <span className="mt-1.5 h-2 w-2 rounded-full bg-[var(--cc-success)] flex-shrink-0" aria-hidden="true" />
                      <span>
                        <strong className="text-[var(--cc-ink)]">{t('contact-response-sales')}:</strong>{' '}
                        <span className="text-[var(--cc-body)]">{t('contact-response-sales-time')}</span>
                      </span>
                    </li>
                    <li className="flex items-start gap-2 cc-body-md">
                      <span className="mt-1.5 h-2 w-2 rounded-full bg-[var(--cc-success)] flex-shrink-0" aria-hidden="true" />
                      <span>
                        <strong className="text-[var(--cc-ink)]">{t('contact-response-support')}:</strong>{' '}
                        <span className="text-[var(--cc-body)]">{t('contact-response-support-time')}</span>
                      </span>
                    </li>
                    <li className="flex items-start gap-2 cc-body-md">
                      <span className="mt-1.5 h-2 w-2 rounded-full bg-[var(--cc-success)] flex-shrink-0" aria-hidden="true" />
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
    </main>
  )
}
