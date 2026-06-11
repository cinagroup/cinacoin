"use client";

import dynamic from "next/dynamic";
import SiteHeader from "@/components/SiteHeader";

// Lazy-load heavy behavior analytics components (SVG charts + recharts)
const WalletFunnel = dynamic(() => import("@/components/WalletFunnel"), {
  loading: () => <div className="h-48 flex items-center justify-center text-ink-mute">Loading funnel...</div>,
  ssr: false,
});
const ChainDistribution = dynamic(() => import("@/components/ChainDistribution"), {
  loading: () => <div className="h-48 flex items-center justify-center text-ink-mute">Loading distribution...</div>,
  ssr: false,
});
const RetentionCurve = dynamic(() => import("@/components/RetentionCurve"), {
  loading: () => <div className="h-48 flex items-center justify-center text-ink-mute">Loading retention...</div>,
  ssr: false,
});
const TransactionAnalytics = dynamic(() => import("@/components/TransactionAnalytics"), {
  loading: () => <div className="h-48 flex items-center justify-center text-ink-mute">Loading transactions...</div>,
  ssr: false,
});

export default function BehaviorPage() {
  return (
    <div className="min-h-screen bg-canvas-soft">
      {/* Header */}
      <SiteHeader activePage="behavior" breadcrumb="Behavior" />

      {/* Main Content */}
      <main id="main-content" className="max-w-7xl mx-auto px-lg py-xl">
        <div className="mb-lg">
          <p className="font-mono text-xs text-mute mb-2">BEHAVIOR</p>
          <h2 className="text-heading-2 text-ink">User Behavior Analytics</h2>
          <p className="text-body text-ink-mute mt-xxs">Wallet connections, chain usage, retention, and transaction patterns</p>
        </div>

        {/* Wallet Funnel */}
        <div className="cc-card p-lg mb-xl">
          <p className="font-mono text-xs text-mute mb-2">CONNECTION</p>
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
