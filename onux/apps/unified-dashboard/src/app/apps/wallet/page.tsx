"use client";

import MetricCard from "@/components/MetricCard";

/**
 * Wallet Explorer page.
 */
export default function WalletPage() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold text-[var(--cc-ink)]">Wallet Explorer</h1>
        <p className="text-sm text-[var(--cc-muted)] mt-1">
          Explore wallets, transactions, and on-chain activity
        </p>
      </div>

      {/* Summary metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Wallets"
          value="48.2K"
          delta={{ value: 5.8, isPositive: true }}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
            </svg>
          }
        />
        <MetricCard
          title="Transactions (24h)"
          value="12.4K"
          delta={{ value: 22.1, isPositive: true }}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
            </svg>
          }
        />
        <MetricCard
          title="Total Value Locked"
          value="$8.4M"
          delta={{ value: 3.2, isPositive: true }}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          }
        />
        <MetricCard
          title="Active Chains"
          value="12"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-2.04a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
            </svg>
          }
        />
      </div>

      {/* Recent transactions */}
      <div className="cc-card overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--cc-hairline)]">
          <h3 className="text-sm font-semibold text-[var(--cc-ink)]">Recent Transactions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[var(--cc-canvas-soft)]">
                <th className="text-left py-3 px-5 text-[var(--cc-muted)] font-medium">Hash</th>
                <th className="text-left py-3 px-5 text-[var(--cc-muted)] font-medium">From</th>
                <th className="text-left py-3 px-5 text-[var(--cc-muted)] font-medium">To</th>
                <th className="text-right py-3 px-5 text-[var(--cc-muted)] font-medium">Value</th>
                <th className="text-right py-3 px-5 text-[var(--cc-muted)] font-medium">Chain</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--cc-hairline)]">
              {[
                { hash: "0x1a2b...3c4d", from: "0xabcd...ef01", to: "0x1234...5678", value: "1.5 ETH", chain: "Ethereum" },
                { hash: "0x5e6f...7g8h", from: "0x9abc...def0", to: "0x2345...6789", value: "100 USDC", chain: "Polygon" },
                { hash: "0x9i0j...1k2l", from: "0x3456...7890", to: "0xabcd...ef01", value: "0.5 BTC", chain: "Bitcoin" },
                { hash: "0x3m4n...5o6p", from: "0x7890...1234", to: "0x5678...9abc", value: "50 SOL", chain: "Solana" },
              ].map((tx, i) => (
                <tr key={i} className="hover:bg-[var(--cc-canvas-soft)] transition-colors">
                  <td className="py-3 px-5 font-mono text-xs text-[var(--cc-brand)]">{tx.hash}</td>
                  <td className="py-3 px-5 font-mono text-xs text-[var(--cc-ink-soft)]">{tx.from}</td>
                  <td className="py-3 px-5 font-mono text-xs text-[var(--cc-ink-soft)]">{tx.to}</td>
                  <td className="py-3 px-5 text-right text-[var(--cc-ink)]">{tx.value}</td>
                  <td className="py-3 px-5 text-right">
                    <span className="cc-badge cc-badge-info">{tx.chain}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
