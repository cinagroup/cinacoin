"use client";

import StatCard from "@/components/StatCard";

// Mock data for charts
const dailyRequests = [
  { date: "Jun 1", requests: 42300, errors: 51 },
  { date: "Jun 2", requests: 38100, errors: 42 },
  { date: "Jun 3", requests: 45600, errors: 55 },
  { date: "Jun 4", requests: 51200, errors: 63 },
  { date: "Jun 5", requests: 48900, errors: 48 },
  { date: "Jun 6", requests: 53400, errors: 71 },
  { date: "Jun 7", requests: 47200, errors: 39 },
  { date: "Jun 8", requests: 41800, errors: 44 },
  { date: "Jun 9", requests: 55100, errors: 58 },
  { date: "Jun 10", requests: 52300, errors: 47 },
];

const topChains = [
  { name: "Cinacoin Mainnet", requests: 684_200, percentage: 53.3 },
  { name: "Cinacoin Testnet", requests: 312_455, percentage: 24.3 },
  { name: "Ethereum (via bridge)", requests: 186_100, percentage: 14.5 },
  { name: "Polygon (via bridge)", requests: 101_637, percentage: 7.9 },
];

export default function AnalyticsPage() {
  const maxRequests = Math.max(...dailyRequests.map((d) => d.requests));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[24px] font-semibold text-ink">Analytics</h1>
        <p className="text-ink-body mt-1">
          Monitor your API usage, performance, and error rates.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard label="Total Requests (30d)" value="1,284,392" icon="📊" />
        <StatCard label="Avg Latency" value="42ms" icon="⚡" />
        <StatCard label="Error Rate" value="0.12%" icon="⚠️" />
        <StatCard label="Uptime" value="99.98%" icon="✅" />
      </div>

      {/* Request Trend */}
      <div className="card">
        <h2 className="text-[18px] font-semibold text-ink mb-4">Request Trend (Last 10 Days)</h2>
        <div className="space-y-2">
          {dailyRequests.map((day) => (
            <div key={day.date} className="flex items-center gap-3">
              <span className="text-[12px] text-ink-mute w-12 shrink-0">{day.date}</span>
              <div className="flex-1 h-6 bg-canvas-soft-2 rounded overflow-hidden relative">
                <div
                  className="h-full bg-link/20 rounded"
                  style={{ width: `${(day.requests / maxRequests) * 100}%` }}
                />
                <div
                  className="absolute top-0 left-0 h-full bg-danger/30 rounded"
                  style={{ width: `${(day.errors / maxRequests) * 100}%`, minWidth: day.errors > 0 ? "2px" : "0" }}
                />
              </div>
              <span className="text-[12px] text-ink-body w-16 text-right shrink-0">
                {(day.requests / 1000).toFixed(1)}k
              </span>
            </div>
          ))}
        </div>
        <div className="flex gap-4 mt-3 text-[12px] text-ink-mute">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-link/20 rounded inline-block"></span> Requests
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-danger/30 rounded inline-block"></span> Errors
          </span>
        </div>
      </div>

      {/* Top Chains */}
      <div className="card">
        <h2 className="text-[18px] font-semibold text-ink mb-4">Top Chains</h2>
        <div className="space-y-3">
          {topChains.map((chain) => (
            <div key={chain.name} className="flex items-center gap-4">
              <span className="text-[14px] text-ink w-48 shrink-0">{chain.name}</span>
              <div className="flex-1 h-3 bg-canvas-soft-2 rounded overflow-hidden">
                <div
                  className="h-full bg-link rounded"
                  style={{ width: `${chain.percentage}%` }}
                />
              </div>
              <span className="text-[14px] text-ink-body w-28 text-right shrink-0">
                {chain.requests.toLocaleString()} ({chain.percentage}%)
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Error Rate */}
      <div className="card">
        <h2 className="text-[18px] font-semibold text-ink mb-4">Error Rate Breakdown</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-canvas-soft rounded-lg">
            <div className="text-[24px] font-semibold text-ink">0.08%</div>
            <div className="text-[14px] text-ink-mute mt-1">4xx Client Errors</div>
          </div>
          <div className="p-4 bg-canvas-soft rounded-lg">
            <div className="text-[24px] font-semibold text-ink">0.03%</div>
            <div className="text-[14px] text-ink-mute mt-1">5xx Server Errors</div>
          </div>
          <div className="p-4 bg-canvas-soft rounded-lg">
            <div className="text-[24px] font-semibold text-ink">0.01%</div>
            <div className="text-[14px] text-ink-mute mt-1">Timeout Errors</div>
          </div>
        </div>
      </div>
    </div>
  );
}
