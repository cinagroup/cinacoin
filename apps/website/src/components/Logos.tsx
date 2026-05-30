export default function Logos() {
  const logos = [
    'Ethereum', 'Polygon', 'Arbitrum', 'Optimism',
    'Base', 'BNB Chain', 'Avalanche', 'Solana'
  ];

  return (
    <section className="relative border-t border-white/[0.06] py-16">
      <p className="mb-10 text-center text-sm text-zinc-500 uppercase tracking-wider">
        Trusted by builders across
      </p>
      <div className="mx-auto max-w-5xl px-6">
        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
          {logos.map((name) => (
            <div key={name} className="text-lg font-medium text-zinc-600 transition-colors hover:text-zinc-400">
              {name}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
