'use client'

import FadeIn from '@/components/FadeIn'
import AnimatedNumber from '@/components/AnimatedNumber'

export default function Stats() {
  const stats = [
    { value: '100M+', label: 'Wallet Connections' },
    { value: '50+', label: 'Chains Supported' },
    { value: '10K+', label: 'Apps Built' },
    { value: '99.99%', label: 'Uptime' },
  ];

  return (
    <section className="relative py-16 sm:py-20" aria-labelledby="stats-heading">
      {/* Subtle divider */}
      <FadeIn direction="none" duration={800}>
        <div className="mx-auto mb-16 h-px w-full max-w-7xl bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </FadeIn>

      <h2 id="stats-heading" className="sr-only">Key Metrics</h2>

      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 sm:gap-8 px-4 sm:px-6 md:grid-cols-4">
        {stats.map((stat, i) => (
          <FadeIn key={i} delay={i * 150} direction="up" duration={700}>
            <div className="text-center">
              <div className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-3xl sm:text-4xl font-bold tracking-tight text-transparent sm:text-5xl md:text-6xl">
                <AnimatedNumber value={stat.value} duration={2000} />
              </div>
              <div className="mt-2 text-xs sm:text-sm text-zinc-500">{stat.label}</div>
            </div>
          </FadeIn>
        ))}
      </div>
    </section>
  );
}
