"use client";

import React, { useState, useMemo, useCallback } from "react";
import { TrendingDown } from "lucide-react";

interface FunnelStep {
  label: string;
  count: number;
  color: string;
}

interface WalletFunnelData {
  wallet: string;
  steps: FunnelStep[];
}

const funnelData: WalletFunnelData[] = [
  {
    wallet: "MetaMask",
    steps: [
      { label: "Click Connect", count: 45200, color: "#f6851b" },
      { label: "Select Wallet", count: 38420, color: "#f6851b" },
      { label: "Confirm Connection", count: 32150, color: "#f6851b" },
      { label: "Completed", count: 30800, color: "#f6851b" },
    ],
  },
  {
    wallet: "Cinacoin",
    steps: [
      { label: "Click Connect", count: 28300, color: "#3b99fc" },
      { label: "Select Wallet", count: 22640, color: "#3b99fc" },
      { label: "Confirm Connection", count: 17200, color: "#3b99fc" },
      { label: "Completed", count: 15980, color: "#3b99fc" },
    ],
  },
  {
    wallet: "Coinbase Wallet",
    steps: [
      { label: "Click Connect", count: 15600, color: "#0052ff" },
      { label: "Select Wallet", count: 13260, color: "#0052ff" },
      { label: "Confirm Connection", count: 11050, color: "#0052ff" },
      { label: "Completed", count: 10450, color: "#0052ff" },
    ],
  },
  {
    wallet: "Phantom",
    steps: [
      { label: "Click Connect", count: 9800, color: "#ab9ff2" },
      { label: "Select Wallet", count: 8330, color: "#ab9ff2" },
      { label: "Confirm Connection", count: 7080, color: "#ab9ff2" },
      { label: "Completed", count: 6860, color: "#ab9ff2" },
    ],
  },
];

export default React.memo(function WalletFunnel() {
  const [selectedWallet, setSelectedWallet] = useState<string>("all");

  const aggregatedSteps: FunnelStep[] = useMemo(() => {
    if (selectedWallet === "all") {
      return funnelData[0].steps.map((_, i) => ({
        label: funnelData[0].steps[i].label,
        count: funnelData.reduce((sum, w) => sum + w.steps[i].count, 0),
        color: "#0070f3",
      }));
    }
    const filtered = funnelData.filter((d) => d.wallet === selectedWallet);
    return filtered[0]?.steps || [];
  }, [selectedWallet]);

  const maxCount = aggregatedSteps[0]?.count || 1;

  const getDropoff = useCallback((current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((previous - current) / previous) * 100;
  }, []);

  const overallConversion = useMemo(() => {
    if (aggregatedSteps.length < 2) return "0";
    return ((aggregatedSteps[aggregatedSteps.length - 1].count / aggregatedSteps[0].count) * 100).toFixed(1);
  }, [aggregatedSteps]);

  return (
    <div className="space-y-lg">
      {/* Wallet Filter */}
      <div className="flex items-center gap-sm flex-wrap">
        <span className="text-body-sm text-[var(--cc-muted)]">Filter:</span>
        <button
          onClick={() => setSelectedWallet("all")}
          className={`px-sm py-xxs text-body-sm rounded-sm transition-all ${
            selectedWallet === "all"
              ? "bg-[var(--cc-primary)] text-[var(--cc-on-primary)] font-medium"
              : "bg-[var(--cc-canvas-soft-2)] text-[var(--cc-body)] hover:bg-[var(--cc-canvas-soft)]"
          }`}
        >
          All Wallets
        </button>
        {funnelData.map((w) => (
          <button
            key={w.wallet}
            onClick={() => setSelectedWallet(w.wallet)}
            className={`px-sm py-xxs text-body-sm rounded-sm transition-all ${
              selectedWallet === w.wallet
                ? "bg-[var(--cc-primary)] text-[var(--cc-on-primary)] font-medium"
                : "bg-[var(--cc-canvas-soft-2)] text-[var(--cc-body)] hover:bg-[var(--cc-canvas-soft)]"
            }`}
          >
            {w.wallet}
          </button>
        ))}
      </div>

      {/* Overall Conversion Rate */}
      <div className="flex items-center gap-lg">
        <div className="cc-card p-md flex-1">
          <p className="text-body-sm text-[var(--cc-muted)]">Overall conversion</p>
          <p className="text-display-sm text-[var(--cc-success)] mt-1">{overallConversion}%</p>
        </div>
        <div className="cc-card p-md flex-1">
          <p className="text-body-sm text-[var(--cc-muted)]">Total attempts</p>
          <p className="text-display-sm text-[var(--cc-ink)] mt-1">
            {aggregatedSteps[0]?.count.toLocaleString() || 0}
          </p>
        </div>
        <div className="cc-card p-md flex-1">
          <p className="text-body-sm text-[var(--cc-muted)]">Completed</p>
          <p className="text-display-sm text-[var(--cc-ink)] mt-1">
            {aggregatedSteps[aggregatedSteps.length - 1]?.count.toLocaleString() || 0}
          </p>
        </div>
      </div>

      {/* Funnel Visualization */}
      <div className="space-y-sm">
        {aggregatedSteps.map((step, i) => {
          const widthPct = (step.count / maxCount) * 100;
          const dropoff = i > 0 ? getDropoff(step.count, aggregatedSteps[i - 1].count) : 0;
          return (
            <div key={step.label}>
              {i > 0 && (
                <div className="flex items-center gap-xs mb-xxs">
                  <TrendingDown className="w-3 h-3 text-[var(--cc-error)]" />
                  <span className="text-caption text-[var(--cc-error)] font-medium">
                    -{dropoff.toFixed(1)}% drop-off
                  </span>
                </div>
              )}
              <div className="flex items-center gap-sm">
                <span className="text-body-sm text-[var(--cc-body)] w-40 flex-shrink-0">{step.label}</span>
                <div className="flex-1 h-8 bg-[var(--cc-canvas-soft-2)] rounded-sm overflow-hidden relative">
                  <div
                    className="h-full rounded-sm transition-all duration-700 flex items-center px-sm"
                    style={{
                      width: `${widthPct}%`,
                      backgroundColor: step.color,
                      opacity: 1 - i * 0.15,
                    }}
                  >
                    <span className="text-caption font-medium text-[var(--cc-on-primary)] whitespace-nowrap">
                      {step.count.toLocaleString()}
                    </span>
                  </div>
                </div>
                <span className="text-body-sm font-medium text-[var(--cc-ink)] w-16 text-right">
                  {((step.count / maxCount) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Per-Wallet Breakdown */}
      {selectedWallet === "all" && (
        <div>
          <h4 className="text-body font-medium text-[var(--cc-ink)] mb-sm">By wallet type</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-sm">
            {funnelData.map((w) => {
              const first = w.steps[0].count;
              const last = w.steps[w.steps.length - 1].count;
              const rate = ((last / first) * 100).toFixed(1);
              return (
                <div key={w.wallet} className="cc-card p-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-body-sm font-medium text-[var(--cc-ink)]">{w.wallet}</span>
                    <span className="text-body-sm font-medium" style={{ color: w.steps[0].color }}>
                      {rate}%
                    </span>
                  </div>
                  <div className="mt-xs h-1.5 bg-[var(--cc-canvas-soft-2)] rounded-sm overflow-hidden">
                    <div
                      className="h-full rounded-sm"
                      style={{
                        width: `${rate}%`,
                        backgroundColor: w.steps[0].color,
                      }}
                    />
                  </div>
                  <p className="text-caption text-[var(--cc-muted)] mt-xxs">
                    {last.toLocaleString()} / {first.toLocaleString()} completed
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
});
