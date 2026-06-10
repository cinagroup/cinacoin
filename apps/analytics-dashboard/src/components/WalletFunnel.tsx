"use client";

import { useState } from "react";

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
    wallet: "WalletConnect",
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

export default function WalletFunnel() {
  const [selectedWallet, setSelectedWallet] = useState<string>("all");

  const filteredData =
    selectedWallet === "all"
      ? funnelData
      : funnelData.filter((d) => d.wallet === selectedWallet);

  // Aggregate steps if showing all wallets
  const aggregatedSteps: FunnelStep[] =
    selectedWallet === "all"
      ? funnelData[0].steps.map((_, i) => ({
          label: funnelData[0].steps[i].label,
          count: funnelData.reduce((sum, w) => sum + w.steps[i].count, 0),
          color: "#0070f3",
        }))
      : filteredData[0]?.steps || [];

  const maxCount = aggregatedSteps[0]?.count || 1;

  const getDropoff = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((previous - current) / previous) * 100;
  };

  const overallConversion =
    aggregatedSteps.length >= 2
      ? ((aggregatedSteps[aggregatedSteps.length - 1].count / aggregatedSteps[0].count) * 100).toFixed(1)
      : "0";

  return (
    <div className="space-y-lg">
      {/* Wallet Filter */}
      <div className="flex items-center gap-sm flex-wrap">
        <span className="text-body-sm text-ink-mute">Filter:</span>
        <button
          onClick={() => setSelectedWallet("all")}
          className={`px-sm py-xxs text-body-sm rounded-md transition-all ${
            selectedWallet === "all"
              ? "bg-primary text-white font-medium"
              : "bg-canvas-soft-2 text-ink-body hover:bg-canvas-soft"
          }`}
        >
          All Wallets
        </button>
        {funnelData.map((w) => (
          <button
            key={w.wallet}
            onClick={() => setSelectedWallet(w.wallet)}
            className={`px-sm py-xxs text-body-sm rounded-md transition-all ${
              selectedWallet === w.wallet
                ? "bg-primary text-white font-medium"
                : "bg-canvas-soft-2 text-ink-body hover:bg-canvas-soft"
            }`}
          >
            {w.wallet}
          </button>
        ))}
      </div>

      {/* Overall Conversion Rate */}
      <div className="flex items-center gap-lg">
        <div className="card p-md flex-1">
          <p className="text-body-sm text-ink-mute mb-xxs">Overall Conversion</p>
          <p className="text-display-sm text-success">{overallConversion}%</p>
        </div>
        <div className="card p-md flex-1">
          <p className="text-body-sm text-ink-mute mb-xxs">Total Attempts</p>
          <p className="text-display-sm text-ink">
            {aggregatedSteps[0]?.count.toLocaleString() || 0}
          </p>
        </div>
        <div className="card p-md flex-1">
          <p className="text-body-sm text-ink-mute mb-xxs">Completed</p>
          <p className="text-display-sm text-ink">
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
                  <svg className="w-3 h-3 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                  <span className="text-caption text-error font-medium">
                    -{dropoff.toFixed(1)}% drop-off
                  </span>
                </div>
              )}
              <div className="flex items-center gap-sm">
                <span className="text-body-sm text-ink-body w-40 flex-shrink-0">{step.label}</span>
                <div className="flex-1 h-8 bg-canvas-soft-2 rounded-md overflow-hidden relative">
                  <div
                    className="h-full rounded-md transition-all duration-700 flex items-center px-sm"
                    style={{
                      width: `${widthPct}%`,
                      backgroundColor: step.color,
                      opacity: 1 - i * 0.15,
                    }}
                  >
                    <span className="text-caption font-medium text-white whitespace-nowrap">
                      {step.count.toLocaleString()}
                    </span>
                  </div>
                </div>
                <span className="text-body-sm font-medium text-ink w-16 text-right">
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
          <h4 className="text-body font-medium text-ink mb-sm">By Wallet Type</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-sm">
            {funnelData.map((w) => {
              const first = w.steps[0].count;
              const last = w.steps[w.steps.length - 1].count;
              const rate = ((last / first) * 100).toFixed(1);
              return (
                <div key={w.wallet} className="card p-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-body-sm font-medium text-ink">{w.wallet}</span>
                    <span className="text-body-sm font-medium" style={{ color: w.steps[0].color }}>
                      {rate}%
                    </span>
                  </div>
                  <div className="mt-xs h-1.5 bg-canvas-soft-2 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${rate}%`,
                        backgroundColor: w.steps[0].color,
                      }}
                    />
                  </div>
                  <p className="text-caption text-ink-mute mt-xxs">
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
}
