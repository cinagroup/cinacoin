"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { generateDemoMetrics } from "@/lib/services";
import { formatNumber } from "@/lib/utils";
import MetricBox from "@/components/MetricBox";
import BarChart from "@/components/BarChart";
const THROUGHPUT_HISTORY = [7200, 8100, 7800, 9200, 8534, 9100, 8800, 9400, 8200, 7600, 8900, 8534];
const THROUGHPUT_LABELS = [
    "00:00", "02:00", "04:00", "06:00", "08:00", "10:00",
    "12:00", "14:00", "16:00", "18:00", "20:00", "22:00",
];
const CONNECTION_HISTORY = [1200, 1150, 1080, 1020, 980, 1050, 1247];
const CONNECTION_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const CHAIN_DATA = [
    { label: "Ethereum Mainnet", count: 520, color: "#627eea", status: "healthy" },
    { label: "Polygon", count: 380, color: "#8247e5", status: "healthy" },
    { label: "Arbitrum", count: 197, color: "#28a0f0", status: "healthy" },
    { label: "Optimism", count: 98, color: "#ff0420", status: "degraded" },
    { label: "Solana", count: 52, color: "#9945ff", status: "healthy" },
];
const DO_STATS = [
    { label: "Active DOs", value: 89, icon: "🏗️" },
    { label: "Avg DO Latency", value: "3ms", icon: "⚡" },
    { label: "DO Errors (24h)", value: "2", icon: "⚠️" },
    { label: "WebSocket Uptime", value: "99.97%", icon: "🟢" },
];
const RECENT_EVENTS = [
    { event: "WebSocket connected", client: "0x7a3f…8d2e", chain: "Ethereum", time: "3s ago" },
    { event: "Subscription created", client: "0x2b1c…9f4a", chain: "Polygon", time: "12s ago" },
    { event: "WebSocket disconnected", client: "0x4d6e…3c7b", chain: "Arbitrum", time: "1m ago" },
    { event: "Heartbeat timeout", client: "0x9f8a…1e5d", chain: "Optimism", time: "2m ago" },
    { event: "WebSocket reconnected", client: "0x6c5b…4a3f", chain: "Solana", time: "3m ago" },
];
export default function RelayServerPage() {
    const [metrics, setMetrics] = useState(generateDemoMetrics("relay-server"));
    useEffect(() => {
        const interval = setInterval(() => {
            setMetrics(generateDemoMetrics("relay-server"));
        }, 30000);
        return () => clearInterval(interval);
    }, []);
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between gap-3", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-xl sm:text-2xl font-bold text-white", children: "\uD83D\uDCE1 Relay Server" }), _jsx("p", { className: "text-dashboard-muted mt-1", children: "WebSocket relay via Durable Objects for real-time chain events" })] }), _jsx("span", { className: "text-xs text-dashboard-muted bg-dashboard-surface border border-dashboard-border rounded-full px-3 py-1.5", children: "Durable Objects \u2022 WebSocket" })] }), _jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4", children: [_jsx(MetricBox, { label: "Active Connections", value: formatNumber(metrics.activeConnections || 0), color: "text-cyan-400", trend: "up" }), _jsx(MetricBox, { label: "Throughput", value: `${formatNumber(metrics.throughput || 0)} msg/s`, trend: "stable" }), _jsx(MetricBox, { label: "Total Requests", value: formatNumber(metrics.totalRequests || 0), trend: "up" }), _jsx(MetricBox, { label: "Error Rate", value: `${metrics.errorRate?.toFixed(2) || 0}%`, color: "text-dashboard-success" })] }), _jsxs("div", { className: "grid md:grid-cols-2 gap-4", children: [_jsxs("div", { className: "bg-dashboard-surface rounded-xl border border-dashboard-border p-5", children: [_jsx("h3", { className: "text-lg font-semibold text-white mb-4", children: "Durable Objects Status" }), _jsx("div", { className: "grid grid-cols-2 gap-4", children: DO_STATS.map((s, i) => (_jsx(MetricBox, { label: s.label, value: s.value, icon: s.icon }, i))) })] }), _jsxs("div", { className: "bg-dashboard-surface rounded-xl border border-dashboard-border p-5", children: [_jsx("h3", { className: "text-lg font-semibold text-white mb-4", children: "Connection Breakdown" }), _jsx("div", { className: "space-y-3", children: CHAIN_DATA.map((chain, i) => {
                                    const total = metrics.activeConnections || 1247;
                                    const pct = ((chain.count / total) * 100).toFixed(1);
                                    return (_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("span", { className: "text-sm text-dashboard-muted w-36", children: chain.label }), _jsx("div", { className: "flex-1 bg-dashboard-border rounded-full h-3 overflow-hidden", role: "progressbar", "aria-valuenow": Math.round(Number(pct)), "aria-valuemin": 0, "aria-valuemax": 100, "aria-label": `${chain.label}: ${pct}%`, children: _jsx("div", { className: "h-full rounded-full transition-all", style: { width: `${pct}%`, backgroundColor: chain.color } }) }), _jsx("span", { className: "text-sm text-white w-12 text-right", children: chain.count })] }, i));
                                }) })] })] }), _jsxs("div", { className: "grid md:grid-cols-2 gap-4", children: [_jsx(BarChart, { data: THROUGHPUT_HISTORY, labels: THROUGHPUT_LABELS, color: "#06b6d4", height: 140, "aria-label": "24h throughput trend" }), _jsx(BarChart, { data: CONNECTION_HISTORY, labels: CONNECTION_LABELS, color: "#06b6d4", height: 140, "aria-label": "Weekly active connections" })] }), _jsxs("div", { className: "bg-dashboard-surface rounded-xl border border-dashboard-border overflow-hidden", children: [_jsx("div", { className: "px-5 py-4 border-b border-dashboard-border", children: _jsx("h3", { className: "text-lg font-semibold text-white", children: "Live Events" }) }), _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b border-dashboard-border/50 text-dashboard-muted", children: [_jsx("th", { className: "text-left px-5 py-3 font-medium", children: "Event" }), _jsx("th", { className: "text-left px-5 py-3 font-medium", children: "Client" }), _jsx("th", { className: "text-left px-5 py-3 font-medium", children: "Chain" }), _jsx("th", { className: "text-left px-5 py-3 font-medium", children: "Time" })] }) }), _jsx("tbody", { children: RECENT_EVENTS.map((e, i) => (_jsxs("tr", { className: "border-b border-dashboard-border/30 hover:bg-dashboard-border/20", children: [_jsx("td", { className: "px-5 py-3", children: _jsx("span", { className: "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-dashboard-border/50 text-white", children: e.event }) }), _jsx("td", { className: "px-5 py-3 font-mono text-xs text-white", children: e.client }), _jsx("td", { className: "px-5 py-3 text-dashboard-muted", children: e.chain }), _jsx("td", { className: "px-5 py-3 text-dashboard-muted", children: e.time })] }, i))) })] }) })] })] }));
}
//# sourceMappingURL=page.js.map