"use client";
import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { useState } from "react";
/**
 * Client component that conditionally renders sidebar + header
 * based on the current route.
 * Mobile: Sidebar is a slide-in drawer toggled from Header.
 * Desktop: Sidebar is always visible.
 */
export default function AppShell({ children }) {
    const pathname = usePathname();
    const isLogin = pathname === "/login";
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    if (isLogin) {
        return _jsx(_Fragment, { children: children });
    }
    return (_jsxs("div", { className: "flex min-h-screen", children: [mobileSidebarOpen && (_jsx("div", { className: "fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden", onClick: () => setMobileSidebarOpen(false) })), _jsx("div", { className: "hidden lg:block", children: _jsx(Sidebar, {}) }), _jsx("div", { className: `fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-200 ease-in-out lg:hidden ${mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"}`, children: _jsx(Sidebar, { onClose: () => setMobileSidebarOpen(false) }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx(Header, { onMenuToggle: () => setMobileSidebarOpen(!mobileSidebarOpen) }), _jsx("main", { className: "p-4 sm:p-6", children: children })] })] }));
}
//# sourceMappingURL=AppShell.js.map