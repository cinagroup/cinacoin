"use client";

import { useState } from "react";
import MetricCard from "@/components/MetricCard";
import TimeRangeSelector, { type TimeRange } from "@/components/TimeRangeSelector";
import DashboardGrid from "@/components/DashboardGrid";
import {
  DashboardLineChart,
  DashboardAreaChart,
  DashboardBarChart,
  DashboardPieChart,
} from "@/components/Charts";
import { useMetrics } from "@/providers/MetricsProvider";
import { formatNumber, formatCurrency } from "@/lib/utils";

/**
 * Main dashboard page — overview of all metrics and activity.
 */
export default function DashboardPage() {
  const { summary, loading } = useMetrics();
  const [timeRange, setTimeRange] = useState<TimeRange>("7d");

  const gridItems = [
    {
      id: "users-chart",
      component: (
        <DashboardAreaChart
          title="Active Users"
          subtitle="Daily active users over time"
          dataKey="users"
          timeRange={timeRange}
          color="#3b82f6"
        />
      ),
      colSpan: 2 as const,
    },
    {
      id: "transactions-chart",
      component: (
        <DashboardBarChart
          title="Transactions"
          subtitle="Transaction volume"
          dataKey="transactions"
          timeRange={timeRange}
          color="#10b981"
        />
      ),
      colSpan: 2 as const,
    },
    {
      id: "revenue-chart",
      component: (
        <DashboardLineChart
          title="Revenue"
          subtitle="Revenue trend"
          dataKey="revenue"
          timeRange={timeRange}
          color="#f59e0b"
        />
      ),
      colSpan: 2 as const,
    },
    {
      id: "distribution-chart",
      component: (
        <DashboardPieChart
          title="Traffic Distribution"
          subtitle="By application"
          data={[
            { name: "Backend", value: 45, color: "#3b82f6" },
            { name: "Cloud", value: 30, color: "#10b981" },
            { name: "Wallet", value: 15, color: "#f59e0b" },
            { name: "Analytics", value: 10, color: "#8b5cf6" },
          ]}
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
          <h1 className="text-2xl font-semibold text-[var(--cc-ink)]">Dashboard</h1>
          <p className="text-sm text-[var(--cc-muted)] mt-1">
            Overview of your platform metrics and activity
          </p>
        </div>
        <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Users"
          value={formatNumber(summary.users, true)}
          delta={{ value: summary.usersDelta, isPositive: summary.usersDelta > 0 }}
          loading={loading}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
          }
        />
        <MetricCard
          title="Active Projects"
          value={formatNumber(summary.projects)}
          delta={{ value: summary.projectsDelta, isPositive: summary.projectsDelta > 0 }}
          loading={loading}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
            </svg>
          }
        />
        <MetricCard
          title="Transactions"
          value={formatNumber(summary.transactions, true)}
          delta={{ value: summary.transactionsDelta, isPositive: summary.transactionsDelta > 0 }}
          loading={loading}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
            </svg>
          }
        />
        <MetricCard
          title="Revenue"
          value={formatCurrency(summary.revenue, "USD", true)}
          delta={{ value: summary.revenueDelta, isPositive: summary.revenueDelta > 0 }}
          loading={loading}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      {/* Charts grid */}
      <DashboardGrid items={gridItems} editable={false} />

      {/* Recent activity */}
      <div className="cc-card p-5">
        <h3 className="text-sm font-semibold text-[var(--cc-ink)] mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {[
            { action: "Deployed", target: "backend-dashboard v2.4.1", time: "5 min ago", icon: "🚀" },
            { action: "Created", target: "Project 'wallet-explorer-v2'", time: "1 hour ago", icon: "📁" },
            { action: "Updated", target: "API rate limits for project 'analytics'", time: "2 hours ago", icon: "⚙️" },
            { action: "Invited", target: "alice@example.com to team", time: "3 hours ago", icon: "👥" },
          ].map((activity, i) => (
            <div key={i} className="flex items-center gap-3 text-sm">
              <span className="text-lg">{activity.icon}</span>
              <div className="flex-1 min-w-0">
                <span className="text-[var(--cc-ink)]">{activity.action}</span>{" "}
                <span className="text-[var(--cc-ink-soft)]">{activity.target}</span>
              </div>
              <span className="text-xs text-[var(--cc-muted)] flex-shrink-0">{activity.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
