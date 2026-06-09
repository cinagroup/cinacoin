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
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-slate-800">CinaCoin Analytics</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex bg-slate-100 rounded-lg p-1">
                {["24h", "7d", "30d", "90d"].map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-3 py-1 text-sm rounded-md transition-all ${
                      timeRange === range
                        ? "bg-white text-primary-600 shadow-sm font-medium"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>
              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-primary-700">A</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {kpiData.map((kpi, index) => (
            <KPICard key={index} {...kpi} />
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">User Growth</h2>
            <UserGrowthChart />
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">API Calls Trend</h2>
            <APICallsChart />
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Region Distribution</h2>
            <RegionDistribution />
          </div>
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Recent Activity</h2>
            <RecentActivity />
          </div>
        </div>
      </main>
    </div>
  );
}
