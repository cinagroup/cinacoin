import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import FadeIn from '@/components/FadeIn'

export const metadata: Metadata = {
  title: 'About — Cinacoin',
  description: 'Cinacoin is an open-source onchain access layer built by CINA Group. Self-hosted, zero vendor lock-in.',
}

const principles = [
  {
    icon: '🔓',
    title: 'Open Source First',
    desc: 'Every SDK, adapter, and tool is MIT licensed on GitHub. No black boxes, no vendor lock-in. You own your stack.',
  },
  {
    icon: '🌍',
    title: 'Chain Agnostic',
    desc: 'EVM, Solana, Bitcoin, Cosmos, TON, Sui — we support 16 chains and counting. Your users shouldn\'t care which chain they\'re on.',
  },
  {
    icon: '⚡',
    title: 'Developer Experience',
    desc: 'Clean APIs, comprehensive docs, and framework adapters for React, Vue, Svelte, and more. Build in minutes, not days.',
  },
  {
    icon: '🛡️',
    title: 'Self-Hosted',
    desc: 'Run everything on your own infrastructure. No data leaves your servers unless you want it to.',
  },
]

const timeline = [
  { date: '2024 Q1', event: 'Project founded', detail: 'Started as an internal toolkit for cross-chain dApps' },
  { date: '2024 Q2', event: 'Core SDK v1.0', detail: 'Released @cinacoin/core-sdk with EVM wallet support' },
  { date: '2024 Q3', event: 'Multi-chain expansion', detail: 'Added Solana, Bitcoin, Cosmos adapters' },
  { date: '2024 Q4', event: 'React + framework adapters', detail: 'Released 9 framework adapters including React, Vue, Svelte' },
  { date: '2025 Q1', event: 'SDK v2.0', detail: 'Unified API, SIWE auth, push notifications, chain abstraction' },
  { date: '2025 Q2', event: 'Open source launch', detail: '52+ packages, fully MIT licensed, community contributions' },
]

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-32 pb-16 sm:pt-40 sm:pb-20">
        <FadeIn>
          <div className="mx-auto max-w-4xl px-6 text-center">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight">
              Built for{' '}
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                developers
              </span>
              , by developers
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto">
              Cinacoin is an open-source onchain access layer created by <strong className="text-white">CINA Group</strong>. 
              We believe infrastructure should be transparent, self-hostable, and free from vendor lock-in.
            </p>
          </div>
        </FadeIn>
      </section>

      {/* Principles */}
      <section className="pb-20 sm:pb-28">
        <div className="mx-auto max-w-7xl px-6">
          <FadeIn>
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">Our Principles</h2>
          </FadeIn>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {principles.map((p, i) => (
              <FadeIn key={p.title} delay={i * 100} direction="up" duration={600}>
                <article className="h-full rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 transition-all hover:border-white/[0.12] hover:bg-white/[0.04]">
                  <div className="text-2xl mb-3" role="img" aria-label={p.title}>{p.icon}</div>
                  <h3 className="text-lg font-semibold mb-2">{p.title}</h3>
                  <p className="text-sm leading-relaxed text-zinc-400">{p.desc}</p>
                </article>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="border-t border-white/[0.06] py-20 sm:py-28">
        <div className="mx-auto max-w-3xl px-6">
          <FadeIn>
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">Timeline</h2>
          </FadeIn>
          <div className="space-y-0">
            {timeline.map((item, i) => (
              <FadeIn key={item.date} delay={i * 80}>
                <div className="flex gap-6 pb-8 last:pb-0">
                  <div className="flex flex-col items-center">
                    <div className="h-3 w-3 rounded-full bg-blue-500 ring-4 ring-blue-500/20" />
                    {i < timeline.length - 1 && <div className="mt-1 w-px flex-1 bg-white/10" />}
                  </div>
                  <div className="pb-8">
                    <span className="text-xs font-mono text-blue-400">{item.date}</span>
                    <h3 className="mt-1 font-semibold">{item.event}</h3>
                    <p className="mt-1 text-sm text-zinc-500">{item.detail}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-t border-white/[0.06] py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '52+', label: 'Open Source Packages' },
              { value: '16', label: 'Chains Supported' },
              { value: 'MIT', label: 'License' },
              { value: '0', label: 'Vendor Lock-in' },
            ].map((stat, i) => (
              <FadeIn key={stat.label} delay={i * 100}>
                <div>
                  <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    {stat.value}
                  </div>
                  <div className="mt-1 text-xs sm:text-sm text-zinc-500">{stat.label}</div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
