'use client'

import FadeIn from '@/components/FadeIn'

export default function Logos() {
  const logos = [
    'Ethereum', 'Polygon', 'Arbitrum', 'Optimism',
    'Base', 'BNB Chain', 'Avalanche', 'Solana',
    'Bitcoin', 'Cosmos', 'TON', 'Sui',
    'Aptos', 'Near', 'Starknet', 'XRPL'
  ];

  return (
    <section className="relative border-t border-white/[0.06] py-16" aria-label="Supported chains">
      <FadeIn>
        <h2 className="sr-only">Supported Chains</h2>
        <p className="mb-8 sm:mb-10 text-center text-xs sm:text-sm text-zinc-500 uppercase tracking-wider px-4">
          Trusted by builders across
        </p>
      </FadeIn>
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <ul className="flex flex-wrap items-center justify-center gap-x-6 sm:gap-x-12 gap-y-4 sm:gap-y-6" role="list">
          {logos.map((name, i) => (
            <FadeIn key={name} delay={i * 80} direction="up" duration={500}>
              <li className="text-base sm:text-lg font-medium text-zinc-600 transition-colors hover:text-zinc-400 cursor-default">
                {name}
              </li>
            </FadeIn>
          ))}
        </ul>
      </div>
    </section>
  );
}
