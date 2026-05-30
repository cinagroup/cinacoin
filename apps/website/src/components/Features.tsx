export default function Features() {
  const features = [
    {
      title: 'Universal Wallet Connection',
      desc: 'Connect any wallet to any chain with a single SDK. Support for 300+ wallets and 100+ chains out of the box.',
      icon: '🔗',
    },
    {
      title: 'Chain Abstraction',
      desc: 'Let users interact with your app without worrying about which chain they\'re on. Automatic bridging and routing.',
      icon: '🌐',
    },
    {
      title: 'Smart Account Integration',
      desc: 'ERC-4337 account abstraction with session keys, gas sponsorship, and batch transactions built in.',
      icon: '🔐',
    },
    {
      title: 'Real-time Notifications',
      desc: 'Push notifications for wallet activity, transaction confirmations, and cross-chain events.',
      icon: '🔔',
    },
    {
      title: 'Developer-First APIs',
      desc: 'Clean TypeScript SDKs, comprehensive docs, and playground examples to get you building in minutes.',
      icon: '⚡',
    },
    {
      title: 'Enterprise Security',
      desc: 'SOC 2 compliant, encrypted communications, and zero-knowledge proofs for maximum security.',
      icon: '🛡️',
    },
  ];

  return (
    <section id="products" className="relative py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-16 max-w-3xl">
          <h2 className="text-4xl font-bold tracking-tight md:text-5xl">
            Everything you need to{' '}
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              build onchain
            </span>
          </h2>
          <p className="mt-4 text-lg text-zinc-400">
            A complete suite of tools and infrastructure for seamless cross-chain experiences.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <div
              key={i}
              className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 transition-all hover:border-white/[0.12] hover:bg-white/[0.04]"
            >
              <div className="mb-4 text-2xl">{f.icon}</div>
              <h3 className="mb-2 text-lg font-semibold">{f.title}</h3>
              <p className="text-sm leading-relaxed text-zinc-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
