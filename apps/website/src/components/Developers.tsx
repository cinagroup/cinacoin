'use client'

import FadeIn from '@/components/FadeIn'

export default function Developers() {
  return (
    <section id="developers" className="relative py-20 sm:py-24" aria-labelledby="developers-heading">
      {/* Background glow */}
      <FadeIn delay={0} duration={1000} direction="none">
        <div className="absolute bottom-0 left-1/4">
          <div className="h-[400px] w-[500px] rounded-full bg-gradient-to-br from-purple-500/10 to-blue-500/10 blur-[120px]" />
        </div>
      </FadeIn>

      <div className="relative mx-auto max-w-7xl px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Left: Text */}
          <FadeIn direction="right" duration={800}>
            <div>
              <h2 id="developers-heading" className="text-3xl sm:text-4xl font-bold tracking-tight md:text-5xl">
                Built for{' '}
                <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                  developers
                </span>
              </h2>
              <p className="mt-4 text-lg text-zinc-400">
                Clean APIs, comprehensive docs, and SDKs in every major language. Get building in minutes, not days.
              </p>

              <div className="mt-8 space-y-4">
                {[
                  'TypeScript SDK — @cinacoin/core-sdk, @cinacoin/react',
                  '9 framework adapters: React, Vue, Svelte, Next, Nuxt, Angular',
                  '8 chain adapters: EVM, Solana, Bitcoin, Cosmos, TON, Sui, Starknet, XRPL',
                  'Open source on GitHub — 52+ packages, MIT licensed',
                ].map((item, i) => (
                  <FadeIn key={i} delay={200 + i * 100} direction="right" duration={500}>
                    <div className="flex items-start gap-3">
                      <span className="mt-1 text-green-400" aria-hidden="true">✓</span>
                      <span className="text-sm text-zinc-300">{item}</span>
                    </div>
                  </FadeIn>
                ))}
              </div>

              <FadeIn delay={600}>
                <div className="mt-8 flex gap-4">
                  <a
                    href="https://docs.cinacoin.com"
                    className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                    aria-label="Read Cinacoin documentation"
                  >
                    Read Docs →
                  </a>
                  <a
                    href="https://github.com/cinagroup/cinacoin"
                    className="rounded-full border border-white/10 px-6 py-3 text-sm font-semibold transition-colors hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                    aria-label="View Cinacoin on GitHub"
                  >
                    GitHub
                  </a>
                </div>
              </FadeIn>
            </div>
          </FadeIn>

          {/* Right: Code preview */}
          <FadeIn direction="left" duration={800}>
            <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-sm">
              <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-3">
                <div className="h-2.5 w-2.5 rounded-full bg-zinc-600" />
                <div className="h-2.5 w-2.5 rounded-full bg-zinc-600" />
                <div className="h-2.5 w-2.5 rounded-full bg-zinc-600" />
                <span className="ml-2 text-xs text-zinc-500">example.tsx</span>
              </div>
              <pre className="p-5 font-mono text-sm leading-relaxed">
                <code>
                  <span className="text-purple-400">import</span>{' '}
                  <span className="text-zinc-300">{'{ useCinacoin, ConnectButton }'}</span>{' '}
                  <span className="text-purple-400">from</span>{' '}
                  <span className="text-green-400">'@cinacoin/react'</span>
                  {'\n\n'}
                  <span className="text-purple-400">function</span>{' '}
                  <span className="text-yellow-300">MyApp</span>
                  <span className="text-zinc-500">() {'{'}</span>
                  {'\n'}
                  {'  '}<span className="text-purple-400">const</span>{' '}
                  <span className="text-zinc-500">{'{'}</span>
                  <span className="text-blue-300"> address</span>
                  <span className="text-zinc-500">,</span>{' '}
                  <span className="text-blue-300"> isConnected</span>
                  <span className="text-zinc-500">,</span>{' '}
                  <span className="text-blue-300"> chain</span>
                  <span className="text-zinc-500"> {'}'} =</span>{' '}
                  <span className="text-yellow-300">useCinacoin</span>
                  <span className="text-zinc-500">()</span>
                  {'\n\n'}
                  {'  '}<span className="text-purple-400">return</span>{' '}
                  <span className="text-zinc-500">(</span>
                  {'\n'}
                  {'    '}<span className="text-zinc-500">{'<'}</span>
                  <span className="text-yellow-300">div</span>
                  <span className="text-zinc-500">{'>'}</span>
                  {'\n'}
                  {'      '}<span className="text-zinc-500">{'<'}</span>
                  <span className="text-yellow-300">ConnectButton</span>{' '}
                  <span className="text-zinc-500">{'/>'}</span>
                  {'\n'}
                  {'      '}<span className="text-zinc-500">{'{'}</span>
                  <span className="text-blue-300">isConnected</span>
                  <span className="text-zinc-500">{' ?'}</span>{' '}
                  <span className="text-green-400">`Connected: ${'{'}address{'}'}`</span>
                  <span className="text-zinc-500">{' :'}</span>{' '}
                  <span className="text-green-400">'Not connected'</span>
                  <span className="text-zinc-500">{'}'}</span>
                  {'\n'}
                  {'    '}<span className="text-zinc-500">{'<'}/</span>
                  <span className="text-yellow-300">div</span>
                  <span className="text-zinc-500">{'>'}</span>
                  {'\n'}
                  {'  '}<span className="text-zinc-500">)</span>
                  {'\n'}
                  <span className="text-zinc-500">{'}'}</span>
                </code>
              </pre>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
