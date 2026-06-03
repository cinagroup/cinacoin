"use client";
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useAuth } from "@/lib/AuthProvider";
import { useWorkerHealth, aggregateStatusLabel } from "@/hooks/useWorkerHealth";
export default function Header({ onMenuToggle }) {
    const { address, isLoggedIn, doLogout } = useAuth();
    const { allHealthy, degradedCount, downCount, checking } = useWorkerHealth(15000);
    const shortAddress = address
        ? `${address.slice(0, 6)}…${address.slice(-4)}`
        : "";
    const statusBadge = aggregateStatusLabel(allHealthy, degradedCount, downCount, checking);
    // Determine dot color for health indicator
    const dotColor = downCount > 0
        ? "bg-dashboard-danger"
        : degradedCount > 0
            ? "bg-dashboard-warning"
            : checking
                ? "bg-dashboard-muted animate-pulse"
                : "bg-dashboard-success animate-pulse";
    const borderColor = downCount > 0
        ? "border-dashboard-danger/30"
        : degradedCount > 0
            ? "border-dashboard-warning/30"
            : checking
                ? "border-dashboard-border"
                : "border-dashboard-success/30";
    const bgColor = downCount > 0
        ? "bg-dashboard-danger/10"
        : degradedCount > 0
            ? "bg-dashboard-warning/10"
            : checking
                ? "bg-dashboard-muted/10"
                : "bg-dashboard-success/10";
    return (_jsxs("header", { className: "bg-dashboard-surface/80 backdrop-blur border-b border-dashboard-border px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("button", { onClick: onMenuToggle, className: "lg:hidden p-2 rounded-lg text-dashboard-muted hover:text-white hover:bg-white/10 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center", "aria-label": "Toggle sidebar", children: _jsx("svg", { className: "w-6 h-6", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M4 6h16M4 12h16M4 18h16" }) }) }), _jsx("img", { src: "/logo.png", alt: "cinacoin", className: "h-7 w-7 sm:h-8 sm:w-8 rounded-lg shrink-0" }), _jsxs("div", { className: "min-w-0", children: [_jsx("h2", { className: "text-base sm:text-xl font-semibold text-white truncate", children: "cinacoin Backend" }), _jsx("p", { className: "text-xs sm:text-sm text-dashboard-muted hidden sm:block", children: "Cloudflare Workers Management" })] })] }), _jsxs("div", { className: "flex items-center gap-2 sm:gap-3", children: [_jsxs("div", { className: `flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-full ${bgColor} border ${borderColor}`, children: [_jsx("span", { className: `w-2 h-2 rounded-full ${dotColor}` }), _jsx("span", { className: `text-xs font-medium hidden sm:inline ${statusBadge.color}`, children: statusBadge.label }), _jsx("span", { className: `text-xs font-medium sm:hidden ${statusBadge.color}`, children: downCount > 0 ? 'Down' : degradedCount > 0 ? 'Degraded' : 'OK' })] }), isLoggedIn && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/30", children: [_jsx("span", { className: "w-2 h-2 rounded-full bg-brand-400" }), _jsx("span", { className: "text-xs text-brand-300 font-mono", children: shortAddress })] }), _jsx("button", { onClick: doLogout, className: "px-3 py-1.5 text-xs font-medium text-red-400 border border-red-500/30 rounded-full hover:bg-red-500/10 transition-colors min-h-[36px]", children: "Logout" })] }))] })] }));
}
//# sourceMappingURL=Header.js.map