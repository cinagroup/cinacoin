import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { statusColor, formatLatency } from "@/lib/utils";
/** Get the color ring/border for a service based on its status */
function statusBorder(status) {
    switch (status) {
        case "healthy":
            return "border-l-4 border-l-emerald-500 border-t-transparent border-r-transparent border-b-transparent";
        case "degraded":
            return "border-l-4 border-l-amber-500 border-t-transparent border-r-transparent border-b-transparent";
        case "down":
            return "border-l-4 border-l-red-500 border-t-transparent border-r-transparent border-b-transparent";
        default:
            return "border-l-4 border-l-gray-600 border-t-transparent border-r-transparent border-b-transparent";
    }
}
function statusDotColor(status) {
    switch (status) {
        case "healthy":
            return "bg-emerald-400 shadow-lg shadow-emerald-500/30";
        case "degraded":
            return "bg-amber-400 shadow-lg shadow-amber-500/30";
        case "down":
            return "bg-red-400 shadow-lg shadow-red-500/30 animate-pulse";
        default:
            return "bg-gray-500";
    }
}
function statusBadgeBg(status) {
    switch (status) {
        case "healthy":
            return "bg-emerald-500/10 border-emerald-500/20";
        case "degraded":
            return "bg-amber-500/10 border-amber-500/20";
        case "down":
            return "bg-red-500/10 border-red-500/20";
        default:
            return "bg-gray-500/10 border-gray-500/20";
    }
}
export default function ServiceCard({ service, health, demoMode = false }) {
    const isHealthy = health.status === "healthy";
    const isDegraded = health.status === "degraded";
    const isDown = health.status === "down";
    return (_jsxs("div", { className: `relative rounded-xl border border-dashboard-border bg-dashboard-surface p-5 ${statusBorder(health.status)} transition-all duration-300 hover:bg-dashboard-surfaceHover hover:shadow-xl hover:shadow-black/20`, children: [_jsx("div", { className: "absolute top-3 right-3", children: _jsxs("div", { className: `flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${statusBadgeBg(health.status)}`, children: [_jsx("span", { className: `inline-block w-2 h-2 rounded-full ${statusDotColor(health.status)}` }), _jsx("span", { className: statusColor(health.status), children: health.status === "unknown" ? "Checking..." : health.status.charAt(0).toUpperCase() + health.status.slice(1) })] }) }), _jsxs("div", { className: "mb-4", children: [_jsxs("div", { className: "flex items-center gap-3 mb-2", children: [_jsx("span", { className: "text-2xl", role: "img", "aria-label": service.name, children: service.icon }), _jsx("h3", { className: "text-base font-semibold text-white", children: service.name })] }), _jsx("p", { className: "text-xs text-dashboard-muted leading-relaxed", children: service.description })] }), _jsxs("div", { className: "space-y-2", children: [health.latency !== null && health.latency >= 0 && (_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-xs text-dashboard-muted", children: "Response Time" }), _jsx("span", { className: `text-sm font-medium ${isDown ? "text-dashboard-danger" :
                                    isDegraded ? "text-dashboard-warning" :
                                        health.latency > 500 ? "text-dashboard-warning" : "text-white"}`, children: formatLatency(health.latency) })] })), health.error && (_jsxs("div", { className: "flex items-center gap-1.5", children: [_jsx("span", { className: "text-xs text-red-400", children: "\u26A0" }), _jsx("span", { className: "text-xs text-red-400/80 truncate", children: health.error })] })), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-xs text-dashboard-muted", children: "Last Check" }), _jsx("span", { className: "text-xs text-dashboard-muted/60", children: health.lastChecked ? new Date(health.lastChecked).toLocaleTimeString() : "—" })] })] }), demoMode && health.status === "down" && (_jsx("div", { className: "mt-3 pt-3 border-t border-dashboard-border", children: _jsx("p", { className: "text-xs text-dashboard-muted/60", children: "\u2139\uFE0F Services on Cloudflare Workers \u2014 using demo data" }) }))] }));
}
//# sourceMappingURL=ServiceCard.js.map