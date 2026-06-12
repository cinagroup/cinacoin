"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import KPICard from "@/components/KPICard";
import RecentActivity from "@/components/RecentActivity";
import SiteHeader from "@/components/SiteHeader";

// Lazy-load heavy chart components (recharts is ~500KB)
const UserGrowthChart = dynamic(() => import("@/components/UserGrowthChart"), {
  loading: () => <div className="h-64 flex items-center justify-center text-ink-mute">Loading chart...</div>,
  ssr: false,
});
const APICallsChart = dynamic(() => import("@/components/APICallsChart"), {
  loading: () => <div className="h-64 flex items-center justify-center text-ink-mute">Loading chart...</div>,
  ssr: false,
});
const RegionDistribution = dynamic(() => import("@/components/RegionDistribution"), {
  loading: () => <div className="h-64 flex items-center justify-center text-ink-mute">Loading chart...</div>,
  ssr: false,
});

const kpiDataByRange: Record<string, Array<{ title: string; value: string; change: string; trend: "up" | "down" }>> = {
  "24h": [
    { title: "Total users.", value: "128,456", change: "+2.1%", trend: "up" },
    { title: "API calls (24h).", value: "2.4M", change: "+8.3%", trend: "up" },
    { title: "Avg response time.", value: "45ms", change: "-15.2%", trend: "down" },
    { title: "Active sessions.", value: "8,932", change: "+3.7%", trend: "up" },
  ],
  "7d": [
    { title: "Total users.", value: "128,456", change: "+12.5%", trend: "up" },
    { title: "API calls (7d).", value: "16.8M", change: "+15.2%", trend: "up" },
    { title: "Avg response time.", value: "48ms", change: "-12.8%", trend: "down" },
    { title: "Active sessions.", value: "9,245", change: "+8.9%", trend: "up" },
  ],
  "30d": [
    { title: "Total users.", value: "128,456", change: "+28.3%", trend: "up" },
    { title: "API calls (30d).", value: "72.1M", change: "+22.7%", trend: "up" },
    { title: "Avg response time.", value: "52ms", change: "-8.4%", trend: "down" },
    { title: "Active sessions.", value: "10,128", change: "+18.2%", trend: "up" },
  ],
  "90d": [
    { title: "Total users.", value: "128,456", change: "+45.7%", trend: "up" },
    { title: "API calls (90d).", value: "215.3M", change: "+38.9%", trend: "up" },
    { title: "Avg response time.", value: "58ms", change: "-5.2%", trend: "down" },
    { title: "Active sessions.", value: "11,892", change: "+32.4%", trend: "up" },
  ],
};

export default function Home() {
  const [timeRange, setTimeRange] = useState("7d");
  const kpiData = useMemo(() => kpiDataByRange[timeRange] || kpiDataByRange["7d"], [timeRange]);

  return (
    <div className="min-h-screen bg-[var(--cc-canvas-soft)]">
      {/* Header */}
      <SiteHeader activePage="overview" timeRange={timeRange} onTimeRangeChange={setTimeRange} />

      {/* Main Content */}
      <main id="main-content" className="max-w-7xl mx-auto px-lg py-xl">
        {/* KPI Cards — no redundant page header, KPIs speak for themselves */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-lg mb-xl">
          {kpiData.map((kpi) => (
            <KPICard key={kpi.title} {...kpi} />
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg mb-xl">
          <div className="cc-card p-lg">
            <div className="flex items-baseline justify-between mb-lg">
              <h2 className="text-heading-3 text-[var(--cc-ink)]">User growth</h2>
              <span className="text-caption text-[var(--cc-muted)]">Last 12 weeks</span>
            </div>
            <UserGrowthChart />
          </div>
          <div className="cc-card p-lg">
            <div className="flex items-baseline justify-between mb-lg">
              <h2 className="text-heading-3 text-[var(--cc-ink)]">API calls</h2>
              <span className="text-caption text-[var(--cc-muted)]">Today by hour (UTC)</span>
            </div>
            <APICallsChart />
          </div>
        </div>

        {/* Bottom Row — asymmetric layout to break grid monotony */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
          <div className="lg:col-span-1 cc-card p-lg">
            <h2 className="text-heading-3 text-[var(--cc-ink)] mb-lg">By region</h2>
            <RegionDistribution />
          </div>
          <div className="lg:col-span-2 cc-card p-lg">
            <div className="flex items-baseline justify-between mb-lg">
              <h2 className="text-heading-3 text-[var(--cc-ink)]">Activity feed</h2>
              <span className="text-caption text-[var(--cc-muted)]">Auto-refreshing</span>
            </div>
            <RecentActivity />
          </div>
        </div>
      </main>
    </div>
  );
}
