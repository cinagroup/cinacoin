import Link from 'next/link';

export default function ProductsPage() {
  return (
    <main className="min-h-screen bg-[#fafafa]">
      {/* Hero */}
      <section className="max-w-[1200px] mx-auto px-6 py-24 text-center">
        <h1 className="text-5xl md:text-[64px] font-semibold mb-6 tracking-tight text-[#171717] leading-[1.05]">
          Products
        </h1>
        <p className="text-lg text-[#4d4d4d] max-w-2xl mx-auto leading-relaxed">
          Everything you need to use, trade, and build on the CinaCoin network.
        </p>
      </section>

      {/* Products Grid */}
      <section className="max-w-[1200px] mx-auto px-6 pb-24">
        <div className="grid md:grid-cols-2 gap-6">
          <div id="wallet" className="p-8 bg-white border border-[#ebebeb] rounded-[12px] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <h2 className="text-[24px] font-semibold mb-3 text-[#171717]">CinaCoin Wallet</h2>
            <p className="text-[#4d4d4d] text-[14px] leading-relaxed mb-6">
              A secure, fast, and intuitive digital wallet for managing your CinaCoin assets. Available on iOS, Android, and desktop.
            </p>
            <ul className="space-y-2 mb-6">
              {['Biometric authentication', 'Multi-currency support', 'Hardware wallet integration', 'Instant transaction notifications'].map((f) => (
                <li key={f} className="flex items-center gap-2 text-[14px] text-[#4d4d4d]">
                  <span className="text-[#0070f3]">✓</span> {f}
                </li>
              ))}
            </ul>
            <Link href="/developers" className="inline-flex items-center justify-center px-4 py-2 bg-[#171717] hover:bg-[#000] text-white rounded-[6px] font-medium text-[14px] transition-colors duration-150 h-10">
              Download Wallet
            </Link>
          </div>

          <div id="exchange" className="p-8 bg-white border border-[#ebebeb] rounded-[12px] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <h2 className="text-[24px] font-semibold mb-3 text-[#171717]">CinaCoin Exchange</h2>
            <p className="text-[#4d4d4d] text-[14px] leading-relaxed mb-6">
              Trade CinaCoin and other digital assets with low fees, deep liquidity, and advanced charting tools.
            </p>
            <ul className="space-y-2 mb-6">
              {['Spot and margin trading', 'Advanced order types', 'Real-time market data', 'API access for bots'].map((f) => (
                <li key={f} className="flex items-center gap-2 text-[14px] text-[#4d4d4d]">
                  <span className="text-[#0070f3]">✓</span> {f}
                </li>
              ))}
            </ul>
            <Link href="/developers" className="inline-flex items-center justify-center px-4 py-2 border border-[#ebebeb] hover:border-[#a1a1a1] rounded-[6px] font-medium text-[14px] transition-colors duration-150 text-[#171717] bg-white h-10">
              Start Trading
            </Link>
          </div>

          <div id="staking" className="p-8 bg-white border border-[#ebebeb] rounded-[12px] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <h2 className="text-[24px] font-semibold mb-3 text-[#171717]">Staking</h2>
            <p className="text-[#4d4d4d] text-[14px] leading-relaxed mb-6">
              Earn rewards by staking your CinaCoin. Help secure the network while growing your holdings.
            </p>
            <ul className="space-y-2 mb-6">
              {['Up to 8% annual yield', 'Flexible lock-up periods', 'Automatic reward compounding', 'No minimum stake amount'].map((f) => (
                <li key={f} className="flex items-center gap-2 text-[14px] text-[#4d4d4d]">
                  <span className="text-[#0070f3]">✓</span> {f}
                </li>
              ))}
            </ul>
            <Link href="/developers" className="inline-flex items-center justify-center px-4 py-2 bg-[#171717] hover:bg-[#000] text-white rounded-[6px] font-medium text-[14px] transition-colors duration-150 h-10">
              Start Staking
            </Link>
          </div>

          <div id="explorer" className="p-8 bg-white border border-[#ebebeb] rounded-[12px] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <h2 className="text-[24px] font-semibold mb-3 text-[#171717]">Block Explorer</h2>
            <p className="text-[#4d4d4d] text-[14px] leading-relaxed mb-6">
              Browse transactions, blocks, and addresses on the CinaCoin blockchain in real-time.
            </p>
            <ul className="space-y-2 mb-6">
              {['Real-time transaction tracking', 'Address analytics', 'Token transfer history', 'Network statistics'].map((f) => (
                <li key={f} className="flex items-center gap-2 text-[14px] text-[#4d4d4d]">
                  <span className="text-[#0070f3]">✓</span> {f}
                </li>
              ))}
            </ul>
            <Link href="/developers" className="inline-flex items-center justify-center px-4 py-2 border border-[#ebebeb] hover:border-[#a1a1a1] rounded-[6px] font-medium text-[14px] transition-colors duration-150 text-[#171717] bg-white h-10">
              Open Explorer
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
