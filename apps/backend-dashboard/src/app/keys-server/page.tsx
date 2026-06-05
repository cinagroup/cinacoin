"use client";

import { useState, useEffect } from "react";
import { generateDemoMetrics, ServiceMetrics } from "@/lib/services";
import { formatNumber, formatLatency, formatBytes } from "@/lib/utils";
import MetricBox from "@/components/MetricBox";
import BarChart from "@/components/BarChart";
import ProgressRing from "@/components/ProgressRing";

const SESSION_HISTORY = [2800, 3200, 3500, 3100, 3800, 4100, 3900];
const SESSION_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const SIGNING_STATS = [
  { label: "Message Signatures", count: 892456, pct: 42, icon: "✍️" },
  { label: "Transaction Signing", count: 654321, pct: 31, icon: "💳" },
  { label: "Auth Requests", count: 312000, pct: 15, icon: "🔐" },
  { label: "Token Refresh", count: 245678, pct: 12, icon: "🔄" },
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
  const [metrics, setMetrics] = useState<ServiceMetrics>(generateDemoMetrics("keys-server"));

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(generateDemoMetrics("keys-server"));
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const storagePct = metrics.storageUsed && metrics.storageLimit
    ? Math.round((metrics.storageUsed / metrics.storageLimit) * 100)
    : 24;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-white">🔑 Keys Server</h1>
          <p className="text-dashboard-muted mt-1">Session key management with D1 storage</p>
        </div>
        <span className="text-xs text-dashboard-muted bg-dashboard-surface border border-dashboard-border rounded-full px-3 py-1.5">
          D1 • Cloudflare Workers
        </span>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricBox label="Active Sessions" value={formatNumber(metrics.activeSessions || 0)} color="text-brand-400" trend="up" />
        <MetricBox label="Total Requests" value={formatNumber(metrics.totalRequests || 0)} />
        <MetricBox label="Avg Latency" value={formatLatency(metrics.avgLatency || 0)} trend="stable" />
        <MetricBox label="Error Rate" value={`${metrics.errorRate?.toFixed(2) || 0}%`} color={metrics.errorRate! > 0.5 ? "text-dashboard-danger" : "text-dashboard-success"} />
      </div>

      {/* Storage + Signing side by side */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Storage */}
        <div className="bg-dashboard-surface rounded-xl border border-dashboard-border p-5">
          <h3 className="text-lg font-semibold text-white mb-4">D1 Storage Usage</h3>
          <div className="flex items-center justify-center gap-8">
            <ProgressRing
              value={storagePct}
              size={120}
              strokeWidth={10}
              color={storagePct > 80 ? "#ef4444" : storagePct > 60 ? "#f59e0b" : "#22c55e"}
              label="Used"
            />
            <div className="space-y-3">
              <div>
                <p className="text-sm text-dashboard-muted">Used Space</p>
                <p className="text-xl font-semibold text-white">{formatBytes(metrics.storageUsed || 0)}</p>
              </div>
              <div>
                <p className="text-sm text-dashboard-muted">Total Capacity</p>
                <p className="text-xl font-semibold text-white">{formatBytes(metrics.storageLimit || 10_000_000_000)}</p>
              </div>
              <div>
                <p className="text-sm text-dashboard-muted">Available</p>
                <p className="text-xl font-semibold text-dashboard-success">
                  {formatBytes((metrics.storageLimit || 10_000_000_000) - (metrics.storageUsed || 0))}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Signing operations */}
        <div className="bg-dashboard-surface rounded-xl border border-dashboard-border p-5">
          <h3 className="text-lg font-semibold text-white mb-4">Signing Operations (24h)</h3>
          <div className="space-y-3">
            {SIGNING_STATS.map((stat, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-base w-6 text-center">{stat.icon}</span>
                <span className="text-sm text-dashboard-muted w-36">{stat.label}</span>
                <div className="flex-1 bg-dashboard-border rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${stat.pct}%`, backgroundColor: "#3b82f6" }}
                  />
                </div>
                <span className="text-sm text-white w-20 text-right">{formatNumber(stat.count)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Session history chart */}
      <BarChart data={SESSION_HISTORY} labels={SESSION_LABELS} color="#8b5cf6" height={140} aria-label="Weekly session creation trend" />

      {/* Active sessions table */}
      <div className="bg-dashboard-surface rounded-xl border border-dashboard-border overflow-hidden">
        <div className="px-5 py-4 border-b border-dashboard-border">
          <h3 className="text-lg font-semibold text-white">Active Sessions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dashboard-border/50 text-dashboard-muted">
                <th className="text-left px-5 py-3 font-medium">Session ID</th>
                <th className="text-left px-5 py-3 font-medium">Address</th>
                <th className="text-left px-5 py-3 font-medium">Chain</th>
                <th className="text-left px-5 py-3 font-medium">Last Active</th>
                <th className="text-left px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {ACTIVE_SESSIONS.map((s) => (
                <tr key={s.id} className="border-b border-dashboard-border/30 hover:bg-dashboard-border/20">
                  <td className="px-5 py-3 font-mono text-xs text-white">{s.id}</td>
                  <td className="px-5 py-3 text-white">{s.address}</td>
                  <td className="px-5 py-3 text-dashboard-muted">{s.chain}</td>
                  <td className="px-5 py-3 text-dashboard-muted">{s.age}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      s.status === "active" ? "bg-dashboard-success/10 text-dashboard-success" : "bg-dashboard-muted/10 text-dashboard-muted"
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
      <div className="bg-dashboard-surface rounded-xl border border-dashboard-border p-5">
        <h3 className="text-lg font-semibold text-white mb-4">Session Statistics (24h)</h3>
        <div className="grid grid-cols-3 gap-4">
          <MetricBox label="New Sessions" value="1,247" icon="🆕" trend="up" />
          <MetricBox label="Expired Sessions" value="892" icon="⏰" />
          <MetricBox label="Revoked Sessions" value="23" icon="🚫" trend="down" />
        </div>
      </div>
    </div>
  );
}
