"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import BarChart from "@/components/BarChart";
import MetricBox from "@/components/MetricBox";
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MAU_DATA = [42000, 48000, 55000, 61000, 73000, 82000, 89000, 95000, 102000, 115000, 128000, 142000];
const CONNECTIONS_DATA = [120000, 138000, 155000, 172000, 198000, 221000, 245000, 268000, 289000, 315000, 342000, 378000];
const AUTH_DATA = [8500, 12000, 15800, 19200, 24500, 28900, 32100, 36800, 41200, 46500, 52000, 58000];
const HOURLY_DATA = [2100, 1800, 1200, 900, 700, 850, 1500, 3200, 5800, 7200, 8100, 7900, 8400, 9200, 8800, 8500, 7800, 6900, 5200, 4100, 3800, 3200, 2800, 2400];
const HOURLY_LABELS = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, "0")}:00`);
const CHAIN_DISTRIBUTION = [
    { name: "Ethereum", pct: 35, color: "#627EEA" },
    { name: "Polygon", pct: 22, color: "#8247E5" },
    { name: "BSC", pct: 15, color: "#F0B90B" },
    { name: "Arbitrum", pct: 12, color: "#28A0F0" },
    { name: "Optimism", pct: 8, color: "#FF0420" },
    { name: "Solana", pct: 5, color: "#9945FF" },
    { name: "Bitcoin", pct: 3, color: "#F7931A" },
];
const WALLET_DISTRIBUTION = [
    { name: "MetaMask", pct: 38, icon: "🦊" },
    { name: "WalletConnect", pct: 25, icon: "🔗" },
    { name: "Coinbase Wallet", pct: 12, icon: "🔵" },
    { name: "Rainbow", pct: 8, icon: "🌈" },
    { name: "Trust Wallet", pct: 7, icon: "🛡️" },
    { name: "Others", pct: 10, icon: "📱" },
];
const AUTH_METHODS = [
    { name: "Wallet Signature (SIWE)", pct: 55, color: "#3b82f6" },
    { name: "Email & Social Login", pct: 25, color: "#06b6d4" },
    { name: "Smart Accounts", pct: 12, color: "#8b5cf6" },
    { name: "SIWX (Cross-chain)", pct: 8, color: "#22c55e" },
];
const TOP_DAPPS = [
    { name: "Cinacoin Demo", users: 28500, growth: 12.4 },
    { name: "Hainai DeFi Portal", users: 15200, growth: 8.7 },
    { name: "CinaSwap", users: 12800, growth: 15.2 },
    { name: "Telegram Mini App", users: 9400, growth: 22.1 },
    { name: "Farcaster Mini App", users: 4200, growth: 35.8 },
];
export default function AnalyticsPage() {
    const [timeRange, setTimeRange] = useState("90d");
    const multiplier = timeRange === "7d" ? 0.08 : timeRange === "30d" ? 0.25 : timeRange === "90d" ? 0.5 : 1;
    const currentMAU = Math.round(142000 * multiplier);
    const totalConnections = Math.round(378000 * multiplier);
    const totalAuth = Math.round(58000 * multiplier);
    const activeSessions = Math.round(12847 * multiplier);
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-white", children: "\uD83D\uDCCA Analytics" }), _jsx("p", { className: "text-dashboard-muted mt-1", children: "AppKit usage metrics and connection analytics" })] }), _jsx("div", { className: "flex gap-2", role: "group", "aria-label": "Time range selector", children: ["7d", "30d", "90d", "1y"].map((range) => (_jsx("button", { onClick: () => setTimeRange(range), "aria-pressed": timeRange === range, "aria-label": `Show ${range} data`, className: `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-dashboard-surface ${timeRange === range
                                ? "bg-brand-500 text-white"
                                : "bg-dashboard-surface text-dashboard-muted hover:text-white border border-dashboard-border"}`, children: range }, range))) })] }), _jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4", children: [_jsx(MetricBox, { label: "Monthly Active Users", value: formatCompact(currentMAU), icon: "\uD83D\uDC65", trend: "up", color: "text-brand-400" }), _jsx(MetricBox, { label: "Total Connections", value: formatCompact(totalConnections), icon: "\uD83D\uDD17", trend: "up", color: "text-brand-400" }), _jsx(MetricBox, { label: "Auth Sessions", value: formatCompact(totalAuth), icon: "\uD83D\uDD10", trend: "up", color: "text-dashboard-success" }), _jsx(MetricBox, { label: "Active Sessions", value: formatCompact(activeSessions), icon: "\u26A1", trend: "up", color: "text-dashboard-warning" })] }), _jsxs("div", { className: "bg-dashboard-surface rounded-xl border border-dashboard-border p-5", children: [_jsx("h3", { className: "text-lg font-semibold text-white mb-4", id: "mau-chart-heading", children: "Monthly Active Users" }), _jsx(BarChart, { data: MAU_DATA.map((v) => Math.round(v * multiplier)), labels: MONTHS, color: "#3b82f6", height: 180, ariaLabelledBy: "mau-chart-heading" })] }), _jsxs("div", { className: "grid md:grid-cols-2 gap-4", children: [_jsxs("div", { className: "bg-dashboard-surface rounded-xl border border-dashboard-border p-5", children: [_jsx("h3", { className: "text-lg font-semibold text-white mb-4", id: "connections-chart-heading", children: "Connections Over Time" }), _jsx(BarChart, { data: CONNECTIONS_DATA.map((v) => Math.round(v * multiplier)), labels: MONTHS, color: "#06b6d4", height: 160, ariaLabelledBy: "connections-chart-heading" })] }), _jsxs("div", { className: "bg-dashboard-surface rounded-xl border border-dashboard-border p-5", children: [_jsx("h3", { className: "text-lg font-semibold text-white mb-4", id: "auth-chart-heading", children: "Authentication Events" }), _jsx(BarChart, { data: AUTH_DATA.map((v) => Math.round(v * multiplier)), labels: MONTHS, color: "#8b5cf6", height: 160, ariaLabelledBy: "auth-chart-heading" })] })] }), _jsxs("div", { className: "bg-dashboard-surface rounded-xl border border-dashboard-border p-5", children: [_jsx("h3", { className: "text-lg font-semibold text-white mb-4", id: "hourly-chart-heading", children: "Hourly Activity Distribution (24h)" }), _jsx(BarChart, { data: HOURLY_DATA, labels: HOURLY_LABELS, color: "#22c55e", height: 140, ariaLabelledBy: "hourly-chart-heading" })] }), _jsxs("div", { className: "grid md:grid-cols-2 gap-4", children: [_jsxs("div", { className: "bg-dashboard-surface rounded-xl border border-dashboard-border p-5", children: [_jsx("h3", { className: "text-lg font-semibold text-white mb-4", children: "Chain Distribution" }), _jsx("div", { className: "space-y-3", children: CHAIN_DISTRIBUTION.map((chain) => (_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-3 h-3 rounded-full flex-shrink-0", style: { backgroundColor: chain.color }, "aria-hidden": "true" }), _jsx("span", { className: "text-sm text-dashboard-muted w-24", children: chain.name }), _jsx("div", { className: "flex-1 bg-dashboard-border rounded-full h-2.5 overflow-hidden", role: "progressbar", "aria-valuenow": chain.pct, "aria-valuemin": 0, "aria-valuemax": 100, "aria-label": `${chain.name}: ${chain.pct}%`, children: _jsx("div", { className: "h-full rounded-full transition-all", style: { width: `${chain.pct}%`, backgroundColor: chain.color } }) }), _jsxs("span", { className: "text-sm text-white w-12 text-right", children: [chain.pct, "%"] })] }, chain.name))) })] }), _jsxs("div", { className: "bg-dashboard-surface rounded-xl border border-dashboard-border p-5", children: [_jsx("h3", { className: "text-lg font-semibold text-white mb-4", children: "Wallet Connectors" }), _jsx("div", { className: "space-y-3", children: WALLET_DISTRIBUTION.map((wallet) => (_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("span", { className: "text-lg", "aria-hidden": "true", children: wallet.icon }), _jsx("span", { className: "text-sm text-dashboard-muted w-32", children: wallet.name }), _jsx("div", { className: "flex-1 bg-dashboard-border rounded-full h-2.5 overflow-hidden", role: "progressbar", "aria-valuenow": wallet.pct, "aria-valuemin": 0, "aria-valuemax": 100, "aria-label": `${wallet.name}: ${wallet.pct}%`, children: _jsx("div", { className: "h-full rounded-full bg-brand-500 transition-all", style: { width: `${wallet.pct}%` } }) }), _jsxs("span", { className: "text-sm text-white w-12 text-right", children: [wallet.pct, "%"] })] }, wallet.name))) })] })] }), _jsxs("div", { className: "bg-dashboard-surface rounded-xl border border-dashboard-border p-5", children: [_jsx("h3", { className: "text-lg font-semibold text-white mb-4", children: "Authentication Methods" }), _jsxs("div", { className: "grid md:grid-cols-2 gap-6", children: [_jsx("div", { className: "space-y-3", children: AUTH_METHODS.map((method) => (_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-3 h-3 rounded-full flex-shrink-0", style: { backgroundColor: method.color }, "aria-hidden": "true" }), _jsx("span", { className: "text-sm text-dashboard-muted flex-1", children: method.name }), _jsxs("span", { className: "text-sm font-medium text-white", children: [method.pct, "%"] })] }, method.name))) }), _jsx("div", { className: "flex items-center justify-center", children: _jsxs("div", { className: "w-40 h-40 rounded-full border-8 border-dashboard-border relative", role: "img", "aria-label": "Authentication method distribution pie chart", children: [AUTH_METHODS.reduce((acc, method, i) => {
                                            const startDeg = AUTH_METHODS.slice(0, i).reduce((sum, m) => sum + (m.pct * 360) / 100, 0);
                                            const arcDeg = (method.pct * 360) / 100;
                                            acc.push(_jsx("div", { className: "absolute inset-0", style: {
                                                    background: `conic-gradient(${method.color} ${startDeg}deg ${startDeg + arcDeg}deg, transparent ${startDeg + arcDeg}deg)`,
                                                    clipPath: `conic-gradient(from 0deg, ${method.color} ${startDeg}deg ${startDeg + arcDeg}deg, transparent ${startDeg + arcDeg}deg)`,
                                                } }, method.name));
                                            return acc;
                                        }, []), _jsx("div", { className: "absolute inset-3 bg-dashboard-surface rounded-full flex items-center justify-center", children: _jsxs("div", { className: "text-center", children: [_jsx("p", { className: "text-xs text-dashboard-muted", children: "Auth Rate" }), _jsx("p", { className: "text-lg font-bold text-white", children: "94.2%" })] }) })] }) })] })] }), _jsxs("div", { className: "bg-dashboard-surface rounded-xl border border-dashboard-border p-5", children: [_jsx("h3", { className: "text-lg font-semibold text-white mb-4", children: "Top Projects by MAU" }), _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b border-dashboard-border", children: [_jsx("th", { scope: "col", className: "text-left px-4 py-3 text-dashboard-muted font-medium", children: "#" }), _jsx("th", { scope: "col", className: "text-left px-4 py-3 text-dashboard-muted font-medium", children: "Project" }), _jsx("th", { scope: "col", className: "text-right px-4 py-3 text-dashboard-muted font-medium", children: "MAU" }), _jsx("th", { scope: "col", className: "text-right px-4 py-3 text-dashboard-muted font-medium", children: "Growth" })] }) }), _jsx("tbody", { children: TOP_DAPPS.map((app, i) => (_jsxs("tr", { className: "border-b border-dashboard-border/50 hover:bg-dashboard-border/20", children: [_jsx("td", { className: "px-4 py-3 text-dashboard-muted", children: i + 1 }), _jsx("td", { className: "px-4 py-3 text-white font-medium", children: app.name }), _jsx("td", { className: "px-4 py-3 text-right text-white", children: formatCompact(app.users) }), _jsxs("td", { className: `px-4 py-3 text-right font-medium ${app.growth > 0 ? "text-dashboard-success" : "text-dashboard-danger"}`, children: [app.growth > 0 ? "+" : "", app.growth, "%"] })] }, app.name))) })] }) })] })] }));
}
function formatCompact(n) {
    if (n >= 1e6)
        return `${(n / 1e6).toFixed(1)}M`;
    if (n >= 1e3)
        return `${(n / 1e3).toFixed(1)}K`;
    return n.toLocaleString();
}
//# sourceMappingURL=page.js.map