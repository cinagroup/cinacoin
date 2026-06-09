"use client";

import { useState } from "react";
import KPICard from "@/components/KPICard";
import UserGrowthChart from "@/components/UserGrowthChart";
import APICallsChart from "@/components/APICallsChart";
import RegionDistribution from "@/components/RegionDistribution";
import RecentActivity from "@/components/RecentActivity";

const kpiData: Array<{ title: string; value: string; change: string; trend: "up" | "down" }> = [
  { title: "Total Users", value: "128,456", change: "+12.5%", trend: "up" },
  { title: "API Calls (24h)", value: "2.4M", change: "+8.3%", trend: "up" },
  { title: "Avg Response Time", value: "45ms", change: "-15.2%", trend: "down" },
  { title: "Active Sessions", value: "8,932", change: "+3.7%", trend: "up" },
];

export default function Home() {
  const [timeRange, setTimeRange] = useState("7d");

  return (
    <div className="min-h-screen bg-canvas-soft">
      {/* Header */}
      <header className="bg-canvas/80 backdrop-blur-sm border-b border-hairline sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-lg">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-md">
              <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h1 className="text-heading-3 text-ink">CinaCoin Analytics</h1>
            </div>
            <div className="flex items-center gap-lg">
              <div className="flex bg-canvas-soft-2 rounded-md p-xxs">
                {["24h", "7d", "30d", "90d"].map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-sm py-xxs text-body-sm rounded-sm transition-all ${
                      timeRange === range
                        ? "bg-canvas text-ink font-medium shadow-cinacoin-2"
                        : "text-ink-mute hover:text-ink"
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>
              <div className="w-8 h-8 bg-canvas-soft-2 rounded-full flex items-center justify-center">
                <span className="text-body-sm font-medium text-ink">A</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-lg py-xl">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-lg mb-xl">
          {kpiData.map((kpi, index) => (
            <KPICard key={index} {...kpi} />
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg mb-xl">
          <div className="card p-lg">
            <h2 className="text-heading-3 text-ink mb-lg">User Growth</h2>
            <UserGrowthChart />
          </div>
          <div className="card p-lg">
            <h2 className="text-heading-3 text-ink mb-lg">API Calls Trend</h2>
            <APICallsChart />
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
          <div className="lg:col-span-1 card p-lg">
            <h2 className="text-heading-3 text-ink mb-lg">Region Distribution</h2>
            <RegionDistribution />
          </div>
          <div className="lg:col-span-2 card p-lg">
            <h2 className="text-heading-3 text-ink mb-lg">Recent Activity</h2>
            <RecentActivity />
          </div>
        </div>
      </main>
    </div>
  );
}
