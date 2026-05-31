'use client'

import FadeIn from '@/components/FadeIn'

export default function Hero() {
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden pt-24 pb-20">
      {/* Background glow */}
      <FadeIn delay={0} duration={1200} direction="none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="h-[600px] w-[800px] rounded-full bg-gradient-to-br from-blue-500/20 via-purple-500/15 to-transparent blur-[120px]" />
        </div>
      </FadeIn>

      {/* Announcement badge */}
      <FadeIn delay={100}>
        <div className="relative mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-1.5 text-xs text-zinc-400 backdrop-blur-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
          Introducing Cinacoin SDK v2.0
          <span className="text-zinc-600">→</span>
        </div>
      </FadeIn>

      {/* Headline */}
      <FadeIn delay={200} duration={800}>
        <h1 className="relative max-w-4xl text-center text-5xl font-extrabold leading-[1.1] tracking-tight sm:text-6xl md:text-7xl lg:text-8xl">
          Connect any wallet,
          <br />
          <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            to any chain
          </span>
        </h1>
      </FadeIn>

      {/* Subheadline */}
      <FadeIn delay={350} duration={800}>
        <p className="relative mt-6 max-w-2xl text-center text-lg text-zinc-400 sm:text-xl md:text-2xl">
          The onchain infrastructure for seamless cross-chain experiences.
          One SDK for authentication, transactions, and wallet connectivity.
        </p>
      </FadeIn>

      {/* CTAs */}
      <FadeIn delay={500} direction="up" duration={800}>
        <div className="relative mt-10 flex flex-col gap-4 sm:flex-row">
          <a
            href="https://docs.cinacoin.com"
            className="rounded-full bg-white px-8 py-3.5 text-center text-sm font-semibold text-black transition-all hover:bg-zinc-200"
          >
            Start Building →
          </a>
          <a
            href="https://github.com/cinagroup/cinacoin"
            className="rounded-full border border-white/10 bg-white/[0.04] px-8 py-3.5 text-center text-sm font-semibold backdrop-blur-sm transition-all hover:bg-white/[0.08]"
          >
            View on GitHub
          </a>
        </div>
      </FadeIn>

      {/* Code snippet */}
      <FadeIn delay={700} direction="up" duration={1000}>
        <div className="relative mt-16 w-full max-w-lg">
          <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-sm">
            <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-2.5">
              <div className="h-2.5 w-2.5 rounded-full bg-zinc-600" />
              <div className="h-2.5 w-2.5 rounded-full bg-zinc-600" />
              <div className="h-2.5 w-2.5 rounded-full bg-zinc-600" />
            </div>
            <pre className="p-5 font-mono text-sm leading-relaxed">
              <code>
                <span className="text-purple-400">import</span>{' '}<span className="text-zinc-300">{'{ createCinacoin }'}</span>{' '}<span className="text-purple-400">from</span>{' '}<span className="text-green-400">'@cinacoin/core'</span>
                {'\n\n'}
                <span className="text-purple-400">const</span>{' '}<span className="text-blue-300">client</span>{' '}<span className="text-zinc-500">=</span>{' '}<span className="text-yellow-300">createCinacoin</span><span className="text-zinc-500">({'{'}</span>{'\n'}
                {'  '}<span className="text-zinc-300">projectId:</span>{' '}<span className="text-green-400">'your-project-id'</span>{'\n'}
                <span className="text-zinc-500">{'}'})</span>
              </code>
            </pre>
          </div>
        </div>
      </FadeIn>
    </section>
  )
}
