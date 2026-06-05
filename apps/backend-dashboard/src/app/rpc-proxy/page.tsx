"use client";

import { useState, useEffect } from "react";
import { generateDemoMetrics, ServiceMetrics } from "@/lib/services";
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
  const [metrics, setMetrics] = useState<ServiceMetrics>(generateDemoMetrics("rpc-proxy"));

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(generateDemoMetrics("rpc-proxy"));
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-white">🔄 RPC Proxy</h1>
          <p className="text-dashboard-muted mt-1">Multi-chain RPC proxy with KV caching and failover</p>
        </div>
        <span className="text-xs text-dashboard-muted bg-dashboard-surface border border-dashboard-border rounded-full px-3 py-1.5">
          KV Cache • Multi-Provider Failover
        </span>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricBox label="Total Requests" value={formatNumber(metrics.totalRequests || 0)} trend="up" />
        <MetricBox label="Error Rate" value={`${metrics.errorRate?.toFixed(2) || 0}%`} color={metrics.errorRate! > 1 ? "text-dashboard-danger" : "text-dashboard-success"} trend="down" />
        <MetricBox label="Avg Latency" value={formatLatency(metrics.avgLatency || 0)} />
        <MetricBox label="P99 Latency" value={formatLatency(metrics.p99Latency || 0)} />
      </div>

      {/* KV Cache + Charts */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* KV Cache */}
        <div className="bg-dashboard-surface rounded-xl border border-dashboard-border p-5">
          <h3 className="text-lg font-semibold text-white mb-4">KV Cache Status</h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-dashboard-muted">Cache Hit Rate</p>
              <p className="text-3xl font-semibold text-dashboard-success">78.3%</p>
            </div>
            <div>
              <p className="text-sm text-dashboard-muted">Cached Keys</p>
              <p className="text-2xl font-semibold text-white">24,891</p>
            </div>
            <div>
              <p className="text-sm text-dashboard-muted">KV Storage Used</p>
              <p className="text-2xl font-semibold text-white">1.2 GB</p>
            </div>
            <div>
              <p className="text-sm text-dashboard-muted">Cache Misses (24h)</p>
              <p className="text-2xl font-semibold text-dashboard-warning">48,392</p>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="md:col-span-2 grid md:grid-cols-2 gap-4">
          <BarChart data={REQUEST_HISTORY} labels={REQUEST_LABELS} color="#3b82f6" height={140} aria-label="24h RPC request rate" />
          <BarChart data={CHAIN_DATA.map(d => d.count)} labels={CHAIN_DATA.map(d => d.name)} color="#8b5cf6" height={140} aria-label="Requests by chain" />
        </div>
      </div>

      {/* RPC Methods */}
      <div className="bg-dashboard-surface rounded-xl border border-dashboard-border overflow-hidden">
        <div className="px-5 py-4 border-b border-dashboard-border">
          <h3 className="text-lg font-semibold text-white">Top RPC Methods (24h)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dashboard-border/50 text-dashboard-muted">
                <th className="text-left px-5 py-3 font-medium">Method</th>
                <th className="text-left px-5 py-3 font-medium">Calls</th>
                <th className="text-left px-5 py-3 font-medium">Share</th>
                <th className="text-left px-5 py-3 font-medium">Distribution</th>
              </tr>
            </thead>
            <tbody>
              {RPC_METHODS.map((m, i) => (
                <tr key={i} className="border-b border-dashboard-border/30 hover:bg-dashboard-border/20">
                  <td className="px-5 py-3 font-mono text-xs text-brand-400">{m.method}</td>
                  <td className="px-5 py-3 text-white">{formatNumber(m.count)}</td>
                  <td className="px-5 py-3 text-dashboard-muted">{m.pct}%</td>
                  <td className="px-5 py-3 w-48">
                    <div className="bg-dashboard-border rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${m.pct}%`, backgroundColor: "#3b82f6" }}
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
      <div className="bg-dashboard-surface rounded-xl border border-dashboard-border overflow-hidden">
        <div className="px-5 py-4 border-b border-dashboard-border">
          <h3 className="text-lg font-semibold text-white">RPC Provider Status</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dashboard-border/50 text-dashboard-muted">
                <th className="text-left px-5 py-3 font-medium">Provider</th>
                <th className="text-left px-5 py-3 font-medium">Requests</th>
                <th className="text-left px-5 py-3 font-medium">Avg Latency</th>
                <th className="text-left px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {RPC_PROVIDERS.map((p, i) => (
                <tr key={i} className="border-b border-dashboard-border/30 hover:bg-dashboard-border/20">
                  <td className="px-5 py-3 text-white">{p.name}</td>
                  <td className="px-5 py-3 text-white">{formatNumber(p.requests)}</td>
                  <td className="px-5 py-3 text-dashboard-muted">{p.latency}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      p.status === "healthy" ? "bg-dashboard-success/10 text-dashboard-success" : "bg-dashboard-danger/10 text-dashboard-danger"
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
      <div className="bg-dashboard-surface rounded-xl border border-dashboard-border p-5">
        <h3 className="text-lg font-semibold text-white mb-4">Chain Distribution (24h)</h3>
        <div className="space-y-3">
          {CHAIN_DATA.map((chain, i) => {
            const total = CHAIN_DATA.reduce((a, b) => a + b.count, 0);
            const pct = ((chain.count / total) * 100).toFixed(1);
            return (
              <div key={i} className="flex items-center gap-3">
                <span className="text-sm text-dashboard-muted w-24">{chain.name}</span>
                <div className="flex-1 bg-dashboard-border rounded-full h-3 overflow-hidden" role="progressbar" aria-valuenow={Number(pct)} aria-valuemin={0} aria-valuemax={100} aria-label={`${chain.name}: ${pct}%`}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, backgroundColor: chain.color }}
                  />
                </div>
                <span className="text-sm text-white w-16 text-right">{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
