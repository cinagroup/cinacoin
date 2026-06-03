"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { generateDemoMetrics } from "@/lib/services";
import { formatNumber, formatLatency } from "@/lib/utils";
import MetricBox from "@/components/MetricBox";
import BarChart from "@/components/BarChart";
const REQUEST_HISTORY = [142, 168, 155, 189, 201, 178, 195, 210, 188, 223, 198, 245];
const REQUEST_LABELS = [
    "00:00", "02:00", "04:00", "06:00", "08:00", "10:00",
    "12:00", "14:00", "16:00", "18:00", "20:00", "22:00",
];
const CHAIN_DATA = [
    { name: "Ethereum", count: 45000, color: "#627EEA" },
    { name: "Polygon", count: 38000, color: "#8247E5" },
    { name: "BSC", count: 52000, color: "#F0B90B" },
    { name: "Arbitrum", count: 28000, color: "#28A0F0" },
    { name: "Optimism", count: 15000, color: "#FF0420" },
];
const RPC_METHODS = [
    { method: "eth_call", count: 89234, pct: 32.1 },
    { method: "eth_getLogs", count: 67891, pct: 24.4 },
    { method: "eth_getBalance", count: 45678, pct: 16.4 },
    { method: "eth_blockNumber", count: 38456, pct: 13.8 },
    { method: "eth_sendRawTransaction", count: 23456, pct: 8.4 },
    { method: "eth_getTransactionReceipt", count: 13567, pct: 4.9 },
];
const RPC_PROVIDERS = [
    { name: "Primary (llamarpc)", requests: 156000, latency: "142ms", status: "healthy" },
    { name: "Fallback (Alchemy)", requests: 34000, latency: "178ms", status: "healthy" },
    { name: "Fallback (Infura)", requests: 12000, latency: "203ms", status: "healthy" },
    { name: "Fallback (QuickNode)", requests: 5000, latency: "156ms", status: "healthy" },
];
export default function RPCProxyPage() {
    const [metrics, setMetrics] = useState(generateDemoMetrics("rpc-proxy"));
    useEffect(() => {
        const interval = setInterval(() => {
            setMetrics(generateDemoMetrics("rpc-proxy"));
        }, 30000);
        return () => clearInterval(interval);
    }, []);
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between gap-3", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-xl sm:text-2xl font-bold text-white", children: "\uD83D\uDD04 RPC Proxy" }), _jsx("p", { className: "text-dashboard-muted mt-1", children: "Multi-chain RPC proxy with KV caching and failover" })] }), _jsx("span", { className: "text-xs text-dashboard-muted bg-dashboard-surface border border-dashboard-border rounded-full px-3 py-1.5", children: "KV Cache \u2022 Multi-Provider Failover" })] }), _jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4", children: [_jsx(MetricBox, { label: "Total Requests", value: formatNumber(metrics.totalRequests || 0), trend: "up" }), _jsx(MetricBox, { label: "Error Rate", value: `${metrics.errorRate?.toFixed(2) || 0}%`, color: metrics.errorRate > 1 ? "text-dashboard-danger" : "text-dashboard-success", trend: "down" }), _jsx(MetricBox, { label: "Avg Latency", value: formatLatency(metrics.avgLatency || 0) }), _jsx(MetricBox, { label: "P99 Latency", value: formatLatency(metrics.p99Latency || 0) })] }), _jsxs("div", { className: "grid md:grid-cols-3 gap-4", children: [_jsxs("div", { className: "bg-dashboard-surface rounded-xl border border-dashboard-border p-5", children: [_jsx("h3", { className: "text-lg font-semibold text-white mb-4", children: "KV Cache Status" }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-dashboard-muted", children: "Cache Hit Rate" }), _jsx("p", { className: "text-3xl font-bold text-dashboard-success", children: "78.3%" })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-dashboard-muted", children: "Cached Keys" }), _jsx("p", { className: "text-2xl font-bold text-white", children: "24,891" })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-dashboard-muted", children: "KV Storage Used" }), _jsx("p", { className: "text-2xl font-bold text-white", children: "1.2 GB" })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-dashboard-muted", children: "Cache Misses (24h)" }), _jsx("p", { className: "text-2xl font-bold text-dashboard-warning", children: "48,392" })] })] })] }), _jsxs("div", { className: "md:col-span-2 grid md:grid-cols-2 gap-4", children: [_jsx(BarChart, { data: REQUEST_HISTORY, labels: REQUEST_LABELS, color: "#3b82f6", height: 140, "aria-label": "24h RPC request rate" }), _jsx(BarChart, { data: CHAIN_DATA.map(d => d.count), labels: CHAIN_DATA.map(d => d.name), color: "#8b5cf6", height: 140, "aria-label": "Requests by chain" })] })] }), _jsxs("div", { className: "bg-dashboard-surface rounded-xl border border-dashboard-border overflow-hidden", children: [_jsx("div", { className: "px-5 py-4 border-b border-dashboard-border", children: _jsx("h3", { className: "text-lg font-semibold text-white", children: "Top RPC Methods (24h)" }) }), _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b border-dashboard-border/50 text-dashboard-muted", children: [_jsx("th", { className: "text-left px-5 py-3 font-medium", children: "Method" }), _jsx("th", { className: "text-left px-5 py-3 font-medium", children: "Calls" }), _jsx("th", { className: "text-left px-5 py-3 font-medium", children: "Share" }), _jsx("th", { className: "text-left px-5 py-3 font-medium", children: "Distribution" })] }) }), _jsx("tbody", { children: RPC_METHODS.map((m, i) => (_jsxs("tr", { className: "border-b border-dashboard-border/30 hover:bg-dashboard-border/20", children: [_jsx("td", { className: "px-5 py-3 font-mono text-xs text-brand-400", children: m.method }), _jsx("td", { className: "px-5 py-3 text-white", children: formatNumber(m.count) }), _jsxs("td", { className: "px-5 py-3 text-dashboard-muted", children: [m.pct, "%"] }), _jsx("td", { className: "px-5 py-3 w-48", children: _jsx("div", { className: "bg-dashboard-border rounded-full h-2 overflow-hidden", children: _jsx("div", { className: "h-full rounded-full transition-all", style: { width: `${m.pct}%`, backgroundColor: "#3b82f6" } }) }) })] }, i))) })] }) })] }), _jsxs("div", { className: "bg-dashboard-surface rounded-xl border border-dashboard-border overflow-hidden", children: [_jsx("div", { className: "px-5 py-4 border-b border-dashboard-border", children: _jsx("h3", { className: "text-lg font-semibold text-white", children: "RPC Provider Status" }) }), _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b border-dashboard-border/50 text-dashboard-muted", children: [_jsx("th", { className: "text-left px-5 py-3 font-medium", children: "Provider" }), _jsx("th", { className: "text-left px-5 py-3 font-medium", children: "Requests" }), _jsx("th", { className: "text-left px-5 py-3 font-medium", children: "Avg Latency" }), _jsx("th", { className: "text-left px-5 py-3 font-medium", children: "Status" })] }) }), _jsx("tbody", { children: RPC_PROVIDERS.map((p, i) => (_jsxs("tr", { className: "border-b border-dashboard-border/30 hover:bg-dashboard-border/20", children: [_jsx("td", { className: "px-5 py-3 text-white", children: p.name }), _jsx("td", { className: "px-5 py-3 text-white", children: formatNumber(p.requests) }), _jsx("td", { className: "px-5 py-3 text-dashboard-muted", children: p.latency }), _jsx("td", { className: "px-5 py-3", children: _jsx("span", { className: `inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${p.status === "healthy" ? "bg-dashboard-success/10 text-dashboard-success" : "bg-dashboard-danger/10 text-dashboard-danger"}`, children: p.status }) })] }, i))) })] }) })] }), _jsxs("div", { className: "bg-dashboard-surface rounded-xl border border-dashboard-border p-5", children: [_jsx("h3", { className: "text-lg font-semibold text-white mb-4", children: "Chain Distribution (24h)" }), _jsx("div", { className: "space-y-3", children: CHAIN_DATA.map((chain, i) => {
                            const total = CHAIN_DATA.reduce((a, b) => a + b.count, 0);
                            const pct = ((chain.count / total) * 100).toFixed(1);
                            return (_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("span", { className: "text-sm text-dashboard-muted w-24", children: chain.name }), _jsx("div", { className: "flex-1 bg-dashboard-border rounded-full h-3 overflow-hidden", role: "progressbar", "aria-valuenow": Number(pct), "aria-valuemin": 0, "aria-valuemax": 100, "aria-label": `${chain.name}: ${pct}%`, children: _jsx("div", { className: "h-full rounded-full transition-all", style: { width: `${pct}%`, backgroundColor: chain.color } }) }), _jsxs("span", { className: "text-sm text-white w-16 text-right", children: [pct, "%"] })] }, i));
                        }) })] })] }));
}
//# sourceMappingURL=page.js.map