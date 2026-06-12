"use client";

import { useServiceMetrics } from "@/hooks/useServiceMetrics";
import { formatNumber, formatLatency, formatBytes } from "@/lib/utils";
import MetricBox from "@/components/MetricBox";
import BarChart from "@/components/BarChart";
import ProgressRing from "@/components/ProgressRing";

const SESSION_HISTORY = [2800, 3200, 3500, 3100, 3800, 4100, 3900];
const SESSION_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const SIGNING_STATS = [
  { label: "Message Signatures", count: 892456, pct: 42 },
  { label: "Transaction Signing", count: 654321, pct: 31 },
  { label: "Auth Requests", count: 312000, pct: 15 },
  { label: "Token Refresh", count: 245678, pct: 12 },
];

const ACTIVE_SESSIONS = [
  { id: "sess_a1b2c3d4", address: "0x7a3f…8d2e", chain: "Ethereum", age: "2m ago", status: "active" },
  { id: "sess_e5f6g7h8", address: "0x2b1c…9f4a", chain: "Polygon", age: "5m ago", status: "active" },
  { id: "sess_i9j0k1l2", address: "0x4d6e…3c7b", chain: "Arbitrum", age: "8m ago", status: "active" },
  { id: "sess_m3n4o5p6", address: "0x9f8a…1e5d", chain: "BSC", age: "12m ago", status: "idle" },
  { id: "sess_q7r8s9t0", address: "0x6c5b…4a3f", chain: "Optimism", age: "15m ago", status: "idle" },
  { id: "sess_u1v2w3x4", address: "0x1e2d…7c8b", chain: "Solana", age: "18m ago", status: "active" },
];

export default function KeysServerPage() {
  const { metrics, isDemo, error } = useServiceMetrics("keys-server");

  if (!metrics) return <div className="flex items-center justify-center h-64 cc-body text-[var(--cc-muted)]">Loading metrics...</div>;

  const storagePct = metrics.storageUsed && metrics.storageLimit
    ? Math.round((metrics.storageUsed / metrics.storageLimit) * 100)
    : 24;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="cc-display-sm text-[var(--cc-ink)]">Keys server.</h1>
          <p className="cc-body-sm text-[var(--cc-muted)] mt-1">Session key management with D1 storage</p>
        </div>
        <span className="cc-badge">D1 • Cloudflare Workers</span>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricBox label="Active Sessions" value={formatNumber(metrics.activeSessions || 0)} color="text-[var(--cc-link)]" trend="up" />
        <MetricBox label="Total Requests" value={formatNumber(metrics.totalRequests || 0)} />
        <MetricBox label="Avg Latency" value={formatLatency(metrics.avgLatency || 0)} trend="stable" />
        <MetricBox label="Error Rate" value={`${metrics.errorRate?.toFixed(2) || 0}%`} color={metrics.errorRate! > 0.5 ? "text-[var(--cc-error)]" : "text-[var(--cc-success)]"} />
      </div>

      {/* Storage + Signing side by side */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Storage */}
        <div className="cc-card">
          <h3 className="cc-body-md-strong text-[var(--cc-ink)] mb-4">D1 storage usage.</h3>
          <div className="flex items-center justify-center gap-8">
            <ProgressRing
              value={storagePct}
              size={120}
              strokeWidth={10}
              color={storagePct > 80 ? "var(--cc-error)" : storagePct > 60 ? "var(--cc-warning)" : "var(--cc-link)"}
              label="Used"
            />
            <div className="space-y-3">
              <div>
                <p className="cc-caption text-[var(--cc-muted)]">Used Space</p>
                <p className="cc-body-md-strong text-[var(--cc-ink)]">{formatBytes(metrics.storageUsed || 0)}</p>
              </div>
              <div>
                <p className="cc-caption text-[var(--cc-muted)]">Total Capacity</p>
                <p className="cc-body-md-strong text-[var(--cc-ink)]">{formatBytes(metrics.storageLimit || 10_000_000_000)}</p>
              </div>
              <div>
                <p className="cc-caption text-[var(--cc-muted)]">Available</p>
                <p className="cc-body-md-strong text-[var(--cc-success)]">
                  {formatBytes((metrics.storageLimit || 10_000_000_000) - (metrics.storageUsed || 0))}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Signing operations */}
        <div className="cc-card">
          <h3 className="cc-body-md-strong text-[var(--cc-ink)] mb-4">Signing operations (24h).</h3>
          <div className="space-y-3">
            {SIGNING_STATS.map((stat) => (
              <div key={stat.label} className="flex items-center gap-3">
                <span className="cc-body-sm text-[var(--cc-muted)] w-36">{stat.label}</span>
                <div className="flex-1 bg-[var(--cc-hairline)] rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${stat.pct}%`, backgroundColor: "var(--cc-link)" }}
                  />
                </div>
                <span className="cc-body-sm text-[var(--cc-ink)] w-20 text-right">{formatNumber(stat.count)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Session history chart */}
      <BarChart data={SESSION_HISTORY} labels={SESSION_LABELS} color="var(--cc-violet)" height={140} aria-label="Weekly session creation trend" />

      {/* Active sessions table */}
      <div className="cc-card-soft overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--cc-hairline)]">
          <h3 className="cc-body-md-strong text-[var(--cc-ink)]">Active sessions.</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-body-sm">
            <thead>
              <tr className="border-b border-[var(--cc-hairline)]/50 cc-caption text-[var(--cc-muted)]">
                <th scope="col" className="text-left px-5 py-3 font-normal">Session ID</th>
                <th scope="col" className="text-left px-5 py-3 font-normal">Address</th>
                <th scope="col" className="text-left px-5 py-3 font-normal">Chain</th>
                <th scope="col" className="text-left px-5 py-3 font-normal">Last Active</th>
                <th scope="col" className="text-left px-5 py-3 font-normal">Status</th>
              </tr>
            </thead>
            <tbody>
              {ACTIVE_SESSIONS.map((s) => (
                <tr key={s.id} className="border-b border-[var(--cc-hairline)]/30 hover:bg-[var(--cc-canvas-soft)] transition-colors">
                  <td className="px-5 py-3 cc-code text-[var(--cc-ink)]">{s.id}</td>
                  <td className="px-5 py-3 text-[var(--cc-ink)]">{s.address}</td>
                  <td className="px-5 py-3 text-[var(--cc-muted)]">{s.chain}</td>
                  <td className="px-5 py-3 text-[var(--cc-muted)]">{s.age}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full cc-caption font-medium ${
                      s.status === "active" ? "bg-[var(--cc-success)]/10 text-[var(--cc-success)]" : "bg-[var(--cc-muted)]/10 text-[var(--cc-muted)]"
                    }`}>
                      {s.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Session stats */}
      <div className="cc-card">
        <h3 className="cc-body-md-strong text-[var(--cc-ink)] mb-4">Session statistics (24h).</h3>
        <div className="grid grid-cols-3 gap-4">
          <MetricBox label="New Sessions" value="1,247" trend="up" />
          <MetricBox label="Expired Sessions" value="892" />
          <MetricBox label="Revoked Sessions" value="23" trend="down" />
        </div>
      </div>
    </div>
  );
}
