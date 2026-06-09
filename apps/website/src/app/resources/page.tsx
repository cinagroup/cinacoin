import Link from 'next/link';

export default function ResourcesPage() {
  return (
    <main className="min-h-screen bg-[#fafafa]">
      {/* Hero */}
      <section className="max-w-[1200px] mx-auto px-6 py-24 text-center">
        <h1 className="text-5xl md:text-[64px] font-semibold mb-6 tracking-tight text-[#171717] leading-[1.05]">
          Resources
        </h1>
        <p className="text-lg text-[#4d4d4d] max-w-2xl mx-auto leading-relaxed">
          Learn about CinaCoin, stay up to date, and connect with the community.
        </p>
      </section>

      {/* Resources Grid */}
      <section className="max-w-[1200px] mx-auto px-6 pb-24">
        <div className="grid md:grid-cols-2 gap-6">
          <div id="whitepaper" className="p-8 bg-white border border-[#ebebeb] rounded-[12px] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <h2 className="text-[24px] font-semibold mb-3 text-[#171717]">Whitepaper</h2>
            <p className="text-[#4d4d4d] text-[14px] leading-relaxed mb-4">
              Read the technical whitepaper detailing CinaCoin&apos;s consensus mechanism, tokenomics, and roadmap.
            </p>
            <span className="inline-flex items-center text-[14px] font-medium text-[#0070f3]">
              Download PDF →
            </span>
          </div>

          <div id="blog" className="p-8 bg-white border border-[#ebebeb] rounded-[12px] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <h2 className="text-[24px] font-semibold mb-3 text-[#171717]">Blog</h2>
            <p className="text-[#4d4d4d] text-[14px] leading-relaxed mb-4">
              Latest news, updates, and insights from the CinaCoin team.
            </p>
            <span className="inline-flex items-center text-[14px] font-medium text-[#0070f3]">
              Read Blog →
            </span>
          </div>

          <div id="community" className="p-8 bg-white border border-[#ebebeb] rounded-[12px] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <h2 className="text-[24px] font-semibold mb-3 text-[#171717]">Community</h2>
            <p className="text-[#4d4d4d] text-[14px] leading-relaxed mb-4">
              Join the conversation. Connect with developers, traders, and enthusiasts worldwide.
            </p>
            <div className="flex gap-3">
              <span className="px-3 py-1 bg-[#f5f5f5] rounded-[4px] text-[12px] font-medium text-[#4d4d4d]">Discord</span>
              <span className="px-3 py-1 bg-[#f5f5f5] rounded-[4px] text-[12px] font-medium text-[#4d4d4d]">Twitter</span>
              <span className="px-3 py-1 bg-[#f5f5f5] rounded-[4px] text-[12px] font-medium text-[#4d4d4d]">Telegram</span>
            </div>
          </div>

          <div id="support" className="p-8 bg-white border border-[#ebebeb] rounded-[12px] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <h2 className="text-[24px] font-semibold mb-3 text-[#171717]">Support</h2>
            <p className="text-[#4d4d4d] text-[14px] leading-relaxed mb-4">
              Get help with your CinaCoin wallet, transactions, or technical questions.
            </p>
            <span className="inline-flex items-center text-[14px] font-medium text-[#0070f3]">
              Contact Support →
            </span>
          </div>
        </div>
      </section>
    </main>
  );
}
