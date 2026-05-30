export default function Products() {
  const products = [
    {
      name: 'AppKit',
      desc: 'Universal wallet connection kit. 300+ wallets, 50+ chains. One SDK to rule them all.',
      href: 'https://docs.cinacoin.com/appkit',
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      name: 'Auth',
      desc: 'Sign-In With Ethereum (SIWE) authentication with session management and wallet verification.',
      href: 'https://docs.cinacoin.com/auth',
      gradient: 'from-purple-500 to-pink-500',
    },
    {
      name: 'Relay',
      desc: 'Cross-chain message relay infrastructure for seamless multi-chain transactions.',
      href: 'https://docs.cinacoin.com/relay',
      gradient: 'from-orange-500 to-red-500',
    },
    {
      name: 'Push',
      desc: 'Real-time push notifications for wallet activity, transactions, and chain events.',
      href: 'https://docs.cinacoin.com/push',
      gradient: 'from-green-500 to-emerald-500',
    },
    {
      name: 'Keys',
      desc: 'Decentralized key management with secure storage, rotation, and recovery.',
      href: 'https://docs.cinacoin.com/keys',
      gradient: 'from-yellow-500 to-orange-500',
    },
    {
      name: 'RPC Proxy',
      desc: 'Unified RPC endpoint with automatic routing, rate limiting, and failover.',
      href: 'https://docs.cinacoin.com/rpc',
      gradient: 'from-indigo-500 to-violet-500',
    },
  ];

  return (
    <section id="products" className="relative py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <h2 className="text-4xl font-bold tracking-tight md:text-5xl">
            Products & Infrastructure
          </h2>
          <p className="mt-4 text-lg text-zinc-400">
            Everything you need to build seamless onchain experiences
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <a
              key={p.name}
              href={p.href}
              className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 transition-all hover:border-white/[0.12] hover:bg-white/[0.04]"
            >
              <div className="mb-4 flex items-center gap-2">
                <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${p.gradient}`} />
                <h3 className="text-lg font-semibold">{p.name}</h3>
              </div>
              <p className="text-sm leading-relaxed text-zinc-400">{p.desc}</p>
              <div className="mt-4 flex items-center gap-1 text-sm text-zinc-500 transition-colors group-hover:text-white">
                Learn more <span>→</span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
