import Link from 'next/link';

export default function DevelopersPage() {
  return (
    <main className="min-h-screen bg-[#fafafa]">
      {/* Hero */}
      <section className="max-w-[1200px] mx-auto px-6 py-24 text-center">
        <h1 className="text-5xl md:text-[64px] font-semibold mb-6 tracking-tight text-[#171717] leading-[1.05]">
          Developers
        </h1>
        <p className="text-lg text-[#4d4d4d] max-w-2xl mx-auto leading-relaxed">
          Build the future of finance. Tools, docs, and resources to get you started.
        </p>
      </section>

      {/* Quick Start */}
      <section className="max-w-[1200px] mx-auto px-6 pb-16">
        <div className="p-8 bg-white border border-[#ebebeb] rounded-[12px] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <h2 className="text-[24px] font-semibold mb-4 text-[#171717]">Quick Start</h2>
          <p className="text-[#4d4d4d] text-[14px] leading-relaxed mb-6">
            Get up and running with CinaCoin in minutes. Install the SDK and make your first API call.
          </p>
          <div className="bg-[#f5f5f5] border border-[#ebebeb] rounded-[8px] p-4 font-mono text-[14px] text-[#171717] overflow-x-auto">
            <p className="text-[#888888]"># Install the CinaCoin SDK</p>
            <p>npm install @cinacoin/sdk</p>
            <br />
            <p className="text-[#888888]"># Initialize and connect</p>
            <p>{`import { CinaCoin } from '@cinacoin/sdk'`}</p>
            <p>{`const client = new CinaCoin({ network: 'mainnet' })`}</p>
            <p>{`const balance = await client.getBalance(address)`}</p>
          </div>
        </div>
      </section>

      {/* Resources Grid */}
      <section className="max-w-[1200px] mx-auto px-6 pb-24">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div id="api" className="p-6 bg-white border border-[#ebebeb] rounded-[8px] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <h3 className="text-[20px] font-semibold mb-2 text-[#171717]">API Reference</h3>
            <p className="text-[#4d4d4d] text-[14px] leading-relaxed mb-4">
              Complete reference for all CinaCoin API endpoints, parameters, and response formats.
            </p>
            <span className="text-[14px] font-medium text-[#0070f3]">View API Docs →</span>
          </div>

          <div id="sdks" className="p-6 bg-white border border-[#ebebeb] rounded-[8px] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <h3 className="text-[20px] font-semibold mb-2 text-[#171717]">SDKs & Libraries</h3>
            <p className="text-[#4d4d4d] text-[14px] leading-relaxed mb-4">
              Official SDKs for JavaScript, Python, Go, Rust, and more.
            </p>
            <span className="text-[14px] font-medium text-[#0070f3]">Browse SDKs →</span>
          </div>

          <div id="github" className="p-6 bg-white border border-[#ebebeb] rounded-[8px] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <h3 className="text-[20px] font-semibold mb-2 text-[#171717]">GitHub</h3>
            <p className="text-[#4d4d4d] text-[14px] leading-relaxed mb-4">
              Open source repositories, contribute to the project, and report issues.
            </p>
            <span className="text-[14px] font-medium text-[#0070f3]">View Repositories →</span>
          </div>

          <div className="p-6 bg-white border border-[#ebebeb] rounded-[8px] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <h3 className="text-[20px] font-semibold mb-2 text-[#171717]">Tutorials</h3>
            <p className="text-[#4d4d4d] text-[14px] leading-relaxed mb-4">
              Step-by-step guides for common development tasks and integrations.
            </p>
            <span className="text-[14px] font-medium text-[#0070f3]">Start Learning →</span>
          </div>

          <div className="p-6 bg-white border border-[#ebebeb] rounded-[8px] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <h3 className="text-[20px] font-semibold mb-2 text-[#171717]">Smart Contracts</h3>
            <p className="text-[#4d4d4d] text-[14px] leading-relaxed mb-4">
              Write, test, and deploy smart contracts on the CinaCoin network.
            </p>
            <span className="text-[14px] font-medium text-[#0070f3]">Learn Solidity →</span>
          </div>

          <div className="p-6 bg-white border border-[#ebebeb] rounded-[8px] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <h3 className="text-[20px] font-semibold mb-2 text-[#171717]">Testnet</h3>
            <p className="text-[#4d4d4d] text-[14px] leading-relaxed mb-4">
              Free testnet tokens and sandbox environment for development and testing.
            </p>
            <span className="text-[14px] font-medium text-[#0070f3]">Get Test Tokens →</span>
          </div>
        </div>
      </section>
    </main>
  );
}
