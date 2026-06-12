"use client";

import { useState, useEffect } from "react";
import { Search, Plus, TrendingUp, TrendingDown, MoreHorizontal } from "lucide-react";
import DemoLayout from "@/components/DemoLayout";
import { useWallet } from "@/lib/useWallet";
import { useToast } from "@/lib/toast";

/* ── Mock token data with realistic values ── */
const MOCK_TOKENS = [
  { symbol: "ETH", name: "Ethereum", balance: "2.4521", usdValue: 9318.00, change: 2.4, color: "#627EEA" },
  { symbol: "USDC", name: "USD Coin", balance: "1,250.00", usdValue: 1250.00, change: 0.01, color: "#2775CA" },
  { symbol: "WBTC", name: "Wrapped Bitcoin", balance: "0.0842", usdValue: 5420.00, change: -1.2, color: "#F7931A" },
  { symbol: "LINK", name: "Chainlink", balance: "45.00", usdValue: 675.00, change: 5.8, color: "#2A5ADA" },
  { symbol: "UNI", name: "Uniswap", balance: "120.00", usdValue: 840.00, change: -0.5, color: "#FF007A" },
  { symbol: "AAVE", name: "Aave", balance: "8.50", usdValue: 1275.00, change: 3.2, color: "#B6509E" },
];

