"use client";

import MetricCard from "@/components/MetricCard";

/**
 * Cloud platform overview page.
 */
export default function CloudPage() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold text-[var(--cc-ink)]">Cloud Platform</h1>
        <p className="text-sm text-[var(--cc-muted)] mt-1">
          Cloud infrastructure and deployment management
        </p>
      </div>

      {/* Summary metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Active Deployments"
          value="24"
          delta={{ value: 4.2, isPositive: true }}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" />
            </svg>
          }
        />
        <MetricCard
          title="Regions"
          value="8"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
            </svg>
          }
        />
        <MetricCard
          title="Bandwidth (30d)"
          value="2.4 TB"
          delta={{ value: 18.7, isPositive: true }}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
          }
        />
        <MetricCard
          title="Cost (MTD)"
          value="$1,247"
          delta={{ value: -5.3, isPositive: true }}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      {/* Deployments list */}
      <div className="cc-card overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--cc-hairline)] flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[var(--cc-ink)]">Recent Deployments</h3>
          <button className="cc-btn-ghost text-xs">View all</button>
        </div>
        <div className="divide-y divide-[var(--cc-hairline)]">
          {[
            { name: "backend-dashboard", version: "v2.4.1", status: "success", time: "5 min ago", region: "us-east-1" },
            { name: "wallet-explorer", version: "v1.8.3", status: "success", time: "2 hours ago", region: "eu-west-1" },
            { name: "analytics-service", version: "v3.1.0", status: "building", time: "10 min ago", region: "ap-southeast-1" },
            { name: "api-gateway", version: "v4.2.1", status: "success", time: "1 day ago", region: "us-west-2" },
          ].map((deploy, i) => (
            <div key={i} className="px-5 py-3 flex items-center gap-4 hover:bg-[var(--cc-canvas-soft)] transition-colors">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--cc-ink)]">{deploy.name}</p>
                <p className="text-xs text-[var(--cc-muted)]">{deploy.version} • {deploy.region}</p>
              </div>
              <span
                className={`cc-badge ${
                  deploy.status === "success"
                    ? "cc-badge-success"
                    : deploy.status === "building"
                    ? "cc-badge-info"
                    : "cc-badge-danger"
                }`}
              >
                {deploy.status}
              </span>
              <span className="text-xs text-[var(--cc-muted)] w-20 text-right">{deploy.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
