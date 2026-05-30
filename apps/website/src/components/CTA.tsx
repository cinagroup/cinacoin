export default function CTA() {
  return (
    <section className="relative py-24">
      {/* Background glow */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="h-[500px] w-[700px] rounded-full bg-gradient-to-br from-blue-500/15 via-purple-500/10 to-transparent blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-3xl px-6 text-center">
        <h2 className="text-4xl font-bold tracking-tight md:text-5xl">
          Ready to build{' '}
          <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            onchain
          </span>
          ?
        </h2>
        <p className="mt-4 text-lg text-zinc-400">
          Join thousands of developers building seamless cross-chain experiences with Cinacoin.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <a
            href="https://docs.cinacoin.com"
            className="rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-black transition-all hover:bg-zinc-200"
          >
            Start Building →
          </a>
          <a
            href="https://github.com/cinagroup/cinacoin"
            className="rounded-full border border-white/10 bg-white/[0.04] px-8 py-3.5 text-sm font-semibold backdrop-blur-sm transition-all hover:bg-white/[0.08]"
          >
            View on GitHub
          </a>
        </div>
      </div>
    </section>
  )
}
