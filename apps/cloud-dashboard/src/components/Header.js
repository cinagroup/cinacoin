"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Link from "next/link";
import { usePathname } from "next/navigation";
const navItems = [
    { href: "/", label: "Dashboard" },
    { href: "/projects", label: "Projects" },
    { href: "/settings", label: "Settings" },
];
export default function Header() {
    const pathname = usePathname();
    return (_jsx("header", { className: "border-b border-gray-200 bg-white", children: _jsxs("div", { className: "mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8", children: [_jsxs(Link, { href: "/", className: "flex items-center gap-2 text-lg font-bold text-gray-900", children: [_jsx("span", { className: "text-blue-600", children: "\uD83D\uDD22" }), _jsx("span", { children: "Cinacoin Cloud" })] }), _jsx("nav", { className: "flex items-center gap-6", children: navItems.map((item) => (_jsx(Link, { href: item.href, className: `text-sm font-medium transition-colors ${pathname === item.href
                            ? "text-blue-600"
                            : "text-gray-500 hover:text-gray-900"}`, children: item.label }, item.href))) })] }) }));
}
//# sourceMappingURL=Header.js.map