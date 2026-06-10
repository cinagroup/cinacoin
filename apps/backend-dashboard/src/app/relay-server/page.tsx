"use client";

import { useServiceMetrics } from "@/hooks/useServiceMetrics";
import { formatNumber, formatLatency } from "@/lib/utils";
import MetricBox from "@/components/MetricBox";
import BarChart from "@/components/BarChart";
import ProgressRing from "@/components/ProgressRing";

const THROUGHPUT_HISTORY = [7200, 8100, 7800, 9200, 8534, 9100, 8800, 9400, 8200, 7600, 8900, 8534];
const THROUGHPUT_LABELS = [
  "00:00", "02:00", "04:00", "06:00", "08:00", "10:00",
  "12:00", "14:00", "16:00", "18:00", "20:00", "22:00",
];

const CONNECTION_HISTORY = [1200, 1150, 1080, 1020, 980, 1050, 1247];
const CONNECTION_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const CHAIN_DATA = [
  { label: "Ethereum Mainnet", count: 520, color: "#627eea", status: "healthy" },
  { label: "Polygon", count: 380, color: "#8247e5", status: "healthy" },
  { label: "Arbitrum", count: 197, color: "#28a0f0", status: "healthy" },
  { label: "Optimism", count: 98, color: "#ff0420", status: "degraded" },
  { label: "Solana", count: 52, color: "#9945ff", status: "healthy" },
];

const DO_STATS = [
  { label: "Active DOs", value: "89" },
  { label: "Avg DO Latency", value: "3ms" },
  { label: "DO Errors (24h)", value: "2" },
  { label: "WebSocket Uptime", value: "99.97%" },
];

const RECENT_EVENTS = [
  { event: "WebSocket connected", client: "0x7a3f…8d2e", chain: "Ethereum", time: "3s ago" },
  { event: "Subscription created", client: "0x2b1c…9f4a", chain: "Polygon", time: "12s ago" },
  { event: "WebSocket disconnected", client: "0x4d6e…3c7b", chain: "Arbitrum", time: "1m ago" },
  { event: "Heartbeat timeout", client: "0x9f8a…1e5d", chain: "Optimism", time: "2m ago" },
  { event: "WebSocket reconnected", client: "0x6c5b…4a3f", chain: "Solana", time: "3m ago" },
];

export default function RelayServerPage() {
  const { metrics, isDemo, error } = useServiceMetrics("relay-server");

  if (!metrics) return <div className="flex items-center justify-center h-64 cc-body text-[var(--cc-muted)]">Loading metrics...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="cc-display-sm text-[var(--cc-ink)]">Relay Server</h1>
          <p className="cc-body-sm text-[var(--cc-muted)] mt-1">WebSocket relay via Durable Objects for real-time chain events</p>
        </div>
        <span className="cc-badge">Durable Objects • WebSocket</span>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricBox label="Active Connections" value={formatNumber(metrics.activeConnections || 0)} color="text-[var(--cc-cyan)]" trend="up" />
        <MetricBox label="Throughput" value={`${formatNumber(metrics.throughput || 0)} msg/s`} trend="stable" />
        <MetricBox label="Total Requests" value={formatNumber(metrics.totalRequests || 0)} trend="up" />
        <MetricBox label="Error Rate" value={`${metrics.errorRate?.toFixed(2) || 0}%`} color="text-[var(--cc-success)]" />
      </div>

      {/* DO Status + Connection breakdown */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* DO status */}
        <div className="cc-card">
          <h3 className="cc-body-md-strong text-[var(--cc-ink)] mb-4">Durable Objects Status</h3>
          <div className="grid grid-cols-2 gap-4">
            {DO_STATS.map((s, i) => (
              <MetricBox key={i} label={s.label} value={s.value} />
            ))}
          </div>
        </div>

        {/* Connection breakdown */}
        <div className="cc-card">
          <h3 className="cc-body-md-strong text-[var(--cc-ink)] mb-4">Connection Breakdown</h3>
          <div className="space-y-3">
            {CHAIN_DATA.map((chain, i) => {
              const total = metrics.activeConnections || 1247;
              const pct = ((chain.count / total) * 100).toFixed(1);
              return (
                <div key={i} className="flex items-center gap-3">
                  <span className="cc-body-sm text-[var(--cc-muted)] w-36">{chain.label}</span>
                  <div className="flex-1 bg-[var(--cc-hairline)] rounded-full h-3 overflow-hidden" role="progressbar" aria-valuenow={Math.round(Number(pct))} aria-valuemin={0} aria-valuemax={100} aria-label={`${chain.label}: ${pct}%`}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: chain.color }}
                    />
                  </div>
                  <span className="cc-body-sm text-[var(--cc-ink)] w-12 text-right">{chain.count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-4">
        <BarChart data={THROUGHPUT_HISTORY} labels={THROUGHPUT_LABELS} color="#29bc9b" height={140} aria-label="24h throughput trend" />
        <BarChart data={CONNECTION_HISTORY} labels={CONNECTION_LABELS} color="#29bc9b" height={140} aria-label="Weekly active connections" />
      </div>

      {/* Event log */}
      <div className="cc-card-soft overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--cc-hairline)]">
          <h3 className="cc-body-md-strong text-[var(--cc-ink)]">Live Events</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[14px]">
            <thead>
              <tr className="border-b border-[var(--cc-hairline)]/50 cc-caption text-[var(--cc-muted)]">
                <th scope="col" className="text-left px-5 py-3 font-normal">Event</th>
                <th scope="col" className="text-left px-5 py-3 font-normal">Client</th>
                <th scope="col" className="text-left px-5 py-3 font-normal">Chain</th>
                <th scope="col" className="text-left px-5 py-3 font-normal">Time</th>
              </tr>
            </thead>
            <tbody>
              {RECENT_EVENTS.map((e, i) => (
                <tr key={i} className="border-b border-[var(--cc-hairline)]/30 hover:bg-[var(--cc-canvas-soft)] transition-colors">
                  <td className="px-5 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full cc-caption bg-[var(--cc-canvas-soft-2)] text-[var(--cc-ink)]">
                      {e.event}
                    </span>
                  </td>
                  <td className="px-5 py-3 cc-code text-[var(--cc-ink)]">{e.client}</td>
                  <td className="px-5 py-3 text-[var(--cc-muted)]">{e.chain}</td>
                  <td className="px-5 py-3 text-[var(--cc-muted)]">{e.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
