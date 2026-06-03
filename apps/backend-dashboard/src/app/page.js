"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Link from "next/link";
import { SERVICES, generateDemoMetrics } from "@/lib/services";
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
    const healthyCount = Object.values(health).filter((h) => h.status === "healthy").length;
    return (_jsxs("div", { className: "space-y-4 sm:space-y-6", children: [_jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between gap-3", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-xl sm:text-2xl font-bold text-white", children: "Service Overview" }), _jsxs("p", { className: "text-dashboard-muted mt-1 text-sm", children: [demoMode ? "Demo Mode — Simulated metrics" : "Live monitoring of Cloudflare Workers", lastRefresh && !demoMode && (_jsxs("span", { className: "ml-2 text-xs", children: ["\u00B7 Updated ", new Date(lastRefresh).toLocaleTimeString()] }))] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("button", { onClick: manualRefresh, disabled: checking, "aria-label": checking ? "Refreshing health check" : "Refresh health check", className: "px-3 py-2 text-sm bg-dashboard-surface border border-dashboard-border rounded-lg text-dashboard-muted hover:text-white hover:border-brand-500 transition-colors disabled:opacity-50 min-h-[40px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-dashboard-surface", children: checking ? "↻ Checking..." : "↻ Refresh" }), _jsx(Link, { href: "/settings", "aria-label": "Go to settings", className: "px-4 py-2 text-sm bg-dashboard-surface border border-dashboard-border rounded-lg text-dashboard-muted hover:text-white hover:border-brand-500 transition-colors min-h-[40px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-dashboard-surface", children: "\u2699\uFE0F Settings" })] })] }), _jsxs("div", { className: "grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4", children: [_jsx(MetricBox, { label: "Workers Health", value: `${healthyCount}/${SERVICES.length}`, icon: "\uD83C\uDFE5", color: "text-brand-400" }), degradedCount > 0 && _jsx(MetricBox, { label: "Degraded", value: degradedCount, icon: "\u26A0\uFE0F", color: "text-dashboard-warning" }), downCount > 0 && _jsx(MetricBox, { label: "Down", value: downCount, icon: "\u274C", color: "text-dashboard-danger" }), _jsx(MetricBox, { label: "Total Requests", value: formatNumber(totalRequests), icon: "\uD83D\uDCC8" }), _jsx(MetricBox, { label: "Total Errors", value: formatNumber(totalErrors), icon: "\u26A0\uFE0F", color: totalErrors > 10000 ? "text-dashboard-danger" : "text-dashboard-warning" }), _jsx(MetricBox, { label: "Avg Error Rate", value: `${avgErrorRate.toFixed(2)}%`, icon: "\uD83D\uDCC9", color: avgErrorRate > 1 ? "text-dashboard-danger" : "text-dashboard-success" })] }), _jsx(BarChart, { data: HISTORY_DATA, labels: HISTORY_DAYS, color: "#3b82f6", height: 140, "aria-label": "7-day request volume bar chart" }), _jsx("h2", { className: "text-base sm:text-lg font-semibold text-white mt-4 sm:mt-6", children: "Service Status" }), _jsx("div", { className: "grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3", children: SERVICES.map((service) => (_jsx(Link, { href: `/${service.id}`, children: _jsx(ServiceCard, { service: service, health: health[service.id] || { status: "unknown", latency: null, lastChecked: Date.now() }, demoMode: demoMode }) }, service.id))) }), _jsx("div", { className: "bg-dashboard-surface rounded-xl border border-dashboard-border overflow-hidden overflow-x-auto", children: _jsxs("table", { className: "w-full text-sm min-w-[500px]", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b border-dashboard-border", children: [_jsx("th", { scope: "col", className: "text-left px-3 sm:px-4 py-3 text-dashboard-muted font-medium", children: "Service" }), _jsx("th", { scope: "col", className: "text-left px-3 sm:px-4 py-3 text-dashboard-muted font-medium", children: "Status" }), _jsx("th", { scope: "col", className: "text-right px-3 sm:px-4 py-3 text-dashboard-muted font-medium", children: "Requests" }), _jsx("th", { scope: "col", className: "text-right px-3 sm:px-4 py-3 text-dashboard-muted font-medium", children: "Error Rate" }), _jsx("th", { scope: "col", className: "text-right px-3 sm:px-4 py-3 text-dashboard-muted font-medium", children: "Avg Latency" })] }) }), _jsx("tbody", { children: SERVICES.map((service) => {
                                const metrics = demoMode ? generateDemoMetrics(service.id) : null;
                                const h = health[service.id] || { status: "unknown", latency: null, lastChecked: 0 };
                                return (_jsxs("tr", { className: "border-b border-dashboard-border/50 hover:bg-dashboard-border/20", children: [_jsxs("td", { className: "px-3 sm:px-4 py-3 text-white whitespace-nowrap", children: [_jsx("span", { className: "mr-2", children: service.icon }), service.name] }), _jsx("td", { className: `px-3 sm:px-4 py-3 font-medium ${statusColor(h.status)}`, children: h.status }), _jsx("td", { className: "px-3 sm:px-4 py-3 text-right text-white", children: metrics ? formatNumber(metrics.totalRequests || 0) : "—" }), _jsx("td", { className: "px-3 sm:px-4 py-3 text-right text-white", children: metrics ? `${metrics.errorRate?.toFixed(2) || 0}%` : "—" }), _jsx("td", { className: "px-3 sm:px-4 py-3 text-right text-white", children: metrics ? formatLatency(metrics.avgLatency || 0) : "—" })] }, service.id));
                            }) })] }) })] }));
}
//# sourceMappingURL=page.js.map