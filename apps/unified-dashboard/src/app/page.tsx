"use client";

import dynamic from "next/dynamic";
import { Sidebar } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";
import { StatsCards } from "@/components/StatsCards";
import { SystemOverview } from "@/components/SystemOverview";
import { RecentActivity } from "@/components/RecentActivity";

function ChartSkeleton() {
  return (
    <div className="cc-card" aria-busy="true" aria-label="Loading chart">
      <div className="h-4 w-32 rounded bg-[var(--cc-canvas-soft-2)] animate-pulse mb-4" />
      <div className="h-[300px] flex items-end gap-2 px-2">
        {[40, 65, 50, 80, 55, 70, 90, 60, 75, 85, 45, 95].map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-t bg-[var(--cc-canvas-soft-2)] animate-pulse"
            style={{ height: `${h}%`, animationDelay: `${i * 80}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

// Lazy-load heavy chart components (recharts is ~500KB)
const UserGrowthChart = dynamic(() => import("@/components/UserGrowthChart").then(m => ({ default: m.UserGrowthChart })), {
  loading: () => <ChartSkeleton />,
  ssr: false,
});
const ApiCallsChart = dynamic(() => import("@/components/ApiCallsChart").then(m => ({ default: m.ApiCallsChart })), {
  loading: () => <ChartSkeleton />,
  ssr: false,
});

export default function Home() {
  return (
    <div className="flex min-h-screen bg-[var(--cc-canvas-soft)]">
      <Sidebar />
      <div className="flex-1 md:ml-64">
        <MobileNav />
        <main className="p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            <header className="mb-8">
              <p className="cc-caption-mono text-[var(--cc-muted)] mb-2 tracking-wide">DASHBOARD</p>
              <h1 className="cc-display-sm text-[var(--cc-ink)]">
                Dashboard overview.
              </h1>
              <p className="cc-body-sm text-[var(--cc-body)] mt-1">
                Welcome to CinaCoin Unified Dashboard.
              </p>
            </header>

            <StatsCards />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              <UserGrowthChart />
              <ApiCallsChart />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              <SystemOverview />
              <RecentActivity />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
