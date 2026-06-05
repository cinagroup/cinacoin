"use client";

import { useState, useEffect } from "react";
import { generateDemoMetrics, ServiceMetrics } from "@/lib/services";
import { formatNumber, formatLatency } from "@/lib/utils";
import MetricBox from "@/components/MetricBox";
import BarChart from "@/components/BarChart";
import ProgressRing from "@/components/ProgressRing";

const SENT_HISTORY = [28000, 31000, 29500, 34000, 36000, 22000, 19000];
const SENT_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const CHANNELS_DATA = [
  { name: "Email", count: "142K", icon: "📧", color: "#3b82f6", pct: 40.6 },
  { name: "Web Push", count: "98K", icon: "🌐", color: "#8b5cf6", pct: 28.0 },
  { name: "Webhook", count: "76K", icon: "🔗", color: "#f59e0b", pct: 21.7 },
  { name: "SMS", count: "29K", icon: "📱", color: "#22c55e", pct: 8.3 },
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
  const [metrics, setMetrics] = useState<ServiceMetrics>(generateDemoMetrics("notify-server"));

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(generateDemoMetrics("notify-server"));
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-white">🔔 Notify Server</h1>
          <p className="text-dashboard-muted mt-1">Multi-channel notification delivery service</p>
        </div>
        <span className="text-xs text-dashboard-muted bg-dashboard-surface border border-dashboard-border rounded-full px-3 py-1.5">
          Email • Web Push • Webhook • SMS
        </span>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricBox label="Total Sent" value={formatNumber(metrics.totalRequests || 0)} trend="up" />
        <MetricBox label="Delivery Rate" value={`${metrics.deliveryRate?.toFixed(1) || 0}%`} color="text-dashboard-success" trend="up" />
        <MetricBox label="Avg Latency" value={formatLatency(metrics.avgLatency || 0)} />
        <MetricBox label="Error Count" value={formatNumber(metrics.errorCount || 0)} color={metrics.errorRate! > 2 ? "text-dashboard-danger" : "text-dashboard-warning"} trend="down" />
      </div>

      {/* Delivery ring + channel breakdown side by side */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Delivery performance */}
        <div className="bg-dashboard-surface rounded-xl border border-dashboard-border p-5">
          <h3 className="text-lg font-semibold text-white mb-4">Delivery Performance</h3>
          <div className="flex items-center justify-center gap-8">
            <ProgressRing
              value={Math.round(metrics.deliveryRate || 0)}
              size={120}
              strokeWidth={10}
              color={(metrics.deliveryRate || 0) > 98 ? "#22c55e" : (metrics.deliveryRate || 0) > 95 ? "#f59e0b" : "#ef4444"}
              label="Delivered"
            />
            <div className="space-y-3">
              <div>
                <p className="text-sm text-dashboard-muted">Successfully Delivered</p>
                <p className="text-xl font-semibold text-dashboard-success">{metrics.deliveryRate?.toFixed(1) || 0}%</p>
              </div>
              <div>
                <p className="text-sm text-dashboard-muted">Failed Delivery</p>
                <p className="text-xl font-semibold text-dashboard-danger">{formatNumber(metrics.errorCount || 0)}</p>
              </div>
              <div>
                <p className="text-sm text-dashboard-muted">Avg Queue Depth</p>
                <p className="text-xl font-semibold text-white">127</p>
              </div>
            </div>
          </div>
        </div>

        {/* Channel distribution */}
        <div className="bg-dashboard-surface rounded-xl border border-dashboard-border p-5">
          <h3 className="text-lg font-semibold text-white mb-4">Channel Distribution</h3>
          <div className="space-y-3">
            {CHANNELS_DATA.map((ch, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-base w-6 text-center">{ch.icon}</span>
                <span className="text-sm text-dashboard-muted w-20">{ch.name}</span>
                <div className="flex-1 bg-dashboard-border rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${ch.pct}%`, backgroundColor: ch.color }}
                  />
                </div>
                <span className="text-sm text-white w-12 text-right">{ch.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sent chart */}
      <BarChart data={SENT_HISTORY} labels={SENT_LABELS} color="#f59e0b" height={140} aria-label="Weekly notification volume" />

      {/* Recent notifications */}
      <div className="bg-dashboard-surface rounded-xl border border-dashboard-border overflow-hidden">
        <div className="px-5 py-4 border-b border-dashboard-border">
          <h3 className="text-lg font-semibold text-white">Recent Notifications</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dashboard-border/50 text-dashboard-muted">
                <th className="text-left px-5 py-3 font-medium">Type</th>
                <th className="text-left px-5 py-3 font-medium">Recipient</th>
                <th className="text-left px-5 py-3 font-medium">Subject</th>
                <th className="text-left px-5 py-3 font-medium">Status</th>
                <th className="text-left px-5 py-3 font-medium">Time</th>
              </tr>
            </thead>
            <tbody>
              {RECENT_NOTIFICATIONS.map((n, i) => (
                <tr key={i} className="border-b border-dashboard-border/30 hover:bg-dashboard-border/20">
                  <td className="px-5 py-3 text-dashboard-muted">{n.type}</td>
                  <td className="px-5 py-3 font-mono text-xs text-white">{n.to}</td>
                  <td className="px-5 py-3 text-white truncate max-w-[200px]">{n.subject}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      n.status === "delivered" ? "bg-dashboard-success/10 text-dashboard-success" :
                      n.status === "failed" ? "bg-dashboard-danger/10 text-dashboard-danger" :
                      "bg-dashboard-warning/10 text-dashboard-warning"
                    }`}>
                      {n.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-dashboard-muted">{n.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
