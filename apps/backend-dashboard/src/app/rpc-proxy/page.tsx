"use client";

import { useServiceMetrics } from "@/hooks/useServiceMetrics";
import { formatNumber, formatLatency } from "@/lib/utils";
import MetricBox from "@/components/MetricBox";
import BarChart from "@/components/BarChart";

const REQUEST_HISTORY = [142, 168, 155, 189, 201, 178, 195, 210, 188, 223, 198, 245];
const REQUEST_LABELS = [
  "00:00", "02:00", "04:00", "06:00", "08:00", "10:00",
  "12:00", "14:00", "16:00", "18:00", "20:00", "22:00",
];

const CHAIN_DATA = [
  { name: "Ethereum", count: 45000, color: "#627EEA" },
  { name: "Polygon", count: 38000, color: "#8247E5" },
  { name: "BSC", count: 52000, color: "#F0B90B" },
  { name: "Arbitrum", count: 28000, color: "#28A0F0" },
  { name: "Optimism", count: 15000, color: "#FF0420" },
];

const RPC_METHODS = [
  { method: "eth_call", count: 89234, pct: 32.1 },
  { method: "eth_getLogs", count: 67891, pct: 24.4 },
  { method: "eth_getBalance", count: 45678, pct: 16.4 },
  { method: "eth_blockNumber", count: 38456, pct: 13.8 },
  { method: "eth_sendRawTransaction", count: 23456, pct: 8.4 },
  { method: "eth_getTransactionReceipt", count: 13567, pct: 4.9 },
];

const RPC_PROVIDERS = [
  { name: "Primary (llamarpc)", requests: 156000, latency: "142ms", status: "healthy" },
  { name: "Fallback (Alchemy)", requests: 34000, latency: "178ms", status: "healthy" },
  { name: "Fallback (Infura)", requests: 12000, latency: "203ms", status: "healthy" },
  { name: "Fallback (QuickNode)", requests: 5000, latency: "156ms", status: "healthy" },
];

