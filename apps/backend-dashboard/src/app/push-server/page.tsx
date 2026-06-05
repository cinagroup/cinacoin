"use client";

import { useState, useEffect } from "react";
import { generateDemoMetrics, ServiceMetrics } from "@/lib/services";
import { formatNumber, formatLatency } from "@/lib/utils";
import MetricBox from "@/components/MetricBox";
import BarChart from "@/components/BarChart";
import ProgressRing from "@/components/ProgressRing";

const TOKEN_HISTORY = [45000, 47200, 48900, 50100, 51200, 52100, 52890];
const TOKEN_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const PUSH_HISTORY = [8200, 9100, 8800, 9500, 10200, 7100, 6300];
const PUSH_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const PLATFORMS_DATA = [
  { label: "iOS (APNs)", count: 31200, color: "#007aff", icon: "🍎" },
  { label: "Android (FCM)", count: 18900, color: "#34a853", icon: "🤖" },
  { label: "Web Push", count: 2790, color: "#f59e0b", icon: "🌐" },
];

const TOPICS = [
  { name: "price-alerts", subscribers: 18200, messages24h: 4200 },
  { name: "tx-confirmations", subscribers: 14500, messages24h: 3100 },
  { name: "security-alerts", subscribers: 9800, messages24h: 890 },
  { name: "airdrop-notifications", subscribers: 7200, messages24h: 340 },
  { name: "governance-votes", subscribers: 3190, messages24h: 120 },
];

export default function PushServerPage() {
  const [metrics, setMetrics] = useState<ServiceMetrics>(generateDemoMetrics("push-server"));

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(generateDemoMetrics("push-server"));
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tighter text-[var(--cc-ink)]">📱 Push Server</h1>
          <p className="text-dashboard-muted mt-1">Cross-platform push notification delivery</p>
        </div>
        <span className="text-xs text-dashboard-muted bg-dashboard-surface border border-dashboard-border rounded-full px-3 py-1.5">
          APNs • FCM • Web Push
        </span>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricBox label="Device Tokens" value={formatNumber(metrics.deviceTokens || 0)} color="text-[var(--cc-success)]" trend="up" />
        <MetricBox label="Delivery Success" value={formatNumber(metrics.deliverySuccess || 0)} color="text-dashboard-success" trend="up" />
        <MetricBox label="Delivery Failed" value={formatNumber(metrics.deliveryFailed || 0)} color="text-dashboard-danger" trend="down" />
        <MetricBox label="Delivery Rate" value={`${metrics.deliveryRate?.toFixed(1) || 0}%`} color="text-dashboard-success" />
      </div>

      {/* Delivery ring + platform breakdown */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Delivery ring */}
        <div className="bg-dashboard-surface rounded-md border border-dashboard-border p-5">
          <h3 className="text-lg font-semibold text-[var(--cc-ink)] mb-4">Delivery Success Rate</h3>
          <div className="flex items-center justify-center gap-8">
            <ProgressRing
              value={Math.round(metrics.deliveryRate || 0)}
              size={120}
              strokeWidth={10}
              color={(metrics.deliveryRate || 0) > 99 ? "#22c55e" : (metrics.deliveryRate || 0) > 95 ? "#f59e0b" : "#ef4444"}
              label="Success"
            />
            <div className="space-y-3">
              <div>
                <p className="text-sm text-dashboard-muted">Successful</p>
                <p className="text-xl font-semibold text-dashboard-success">{formatNumber(metrics.deliverySuccess || 0)}</p>
              </div>
              <div>
                <p className="text-sm text-dashboard-muted">Failed</p>
                <p className="text-xl font-semibold text-dashboard-danger">{formatNumber(metrics.deliveryFailed || 0)}</p>
              </div>
              <div>
                <p className="text-sm text-dashboard-muted">Avg Latency</p>
                <p className="text-xl font-semibold text-[var(--cc-ink)]">{formatLatency(metrics.avgLatency || 0)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Platform breakdown */}
        <div className="bg-dashboard-surface rounded-md border border-dashboard-border p-5">
          <h3 className="text-lg font-semibold text-[var(--cc-ink)] mb-4">Platform Breakdown</h3>
          <div className="space-y-3">
            {PLATFORMS_DATA.map((platform, i) => {
              const total = metrics.deviceTokens || 52890;
              const pct = ((platform.count / total) * 100).toFixed(1);
              return (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-base w-6 text-center">{platform.icon}</span>
                  <span className="text-sm text-dashboard-muted w-32">{platform.label}</span>
                  <div className="flex-1 bg-dashboard-border rounded-full h-3 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: platform.color }}
                    />
                  </div>
                  <span className="text-sm text-[var(--cc-ink)] w-16 text-right">{formatNumber(platform.count)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-4">
        <BarChart data={TOKEN_HISTORY} labels={TOKEN_LABELS} color="#22c55e" height={140} aria-label="Weekly token growth" />
        <BarChart data={PUSH_HISTORY} labels={PUSH_LABELS} color="#007aff" height={140} aria-label="Weekly push delivery volume" />
      </div>

      {/* Topics table */}
      <div className="bg-dashboard-surface rounded-md border border-dashboard-border overflow-hidden">
        <div className="px-5 py-4 border-b border-dashboard-border">
          <h3 className="text-lg font-semibold text-[var(--cc-ink)]">Push Topics</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dashboard-border/50 text-dashboard-muted">
                <th className="text-left px-5 py-3 font-medium">Topic</th>
                <th className="text-left px-5 py-3 font-medium">Subscribers</th>
                <th className="text-left px-5 py-3 font-medium">Messages (24h)</th>
                <th className="text-left px-5 py-3 font-medium">Per-Subscriber Rate</th>
              </tr>
            </thead>
            <tbody>
              {TOPICS.map((t, i) => (
                <tr key={i} className="border-b border-dashboard-border/30 hover:bg-dashboard-border/20">
                  <td className="px-5 py-3 font-mono text-xs text-[var(--cc-ink)]">{t.name}</td>
                  <td className="px-5 py-3 text-[var(--cc-ink)]">{formatNumber(t.subscribers)}</td>
                  <td className="px-5 py-3 text-dashboard-muted">{formatNumber(t.messages24h)}</td>
                  <td className="px-5 py-3 text-dashboard-muted">
                    {(t.messages24h / t.subscribers).toFixed(2)} msgs/user
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Error breakdown */}
      <div className="bg-dashboard-surface rounded-md border border-dashboard-border p-5">
        <h3 className="text-lg font-semibold text-[var(--cc-ink)] mb-4">Error Breakdown (24h)</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricBox label="Invalid Token" value="1,892" icon="🚫" color="text-dashboard-danger" />
          <MetricBox label="Expired Token" value="987" icon="⏰" color="text-dashboard-warning" />
          <MetricBox label="Rate Limited" value="342" icon="⏱️" color="text-dashboard-warning" />
          <MetricBox label="Network Error" value="200" icon="🌐" color="text-dashboard-muted" />
        </div>
      </div>
    </div>
  );
}
