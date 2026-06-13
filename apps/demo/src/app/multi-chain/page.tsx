"use client";

import { useState, useEffect } from "react";
import { Globe, Check, ArrowRightLeft, Loader2, ExternalLink, AlertCircle } from "lucide-react";
import DemoLayout from "@/components/DemoLayout";
import { useWallet } from "@/lib/useWallet";
import { useToast } from "@/lib/toast";
import { switchChain, type ChainConfig } from "@/lib/multiChain";

/* ── Mock chain balances ── */
const CHAIN_BALANCES: Record<string, { balance: string; usdValue: number; tokens: number }> = {
  "1": { balance: "2.4521", usdValue: 9318.00, tokens: 6 },
  "137": { balance: "145.20", usdValue: 145.20, tokens: 3 },
  "10": { balance: "0.892", usdValue: 3389.60, tokens: 4 },
  "42161": { balance: "12.45", usdValue: 47310.00, tokens: 5 },
  "8453": { balance: "0.00", usdValue: 0, tokens: 0 },
  "43114": { balance: "28.50", usdValue: 1083.00, tokens: 2 },
};

/* ── Chain explorer URLs ── */
const EXPLORER_URLS: Record<string, string> = {
  "1": "https://etherscan.io",
  "137": "https://polygonscan.com",
  "10": "https://optimistic.etherscan.io",
  "42161": "https://arbiscan.io",
  "8453": "https://basescan.org",
  "43114": "https://snowtrace.io",
};

