"use client";

import { useState } from "react";
import TimeRangeSelector, { type TimeRange } from "@/components/TimeRangeSelector";
import DashboardGrid from "@/components/DashboardGrid";
import {
  DashboardLineChart,
  DashboardAreaChart,
  DashboardBarChart,
} from "@/components/Charts";

/**
 * Analytics page — detailed metrics and charts.
 */
export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");

  const gridItems = [
    {
      id: "requests",
      component: (
        <DashboardAreaChart
          title="API Requests"
          subtitle="Total requests per period"
          dataKey="requests"
          timeRange={timeRange}
          color="#3b82f6"
        />
      ),
      colSpan: 2 as const,
    },
    {
      id: "errors",
      component: (
        <DashboardLineChart
          title="Error Rate"
          subtitle="Errors per period"
          dataKey="errors"
          timeRange={timeRange}
          color="#ef4444"
        />
      ),
      colSpan: 2 as const,
    },
    {
      id: "latency",
      component: (
        <DashboardLineChart
          title="Average Latency"
          subtitle="Response time in ms"
          dataKey="latency"
          timeRange={timeRange}
          color="#f59e0b"
        />
      ),
      colSpan: 2 as const,
    },
    {
      id: "throughput",
      component: (
        <DashboardBarChart
          title="Throughput"
          subtitle="Requests per second"
          dataKey="requests"
          timeRange={timeRange}
          color="#10b981"
        />
      ),
      colSpan: 2 as const,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--cc-ink)]">Analytics</h1>
          <p className="text-sm text-[var(--cc-muted)] mt-1">
            Detailed performance metrics and insights
          </p>
        </div>
        <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="cc-card p-5">
          <p className="cc-metric-label">Total Requests (30d)</p>
          <p className="cc-metric-value mt-1">2.4M</p>
          <p className="cc-metric-delta text-green-600 mt-2">↑ 18.2% vs last period</p>
        </div>
        <div className="cc-card p-5">
          <p className="cc-metric-label">Avg Response Time</p>
          <p className="cc-metric-value mt-1">124ms</p>
          <p className="cc-metric-delta text-green-600 mt-2">↓ 8.5% vs last period</p>
        </div>
        <div className="cc-card p-5">
          <p className="cc-metric-label">Error Rate</p>
          <p className="cc-metric-value mt-1">0.12%</p>
          <p className="cc-metric-delta text-red-600 mt-2">↑ 0.03% vs last period</p>
        </div>
      </div>

      {/* Charts */}
      <DashboardGrid items={gridItems} editable={false} />

      {/* Top endpoints */}
      <div className="cc-card p-5">
        <h3 className="text-sm font-semibold text-[var(--cc-ink)] mb-4">Top Endpoints</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--cc-hairline)]">
                <th className="text-left py-2 px-3 text-[var(--cc-muted)] font-medium">Endpoint</th>
                <th className="text-right py-2 px-3 text-[var(--cc-muted)] font-medium">Requests</th>
                <th className="text-right py-2 px-3 text-[var(--cc-muted)] font-medium">Avg Latency</th>
                <th className="text-right py-2 px-3 text-[var(--cc-muted)] font-medium">Error Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--cc-hairline)]">
              {[
                { endpoint: "/api/v1/transactions", requests: "458K", latency: "89ms", errorRate: "0.08%" },
                { endpoint: "/api/v1/wallets", requests: "312K", latency: "124ms", errorRate: "0.12%" },
                { endpoint: "/api/v1/projects", requests: "198K", latency: "67ms", errorRate: "0.05%" },
                { endpoint: "/api/v1/analytics", requests: "156K", latency: "234ms", errorRate: "0.18%" },
                { endpoint: "/api/v1/users", requests: "142K", latency: "95ms", errorRate: "0.09%" },
              ].map((row, i) => (
                <tr key={i} className="hover:bg-[var(--cc-canvas-soft)] transition-colors">
                  <td className="py-2.5 px-3 font-mono text-xs text-[var(--cc-ink-soft)]">{row.endpoint}</td>
                  <td className="py-2.5 px-3 text-right text-[var(--cc-ink)]">{row.requests}</td>
                  <td className="py-2.5 px-3 text-right text-[var(--cc-ink)]">{row.latency}</td>
                  <td className="py-2.5 px-3 text-right text-[var(--cc-ink)]">{row.errorRate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
