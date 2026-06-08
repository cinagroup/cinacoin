"use client";

import Link from "next/link";
import { SERVICES, ServiceMetrics, generateDemoMetrics } from "@/lib/services";
import { formatNumber, formatLatency, statusColor } from "@/lib/utils";
import { useWorkerHealth } from "@/hooks/useWorkerHealth";
import ServiceCard from "@/components/ServiceCard";
import MetricBox from "@/components/MetricBox";
import BarChart from "@/components/BarChart";
import EmptyState from "@/components/EmptyState";
import ErrorState from "@/components/ErrorState";
import LoadingState from "@/components/LoadingState";
import ErrorBoundary from "@/components/ErrorBoundary";

// Simulated 7-day request history for overview
const HISTORY_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HISTORY_DATA = [142000, 158000, 171000, 163000, 189000, 98000, 112000];

export default function OverviewPage() {
  const { health, allHealthy, degradedCount, downCount, checking, lastRefresh, manualRefresh } = useWorkerHealth(15000);

  // Demo mode when all services are unreachable
  const demoMode = Object.keys(health).length === 0 ||
    SERVICES.every((s) => health[s.id]?.status === "down");

  // No services available
  if (SERVICES.length === 0) {
    return (
      <EmptyState
        title="No services configured"
        description="Add services in the configuration to start monitoring."
      />
    );
  }

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
    <ErrorBoundary>
    <div className="space-y-4 sm:space-y-6">
      {/* Page title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="cc-display-md text-[var(--cc-ink)]">Service Overview</h1>
          <p className="cc-body-sm text-[var(--cc-muted)] mt-1">
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
            aria-label={checking ? "Refreshing health check" : "Refresh health check"}
            className="cc-btn-secondary-sm disabled:opacity-50"
          >
            {checking ? "↻ Checking..." : "↻ Refresh"}
          </button>
          <Link
            href="/settings"
            aria-label="Go to settings"
            className="cc-btn-secondary-sm"
          >
            Settings
          </Link>
        </div>
      </div>

      {/* Aggregate metrics - Workers health summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <MetricBox label="Workers Health" value={`${healthyCount}/${SERVICES.length}`} color="text-[var(--cc-link)]" />
        {degradedCount > 0 && <MetricBox label="Degraded" value={degradedCount} color="text-[var(--cc-warning)]" />}
        {downCount > 0 && <MetricBox label="Down" value={downCount} color="text-[var(--cc-error)]" />}
        <MetricBox label="Total Requests" value={formatNumber(totalRequests)} />
        <MetricBox label="Total Errors" value={formatNumber(totalErrors)} color={totalErrors > 10000 ? "text-[var(--cc-error)]" : "text-[var(--cc-warning)]"} />
        <MetricBox label="Avg Error Rate" value={`${avgErrorRate.toFixed(2)}%`} color={avgErrorRate > 1 ? "text-[var(--cc-error)]" : "text-[var(--cc-success)]"} />
      </div>

      {/* 7-day request chart */}
      <BarChart data={HISTORY_DATA} labels={HISTORY_DAYS} color="var(--cc-link)" height={140} ariaLabelledBy="overview-heading" />

      {/* Service status cards */}
      <h2 className="cc-body-md-strong text-[var(--cc-ink)] mt-4 sm:mt-6" id="overview-heading">Service Status</h2>
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
      <div className="cc-card-soft overflow-hidden overflow-x-auto">
        <table className="w-full text-sm min-w-[500px]">
          <thead>
            <tr className="border-b border-[var(--cc-hairline)]">
              <th scope="col" className="ds-table-header">Service</th>
              <th scope="col" className="ds-table-header">Status</th>
              <th scope="col" className="ds-table-header text-right">Requests</th>
              <th scope="col" className="ds-table-header text-right">Error Rate</th>
              <th scope="col" className="ds-table-header text-right">Avg Latency</th>
            </tr>
          </thead>
          <tbody>
            {SERVICES.map((service) => {
              const metrics = demoMode ? generateDemoMetrics(service.id) : null;
              const h = health[service.id] || { status: "unknown", latency: null, lastChecked: 0 };
              return (
                <tr key={service.id} className="ds-table-row">
                  <td className="ds-table-cell whitespace-nowrap">
                    {service.name}
                  </td>
                  <td className={`ds-table-cell cc-body-sm-strong ${statusColor(h.status)}`}>
                    {h.status}
                  </td>
                  <td className="ds-table-cell text-right">{metrics ? formatNumber(metrics.totalRequests || 0) : "—"}</td>
                  <td className="ds-table-cell text-right">{metrics ? `${metrics.errorRate?.toFixed(2) || 0}%` : "—"}</td>
                  <td className="ds-table-cell text-right">
                    {metrics ? formatLatency(metrics.avgLatency || 0) : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
    </ErrorBoundary>
  );
}
