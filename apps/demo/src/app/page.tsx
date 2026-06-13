"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowDownToLine, ArrowUpDown, BarChart3, List, TrendingUp, TrendingDown } from "lucide-react";
import DemoLayout from "@/components/DemoLayout";
import { useWallet, shortenAddress } from "@/lib/useWallet";

/* ── Mock sparkline data ── */
function generateMockSparkline(baseValue: number, points = 20): number[] {
  const data: number[] = [];
  let value = baseValue;
  for (let i = 0; i < points; i++) {
    value += (Math.random() - 0.5) * baseValue * 0.05;
    data.push(value);
  }
  return data;
}

function MiniSparkline({ data, positive }: { data: number[]; positive: boolean }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 80;
  const h = 24;

  const pathData = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * (h - 2) - 1;
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="opacity-60">
      <path
        d={pathData}
        fill="none"
        stroke={positive ? 'var(--cc-success)' : 'var(--cc-error)'}
        strokeWidth="1.5"
      />
    </svg>
  );
}

export default function Home() {
  const { account, status, connectors, connect, disconnect } = useWallet();
  const [loading, setLoading] = useState(false);
  const [sparklines, setSparklines] = useState<Record<string, number[]>>({});

  const isConnected = status === "connected";
  const primaryConnector = connectors.find((c) => c.id === "io.metamask") ?? connectors[0];

  const handleConnect = async () => {
    setLoading(true);
    await connect(primaryConnector?.id ?? "io.metamask");
    setLoading(false);
  };

  // Generate sparklines on mount
  useEffect(() => {
    setSparklines({
      balance: generateMockSparkline(100),
      network: generateMockSparkline(50),
      tokens: generateMockSparkline(75),
      activity: generateMockSparkline(60),
    });
  }, []);

  // Format balance with proper locale
  const formatBalance = (balance: string) => {
    const num = parseFloat(balance);
    if (isNaN(num)) return "0.00";
    return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 });
  };

  const formatUSD = (amount: number) => {
    return amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <DemoLayout>
      <div className="max-w-5xl mx-auto px-4 py-12 cc-page-enter">
        {!isConnected ? (
          /* Connect Prompt */
          <div className="text-center py-20">
            <div className="mb-6 flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-[var(--cc-link)] to-[var(--cc-violet)] rounded-sm blur-xl opacity-20 animate-pulse" />
                <svg className="relative h-16 w-16 text-[var(--cc-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                </svg>
              </div>
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
              className="px-8 py-3 bg-[var(--cc-primary)] text-[var(--cc-on-primary)] hover:bg-[var(--cc-primary-hover)] disabled:opacity-50 rounded-[var(--cc-radius-sm)] font-semibold transition-all shadow-[var(--cc-level3)] hover:shadow-[var(--cc-level4)] active:scale-[0.98]"
            >
              {loading ? "Connecting..." : "Connect Wallet"}
            </button>
          </div>
        ) : (
          /* Dashboard */
          <div className="space-y-6">
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
                className="px-4 py-2 text-body-sm font-semibold text-[var(--cc-body)] border border-[var(--cc-hairline)] rounded-[var(--cc-radius-sm)] hover:text-[var(--cc-ink)] hover:border-[var(--cc-hairline-strong)] transition-all"
              >
                Disconnect
              </button>
            </div>

            {/* Stats Grid */}
            <div className="grid md:grid-cols-2 gap-6 cc-stagger">
              {/* Balance Card */}
              <div className="p-6 border border-[var(--cc-hairline)] rounded-[var(--cc-radius-md)] bg-[var(--cc-canvas)] hover:shadow-[var(--cc-level2)] transition-shadow cc-animate-slide-up">
                <div className="flex items-start justify-between mb-3">
                  <p className="text-[var(--cc-muted)] text-body-sm">Your Balance</p>
                  {sparklines.balance && (
                    <MiniSparkline data={sparklines.balance} positive={true} />
                  )}
                </div>
                <p className="text-display-xl font-semibold tracking-tighter text-[var(--cc-ink)] mb-1 cc-tabular-nums">
                  {formatBalance(account.balance)} <span className="text-body-lg text-[var(--cc-muted)]">{account.chainSymbol}</span>
                </p>
                <p className="text-[var(--cc-body)] text-body-sm cc-tabular-nums">
                  ≈ ${formatUSD(parseFloat(account.balance) * 3800)} USD
                </p>
              </div>

              {/* Network Info */}
              <div className="p-6 border border-[var(--cc-hairline)] rounded-[var(--cc-radius-md)] bg-[var(--cc-canvas)] hover:shadow-[var(--cc-level2)] transition-shadow cc-animate-slide-up">
                <div className="flex items-start justify-between mb-3">
                  <p className="text-[var(--cc-muted)] text-body-sm">Network</p>
                  {sparklines.network && (
                    <MiniSparkline data={sparklines.network} positive={true} />
                  )}
                </div>
                <p className="text-display-sm font-semibold text-[var(--cc-ink)] mb-2">{account.chainName}</p>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-[var(--cc-success)] rounded-sm animate-pulse"></span>
                  <span className="text-[var(--cc-success)] text-body-sm">Connected</span>
                  <span className="text-[var(--cc-muted)] text-caption ml-auto">Chain ID: {account.chainId}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="p-6 border border-[var(--cc-hairline)] rounded-[var(--cc-radius-md)] bg-[var(--cc-canvas)]">
              <h3 className="text-display-sm font-semibold tracking-tighter text-[var(--cc-ink)] mb-6">
                Quick actions.
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 cc-stagger">
                <Link
                  href="/tokens"
                  className="p-4 border border-[var(--cc-hairline)] rounded-[var(--cc-radius-sm)] hover:border-[var(--cc-hairline-strong)] hover:shadow-[var(--cc-level1)] transition-all group cc-animate-slide-up cc-hover-lift"
                >
                  <div className="flex items-center justify-between mb-3">
                    <ArrowDownToLine className="h-6 w-6 text-[var(--cc-muted)] group-hover:text-[var(--cc-link)] transition-colors" />
                    {sparklines.tokens && (
                      <MiniSparkline data={sparklines.tokens} positive={true} />
                    )}
                  </div>
                  <span className="text-body-sm font-medium text-[var(--cc-ink)]">Tokens</span>
                  <p className="text-caption text-[var(--cc-muted)] mt-1">Manage portfolio</p>
                </Link>
                <Link
                  href="/swap"
                  className="p-4 border border-[var(--cc-hairline)] rounded-[var(--cc-radius-sm)] hover:border-[var(--cc-hairline-strong)] hover:shadow-[var(--cc-level1)] transition-all group cc-animate-slide-up cc-hover-lift"
                >
                  <div className="flex items-center justify-between mb-3">
                    <ArrowUpDown className="h-6 w-6 text-[var(--cc-muted)] group-hover:text-[var(--cc-link)] transition-colors" />
                    {sparklines.activity && (
                      <MiniSparkline data={sparklines.activity} positive={false} />
                    )}
                  </div>
                  <span className="text-body-sm font-medium text-[var(--cc-ink)]">Swap</span>
                  <p className="text-caption text-[var(--cc-muted)] mt-1">Exchange tokens</p>
                </Link>
                <Link
                  href="/multi-chain"
                  className="p-4 border border-[var(--cc-hairline)] rounded-[var(--cc-radius-sm)] hover:border-[var(--cc-hairline-strong)] hover:shadow-[var(--cc-level1)] transition-all group cc-animate-slide-up cc-hover-lift"
                >
                  <div className="flex items-center justify-between mb-3">
                    <BarChart3 className="h-6 w-6 text-[var(--cc-muted)] group-hover:text-[var(--cc-link)] transition-colors" />
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3 text-[var(--cc-success)]" />
                      <span className="text-caption text-[var(--cc-success)]">+2.4%</span>
                    </div>
                  </div>
                  <span className="text-body-sm font-medium text-[var(--cc-ink)]">Multi-Chain</span>
                  <p className="text-caption text-[var(--cc-muted)] mt-1">Cross-chain assets</p>
                </Link>
                <Link
                  href="/activity"
                  className="p-4 border border-[var(--cc-hairline)] rounded-[var(--cc-radius-sm)] hover:border-[var(--cc-hairline-strong)] hover:shadow-[var(--cc-level1)] transition-all group cc-animate-slide-up cc-hover-lift"
                >
                  <div className="flex items-center justify-between mb-3">
                    <List className="h-6 w-6 text-[var(--cc-muted)] group-hover:text-[var(--cc-link)] transition-colors" />
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-[var(--cc-success)] rounded-sm animate-pulse" />
                      <span className="text-caption text-[var(--cc-muted)]">Live</span>
                    </div>
                  </div>
                  <span className="text-body-sm font-medium text-[var(--cc-ink)]">Activity</span>
                  <p className="text-caption text-[var(--cc-muted)] mt-1">Transaction history</p>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </DemoLayout>
  );
}