export default function RPCProxyPage() {
  const { metrics, isDemo, error } = useServiceMetrics("rpc-proxy");

  if (!metrics) {
    return <div className="flex items-center justify-center h-64 cc-body text-[var(--cc-muted)]">Loading metrics...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="cc-display-sm text-[var(--cc-ink)]">RPC Proxy</h1>
          <p className="cc-body-sm text-[var(--cc-muted)] mt-1">Multi-chain RPC proxy with KV caching and failover</p>
        </div>
        <span className="cc-badge">KV Cache • Multi-Provider Failover</span>
      </div>

      {/* Demo data banner */}
      {isDemo && (
        <div className="cc-card border-l-4 border-[var(--cc-warning)] px-4 py-3 flex items-center gap-3" role="alert">
          <span className="text-[var(--cc-warning)] text-body-lg">⚠️</span>
          <div>
            <p className="cc-body-sm-strong text-[var(--cc-ink)]">Demo Mode</p>
            <p className="cc-caption text-[var(--cc-muted)]">{error}</p>
          </div>
        </div>
      )}

      {/* Key metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricBox label="Total Requests" value={formatNumber(metrics.totalRequests || 0)} trend="up" />
        <MetricBox label="Error Rate" value={`${metrics.errorRate?.toFixed(2) || 0}%`} color={metrics.errorRate! > 1 ? "text-[var(--cc-error)]" : "text-[var(--cc-success)]"} trend="down" />
        <MetricBox label="Avg Latency" value={formatLatency(metrics.avgLatency || 0)} />
        <MetricBox label="P99 Latency" value={formatLatency(metrics.p99Latency || 0)} />
      </div>

      {/* KV Cache + Charts */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* KV Cache */}
        <div className="cc-card">
          <h3 className="cc-body-md-strong text-[var(--cc-ink)] mb-4">KV Cache Status</h3>
          <div className="space-y-4">
            <div>
              <p className="cc-caption text-[var(--cc-muted)]">Cache Hit Rate</p>
              <p className="cc-display-sm text-[var(--cc-success)]">78.3%</p>
            </div>
            <div>
              <p className="cc-caption text-[var(--cc-muted)]">Cached Keys</p>
              <p className="cc-display-sm text-[var(--cc-ink)]">24,891</p>
            </div>
            <div>
              <p className="cc-caption text-[var(--cc-muted)]">KV Storage Used</p>
              <p className="cc-display-sm text-[var(--cc-ink)]">1.2 GB</p>
            </div>
            <div>
              <p className="cc-caption text-[var(--cc-muted)]">Cache Misses (24h)</p>
              <p className="cc-display-sm text-[var(--cc-warning)]">48,392</p>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="md:col-span-2 grid md:grid-cols-2 gap-4">
          <BarChart data={REQUEST_HISTORY} labels={REQUEST_LABELS} color="var(--cc-link)" height={140} aria-label="24h RPC request rate" />
          <BarChart data={CHAIN_DATA.map(d => d.count)} labels={CHAIN_DATA.map(d => d.name)} color="var(--cc-violet)" height={140} aria-label="Requests by chain" />
        </div>
      </div>

      {/* RPC Methods */}
      <div className="cc-card-soft overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--cc-hairline)]">
          <h3 className="cc-body-md-strong text-[var(--cc-ink)]">Top RPC Methods (24h)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-body-sm">
            <thead>
              <tr className="border-b border-[var(--cc-hairline)]">
                <th scope="col" className="ds-table-header">Method</th>
                <th className="ds-table-header">Calls</th>
                <th className="ds-table-header">Share</th>
                <th className="ds-table-header">Distribution</th>
              </tr>
            </thead>
            <tbody>
              {RPC_METHODS.map((m) => (
                <tr key={m.method} className="ds-table-row">
                  <td className="ds-table-cell cc-code text-[var(--cc-link)]">{m.method}</td>
                  <td className="ds-table-cell">{formatNumber(m.count)}</td>
                  <td className="ds-table-cell text-[var(--cc-muted)]">{m.pct}%</td>
                  <td className="ds-table-cell w-48">
                    <div className="bg-[var(--cc-hairline)] rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${m.pct}%`, backgroundColor: "var(--cc-link)" }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Provider status */}
      <div className="cc-card-soft overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--cc-hairline)]">
          <h3 className="cc-body-md-strong text-[var(--cc-ink)]">RPC Provider Status</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-body-sm">
            <thead>
              <tr className="border-b border-[var(--cc-hairline)]">
                <th scope="col" className="ds-table-header">Provider</th>
                <th className="ds-table-header">Requests</th>
                <th className="ds-table-header">Avg Latency</th>
                <th className="ds-table-header">Status</th>
              </tr>
            </thead>
            <tbody>
              {RPC_PROVIDERS.map((p) => (
                <tr key={p.name} className="ds-table-row">
                  <td className="ds-table-cell">{p.name}</td>
                  <td className="ds-table-cell">{formatNumber(p.requests)}</td>
                  <td className="ds-table-cell text-[var(--cc-muted)]">{p.latency}</td>
                  <td className="ds-table-cell">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full cc-caption font-medium ${
                      p.status === "healthy" ? "bg-[var(--cc-success)]/10 text-[var(--cc-success)]" : "bg-[var(--cc-error)]/10 text-[var(--cc-error)]"
                    }`}>
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Chain distribution */}
      <div className="cc-card">
        <h3 className="cc-body-md-strong text-[var(--cc-ink)] mb-4">Chain Distribution (24h)</h3>
        <div className="space-y-3">
          {CHAIN_DATA.map((chain) => {
            const total = CHAIN_DATA.reduce((a, b) => a + b.count, 0);
            const pct = ((chain.count / total) * 100).toFixed(1);
            return (
              <div key={chain.name} className="flex items-center gap-3">
                <span className="cc-body-sm text-[var(--cc-muted)] w-24">{chain.name}</span>
                <div className="flex-1 bg-[var(--cc-hairline)] rounded-full h-3 overflow-hidden" role="progressbar" aria-valuenow={Number(pct)} aria-valuemin={0} aria-valuemax={100} aria-label={`${chain.name}: ${pct}%`}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, backgroundColor: chain.color }}
                  />
                </div>
                <span className="cc-body-sm text-[var(--cc-ink)] w-16 text-right">{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
