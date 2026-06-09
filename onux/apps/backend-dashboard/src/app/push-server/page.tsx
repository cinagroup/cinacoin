"use client";

import { useServiceMetrics } from "@/hooks/useServiceMetrics";
import { formatNumber, formatLatency } from "@/lib/utils";
import MetricBox from "@/components/MetricBox";
import BarChart from "@/components/BarChart";
import ProgressRing from "@/components/ProgressRing";

const TOKEN_HISTORY = [45000, 47200, 48900, 50100, 51200, 52100, 52890];
const TOKEN_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const PUSH_HISTORY = [8200, 9100, 8800, 9500, 10200, 7100, 6300];
const PUSH_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const PLATFORMS_DATA = [
  { label: "iOS (APNs)", count: 31200, color: "#007aff" },
  { label: "Android (FCM)", count: 18900, color: "#34a853" },
  { label: "Web Push", count: 2790, color: "#f5a623" },
];

const TOPICS = [
  { name: "price-alerts", subscribers: 18200, messages24h: 4200 },
  { name: "tx-confirmations", subscribers: 14500, messages24h: 3100 },
  { name: "security-alerts", subscribers: 9800, messages24h: 890 },
  { name: "airdrop-notifications", subscribers: 7200, messages24h: 340 },
  { name: "governance-votes", subscribers: 3190, messages24h: 120 },
];

export default function PushServerPage() {
  const { metrics, isDemo, error } = useServiceMetrics("push-server");

  if (!metrics) return <div className="flex items-center justify-center h-64 cc-body text-[var(--cc-muted)]">Loading metrics...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="cc-display-sm text-[var(--cc-ink)]">Push Server</h1>
          <p className="cc-body-sm text-[var(--cc-muted)] mt-1">Cross-platform push notification delivery</p>
        </div>
        <span className="cc-badge">APNs • FCM • Web Push</span>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricBox label="Device Tokens" value={formatNumber(metrics.deviceTokens || 0)} color="text-[var(--cc-success)]" trend="up" />
        <MetricBox label="Delivery Success" value={formatNumber(metrics.deliverySuccess || 0)} color="text-[var(--cc-success)]" trend="up" />
        <MetricBox label="Delivery Failed" value={formatNumber(metrics.deliveryFailed || 0)} color="text-[var(--cc-error)]" trend="down" />
        <MetricBox label="Delivery Rate" value={`${metrics.deliveryRate?.toFixed(1) || 0}%`} color="text-[var(--cc-success)]" />
      </div>

      {/* Delivery ring + platform breakdown */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Delivery ring */}
        <div className="cc-card">
          <h3 className="cc-body-md-strong text-[var(--cc-ink)] mb-4">Delivery Success Rate</h3>
          <div className="flex items-center justify-center gap-8">
            <ProgressRing
              value={Math.round(metrics.deliveryRate || 0)}
              size={120}
              strokeWidth={10}
              color={(metrics.deliveryRate || 0) > 99 ? "var(--cc-link)" : (metrics.deliveryRate || 0) > 95 ? "var(--cc-warning)" : "var(--cc-error)"}
              label="Success"
            />
            <div className="space-y-3">
              <div>
                <p className="cc-caption text-[var(--cc-muted)]">Successful</p>
                <p className="cc-body-md-strong text-[var(--cc-success)]">{formatNumber(metrics.deliverySuccess || 0)}</p>
              </div>
              <div>
                <p className="cc-caption text-[var(--cc-muted)]">Failed</p>
                <p className="cc-body-md-strong text-[var(--cc-error)]">{formatNumber(metrics.deliveryFailed || 0)}</p>
              </div>
              <div>
                <p className="cc-caption text-[var(--cc-muted)]">Avg Latency</p>
                <p className="cc-body-md-strong text-[var(--cc-ink)]">{formatLatency(metrics.avgLatency || 0)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Platform breakdown */}
        <div className="cc-card">
          <h3 className="cc-body-md-strong text-[var(--cc-ink)] mb-4">Platform Breakdown</h3>
          <div className="space-y-3">
            {PLATFORMS_DATA.map((platform, i) => {
              const total = metrics.deviceTokens || 52890;
              const pct = ((platform.count / total) * 100).toFixed(1);
              return (
                <div key={i} className="flex items-center gap-3">
                  <span className="cc-body-sm text-[var(--cc-muted)] w-32">{platform.label}</span>
                  <div className="flex-1 bg-[var(--cc-hairline)] rounded-full h-3 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: platform.color }}
                    />
                  </div>
                  <span className="cc-body-sm text-[var(--cc-ink)] w-16 text-right">{formatNumber(platform.count)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-4">
        <BarChart data={TOKEN_HISTORY} labels={TOKEN_LABELS} color="#0070f3" height={140} aria-label="Weekly token growth" />
        <BarChart data={PUSH_HISTORY} labels={PUSH_LABELS} color="#007aff" height={140} aria-label="Weekly push delivery volume" />
      </div>

      {/* Topics table */}
      <div className="cc-card-soft overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--cc-hairline)]">
          <h3 className="cc-body-md-strong text-[var(--cc-ink)]">Push Topics</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--cc-hairline)]/50 cc-caption text-[var(--cc-muted)]">
                <th scope="col" className="text-left px-5 py-3 font-normal">Topic</th>
                <th scope="col" className="text-left px-5 py-3 font-normal">Subscribers</th>
                <th scope="col" className="text-left px-5 py-3 font-normal">Messages (24h)</th>
                <th scope="col" className="text-left px-5 py-3 font-normal">Per-Subscriber Rate</th>
              </tr>
            </thead>
            <tbody>
              {TOPICS.map((t, i) => (
                <tr key={i} className="border-b border-[var(--cc-hairline)]/30 hover:bg-[var(--cc-canvas-soft)] transition-colors">
                  <td className="px-5 py-3 cc-code text-[var(--cc-ink)]">{t.name}</td>
                  <td className="px-5 py-3 text-[var(--cc-ink)]">{formatNumber(t.subscribers)}</td>
                  <td className="px-5 py-3 text-[var(--cc-muted)]">{formatNumber(t.messages24h)}</td>
                  <td className="px-5 py-3 text-[var(--cc-muted)]">
                    {(t.messages24h / t.subscribers).toFixed(2)} msgs/user
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Error breakdown */}
      <div className="cc-card">
        <h3 className="cc-body-md-strong text-[var(--cc-ink)] mb-4">Error Breakdown (24h)</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricBox label="Invalid Token" value="1,892" color="text-[var(--cc-error)]" />
          <MetricBox label="Expired Token" value="987" color="text-[var(--cc-warning)]" />
          <MetricBox label="Rate Limited" value="342" color="text-[var(--cc-warning)]" />
          <MetricBox label="Network Error" value="200" color="text-[var(--cc-muted)]" />
        </div>
      </div>
    </div>
  );
}
