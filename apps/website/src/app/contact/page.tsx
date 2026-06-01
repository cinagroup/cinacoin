import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import FadeIn from '@/components/FadeIn'

export const metadata: Metadata = {
  title: 'Contact — Cinacoin',
  description: 'Get in touch with the Cinacoin team. Sales, support, partnerships, or just say hello.',
  alternates: {
    canonical: '/contact',
  },
}

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <Navbar />

      <section className="relative pt-32 pb-16 sm:pt-40 sm:pb-20">
        <FadeIn>
          <div className="mx-auto max-w-4xl px-6 text-center">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight">
              Get in{' '}
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                touch
              </span>
            </h1>
            <p className="mt-6 text-lg text-zinc-400 max-w-xl mx-auto">
              Whether you have a question about pricing, need technical support, or want to explore a partnership — we'd love to hear from you.
            </p>
          </div>
        </FadeIn>
      </section>

      <section className="pb-20 sm:pb-32">
        <div className="mx-auto max-w-5xl px-6">
          <div className="grid gap-8 md:grid-cols-2">
            {/* Contact Form */}
            <FadeIn direction="right" duration={600}>
              <form className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-zinc-300 mb-2">
                    Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-zinc-300 mb-2">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                    placeholder="you@company.com"
                  />
                </div>
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-zinc-300 mb-2">
                    Subject
                  </label>
                  <select
                    id="subject"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all appearance-none"
                  >
                    <option value="" className="bg-[#050505]">Select a topic</option>
                    <option value="sales" className="bg-[#050505]">Sales & Pricing</option>
                    <option value="support" className="bg-[#050505]">Technical Support</option>
                    <option value="partnership" className="bg-[#050505]">Partnership</option>
                    <option value="other" className="bg-[#050505]">Other</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-zinc-300 mb-2">
                    Message
                  </label>
                  <textarea
                    id="message"
                    rows={5}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all resize-none"
                    placeholder="Tell us what you need..."
                  />
                </div>
                <button
                  type="submit"
                  className="w-full rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-black transition-all hover:bg-zinc-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                >
                  Send Message →
                </button>
              </form>
            </FadeIn>

            {/* Contact Info */}
            <FadeIn direction="left" duration={600}>
              <div className="space-y-8">
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8">
                  <h3 className="text-lg font-semibold mb-4">Reach Us Directly</h3>
                  <ul className="space-y-4">
                    {[
                      { label: 'Email', value: 'hello@cinacoin.com', href: 'mailto:hello@cinacoin.com' },
                      { label: 'GitHub', value: 'github.com/cinagroup/cinacoin', href: 'https://github.com/cinagroup/cinacoin' },
                      { label: 'Discord', value: 'discord.gg/cinacoin', href: 'https://discord.gg/cinacoin' },
                      { label: 'X (Twitter)', value: '@cinacoin', href: 'https://x.com/cinacoin' },
                    ].map((item) => (
                      <li key={item.label}>
                        <span className="text-xs text-zinc-500 block mb-1">{item.label}</span>
                        <a
                          href={item.href}
                          className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          {item.value}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8">
                  <h3 className="text-lg font-semibold mb-3">Response Time</h3>
                  <ul className="space-y-3 text-sm text-zinc-400">
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 mt-0.5" aria-hidden="true">●</span>
                      <span><strong className="text-white">Sales:</strong> Within 24 hours</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 mt-0.5" aria-hidden="true">●</span>
                      <span><strong className="text-white">Support:</strong> Within 48 hours</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 mt-0.5" aria-hidden="true">●</span>
                      <span><strong className="text-white">Community:</strong> Real-time on Discord</span>
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
