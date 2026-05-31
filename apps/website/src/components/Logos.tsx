'use client'

import FadeIn from '@/components/FadeIn'

export default function Logos() {
  const logos = [
    'Ethereum', 'Polygon', 'Arbitrum', 'Optimism',
    'Base', 'BNB Chain', 'Avalanche', 'Solana'
  ];

  return (
    <section className="relative border-t border-white/[0.06] py-16">
      <FadeIn>
        <p className="mb-8 sm:mb-10 text-center text-xs sm:text-sm text-zinc-500 uppercase tracking-wider px-4">
          Trusted by builders across
        </p>
      </FadeIn>
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-center gap-x-6 sm:gap-x-12 gap-y-4 sm:gap-y-6">
          {logos.map((name, i) => (
            <FadeIn key={name} delay={i * 80} direction="up" duration={500}>
              <div className="text-base sm:text-lg font-medium text-zinc-600 transition-colors hover:text-zinc-400 cursor-default">
                {name}
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
