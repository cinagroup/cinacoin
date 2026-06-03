"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Link from "next/link";
import { usePathname } from "next/navigation";
const NAV_SECTIONS = [
    {
        label: "Dashboard",
        items: [
            { href: "/", label: "Overview", icon: "📊" },
            { href: "/analytics", label: "Analytics", icon: "📈" },
        ],
    },
    {
        label: "Services",
        items: [
            { href: "/rpc-proxy", label: "RPC Proxy", icon: "🔄" },
            { href: "/keys-server", label: "Keys Server", icon: "🔑" },
            { href: "/relay-server", label: "Relay Server", icon: "📡" },
            { href: "/notify-server", label: "Notify Server", icon: "🔔" },
            { href: "/push-server", label: "Push Server", icon: "📱" },
        ],
    },
    {
        label: "Configuration",
        items: [
            { href: "/project", label: "Project", icon: "📦" },
            { href: "/chains", label: "Networks", icon: "🌐" },
            { href: "/settings", label: "Settings", icon: "⚙️" },
        ],
    },
];
export default function Sidebar({ onClose }) {
    const pathname = usePathname();
    const handleNav = () => {
        onClose?.();
    };
    return (_jsxs("aside", { className: "w-64 bg-dashboard-surface border-r border-dashboard-border flex flex-col h-screen sticky top-0", children: [_jsx("div", { className: "p-6 border-b border-dashboard-border", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("img", { src: "/logo.png", alt: "cinacoin", className: "h-8 w-8 rounded-lg shrink-0" }), _jsxs("div", { className: "flex-1", children: [_jsx("h1", { className: "text-lg font-bold text-white", children: "cinacoin" }), _jsx("p", { className: "text-xs text-dashboard-muted", children: "Backend Dashboard" })] }), onClose && (_jsx("button", { onClick: onClose, className: "lg:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center", "aria-label": "Close sidebar", children: _jsx("svg", { className: "w-5 h-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M6 18L18 6M6 6l12 12" }) }) }))] }) }), _jsx("nav", { className: "flex-1 p-4 space-y-4 overflow-y-auto", children: NAV_SECTIONS.map((section) => (_jsxs("div", { children: [_jsx("p", { className: "text-[10px] uppercase tracking-wider text-dashboard-muted/60 font-semibold mb-2 px-3", children: section.label }), _jsx("div", { className: "space-y-0.5", children: section.items.map((item) => {
                                const isActive = pathname === item.href;
                                return (_jsxs(Link, { href: item.href, onClick: handleNav, className: `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors min-h-[44px] ${isActive
                                        ? "bg-brand-500/20 text-brand-400"
                                        : "text-dashboard-muted hover:text-white hover:bg-dashboard-border/50"}`, children: [_jsx("span", { className: "text-lg", children: item.icon }), item.label] }, item.href));
                            }) })] }, section.label))) }), _jsx("div", { className: "p-4 border-t border-dashboard-border", children: _jsx("div", { className: "text-xs text-dashboard-muted", children: "v0.1.0 \u2022 Cloudflare Workers" }) })] }));
}
//# sourceMappingURL=Sidebar.js.map