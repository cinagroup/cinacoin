"use client";

import { useServiceMetrics } from "@/hooks/useServiceMetrics";
import { formatNumber, formatLatency } from "@/lib/utils";
import MetricBox from "@/components/MetricBox";
import BarChart from "@/components/BarChart";
import ProgressRing from "@/components/ProgressRing";

const SENT_HISTORY = [28000, 31000, 29500, 34000, 36000, 22000, 19000];
const SENT_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const CHANNELS_DATA = [
  { name: "Email", count: "142K", pct: 40.6 },
  { name: "Web Push", count: "98K", pct: 28.0 },
  { name: "Webhook", count: "76K", pct: 21.7 },
  { name: "SMS", count: "29K", pct: 8.3 },
];

const RECENT_NOTIFICATIONS = [
  { type: "email", to: "user@example.com", subject: "Transaction confirmed", status: "delivered", time: "12s ago" },
  { type: "webhook", to: "api.client.com", subject: "Price alert: BTC > $70K", status: "delivered", time: "28s ago" },
  { type: "push", to: "0x7a3f…8d2e", subject: "Swap completed", status: "delivered", time: "45s ago" },
  { type: "sms", to: "+1***-***-4567", subject: "Login verification", status: "pending", time: "1m ago" },
  { type: "email", to: "dev@project.io", subject: "API key rotation notice", status: "delivered", time: "2m ago" },
  { type: "webhook", to: "hooks.bot.io", subject: "New deposit detected", status: "failed", time: "3m ago" },
];

export default function NotifyServerPage() {
  const { metrics, isDemo, error } = useServiceMetrics("notify-server");

  if (!metrics) return <div className="flex items-center justify-center h-64 cc-body text-[var(--cc-muted)]">Loading metrics...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="cc-display-sm text-[var(--cc-ink)]">Notify server.</h1>
          <p className="cc-body-sm text-[var(--cc-muted)] mt-1">Multi-channel notification delivery service</p>
        </div>
        <span className="cc-badge">Email • Web Push • Webhook • SMS</span>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricBox label="Total Sent" value={formatNumber(metrics.totalRequests || 0)} trend="up" />
        <MetricBox label="Delivery Rate" value={`${metrics.deliveryRate?.toFixed(1) || 0}%`} color="text-[var(--cc-success)]" trend="up" />
        <MetricBox label="Avg Latency" value={formatLatency(metrics.avgLatency || 0)} />
        <MetricBox label="Error Count" value={formatNumber(metrics.errorCount || 0)} color={metrics.errorRate! > 2 ? "text-[var(--cc-error)]" : "text-[var(--cc-warning)]"} trend="down" />
      </div>

      {/* Delivery ring + channel breakdown side by side */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Delivery performance */}
        <div className="cc-card">
          <h3 className="cc-body-md-strong text-[var(--cc-ink)] mb-4">Delivery Performance</h3>
          <div className="flex items-center justify-center gap-8">
            <ProgressRing
              value={Math.round(metrics.deliveryRate || 0)}
              size={120}
              strokeWidth={10}
              color={(metrics.deliveryRate || 0) > 98 ? "var(--cc-link)" : (metrics.deliveryRate || 0) > 95 ? "var(--cc-warning)" : "var(--cc-error)"}
              label="Delivered"
            />
            <div className="space-y-3">
              <div>
                <p className="cc-caption text-[var(--cc-muted)]">Successfully Delivered</p>
                <p className="cc-body-md-strong text-[var(--cc-success)]">{metrics.deliveryRate?.toFixed(1) || 0}%</p>
              </div>
              <div>
                <p className="cc-caption text-[var(--cc-muted)]">Failed Delivery</p>
                <p className="cc-body-md-strong text-[var(--cc-error)]">{formatNumber(metrics.errorCount || 0)}</p>
              </div>
              <div>
                <p className="cc-caption text-[var(--cc-muted)]">Avg Queue Depth</p>
                <p className="cc-body-md-strong text-[var(--cc-ink)]">127</p>
              </div>
            </div>
          </div>
        </div>

        {/* Channel distribution */}
        <div className="cc-card">
          <h3 className="cc-body-md-strong text-[var(--cc-ink)] mb-4">Channel Distribution</h3>
          <div className="space-y-3">
            {CHANNELS_DATA.map((ch) => (
              <div key={ch.name} className="flex items-center gap-3">
                <span className="cc-body-sm text-[var(--cc-muted)] w-20">{ch.name}</span>
                <div className="flex-1 bg-[var(--cc-hairline)] rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${ch.pct}%`, backgroundColor: ch.pct > 30 ? "var(--cc-link)" : ch.pct > 20 ? "var(--cc-violet)" : "var(--cc-warning)" }}
                  />
                </div>
                <span className="cc-body-sm text-[var(--cc-ink)] w-12 text-right">{ch.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sent chart */}
      <BarChart data={SENT_HISTORY} labels={SENT_LABELS} color="#f5a623" height={140} aria-label="Weekly notification volume" />

      {/* Recent notifications */}
      <div className="cc-card-soft overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--cc-hairline)]">
          <h3 className="cc-body-md-strong text-[var(--cc-ink)]">Recent Notifications</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-body-sm">
            <thead>
              <tr className="border-b border-[var(--cc-hairline)]/50 cc-caption text-[var(--cc-muted)]">
                <th scope="col" className="text-left px-5 py-3 font-normal">Type</th>
                <th scope="col" className="text-left px-5 py-3 font-normal">Recipient</th>
                <th scope="col" className="text-left px-5 py-3 font-normal">Subject</th>
                <th scope="col" className="text-left px-5 py-3 font-normal">Status</th>
                <th scope="col" className="text-left px-5 py-3 font-normal">Time</th>
              </tr>
            </thead>
            <tbody>
              {RECENT_NOTIFICATIONS.map((n) => (
                <tr key={`${n.to}-${n.subject}`} className="border-b border-[var(--cc-hairline)]/30 hover:bg-[var(--cc-canvas-soft)] transition-colors">
                  <td className="px-5 py-3 text-[var(--cc-muted)]">{n.type}</td>
                  <td className="px-5 py-3 cc-code text-[var(--cc-ink)]">{n.to}</td>
                  <td className="px-5 py-3 text-[var(--cc-ink)] truncate max-w-[200px]">{n.subject}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full cc-caption font-medium ${
                      n.status === "delivered" ? "bg-[var(--cc-success)]/10 text-[var(--cc-success)]" :
                      n.status === "failed" ? "bg-[var(--cc-error)]/10 text-[var(--cc-error)]" :
                      "bg-[var(--cc-warning)]/10 text-[var(--cc-warning)]"
                    }`}>
                      {n.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-[var(--cc-muted)]">{n.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
