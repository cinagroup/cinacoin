import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import FadeIn from '@/components/FadeIn'

export const metadata: Metadata = {
  title: 'Changelog — Cinacoin',
  description: 'Release history and updates for Cinacoin SDK and infrastructure.',
}

const releases = [
  {
    version: 'v2.0.0',
    date: '2025-06-01',
    type: 'major',
    changes: [
      'Unified API across all SDKs',
      'SIWE authentication with session management',
      'Push notifications for wallet activity',
      'Chain abstraction — automatic cross-chain routing',
      '9 framework adapters: React, Vue, Svelte, Next, Nuxt, Angular, React Native',
      '8 chain adapters: EVM, Solana, Bitcoin, Cosmos, TON, Sui, Starknet, XRPL',
      '52+ open source packages',
    ],
  },
  {
    version: 'v1.5.0',
    date: '2025-03-15',
    type: 'minor',
    changes: [
      'Added Solana and Bitcoin adapters',
      'Smart account (ERC-4337) support',
      'Gas sponsorship API',
      'Batch transaction support',
    ],
  },
  {
    version: 'v1.0.0',
    date: '2024-06-20',
    type: 'major',
    changes: [
      'Initial release of @cinacoin/core-sdk',
      'EVM wallet connection (MetaMask, WalletConnect, Coinbase)',
      'React adapter with ConnectButton component',
      'Basic analytics dashboard',
    ],
  },
]

export default function ChangelogPage() {
  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <Navbar />

      <section className="relative pt-32 pb-16 sm:pt-40 sm:pb-20">
        <FadeIn>
          <div className="mx-auto max-w-4xl px-6 text-center">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight">
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Changelog
              </span>
            </h1>
            <p className="mt-6 text-lg text-zinc-400">
              Release history for Cinacoin SDK and infrastructure.
            </p>
          </div>
        </FadeIn>
      </section>

      <section className="pb-20 sm:pb-32">
        <div className="mx-auto max-w-3xl px-6 space-y-12">
          {releases.map((release, i) => (
            <FadeIn key={release.version} delay={i * 150}>
              <article className="relative pl-8 border-l border-white/10">
                <div className={`absolute -left-1.5 top-1 h-3 w-3 rounded-full ${
                  release.type === 'major' ? 'bg-blue-500' : 'bg-zinc-500'
                }`} />
                <div className="flex items-center gap-3 mb-3">
                  <span className="font-mono text-sm font-semibold text-blue-400">{release.version}</span>
                  <span className="text-xs text-zinc-500">{release.date}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    release.type === 'major' ? 'bg-blue-500/10 text-blue-400' : 'bg-zinc-500/10 text-zinc-400'
                  }`}>
                    {release.type}
                  </span>
                </div>
                <ul className="space-y-2">
                  {release.changes.map((change) => (
                    <li key={change} className="flex items-start gap-2 text-sm text-zinc-400">
                      <span className="mt-1.5 h-1 w-1 rounded-full bg-zinc-600 flex-shrink-0" />
                      {change}
                    </li>
                  ))}
                </ul>
              </article>
            </FadeIn>
          ))}
        </div>
      </section>

      <Footer />
    </main>
  )
}
