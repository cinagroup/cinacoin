import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import FadeIn from '@/components/FadeIn'

export const metadata: Metadata = {
  title: 'Pricing — Cinacoin',
  description: 'Transparent, usage-based pricing for Cinacoin. Free tier for developers, scalable plans for teams and enterprises.',
}

const tiers = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Perfect for prototyping and personal projects.',
    features: [
      '10,000 API calls/month',
      '2 projects',
      'Core SDK access',
      'Community support',
      'Basic analytics',
    ],
    cta: 'Start Free',
    href: 'https://dash.cinacoin.com',
    popular: false,
  },
  {
    name: 'Pro',
    price: '$49',
    period: '/month',
    description: 'For growing teams shipping real products.',
    features: [
      '1M API calls/month',
      'Unlimited projects',
      'All SDKs + framework adapters',
      'Priority email support',
      'Advanced analytics dashboard',
      'Custom domain support',
      'Webhook integrations',
    ],
    cta: 'Start Pro Trial',
    href: 'https://dash.cinacoin.com',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'For organizations that need scale, SLA, and dedicated support.',
    features: [
      'Unlimited API calls',
      'Dedicated infrastructure',
      '99.99% SLA guarantee',
      'Dedicated account manager',
      'Custom integrations',
      'SOC 2 compliance',
      'On-premise deployment option',
      '24/7 phone support',
    ],
    cta: 'Contact Sales',
    href: '/contact',
    popular: false,
  },
]

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-32 pb-16 sm:pt-40 sm:pb-20">
        <FadeIn>
          <div className="mx-auto max-w-4xl px-6 text-center">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight">
              Simple, transparent{' '}
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                pricing
              </span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto">
              Start free, scale as you grow. No hidden fees, no surprise bills.
            </p>
          </div>
        </FadeIn>
      </section>

      {/* Pricing Tiers */}
      <section className="pb-20 sm:pb-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {tiers.map((tier, i) => (
              <FadeIn key={tier.name} delay={i * 150} direction="up" duration={600}>
                <div
                  className={`relative h-full rounded-2xl border p-8 transition-all hover:-translate-y-1 ${
                    tier.popular
                      ? 'border-blue-500/30 bg-blue-500/[0.03] shadow-lg shadow-blue-500/5'
                      : 'border-white/[0.06] bg-white/[0.02]'
                  }`}
                >
                  {tier.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-500 px-3 py-1 text-xs font-semibold text-white">
                      Most Popular
                    </span>
                  )}

                  <h3 className="text-lg font-semibold">{tier.name}</h3>
                  <p className="mt-1 text-sm text-zinc-500">{tier.description}</p>

                  <div className="mt-6 flex items-baseline gap-1">
                    <span className="text-4xl font-bold">{tier.price}</span>
                    {tier.period && <span className="text-zinc-500">{tier.period}</span>}
                  </div>

                  <a
                    href={tier.href}
                    className={`mt-6 inline-flex w-full items-center justify-center rounded-full px-6 py-3 text-sm font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
                      tier.popular
                        ? 'bg-white text-black hover:bg-zinc-200'
                        : 'border border-white/10 bg-white/[0.04] hover:bg-white/[0.08]'
                    }`}
                  >
                    {tier.cta}
                  </a>

                  <ul className="mt-8 space-y-3">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3 text-sm text-zinc-400">
                        <span className="mt-0.5 text-green-400" aria-hidden="true">✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-white/[0.06] py-20 sm:py-28">
        <div className="mx-auto max-w-3xl px-6">
          <FadeIn>
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">
              Frequently Asked Questions
            </h2>
          </FadeIn>

          {[
            {
              q: 'What counts as an API call?',
              a: 'Each request to Cinacoin infrastructure — wallet connections, transactions, authentication, push notifications — counts as one API call. SDK initialization and local operations are free.',
            },
            {
              q: 'Can I switch plans at any time?',
              a: 'Yes. Upgrade or downgrade anytime. When upgrading, you get immediate access to new features. When downgrading, changes take effect at the next billing cycle.',
            },
            {
              q: 'What happens if I exceed my API limit?',
              a: "We'll never cut off your app. You'll receive a notification at 80% and 100% usage. Beyond your limit, requests continue at a reduced rate until the next cycle or until you upgrade.",
            },
            {
              q: 'Is Cinacoin really open source?',
              a: 'Yes. All SDKs, adapters, and core infrastructure are MIT licensed on GitHub. You can self-host everything. Paid plans add managed infrastructure, analytics, and support.',
            },
            {
              q: 'Do you offer discounts for open source projects?',
              a: 'Absolutely. Active open source projects can apply for a free Pro tier. Contact us with your project details.',
            },
          ].map((faq, i) => (
            <FadeIn key={i} delay={i * 100}>
              <details className="group border-b border-white/[0.06] py-6 last:border-b-0">
                <summary className="flex cursor-pointer items-center justify-between text-base font-semibold transition-colors hover:text-blue-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded">
                  {faq.q}
                  <span className="ml-4 text-zinc-500 transition-transform group-open:rotate-45 text-xl" aria-hidden="true">+</span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-zinc-400">{faq.a}</p>
              </details>
            </FadeIn>
          ))}
        </div>
      </section>

      <Footer />
    </main>
  )
}
