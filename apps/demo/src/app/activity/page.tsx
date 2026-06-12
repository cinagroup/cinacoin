"use client";

import { useState, useEffect } from "react";
import { ArrowUpRight, ArrowDownLeft, ArrowRightLeft, Loader2, ExternalLink, Filter } from "lucide-react";
import DemoLayout from "@/components/DemoLayout";
import { useWallet, shortenAddress } from "@/lib/useWallet";

/* ── Mock transaction data with realistic timestamps ── */
const MOCK_TRANSACTIONS = [
  {
    hash: "0x1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z",
    type: "send" as const,
    from: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    to: "0x8ba1f109551bD432803012645Ac136ddd64DBA72",
    value: "0.5",
    timestamp: Date.now() - 2 * 60 * 1000, // 2 min ago
    status: "confirmed" as const,
  },
  {
    hash: "0x2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z1a",
    type: "receive" as const,
    from: "0x9c1d2e3f4g5h6i7j8k9l0m1n2o3p4q5r6s7t8u9v",
    to: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    value: "1.25",
    timestamp: Date.now() - 45 * 60 * 1000, // 45 min ago
    status: "confirmed" as const,
  },
  {
    hash: "0x3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z1a2b",
    type: "swap" as const,
    from: "0xUniswapRouter",
    to: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    value: "0.1",
    timestamp: Date.now() - 3 * 60 * 60 * 1000, // 3 hours ago
    status: "confirmed" as const,
  },
  {
    hash: "0x4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z1a2b3c",
    type: "send" as const,
    from: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    to: "0xAlice1234567890abcdef",
    value: "0.05",
    timestamp: Date.now() - 24 * 60 * 60 * 1000, // 1 day ago
    status: "confirmed" as const,
  },
  {
    hash: "0x5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z1a2b3c4d",
    type: "receive" as const,
    from: "0xBob9876543210fedcba",
    to: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    value: "2.0",
    timestamp: Date.now() - 2 * 24 * 60 * 60 * 1000, // 2 days ago
    status: "confirmed" as const,
  },
];

/* ── Relative time formatter ── */
function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  if (hours < 24) return `${hours} hr ago`;
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return new Date(timestamp).toLocaleDateString();
}

/* ── Transaction icon ── */
function TransactionIcon({ type }: { type: "send" | "receive" | "swap" }) {
  const iconClass = "w-4 h-4";
  
  if (type === "send") {
    return (
      <div className="w-9 h-9 rounded-full bg-[var(--cc-error)]/15 border border-[var(--cc-error)]/25 flex items-center justify-center">
        <ArrowUpRight className={`${iconClass} text-[var(--cc-error)]`} />
      </div>
    );
  }
  
  if (type === "receive") {
    return (
      <div className="w-9 h-9 rounded-full bg-[var(--cc-success)]/15 border border-[var(--cc-success)]/25 flex items-center justify-center">
        <ArrowDownLeft className={`${iconClass} text-[var(--cc-success)]`} />
      </div>
    );
  }
  
  return (
    <div className="w-9 h-9 rounded-full bg-[var(--cc-link)]/15 border border-[var(--cc-primary)]/25 flex items-center justify-center">
      <ArrowRightLeft className={`${iconClass} text-[var(--cc-link)]`} />
    </div>
  );
}

