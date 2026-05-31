"use client";

import Link from "next/link";
import { SERVICES, ServiceDefinition, ServiceMetrics, generateDemoMetrics } from "@/lib/services";
import { formatNumber, formatLatency, statusColor } from "@/lib/utils";
import { useWorkerHealth } from "@/hooks/useWorkerHealth";
import ServiceCard from "@/components/ServiceCard";
import MetricBox from "@/components/MetricBox";
import BarChart from "@/components/BarChart";

// Simulated 7-day request history for overview
const HISTORY_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HISTORY_DATA = [142000, 158000, 171000, 163000, 189000, 98000, 112000];

export default function OverviewPage() {
  const { health, allHealthy, degradedCount, downCount, checking, lastRefresh, manualRefresh } = useWorkerHealth(15000);

  // Demo mode when all services are unreachable
  const demoMode = Object.keys(health).length === 0 ||
    SERVICES.every((s) => health[s.id]?.status === "down");

  // Compute aggregate stats
  const totalRequests = SERVICES.reduce((sum, s) => {
    const metrics = demoMode ? generateDemoMetrics(s.id) : null;
    return sum + (metrics?.totalRequests || 0);
  }, 0);

  const totalErrors = SERVICES.reduce((sum, s) => {
    const metrics = demoMode ? generateDemoMetrics(s.id) : null;
    return sum + (metrics?.errorCount || 0);
  }, 0);

  const avgErrorRate = SERVICES.reduce((sum, s) => {
    const metrics = demoMode ? generateDemoMetrics(s.id) : null;
    return sum + (metrics?.errorRate || 0);
  }, 0) / SERVICES.length;

  const healthyCount = Object.values(health).filter(
    (h) => h.status === "healthy"
  ).length;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Service Overview</h1>
          <p className="text-dashboard-muted mt-1 text-sm">
            {demoMode ? "Demo Mode — Simulated metrics" : "Live monitoring of Cloudflare Workers"}
            {lastRefresh && !demoMode && (
              <span className="ml-2 text-xs">
                · Updated {new Date(lastRefresh).toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={manualRefresh}
            disabled={checking}
            className="px-3 py-2 text-sm bg-dashboard-surface border border-dashboard-border rounded-lg text-dashboard-muted hover:text-white hover:border-dashboard-primary transition-colors disabled:opacity-50 min-h-[40px]"
          >
            {checking ? "↻ Checking..." : "↻ Refresh"}
          </button>
          <Link
            href="/settings"
            className="px-4 py-2 text-sm bg-dashboard-surface border border-dashboard-border rounded-lg text-dashboard-muted hover:text-white hover:border-dashboard-primary transition-colors min-h-[40px]"
          >
            ⚙️ Settings
          </Link>
        </div>
      </div>

      {/* Aggregate metrics - Workers health summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <MetricBox label="Workers Health" value={`${healthyCount}/${SERVICES.length}`} icon="🏥" color="text-dashboard-primaryLight" />
        {degradedCount > 0 && <MetricBox label="Degraded" value={degradedCount} icon="⚠️" color="text-dashboard-warning" />}
        {downCount > 0 && <MetricBox label="Down" value={downCount} icon="❌" color="text-dashboard-danger" />}
        <MetricBox label="Total Requests" value={formatNumber(totalRequests)} icon="📈" />
        <MetricBox label="Total Requests" value={formatNumber(totalRequests)} icon="📈" />
        <MetricBox label="Total Errors" value={formatNumber(totalErrors)} icon="⚠️" color={totalErrors > 10000 ? "text-dashboard-danger" : "text-dashboard-warning"} />
        <MetricBox label="Avg Error Rate" value={`${avgErrorRate.toFixed(2)}%`} icon="📉" color={avgErrorRate > 1 ? "text-dashboard-danger" : "text-dashboard-success"} />
      </div>

      {/* 7-day request chart */}
      <BarChart data={HISTORY_DATA} labels={HISTORY_DAYS} color="#6366f1" height={140} />

      {/* Service status cards */}
      <h2 className="text-base sm:text-lg font-semibold text-white mt-4 sm:mt-6">Service Status</h2>
      <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SERVICES.map((service) => (
          <Link key={service.id} href={`/${service.id}`}>
            <ServiceCard
              service={service}
              health={health[service.id] || { status: "unknown", latency: null, lastChecked: Date.now() }}
              demoMode={demoMode}
            />
          </Link>
        ))}
      </div>

      {/* Service summary table */}
      <div className="bg-dashboard-surface rounded-xl border border-dashboard-border overflow-hidden overflow-x-auto">
        <table className="w-full text-sm min-w-[500px]">
          <thead>
            <tr className="border-b border-dashboard-border">
              <th className="text-left px-3 sm:px-4 py-3 text-dashboard-muted font-medium">Service</th>
              <th className="text-left px-3 sm:px-4 py-3 text-dashboard-muted font-medium">Status</th>
              <th className="text-right px-3 sm:px-4 py-3 text-dashboard-muted font-medium">Requests</th>
              <th className="text-right px-3 sm:px-4 py-3 text-dashboard-muted font-medium">Error Rate</th>
              <th className="text-right px-3 sm:px-4 py-3 text-dashboard-muted font-medium">Avg Latency</th>
            </tr>
          </thead>
          <tbody>
            {SERVICES.map((service) => {
              const metrics = demoMode ? generateDemoMetrics(service.id) : null;
              const h = health[service.id] || { status: "unknown", latency: null, lastChecked: 0 };
              return (
                <tr key={service.id} className="border-b border-dashboard-border/50 hover:bg-dashboard-border/20">
                  <td className="px-3 sm:px-4 py-3 text-white whitespace-nowrap">
                    <span className="mr-2">{service.icon}</span>
                    {service.name}
                  </td>
                  <td className={`px-3 sm:px-4 py-3 font-medium ${statusColor(h.status)}`}>
                    {h.status}
                  </td>
                  <td className="px-3 sm:px-4 py-3 text-right text-white">{metrics ? formatNumber(metrics.totalRequests || 0) : "—"}</td>
                  <td className="px-3 sm:px-4 py-3 text-right text-white">{metrics ? `${metrics.errorRate?.toFixed(2) || 0}%` : "—"}</td>
                  <td className="px-3 sm:px-4 py-3 text-right text-white">
                    {metrics ? formatLatency(metrics.avgLatency || 0) : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