/* ── Sparkline component ── */
function TokenSparkline({ positive }: { positive: boolean }) {
  const points = Array.from({ length: 20 }, (_, i) => {
    const base = positive ? 50 + i * 0.5 : 50 - i * 0.3;
    return base + (Math.random() - 0.5) * 10;
  });
  
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const w = 60;
  const h = 20;

  const pathData = points
    .map((v, i) => {
      const x = (i / (points.length - 1)) * w;
      const y = h - ((v - min) / range) * (h - 2) - 1;
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="opacity-70">
      <path
        d={pathData}
        fill="none"
        stroke={positive ? 'var(--cc-success)' : 'var(--cc-error)'}
        strokeWidth="1.5"
      />
    </svg>
  );
}

export default function TokensPage() {
  const { status } = useWallet();
  const { success } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const isConnected = status === "connected";

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  const filteredTokens = MOCK_TOKENS.filter(
    (t) =>
      t.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalValue = MOCK_TOKENS.reduce((sum, t) => sum + t.usdValue, 0);

  const formatUSD = (value: number) => {
    return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  if (!isConnected) {
    return (
      <DemoLayout>
        <div className="max-w-4xl mx-auto px-4 py-12 text-center cc-page-enter">
          <p className="font-mono text-xs text-[var(--cc-muted)] mb-2">TOKENS</p>
          <h1 className="text-display-lg font-semibold tracking-tighter text-[var(--cc-ink)] mb-4">
            Your tokens.
          </h1>
          <p className="text-[var(--cc-body)]">Connect your wallet to view your token portfolio.</p>
        </div>
      </DemoLayout>
    );
  }

  return (
    <DemoLayout>
      <div className="max-w-4xl mx-auto px-4 py-12 cc-page-enter">
        {/* Header */}
        <div className="mb-8">
          <p className="font-mono text-xs text-[var(--cc-muted)] mb-2">TOKENS</p>
          <div className="flex items-end justify-between mb-4">
            <div>
              <h1 className="text-display-lg font-semibold tracking-tighter text-[var(--cc-ink)]">
                Your tokens.
              </h1>
              <p className="text-[var(--cc-body)] text-body-sm mt-1">
                {MOCK_TOKENS.length} tokens · ${formatUSD(totalValue)} total value
              </p>
            </div>
            <button
              onClick={() => success("Coming soon", "Import tokens feature is under development")}
              className="px-4 py-2 bg-[var(--cc-primary)] text-[var(--cc-on-primary)] hover:bg-[var(--cc-primary-hover)] rounded-[var(--cc-radius-sm)] font-semibold text-body-sm transition-all shadow-[var(--cc-level2)] hover:shadow-[var(--cc-level3)] active:scale-[0.98] flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Import
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--cc-muted)]" />
          <input
            type="text"
            placeholder="Search tokens..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[var(--cc-canvas)] border border-[var(--cc-hairline)] rounded-[var(--cc-radius-sm)] text-[var(--cc-ink)] placeholder:text-[var(--cc-muted)] focus:outline-none focus:border-[var(--cc-hairline-strong)] focus:shadow-[var(--cc-level1)] transition-all"
          />
        </div>

        {/* Token List */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="p-4 border border-[var(--cc-hairline)] rounded-[var(--cc-radius-md)] bg-[var(--cc-canvas)]">
                <div className="flex items-center gap-4">
                  <div className="cc-skeleton cc-skeleton-circle w-10 h-10" />
                  <div className="flex-1 space-y-2">
                    <div className="cc-skeleton cc-skeleton-text w-24" />
                    <div className="cc-skeleton cc-skeleton-text w-16" />
                  </div>
                  <div className="space-y-2 text-right">
                    <div className="cc-skeleton cc-skeleton-text w-20 ml-auto" />
                    <div className="cc-skeleton cc-skeleton-text w-16 ml-auto" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredTokens.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--cc-canvas-soft-2)] mb-4">
              <Search className="h-8 w-8 text-[var(--cc-muted)]" />
            </div>
            <p className="text-[var(--cc-body)] mb-2">No tokens found</p>
            <p className="text-caption text-[var(--cc-muted)]">Try adjusting your search query</p>
          </div>
        ) : (
          <div className="space-y-2 cc-stagger">
            {filteredTokens.map((token) => (
              <div
                key={token.symbol}
                className="p-4 border border-[var(--cc-hairline)] rounded-[var(--cc-radius-md)] bg-[var(--cc-canvas)] hover:shadow-[var(--cc-level2)] transition-all group cc-animate-slide-up"
              >
                <div className="flex items-center gap-4">
                  {/* Token Icon */}
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-[var(--cc-on-primary)] font-semibold text-body-sm shadow-[var(--cc-level1)]"
                    style={{ backgroundColor: token.color }}
                  >
                    {token.symbol.slice(0, 2)}
                  </div>

                  {/* Token Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-[var(--cc-ink)]">{token.symbol}</p>
                      <span className="text-caption text-[var(--cc-muted)]">{token.name}</span>
                    </div>
                    <p className="text-caption text-[var(--cc-body)] mt-0.5 cc-tabular-nums">
                      {token.balance} {token.symbol}
                    </p>
                  </div>

                  {/* Sparkline */}
                  <div className="hidden sm:block">
                    <TokenSparkline positive={token.change > 0} />
                  </div>

                  {/* Value & Change */}
                  <div className="text-right min-w-[100px]">
                    <p className="font-semibold text-[var(--cc-ink)] cc-tabular-nums">
                      ${formatUSD(token.usdValue)}
                    </p>
                    <div className="flex items-center justify-end gap-1 mt-0.5">
                      {token.change > 0 ? (
                        <TrendingUp className="w-3 h-3 text-[var(--cc-success)]" />
                      ) : token.change < 0 ? (
                        <TrendingDown className="w-3 h-3 text-[var(--cc-error)]" />
                      ) : null}
                      <span
                        className={`text-caption cc-tabular-nums ${
                          token.change > 0
                            ? "text-[var(--cc-success)]"
                            : token.change < 0
                            ? "text-[var(--cc-error)]"
                            : "text-[var(--cc-muted)]"
                        }`}
                      >
                        {token.change > 0 ? "+" : ""}
                        {token.change.toFixed(2)}%
                      </span>
                    </div>
                  </div>

                  {/* More Menu */}
                  <button className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-[var(--cc-canvas-soft-2)] rounded transition-all">
                    <MoreHorizontal className="w-4 h-4 text-[var(--cc-muted)]" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DemoLayout>
  );
}