export default function ActivityPage() {
  const { account, status } = useWallet();
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "send" | "receive" | "swap">("all");

  const isConnected = status === "connected";

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const filteredTransactions = MOCK_TRANSACTIONS.filter(
    (tx) => filter === "all" || tx.type === filter
  );

  if (!isConnected) {
    return (
      <DemoLayout>
        <div className="max-w-4xl mx-auto px-4 py-12 text-center cc-page-enter">
          <p className="font-mono text-xs text-[var(--cc-muted)] mb-2">ACTIVITY</p>
          <h1 className="text-display-lg font-semibold tracking-tighter text-[var(--cc-ink)] mb-4">
            Transaction history.
          </h1>
          <p className="text-[var(--cc-body)]">Connect your wallet to view your transaction history.</p>
        </div>
      </DemoLayout>
    );
  }

  return (
    <DemoLayout>
      <div className="max-w-4xl mx-auto px-4 py-12 cc-page-enter">
        {/* Header */}
        <div className="mb-8">
          <p className="font-mono text-xs text-[var(--cc-muted)] mb-2">ACTIVITY</p>
          <h1 className="text-display-lg font-semibold tracking-tighter text-[var(--cc-ink)] mb-2">
            Transaction history.
          </h1>
          <p className="text-[var(--cc-body)] text-body-sm">
            {MOCK_TRANSACTIONS.length} transactions · Last activity {formatRelativeTime(MOCK_TRANSACTIONS[0].timestamp)}
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 mb-6 p-1 bg-[var(--cc-canvas-soft-2)]/60 border border-[var(--cc-hairline)] rounded-full w-fit">
          {(["all", "send", "receive", "swap"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-4 py-1.5 text-caption font-medium rounded-full transition-all ${
                filter === type
                  ? 'bg-[var(--cc-canvas)] text-[var(--cc-ink)] shadow-[var(--cc-level1)]'
                  : 'text-[var(--cc-muted)] hover:text-[var(--cc-body)]'
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>

        {/* Transaction List */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="p-4 border border-[var(--cc-hairline)] rounded-[var(--cc-radius-md)] bg-[var(--cc-canvas)]">
                <div className="flex items-center gap-4">
                  <div className="cc-skeleton cc-skeleton-circle w-9 h-9" />
                  <div className="flex-1 space-y-2">
                    <div className="cc-skeleton cc-skeleton-text w-32" />
                    <div className="cc-skeleton cc-skeleton-text w-24" />
                  </div>
                  <div className="space-y-2 text-right">
                    <div className="cc-skeleton cc-skeleton-text w-20" />
                    <div className="cc-skeleton cc-skeleton-text w-16" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--cc-canvas-soft-2)] mb-4">
              <Filter className="h-8 w-8 text-[var(--cc-muted)]" />
            </div>
            <p className="text-[var(--cc-body)] mb-2">No transactions found</p>
            <p className="text-caption text-[var(--cc-muted)]">Try adjusting your filter</p>
          </div>
        ) : (
          <div className="space-y-2 cc-stagger">
            {filteredTransactions.map((tx) => (
              <div
                key={tx.hash}
                className="p-4 border border-[var(--cc-hairline)] rounded-[var(--cc-radius-md)] bg-[var(--cc-canvas)] hover:shadow-[var(--cc-level1)] transition-all group cc-animate-slide-up"
              >
                <div className="flex items-center gap-4">
                  {/* Icon */}
                  <TransactionIcon type={tx.type} />

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-body-sm text-[var(--cc-ink)] capitalize">
                        {tx.type}
                      </p>
                      <span className="text-caption text-[var(--cc-muted)]">
                        {formatRelativeTime(tx.timestamp)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-caption text-[var(--cc-body)]">
                      <span className="font-mono">
                        {tx.type === "send" ? `To: ${shortenAddress(tx.to)}` :
                         tx.type === "receive" ? `From: ${shortenAddress(tx.from)}` :
                         `Via ${shortenAddress(tx.from)}`}
                      </span>
                    </div>
                  </div>

                  {/* Value & Hash */}
                  <div className="text-right">
                    <p className={`font-semibold cc-tabular-nums ${
                      tx.type === "receive" ? 'text-[var(--cc-success)]' : 'text-[var(--cc-ink)]'
                    }`}>
                      {tx.type === "receive" ? "+" : tx.type === "send" ? "-" : ""}
                      {tx.value} ETH
                    </p>
                    <div className="flex items-center justify-end gap-1 mt-1">
                      <span className="text-caption text-[var(--cc-muted)] font-mono">
                        {shortenAddress(tx.hash)}
                      </span>
                      <ExternalLink className="w-3 h-3 text-[var(--cc-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DemoLayout>
  );
}
