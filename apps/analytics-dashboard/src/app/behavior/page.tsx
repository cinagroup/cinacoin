"use client";

import WalletFunnel from "@/components/WalletFunnel";
import ChainDistribution from "@/components/ChainDistribution";
import RetentionCurve from "@/components/RetentionCurve";
import TransactionAnalytics from "@/components/TransactionAnalytics";

export default function BehaviorPage() {
  return (
    <div className="min-h-screen bg-canvas-soft">
      {/* Header */}
      <header className="bg-canvas/80 backdrop-blur-sm border-b border-hairline sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-lg">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-md">
              <a href="/" className="flex items-center gap-md hover:opacity-80 transition-opacity">
                <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h1 className="text-heading-3 text-ink">CinaCoin Analytics</h1>
              </a>
              <span className="text-body-sm text-ink-mute">/</span>
              <span className="text-body-sm text-ink-body">Behavior</span>
            </div>
            <nav className="flex items-center gap-md">
              <a href="/" className="text-body-sm text-ink-mute hover:text-ink transition-colors">Overview</a>
              <a href="/realtime" className="text-body-sm text-ink-mute hover:text-ink transition-colors">Realtime</a>
              <a href="/behavior" className="text-body-sm text-ink font-medium">Behavior</a>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-lg py-xl">
        <div className="mb-lg">
          <h2 className="text-heading-2 text-ink">User Behavior Analytics</h2>
          <p className="text-body text-ink-mute mt-xxs">Wallet connections, chain usage, retention, and transaction patterns</p>
        </div>

        {/* Wallet Funnel */}
        <div className="cc-card p-lg mb-xl">
          <h3 className="text-heading-3 text-ink mb-lg">Wallet Connection Funnel</h3>
          <WalletFunnel />
        </div>

        {/* Chain Distribution */}
        <div className="cc-card p-lg mb-xl">
          <ChainDistribution />
        </div>

        {/* Retention Curve */}
        <div className="cc-card p-lg mb-xl">
          <RetentionCurve />
        </div>

        {/* Transaction Analytics */}
        <div className="mb-xl">
          <TransactionAnalytics />
        </div>
      </main>
    </div>
  );
}
