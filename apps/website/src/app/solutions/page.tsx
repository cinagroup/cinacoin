import Link from 'next/link';

export default function SolutionsPage() {
  const solutions = [
    {
      id: 'enterprise',
      title: 'Enterprise',
      description: 'Blockchain infrastructure for businesses. Private chains, compliance tools, and dedicated support.',
      features: ['Private blockchain deployment', 'Regulatory compliance tools', 'Custom smart contracts', 'Dedicated account manager'],
    },
    {
      id: 'defi',
      title: 'DeFi',
      description: 'Build decentralized financial applications on CinaCoin with our comprehensive DeFi toolkit.',
      features: ['AMM protocol', 'Lending & borrowing', 'Yield optimization', 'Cross-chain bridges'],
    },
    {
      id: 'payments',
      title: 'Payments',
      description: 'Accept CinaCoin payments in your business with our merchant solutions.',
      features: ['Point-of-sale integration', 'E-commerce plugins', 'Instant settlement', 'Multi-currency conversion'],
    },
    {
      id: 'performance',
      title: 'High Performance',
      description: 'Our consensus mechanism delivers sub-second finality and 100,000+ TPS.',
      features: ['Sub-second finality', '100,000+ TPS', 'Low energy consumption', 'Horizontal scaling'],
    },
    {
      id: 'security',
      title: 'Security',
      description: 'Enterprise-grade security with multi-layer protection and audit trails.',
      features: ['Zero-knowledge proofs', 'Multi-sig wallets', 'Formal verification', 'Bug bounty program'],
    },
    {
      id: 'scale',
      title: 'Global Scale',
      description: 'Deploy globally with nodes across 50+ regions and automatic load balancing.',
      features: ['50+ global regions', 'Automatic failover', 'Edge caching', 'DDoS protection'],
    },
  ];

  return (
    <main className="min-h-screen bg-[#fafafa]">
      {/* Hero */}
      <section className="max-w-[1200px] mx-auto px-6 py-24 text-center">
        <h1 className="text-5xl md:text-[64px] font-semibold mb-6 tracking-tight text-[#171717] leading-[1.05]">
          Solutions
        </h1>
        <p className="text-lg text-[#4d4d4d] max-w-2xl mx-auto leading-relaxed">
          Tailored blockchain solutions for every use case, from startups to enterprises.
        </p>
      </section>

      {/* Solutions Grid */}
      <section className="max-w-[1200px] mx-auto px-6 pb-24">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {solutions.map((solution) => (
            <div key={solution.id} id={solution.id} className="p-6 bg-white border border-[#ebebeb] rounded-[8px] shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] transition-shadow duration-200">
              <h2 className="text-[20px] font-semibold mb-2 text-[#171717]">{solution.title}</h2>
              <p className="text-[#4d4d4d] text-[14px] leading-relaxed mb-4">{solution.description}</p>
              <ul className="space-y-2">
                {solution.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-[14px] text-[#4d4d4d]">
                    <span className="text-[#0070f3]">✓</span> {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#f5f5f5] border-y border-[#ebebeb]">
        <div className="max-w-[1200px] mx-auto px-6 py-16 text-center">
          <h2 className="text-[32px] font-semibold mb-4 tracking-tight text-[#171717]">
            Need a Custom Solution?
          </h2>
          <p className="text-[#4d4d4d] text-lg mb-8 max-w-xl mx-auto">
            Contact our team to discuss your specific requirements.
          </p>
          <Link href="/about" className="inline-flex items-center justify-center px-8 py-3 bg-[#171717] hover:bg-[#2a2a2a] text-white rounded-[6px] font-medium text-[14px] transition-colors duration-150 h-10">
            Contact Us
          </Link>
        </div>
      </section>
    </main>
  );
}
