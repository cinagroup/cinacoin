import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import './globals.css';
export const metadata = {
    title: 'Cinacoin Cloud Dashboard',
    description: 'Developer portal for Cinacoin — manage projects, API keys, and usage analytics',
};
export default function RootLayout({ children, }) {
    return (_jsx("html", { lang: "en", children: _jsx("body", { className: "min-h-screen bg-dark-950 text-slate-100 antialiased", children: _jsxs("div", { className: "flex min-h-screen", children: [_jsx("aside", { className: "hidden w-64 flex-shrink-0 border-r border-dark-800 bg-dark-900/50 md:block", children: _jsxs("nav", { className: "flex h-full flex-col p-4", children: [_jsxs("div", { className: "mb-8 flex items-center gap-3", children: [_jsx("div", { className: "flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600 font-bold text-white", children: "C" }), _jsxs("div", { children: [_jsx("div", { className: "text-lg font-semibold", children: "Cinacoin Cloud" }), _jsx("div", { className: "text-xs text-slate-400", children: "Developer Portal" })] })] }), _jsxs("ul", { className: "space-y-1", children: [_jsx(NavItem, { href: "/", label: "Dashboard", icon: "grid" }), _jsx(NavItem, { href: "/projects", label: "Projects", icon: "folder" }), _jsx(NavItem, { href: "/settings", label: "Settings", icon: "settings" })] })] }) }), _jsx("main", { className: "flex-1 overflow-auto", children: children })] }) }) }));
}
function NavItem({ href, label, icon, }) {
    const icons = {
        grid: (_jsxs("svg", { className: "h-5 w-5", fill: "none", stroke: "currentColor", strokeWidth: "2", viewBox: "0 0 24 24", children: [_jsx("rect", { x: "3", y: "3", width: "7", height: "7", rx: "1" }), _jsx("rect", { x: "14", y: "3", width: "7", height: "7", rx: "1" }), _jsx("rect", { x: "3", y: "14", width: "7", height: "7", rx: "1" }), _jsx("rect", { x: "14", y: "14", width: "7", height: "7", rx: "1" })] })),
        folder: (_jsx("svg", { className: "h-5 w-5", fill: "none", stroke: "currentColor", strokeWidth: "2", viewBox: "0 0 24 24", children: _jsx("path", { d: "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" }) })),
        settings: (_jsxs("svg", { className: "h-5 w-5", fill: "none", stroke: "currentColor", strokeWidth: "2", viewBox: "0 0 24 24", children: [_jsx("circle", { cx: "12", cy: "12", r: "3" }), _jsx("path", { d: "M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" })] })),
    };
    return (_jsx("li", { children: _jsxs("a", { href: href, className: "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-dark-800 hover:text-white", children: [icons[icon], label] }) }));
}
//# sourceMappingURL=layout.js.map