import { jsx as _jsx } from "react/jsx-runtime";
import "./globals.css";
import AppShell from "@/components/AppShell";
import AuthProvider from "@/lib/AuthProvider";
import AuthGuard from "@/components/AuthGuard";
export const metadata = {
    title: "Cinacoin — Backend Dashboard",
    description: "Management dashboard for Cinacoin Cloudflare Workers services",
    icons: {
        icon: '/favicon.ico',
        apple: '/favicon.png',
    },
    openGraph: {
        title: 'Cinacoin — Backend Dashboard',
        description: 'Management dashboard for Cinacoin Cloudflare Workers services',
        type: 'website',
        siteName: 'Cinacoin',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Cinacoin — Backend Dashboard',
        description: 'Management dashboard for Cinacoin Cloudflare Workers services',
    },
};
export default function RootLayout({ children, }) {
    return (_jsx("html", { lang: "en", children: _jsx("body", { className: "bg-dashboard-bg min-h-screen", children: _jsx(AuthProvider, { children: _jsx(AuthGuard, { children: _jsx(AppShell, { children: children }) }) }) }) }));
}
//# sourceMappingURL=layout.js.map