import { jsx as _jsx } from "react/jsx-runtime";
import { ToastProvider } from '@/lib/toast';
import { WorkerHealthProvider } from '@/lib/WorkerHealthProvider';
import './globals.css';
const siteUrl = 'https://demo.cinacoin.com';
export const metadata = {
    metadataBase: new URL(siteUrl),
    title: 'Cinacoin — Wallet Connection Toolkit',
    description: 'Open-source wallet connection toolkit for 16 chains. Connect wallets, swap tokens, bridge chains. Self-hosted, zero vendor lock-in.',
    keywords: ['wallet', 'Web3', 'blockchain', 'cross-chain', 'Cinacoin', 'SDK'],
    authors: [{ name: 'Cinacoin' }],
    robots: { index: true, follow: true },
    icons: {
        icon: '/favicon.ico',
        apple: '/favicon.png',
    },
    openGraph: {
        title: 'Cinacoin — Wallet Connection Toolkit',
        description: 'Open-source wallet connection toolkit for 16 chains. Connect wallets, swap tokens, bridge chains.',
        type: 'website',
        locale: 'en_US',
        url: siteUrl,
        siteName: 'Cinacoin',
        images: [
            {
                url: '/logo.png',
                width: 1200,
                height: 630,
                alt: 'Cinacoin — Wallet Connection Toolkit',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Cinacoin — Wallet Connection Toolkit',
        description: 'Open-source wallet connection toolkit for 16 chains.',
        site: '@cinacoin',
        creator: '@cinacoin',
    },
    alternates: {
        canonical: siteUrl,
    },
};
export const viewport = {
    themeColor: [
        { media: '(prefers-color-scheme: dark)', color: '#030712' },
    ],
    colorScheme: 'dark',
};
export default function RootLayout({ children, }) {
    return (_jsx("html", { lang: "en", className: "dark", children: _jsx("body", { className: "bg-gray-950", children: _jsx(ToastProvider, { children: _jsx(WorkerHealthProvider, { children: children }) }) }) }));
}
//# sourceMappingURL=layout.js.map