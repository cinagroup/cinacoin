import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-[#fafafa] text-[#171717]">
      {/* Hero Section */}
      <section className="max-w-[1200px] mx-auto px-6 py-48 text-center">
        <h1 className="text-5xl md:text-[64px] font-semibold mb-6 tracking-tight text-[#171717] leading-[1.05]">
          CinaCoin
        </h1>
        <p className="text-xl md:text-2xl text-[#4d4d4d] mb-8 max-w-3xl mx-auto leading-relaxed">
          The Future of Digital Currency
        </p>
        <p className="text-lg text-[#888888] mb-12 max-w-2xl mx-auto leading-relaxed">
          Built for speed, security, and scalability. Experience the next generation of blockchain technology.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link
            href="/products"
            className="inline-flex items-center justify-center px-8 py-3 bg-[#171717] hover:bg-[#000000] text-white rounded-[6px] font-medium text-[14px] transition-colors duration-150 h-10"
          >
            Get Started
          </Link>
          <Link
            href="/about"
            className="inline-flex items-center justify-center px-8 py-3 border border-[#ebebeb] hover:border-[#a1a1a1] rounded-[6px] font-medium text-[14px] transition-colors duration-150 text-[#171717] bg-white h-10"
          >
            Learn More
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white border-y border-[#ebebeb]">
        <div className="max-w-[1200px] mx-auto px-6 py-24">
          <h2 className="text-3xl md:text-[48px] font-semibold text-center mb-4 tracking-tight text-[#171717] leading-[1.1]">
            Why Choose CinaCoin?
          </h2>
          <p className="text-center text-[#888888] text-lg mb-16 max-w-2xl mx-auto">
            Built with cutting-edge technology to deliver the best blockchain experience.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            <Link href="/solutions#performance" className="group p-6 bg-white border border-[#ebebeb] rounded-[8px] shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] transition-shadow duration-200">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-semibold mb-2 text-[#171717]">Lightning Fast</h3>
              <p className="text-[#4d4d4d] text-[14px] leading-relaxed">
                Transactions confirmed in seconds, not minutes. Built for real-world usage.
              </p>
              <span className="inline-block mt-4 text-[14px] font-medium text-[#0070f3] group-hover:underline">
                Learn more →
              </span>
            </Link>
            <Link href="/solutions#security" className="group p-6 bg-white border border-[#ebebeb] rounded-[8px] shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] transition-shadow duration-200">
              <div className="text-4xl mb-4">🔒</div>
              <h3 className="text-xl font-semibold mb-2 text-[#171717]">Bank-Level Security</h3>
              <p className="text-[#4d4d4d] text-[14px] leading-relaxed">
                Advanced cryptography and decentralized consensus protect your assets.
              </p>
              <span className="inline-block mt-4 text-[14px] font-medium text-[#0070f3] group-hover:underline">
                Learn more →
              </span>
            </Link>
            <Link href="/solutions#scale" className="group p-6 bg-white border border-[#ebebeb] rounded-[8px] shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] transition-shadow duration-200">
              <div className="text-4xl mb-4">🌐</div>
              <h3 className="text-xl font-semibold mb-2 text-[#171717]">Global Scale</h3>
              <p className="text-[#4d4d4d] text-[14px] leading-relaxed">
                Designed to handle millions of transactions per second worldwide.
              </p>
              <span className="inline-block mt-4 text-[14px] font-medium text-[#0070f3] group-hover:underline">
                Learn more →
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* Products Preview Section */}
      <section className="max-w-[1200px] mx-auto px-6 py-24">
        <h2 className="text-3xl md:text-[48px] font-semibold text-center mb-4 tracking-tight text-[#171717] leading-[1.1]">
          Our Products
        </h2>
        <p className="text-center text-[#888888] text-lg mb-16 max-w-2xl mx-auto">
          Everything you need to build on the CinaCoin network.
        </p>
        <div className="grid md:grid-cols-2 gap-6">
          <Link href="/products#wallet" className="group p-8 bg-white border border-[#ebebeb] rounded-[12px] shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] transition-shadow duration-200">
            <h3 className="text-[24px] font-semibold mb-2 text-[#171717]">CinaCoin Wallet</h3>
            <p className="text-[#4d4d4d] text-[14px] leading-relaxed mb-4">
              Secure, fast, and easy-to-use digital wallet for managing your CinaCoin assets.
            </p>
            <span className="inline-flex items-center text-[14px] font-medium text-[#0070f3] group-hover:underline">
              Explore Wallet →
            </span>
          </Link>
          <Link href="/products#exchange" className="group p-8 bg-white border border-[#ebebeb] rounded-[12px] shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] transition-shadow duration-200">
            <h3 className="text-[24px] font-semibold mb-2 text-[#171717]">CinaCoin Exchange</h3>
            <p className="text-[#4d4d4d] text-[14px] leading-relaxed mb-4">
              Trade CinaCoin and other digital assets with low fees and high liquidity.
            </p>
            <span className="inline-flex items-center text-[14px] font-medium text-[#0070f3] group-hover:underline">
              Explore Exchange →
            </span>
          </Link>
          <Link href="/products#staking" className="group p-8 bg-white border border-[#ebebeb] rounded-[12px] shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] transition-shadow duration-200">
            <h3 className="text-[24px] font-semibold mb-2 text-[#171717]">Staking</h3>
            <p className="text-[#4d4d4d] text-[14px] leading-relaxed mb-4">
              Earn rewards by staking your CinaCoin and securing the network.
            </p>
            <span className="inline-flex items-center text-[14px] font-medium text-[#0070f3] group-hover:underline">
              Start Staking →
            </span>
          </Link>
          <Link href="/developers" className="group p-8 bg-white border border-[#ebebeb] rounded-[12px] shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] transition-shadow duration-200">
            <h3 className="text-[24px] font-semibold mb-2 text-[#171717]">Developer Tools</h3>
            <p className="text-[#4d4d4d] text-[14px] leading-relaxed mb-4">
              Build powerful applications on the CinaCoin blockchain with our SDKs and APIs.
            </p>
            <span className="inline-flex items-center text-[14px] font-medium text-[#0070f3] group-hover:underline">
              View Docs →
            </span>
          </Link>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-[#f5f5f5] border-y border-[#ebebeb]">
        <div className="max-w-[1200px] mx-auto px-6 py-24 text-center">
          <h2 className="text-3xl md:text-[48px] font-semibold mb-6 tracking-tight text-[#171717] leading-[1.1]">
            Ready to Join the Revolution?
          </h2>
          <p className="text-lg text-[#4d4d4d] mb-8 max-w-xl mx-auto leading-relaxed">
            Start using CinaCoin today and be part of the financial future.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href="/products"
              className="inline-flex items-center justify-center px-8 py-3 bg-[#171717] hover:bg-[#000000] text-white rounded-[6px] font-medium text-[14px] transition-colors duration-150 h-10"
            >
              Create Your Wallet
            </Link>
            <Link
              href="/developers"
              className="inline-flex items-center justify-center px-8 py-3 border border-[#ebebeb] hover:border-[#a1a1a1] rounded-[6px] font-medium text-[14px] transition-colors duration-150 text-[#171717] bg-white h-10"
            >
              Read the Docs
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
