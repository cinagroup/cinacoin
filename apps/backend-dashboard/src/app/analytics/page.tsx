"use client";

import { useState } from "react";
import BarChart from "@/components/BarChart";
import MetricBox from "@/components/MetricBox";
import ErrorBoundary from "@/components/ErrorBoundary";

function formatCompact(n: number): string {
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toLocaleString();
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MAU_DATA = [42000, 48000, 55000, 61000, 73000, 82000, 89000, 95000, 102000, 115000, 128000, 142000];
const CONNECTIONS_DATA = [120000, 138000, 155000, 172000, 198000, 221000, 245000, 268000, 289000, 315000, 342000, 378000];
const AUTH_DATA = [8500, 12000, 15800, 19200, 24500, 28900, 32100, 36800, 41200, 46500, 52000, 58000];

const HOURLY_DATA = [2100, 1800, 1200, 900, 700, 850, 1500, 3200, 5800, 7200, 8100, 7900, 8400, 9200, 8800, 8500, 7800, 6900, 5200, 4100, 3800, 3200, 2800, 2400];
const HOURLY_LABELS = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, "0")}:00`);

const CHAIN_DISTRIBUTION = [
  { name: "Ethereum", pct: 35, color: "#627EEA" },
  { name: "Polygon", pct: 22, color: "#8247E5" },
  { name: "BSC", pct: 15, color: "#F0B90B" },
  { name: "Arbitrum", pct: 12, color: "#28A0F0" },
  { name: "Optimism", pct: 8, color: "#FF0420" },
  { name: "Solana", pct: 5, color: "#9945FF" },
  { name: "Bitcoin", pct: 3, color: "#F7931A" },
];

const WALLET_DISTRIBUTION = [
  { name: "MetaMask", pct: 38 },
  { name: "WalletConnect", pct: 25 },
  { name: "Coinbase Wallet", pct: 12 },
  { name: "Rainbow", pct: 8 },
  { name: "Trust Wallet", pct: 7 },
  { name: "Others", pct: 10 },
];

const AUTH_METHODS = [
  { name: "Wallet Signature (SIWE)", pct: 55, color: "#0070f3" },
  { name: "Email & Social Login", pct: 25, color: "#29bc9b" },
  { name: "Smart Accounts", pct: 12, color: "#7928ca" },
  { name: "SIWX (Cross-chain)", pct: 8, color: "#0070f3" },
];

const TOP_DAPPS = [
  { name: "CinaCoin Demo", users: 28500, growth: 12.4 },
  { name: "Hainai DeFi Portal", users: 15200, growth: 8.7 },
  { name: "CinaSwap", users: 12800, growth: 15.2 },
  { name: "Telegram Mini App", users: 9400, growth: 22.1 },
  { name: "Farcaster Mini App", users: 4200, growth: 35.8 },
];

type TimeRange = "7d" | "30d" | "90d" | "1y";

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>("90d");

  const multiplier = timeRange === "7d" ? 0.08 : timeRange === "30d" ? 0.25 : timeRange === "90d" ? 0.5 : 1;
  const currentMAU = Math.round(142000 * multiplier);
  const totalConnections = Math.round(378000 * multiplier);
  const totalAuth = Math.round(58000 * multiplier);
  const activeSessions = Math.round(12847 * multiplier);

  return (
    <ErrorBoundary>
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="cc-display-sm text-[var(--cc-ink)]">Analytics.</h1>
          <p className="cc-body-sm text-[var(--cc-muted)] mt-1">
            AppKit usage metrics and connection analytics
          </p>
        </div>
        <div className="flex gap-2 flex-wrap" role="group" aria-label="Time range selector">
          {(["7d", "30d", "90d", "1y"] as TimeRange[]).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              aria-pressed={timeRange === range}
              data-active={timeRange === range ? "true" : "false"}
              className="cc-tab-ghost"
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricBox label="Monthly Active Users" value={formatCompact(currentMAU)} trend="up" color="text-[var(--cc-link)]" />
        <MetricBox label="Total Connections" value={formatCompact(totalConnections)} trend="up" color="text-[var(--cc-link)]" />
        <MetricBox label="Auth Sessions" value={formatCompact(totalAuth)} trend="up" color="text-[var(--cc-success)]" />
        <MetricBox label="Active Sessions" value={formatCompact(activeSessions)} trend="up" color="text-[var(--cc-warning)]" />
      </div>

      {/* MAU Trend */}
      <div className="cc-card">
        <h3 className="cc-body-md-strong text-[var(--cc-ink)] mb-4" id="mau-chart-heading">Monthly Active Users</h3>
        <BarChart data={MAU_DATA.map((v) => Math.round(v * multiplier))} labels={MONTHS} color="var(--cc-link)" height={180} ariaLabelledBy="mau-chart-heading" />
      </div>

      {/* Charts row */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="cc-card">
          <h3 className="cc-body-md-strong text-[var(--cc-ink)] mb-4" id="connections-chart-heading">Connections Over Time</h3>
          <BarChart data={CONNECTIONS_DATA.map((v) => Math.round(v * multiplier))} labels={MONTHS} color="var(--cc-success)" height={160} ariaLabelledBy="connections-chart-heading" />
        </div>
        <div className="cc-card">
          <h3 className="cc-body-md-strong text-[var(--cc-ink)] mb-4" id="auth-chart-heading">Authentication events.</h3>
          <BarChart data={AUTH_DATA.map((v) => Math.round(v * multiplier))} labels={MONTHS} color="var(--cc-violet)" height={160} ariaLabelledBy="auth-chart-heading" />
        </div>
      </div>

      {/* Hourly activity */}
      <div className="cc-card">
        <h3 className="cc-body-md-strong text-[var(--cc-ink)] mb-4" id="hourly-chart-heading">Hourly Activity Distribution (24h)</h3>
        <BarChart data={HOURLY_DATA} labels={HOURLY_LABELS} color="var(--cc-link)" height={140} ariaLabelledBy="hourly-chart-heading" />
      </div>

      {/* Chain & Wallet distribution */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="cc-card">
          <h3 className="cc-body-md-strong text-[var(--cc-ink)] mb-4">Chain Distribution</h3>
          <div className="space-y-3">
            {CHAIN_DISTRIBUTION.map((chain) => (
              <div key={chain.name} className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: chain.color }} aria-hidden="true" />
                <span className="cc-body-sm text-[var(--cc-muted)] w-24">{chain.name}</span>
                <div className="flex-1 bg-[var(--cc-hairline)] rounded-full h-2.5 overflow-hidden" role="progressbar" aria-valuenow={chain.pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${chain.name}: ${chain.pct}%`}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${chain.pct}%`, backgroundColor: chain.color }} />
                </div>
                <span className="cc-body-sm text-[var(--cc-ink)] w-12 text-right" aria-hidden="true">{chain.pct}%</span>
              </div>
            ))}
          </div>
        </div>
        <div className="cc-card">
          <h3 className="cc-body-md-strong text-[var(--cc-ink)] mb-4" id="wallet-distribution-heading">Wallet Connectors</h3>
          <div className="space-y-3">
            {WALLET_DISTRIBUTION.map((wallet) => (
              <div key={wallet.name} className="flex items-center gap-3">
                <span className="cc-body-sm text-[var(--cc-muted)] w-32">{wallet.name}</span>
                <div className="flex-1 bg-[var(--cc-hairline)] rounded-full h-2.5 overflow-hidden" role="progressbar" aria-valuenow={wallet.pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${wallet.name}: ${wallet.pct}%`}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${wallet.pct}%`, backgroundColor: "var(--cc-link)" }} />
                </div>
                <span className="cc-body-sm text-[var(--cc-ink)] w-12 text-right" aria-hidden="true">{wallet.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Authentication methods */}
      <div className="cc-card">
        <h3 className="cc-body-md-strong text-[var(--cc-ink)] mb-4">Authentication methods.</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-3">
            {AUTH_METHODS.map((method) => (
              <div key={method.name} className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: method.color }} aria-hidden="true" />
                <span className="cc-body-sm text-[var(--cc-muted)] flex-1">{method.name}</span>
                <span className="cc-body-sm-strong text-[var(--cc-ink)]">{method.pct}%</span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center">
            <div className="w-40 h-40 rounded-full border-8 border-[var(--cc-hairline)] relative" role="img" aria-label="Authentication method distribution pie chart">
              {AUTH_METHODS.reduce((acc, method, i) => {
                const startDeg = AUTH_METHODS.slice(0, i).reduce((sum, m) => sum + (m.pct * 360) / 100, 0);
                const arcDeg = (method.pct * 360) / 100;
                acc.push(
                  <div
                    key={method.name}
                    className="absolute inset-0"
                    style={{
                      background: `conic-gradient(${method.color} ${startDeg}deg ${startDeg + arcDeg}deg, transparent ${startDeg + arcDeg}deg)`,
                      clipPath: `conic-gradient(from 0deg, ${method.color} ${startDeg}deg ${startDeg + arcDeg}deg, transparent ${startDeg + arcDeg}deg)`,
                    }}
                  />
                );
                return acc;
              }, [] as React.ReactNode[])}
              <div className="absolute inset-3 bg-[var(--cc-canvas)] rounded-full flex items-center justify-center">
                <div className="text-center">
                  <p className="cc-caption text-[var(--cc-muted)]">Auth Rate</p>
                  <p className="cc-body-md-strong text-[var(--cc-ink)]">94.2%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top dApps */}
      <div className="cc-card">
        <h3 className="cc-body-md-strong text-[var(--cc-ink)] mb-4">Top Projects by MAU</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-body-sm">
            <thead>
              <tr className="border-b border-[var(--cc-hairline)]">
                <th scope="col" className="text-left px-4 py-3 cc-caption text-[var(--cc-muted)] font-normal">#</th>
                <th scope="col" className="text-left px-4 py-3 cc-caption text-[var(--cc-muted)] font-normal">Project</th>
                <th scope="col" className="text-right px-4 py-3 cc-caption text-[var(--cc-muted)] font-normal">MAU</th>
                <th scope="col" className="text-right px-4 py-3 cc-caption text-[var(--cc-muted)] font-normal">Growth</th>
              </tr>
            </thead>
            <tbody>
              {TOP_DAPPS.map((app, i) => (
                <tr key={app.name} className="border-b border-[var(--cc-hairline)]/50 hover:bg-[var(--cc-canvas-soft)] transition-colors">
                  <td className="px-4 py-3 text-[var(--cc-muted)]">{i + 1}</td>
                  <td className="px-4 py-3 cc-body-sm-strong text-[var(--cc-ink)]">{app.name}</td>
                  <td className="px-4 py-3 text-right cc-body-sm text-[var(--cc-ink)]">{formatCompact(app.users)}</td>
                  <td className={`px-4 py-3 text-right cc-body-sm-strong ${app.growth > 0 ? "text-[var(--cc-success)]" : "text-[var(--cc-error)]"}`}>
                    {app.growth > 0 ? "+" : ""}{app.growth}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    </ErrorBoundary>
  );
}