export default function MultiChainPage() {
  const { account, status } = useWallet();
  const { success, error: showError } = useToast();

  const isConnected = status === "connected";
  const [switchingChain, setSwitchingChain] = useState<string | null>(null);
  const [recentlySwitched, setRecentlySwitched] = useState<string | null>(null);

  const handleSwitchChain = async (chainId: string) => {
    if (chainId === String(account.chainId)) return;
    setSwitchingChain(chainId);
    try {
      await switchChain(chainId);
      setRecentlySwitched(chainId);
      success("Network switched", `Connected to chain ${chainId}`);
      setTimeout(() => setRecentlySwitched(null), 2000);
    } catch (err) {
      showError("Switch failed", err instanceof Error ? err.message : "Could not switch network");
    } finally {
      setSwitchingChain(null);
    }
  };

  const totalUsdValue = Object.values(CHAIN_BALANCES).reduce((sum, c) => sum + c.usdValue, 0);
  const totalTokens = Object.values(CHAIN_BALANCES).reduce((sum, c) => sum + c.tokens, 0);

  const formatUSD = (value: number) => {
    return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  if (!isConnected) {
    return (
      <DemoLayout>
        <div className="max-w-4xl mx-auto px-4 py-12 text-center cc-page-enter">
          <p className="font-mono text-xs text-[var(--cc-muted)] mb-2">MULTI-CHAIN</p>
          <h1 className="text-display-lg font-semibold tracking-tighter text-[var(--cc-ink)] mb-4">
            Multi-chain.
          </h1>
          <p className="text-[var(--cc-body)]">Connect your wallet to manage assets across chains.</p>
        </div>
      </DemoLayout>
    );
  }

  return (
    <DemoLayout>
      <div className="max-w-4xl mx-auto px-4 py-12 cc-page-enter">
        {/* Header */}
        <div className="mb-8">
          <p className="font-mono text-xs text-[var(--cc-muted)] mb-2">MULTI-CHAIN</p>
          <h1 className="text-display-lg font-semibold tracking-tighter text-[var(--cc-ink)] mb-2">
            Multi-chain.
          </h1>
          <p className="text-[var(--cc-body)] text-body-sm">
            ${formatUSD(totalUsdValue)} across {Object.keys(CHAIN_BALANCES).length} networks · {totalTokens} tokens
          </p>
        </div>

        {/* Network Grid */}
        <div className="grid md:grid-cols-2 gap-4 cc-stagger">
          {Object.entries(CHAIN_BALANCES).map(([chainId, data]) => {
            const isActive = String(account.chainId) === chainId;
            const isSwitching = switchingChain === chainId;
            const wasSwitched = recentlySwitched === chainId;

            return (
              <div
                key={chainId}
                className={`p-5 border rounded-[var(--cc-radius-md)] bg-[var(--cc-canvas)] transition-all cc-animate-slide-up ${
                  isActive
                    ? 'border-[var(--cc-hairline-strong)] shadow-[var(--cc-level2)]'
                    : 'border-[var(--cc-hairline)] hover:shadow-[var(--cc-level1)] hover:border-[var(--cc-hairline-strong)]'
                } ${wasSwitched ? 'animate-chain-switch-flash' : ''}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-sm flex items-center justify-center ${
                      isActive ? 'bg-[var(--cc-primary)]' : 'bg-[var(--cc-canvas-soft-2)]'
                    } transition-colors`}>
                      <Globe className={`w-5 h-5 ${isActive ? 'text-[var(--cc-on-primary)]' : 'text-[var(--cc-muted)]'}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-[var(--cc-ink)]">
                          {chainId === "1" ? "Ethereum" : 
                           chainId === "137" ? "Polygon" :
                           chainId === "10" ? "Optimism" :
                           chainId === "42161" ? "Arbitrum" :
                           chainId === "8453" ? "Base" :
                           chainId === "43114" ? "Avalanche" : `Chain ${chainId}`}
                        </p>
                        {isActive && (
                          <span className="px-2 py-0.5 bg-[var(--cc-success)]/15 text-[var(--cc-success)] text-caption rounded-sm font-medium">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-caption text-[var(--cc-muted)] mt-0.5">Chain ID: {chainId}</p>
                    </div>
                  </div>
                  <a
                    href={EXPLORER_URLS[chainId] || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 hover:bg-[var(--cc-canvas-soft-2)] rounded transition-colors"
                    title="View explorer"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-[var(--cc-muted)]" />
                  </a>
                </div>

                {/* Balance */}
                <div className="mb-4">
                  <p className="text-display-sm font-semibold text-[var(--cc-ink)] cc-tabular-nums">
                    ${formatUSD(data.usdValue)}
                  </p>
                  <p className="text-caption text-[var(--cc-muted)] mt-0.5 cc-tabular-nums">
                    {data.balance} {chainId === "1" ? "ETH" : chainId === "137" ? "MATIC" : chainId === "10" ? "ETH" : chainId === "42161" ? "ETH" : chainId === "8453" ? "ETH" : "AVAX"} · {data.tokens} tokens
                  </p>
                </div>

                {/* Action */}
                {isActive ? (
                  <div className="flex items-center gap-2 text-caption text-[var(--cc-success)]">
                    <Check className="w-3.5 h-3.5" />
                    <span className="font-medium">Connected</span>
                  </div>
                ) : (
                  <button
                    onClick={() => handleSwitchChain(chainId)}
                    disabled={isSwitching}
                    className="w-full px-4 py-2 bg-[var(--cc-canvas-soft-2)] border border-[var(--cc-hairline)] rounded-[var(--cc-radius-sm)] text-body-sm font-medium text-[var(--cc-ink)] hover:border-[var(--cc-hairline-strong)] hover:shadow-[var(--cc-level1)] disabled:opacity-50 transition-all flex items-center justify-center gap-2 active:scale-[0.99]"
                  >
                    {isSwitching ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Switching...
                      </>
                    ) : (
                      <>
                        <ArrowRightLeft className="w-3.5 h-3.5" />
                        Switch network
                      </>
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Info note */}
        <div className="mt-6 flex items-start gap-2 p-3 bg-[var(--cc-canvas-soft-2)]/30 border border-[var(--cc-hairline)]/60 rounded-[var(--cc-radius-sm)]">
          <AlertCircle className="w-3.5 h-3.5 text-[var(--cc-muted)] mt-0.5 shrink-0" />
          <p className="text-caption text-[var(--cc-muted)]">
            Multi-chain balances are simulated for demo purposes. Connect a wallet with real assets to see actual cross-chain portfolio data.
          </p>
        </div>
      </div>
    </DemoLayout>
  );
}
