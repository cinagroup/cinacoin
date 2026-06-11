"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowDownToLine, ArrowUpDown, BarChart3, List } from "lucide-react";
import DemoLayout from "@/components/DemoLayout";
import { useWallet, shortenAddress } from "@/lib/useWallet";

export default function Home() {
  const { account, status, connectors, connect, disconnect } = useWallet();
  const [loading, setLoading] = useState(false);

  const isConnected = status === "connected";
  const primaryConnector = connectors.find((c) => c.id === "io.metamask") ?? connectors[0];

  const handleConnect = async () => {
    setLoading(true);
    await connect(primaryConnector?.id ?? "io.metamask");
    setLoading(false);
  };

  return (
    <DemoLayout>
      <div className="max-w-4xl mx-auto px-4 py-12">
        {!isConnected ? (
          /* Connect Prompt */
          <div className="text-center py-20">
            <div className="mb-6 flex justify-center">
              <svg className="h-16 w-16 text-[var(--cc-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
              </svg>
            </div>
            <h2 className="text-display-lg font-semibold tracking-tighter text-[var(--cc-ink)] mb-4">
              Welcome to the CinaCoin demo.
            </h2>
            <p className="text-[var(--cc-body)] mb-8 max-w-md mx-auto">
              Connect your wallet to explore wallet management, transactions, and more.
            </p>
            <button
              onClick={handleConnect}
              disabled={loading}
              className="px-8 py-3 bg-[var(--cc-primary)] text-[var(--cc-on-primary)] hover:opacity-90 disabled:opacity-50 rounded-[6px] font-semibold transition-all"
            >
              {loading ? "Connecting..." : "Connect Wallet"}
            </button>
          </div>
        ) : (
          /* Dashboard */
          <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-mono text-xs text-[var(--cc-muted)] mb-2">DASHBOARD</p>
                <h1 className="text-display-lg font-semibold tracking-tighter text-[var(--cc-ink)]">
                  Dashboard.
                </h1>
                <p className="text-[var(--cc-body)] text-body-sm mt-1">
                  {account.chainName} · {shortenAddress(account.address ?? "")}
                </p>
              </div>
              <button
                onClick={disconnect}
                className="px-4 py-2 text-body-sm font-semibold text-[var(--cc-body)] border border-[var(--cc-hairline)] rounded-[6px] hover:text-[var(--cc-ink)] hover:border-[var(--cc-hairline-strong)] transition-all"
              >
                Disconnect
              </button>
            </div>

            {/* Stats Grid */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Balance Card */}
              <div className="p-6 border border-[var(--cc-hairline)] rounded-[8px] bg-[var(--cc-canvas)] hover:shadow-[var(--cc-level2)] transition-shadow">
                <p className="text-[var(--cc-muted)] text-body-sm mb-2">Your Balance</p>
                <p className="text-display-xl font-semibold tracking-tighter text-[var(--cc-ink)] mb-1">
                  {account.balance} <span className="text-body-lg text-[var(--cc-muted)]">{account.chainSymbol}</span>
                </p>
                <p className="text-[var(--cc-body)] text-body-sm">≈ ${(parseFloat(account.balance) * 0.42).toFixed(2)} USD</p>
              </div>

              {/* Network Info */}
              <div className="p-6 border border-[var(--cc-hairline)] rounded-[8px] bg-[var(--cc-canvas)] hover:shadow-[var(--cc-level2)] transition-shadow">
                <p className="text-[var(--cc-muted)] text-body-sm mb-2">Network</p>
                <p className="text-display-sm font-semibold text-[var(--cc-ink)] mb-1">{account.chainName}</p>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-[var(--cc-success)] rounded-full animate-pulse"></span>
                  <span className="text-[var(--cc-success)] text-body-sm">Connected</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="p-6 border border-[var(--cc-hairline)] rounded-[8px] bg-[var(--cc-canvas)]">
              <h3 className="text-display-sm font-semibold tracking-tighter text-[var(--cc-ink)] mb-6">
                Quick actions.
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Link
                  href="/tokens"
                  className="p-4 border border-[var(--cc-hairline)] rounded-[6px] hover:border-[var(--cc-hairline-strong)] hover:shadow-[var(--cc-level1)] transition-all text-center group"
                >
                  <div className="flex justify-center mb-2 group-hover:scale-110 transition-transform">
                    <ArrowDownToLine className="h-8 w-8 text-[var(--cc-muted)]" />
                  </div>
                  <span className="text-body-sm font-medium text-[var(--cc-ink)]">Tokens</span>
                </Link>
                <Link
                  href="/swap"
                  className="p-4 border border-[var(--cc-hairline)] rounded-[6px] hover:border-[var(--cc-hairline-strong)] hover:shadow-[var(--cc-level1)] transition-all text-center group"
                >
                  <div className="flex justify-center mb-2 group-hover:scale-110 transition-transform">
                    <ArrowUpDown className="h-8 w-8 text-[var(--cc-muted)]" />
                  </div>
                  <span className="text-body-sm font-medium text-[var(--cc-ink)]">Swap</span>
                </Link>
                <Link
                  href="/multi-chain"
                  className="p-4 border border-[var(--cc-hairline)] rounded-[6px] hover:border-[var(--cc-hairline-strong)] hover:shadow-[var(--cc-level1)] transition-all text-center group"
                >
                  <div className="flex justify-center mb-2 group-hover:scale-110 transition-transform">
                    <BarChart3 className="h-8 w-8 text-[var(--cc-muted)]" />
                  </div>
                  <span className="text-body-sm font-medium text-[var(--cc-ink)]">Multi-Chain</span>
                </Link>
                <Link
                  href="/activity"
                  className="p-4 border border-[var(--cc-hairline)] rounded-[6px] hover:border-[var(--cc-hairline-strong)] hover:shadow-[var(--cc-level1)] transition-all text-center group"
                >
                  <div className="flex justify-center mb-2 group-hover:scale-110 transition-transform">
                    <List className="h-8 w-8 text-[var(--cc-muted)]" />
                  </div>
                  <span className="text-body-sm font-medium text-[var(--cc-ink)]">Activity</span>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </DemoLayout>
  );
}
