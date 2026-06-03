'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useWallet, shortenAddress } from '@/lib/useWallet';
import { useToast } from '@/lib/toast';
import { getConnectionHistory, addConnectionRecord, getLastConnection } from '@/lib/connectionHistory';
import { useWorkerHealth } from '@/lib/WorkerHealthProvider';
import { WORKER_URLS } from '@/lib/workers';
import { DemoDisclaimer } from '@/components/DemoDisclaimer';
import { useInView } from '@/hooks/useInView';
import ChainSelector from '@/components/ChainSelector';
/* ── chain data ── */
const CHAINS = [
    { name: 'Ethereum', symbol: 'ETH', color: '#627EEA', initial: 'Ξ' },
    { name: 'Polygon', symbol: 'POL', color: '#8247E5', initial: '⬡' },
    { name: 'Arbitrum', symbol: 'ARB', color: '#28A0F0', initial: 'A' },
    { name: 'Base', symbol: 'BASE', color: '#0052FF', initial: 'B' },
    { name: 'Optimism', symbol: 'OP', color: '#FF0420', initial: 'O' },
    { name: 'BNB Chain', symbol: 'BNB', color: '#F0B90B', initial: 'B' },
    { name: 'Avalanche', symbol: 'AVAX', color: '#E84142', initial: 'A' },
    { name: 'Solana', symbol: 'SOL', color: '#9945FF', initial: 'S' },
    { name: 'Bitcoin', symbol: 'BTC', color: '#F7931A', initial: '₿' },
    { name: 'TON', symbol: 'TON', color: '#0098EA', initial: 'T' },
    { name: 'TRON', symbol: 'TRX', color: '#FF0013', initial: 'T' },
    { name: 'Cosmos', symbol: 'ATOM', color: '#2E3148', initial: 'C' },
    { name: 'Sui', symbol: 'SUI', color: '#4DA2FF', initial: 'S' },
    { name: 'Starknet', symbol: 'STRK', color: '#EF6D39', initial: 'S' },
    { name: 'NEAR', symbol: 'NEAR', color: '#000000', initial: 'N' },
    { name: 'Hedera', symbol: 'HBAR', color: '#161E3B', initial: 'H' },
];
const CHAINS_FOR_SELECT = CHAINS.filter((c) => c.symbol !== 'BTC' && c.symbol !== 'SOL');
const FEATURES = [
    { icon: '🔗', title: 'Multi-Chain', desc: '16 chains — EVM, Solana, Bitcoin. One SDK, zero fragmentation.' },
    { icon: '🔐', title: 'SIWE Auth', desc: 'Sign-In With Ethereum for secure, wallet-native authentication.' },
    { icon: '🔄', title: 'Swap (DEX Aggregation)', desc: 'Best-rate token swaps across every chain via aggregated liquidity.' },
    { icon: '🌉', title: 'Bridge (Cross-Chain)', desc: 'Seamless cross-chain asset transfers with unified routing.' },
    { icon: '🧠', title: 'Smart Accounts (AA v5)', desc: 'ERC-4337 account abstraction, paymasters, and transaction bundles.' },
    { icon: '⛽', title: 'Gas Sponsorship', desc: 'Let your app cover gas — invisible blockchain UX for end users.' },
    { icon: '🔑', title: 'Passkey Auth', desc: 'Passwordless, biometric wallet login via WebAuthn passkeys.' },
    { icon: '📱', title: 'Multi-Platform', desc: 'Web, React Native, Unity, server — one consistent toolkit.' },
    { icon: '🏠', title: 'Self-Hosted', desc: 'Your infra, your rules. No vendor lock-in. Fully open source.' },
];
const STATS = [
    { value: '64', label: 'Packages' },
    { value: '16', label: 'Chains' },
    { value: '30+', label: 'Wallets' },
    { value: '$0', label: 'Cost' },
    { value: '100%', label: 'Open Source' },
];
/* ── particles ── */
const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    size: 2 + (i * 7) % 5,
    left: (i * 37 + 13) % 100,
    top: (i * 53 + 7) % 100,
    duration: 6 + (i * 3) % 10,
    delay: (i * 2) % 5,
    color: i % 3 === 0 ? '#3b82f6' : i % 3 === 1 ? '#8b5cf6' : '#6366f1',
}));
/* ── chain badge with hover glow ── */
function ChainBadge({ chain }) {
    return (_jsxs("div", { className: "group flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-900/80 border border-gray-800 hover:border-gray-500 transition-all duration-300 cursor-default shrink-0 hover:-translate-y-0.5", style: {
            transition: 'all 0.3s ease',
        }, children: [_jsx("span", { className: "inline-flex size-5 items-center justify-center rounded-full text-[10px] font-bold text-white transition-all duration-300 group-hover:shadow-lg", style: {
                    backgroundColor: chain.color,
                    boxShadow: 'none',
                }, onMouseEnter: (e) => {
                    e.currentTarget.style.boxShadow = `0 0 12px 4px ${chain.color}60`;
                }, onMouseLeave: (e) => {
                    e.currentTarget.style.boxShadow = 'none';
                }, children: chain.initial }), _jsx("span", { className: "text-xs font-medium text-gray-400 group-hover:text-gray-200 transition-colors whitespace-nowrap", children: chain.name })] }));
}
/* ── feature card with fade-in ── */
function FeatureCard({ feature, delay }) {
    const { ref, isInView } = useInView(0.1);
    return (_jsxs("div", { ref: ref, className: `group relative p-6 rounded-2xl bg-gray-900/50 border border-gray-800 hover:border-gray-600 hover:bg-gray-800/60 transition-all duration-300 hover:-translate-y-1 ${isInView ? 'animate-fade-in-up' : 'opacity-0'}`, style: isInView ? { animationDelay: `${delay}ms`, animationFillMode: 'both' } : undefined, children: [_jsx("div", { className: "absolute inset-0 rounded-2xl bg-gradient-to-br from-brand-500/5 to-brand-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" }), _jsxs("div", { className: "relative", children: [_jsx("div", { className: "text-3xl mb-4", children: feature.icon }), _jsx("h3", { className: "text-base font-semibold text-gray-100 group-hover:text-white transition-colors mb-2", children: feature.title }), _jsx("p", { className: "text-sm text-gray-500 leading-relaxed group-hover:text-gray-400 transition-colors", children: feature.desc })] })] }));
}
/* ── backend status component (terminal style) ── */
const WORKER_LABELS = {
    rpcProxy: 'RPC Proxy',
    keysServer: 'Keys Server',
    relayServer: 'Relay Server',
    notifyServer: 'Notify Server',
    pushServer: 'Push Server',
};
function BackendStatus() {
    const { health, loading, lastChecked, refresh } = useWorkerHealth();
    const healthyCount = health.filter((h) => h.healthy).length;
    const total = Object.keys(WORKER_URLS).length;
    return (_jsx("section", { className: "w-full max-w-2xl px-4 py-8", children: _jsxs("div", { className: "relative bg-gradient-to-b from-gray-900 to-gray-950 rounded-2xl border border-emerald-900/40 overflow-hidden shadow-2xl shadow-emerald-900/10", children: [_jsx("div", { className: "pointer-events-none absolute inset-0 overflow-hidden rounded-2xl", children: _jsx("div", { className: "absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent animate-[scan-line_3s_linear_infinite]" }) }), _jsxs("div", { className: "relative flex items-center justify-between px-5 py-3 border-b border-emerald-900/30", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsxs("div", { className: "flex gap-1.5", children: [_jsx("span", { className: "size-2.5 rounded-full bg-red-500/80" }), _jsx("span", { className: "size-2.5 rounded-full bg-yellow-500/80" }), _jsx("span", { className: "size-2.5 rounded-full bg-green-500/80" })] }), _jsx("span", { className: "text-[11px] text-emerald-600/70 font-mono tracking-wider ml-1 uppercase", children: "\u26A1 Infrastructure Monitor" })] }), _jsxs("div", { className: "flex items-center gap-2", children: [lastChecked && (_jsxs("span", { className: "text-[10px] text-gray-700 font-mono", children: [Math.round((Date.now() - lastChecked) / 1000), "s ago"] })), _jsx("button", { onClick: refresh, disabled: loading, className: "text-xs text-gray-500 hover:text-emerald-400 transition-colors disabled:opacity-50", title: "Refresh", children: loading ? (_jsxs("svg", { className: "animate-spin h-4 w-4", viewBox: "0 0 24 24", fill: "none", children: [_jsx("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }), _jsx("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" })] })) : ('↻') })] })] }), _jsxs("div", { className: "relative px-5 py-2.5 border-b border-gray-800/40 flex items-center justify-between bg-gray-950/50", children: [_jsx("div", { className: "flex items-center gap-2", children: _jsxs("span", { className: `inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${healthyCount === total
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                    : healthyCount > 0
                                        ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                                        : 'bg-red-500/10 text-red-400 border border-red-500/20'}`, children: [_jsx("span", { className: `size-2 rounded-full ${healthyCount === total
                                            ? 'bg-emerald-400'
                                            : healthyCount > 0
                                                ? 'bg-yellow-400'
                                                : 'bg-red-400'}`, style: {
                                            color: healthyCount === total ? '#34d399' : healthyCount > 0 ? '#facc15' : '#f87171',
                                            animation: 'pulse-glow 2s ease-in-out infinite',
                                        } }), healthyCount, "/", total, " Workers Online"] }) }), _jsx("span", { className: "text-[10px] text-gray-700 font-mono", children: "Cloudflare Workers Edge" })] }), _jsx("div", { className: "relative divide-y divide-gray-800/30", children: (loading ? Array.from({ length: total }) : health).map((h, i) => {
                        if (loading) {
                            return (_jsxs("div", { className: "flex items-center gap-3 px-5 py-3 animate-pulse", children: [_jsx("div", { className: "size-2 rounded-full bg-gray-800" }), _jsx("div", { className: "flex-1 h-3 bg-gray-800 rounded" }), _jsx("div", { className: "w-16 h-3 bg-gray-800 rounded" })] }, i));
                        }
                        const result = h;
                        return (_jsxs("div", { className: "flex items-center gap-3 px-5 py-3 hover:bg-gray-800/20 transition-colors", children: [_jsx("span", { className: `size-2 rounded-full ${result.healthy ? 'bg-emerald-400' : 'bg-red-400'}`, style: result.healthy ? {
                                        color: '#34d399',
                                        animation: 'pulse-glow 2s ease-in-out infinite',
                                    } : undefined }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "text-sm font-mono text-gray-300", children: WORKER_LABELS[result.name] }), _jsx("p", { className: "text-[10px] text-gray-700 font-mono truncate", children: result.url })] }), _jsxs("div", { className: "text-right shrink-0", children: [_jsxs("p", { className: "text-xs font-mono text-gray-500", children: [result.latencyMs, "ms"] }), _jsx("p", { className: `text-[10px] font-mono ${result.healthy ? 'text-emerald-500' : 'text-red-400'}`, children: result.healthy ? 'OK' : result.status ? `HTTP ${result.status}` : 'OFFLINE' })] })] }, result.name));
                    }) })] }) }));
}
/* ── scroll-to-top ── */
function ScrollToTop() {
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const onScroll = () => setVisible(window.scrollY > 400);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);
    return (_jsx("button", { className: `scroll-to-top ${visible ? 'visible' : ''}`, onClick: () => window.scrollTo({ top: 0, behavior: 'smooth' }), "aria-label": "Scroll to top", children: _jsx("svg", { className: "w-5 h-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2.5, children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M5 15l7-7 7 7" }) }) }));
}
/* ── success celebration particles ── */
function SuccessParticles() {
    const particles = Array.from({ length: 12 }, (_, i) => ({
        id: i,
        left: 15 + (i * 6) % 70,
        color: ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899'][i % 5],
        delay: (i * 0.08).toFixed(2),
        size: 3 + (i % 3) * 2,
    }));
    return (_jsx("div", { className: "absolute inset-0 pointer-events-none overflow-hidden", children: particles.map((p) => (_jsx("div", { className: "absolute rounded-full animate-confetti-fall", style: {
                left: `${p.left}%`,
                top: '30%',
                width: p.size,
                height: p.size,
                backgroundColor: p.color,
                animationDelay: `${p.delay}s`,
            } }, p.id))) }));
}
/* ── connecting overlay ── */
function ConnectingOverlay() {
    return (_jsxs("div", { className: "flex flex-col items-center justify-center py-10 space-y-5 animate-status-transition", children: [_jsxs("div", { className: "relative", children: [_jsx("div", { className: "w-16 h-16 rounded-full border-2 border-blue-500/30 animate-ping-once" }), _jsx("div", { className: "absolute inset-0 flex items-center justify-center", children: _jsx("div", { className: "w-12 h-12 rounded-full bg-gradient-to-br from-blue-500/20 to-violet-500/20 border border-blue-500/40 flex items-center justify-center", children: _jsxs("svg", { className: "animate-spin h-6 w-6 text-blue-400", viewBox: "0 0 24 24", fill: "none", children: [_jsx("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }), _jsx("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" })] }) }) })] }), _jsxs("div", { className: "text-center space-y-1", children: [_jsx("p", { className: "text-sm font-semibold text-blue-400", children: "Connecting to wallet..." }), _jsx("p", { className: "text-xs text-gray-500", children: "Please approve the connection in your wallet" })] })] }));
}
/* ── main page ── */
export default function HomePage() {
    const { account, status, error, connectors, connect, disconnect } = useWallet();
    const { success, error: toastError, info } = useToast();
    const isConnected = status === 'connected';
    const isConnecting = status === 'connecting';
    const wasConnecting = status === 'connected' && account.address; // for success animation trigger
    // For the chain selector in the demo card, use a local state
    const [selectedChain, setSelectedChain] = useState('Ethereum');
    const [connectionHistory, setConnectionHistory] = useState([]);
    const [showSuccessParticles, setShowSuccessParticles] = useState(false);
    // Section refs for scroll animations
    const statsSection = useInView(0.1);
    const chainsSection = useInView(0.1);
    const ctaSection = useInView(0.1);
    useEffect(() => {
        setConnectionHistory(getConnectionHistory());
    }, []);
    // Record connection in history
    const handleConnect = useCallback(async (connectorId) => {
        try {
            await connect(connectorId);
        }
        catch (e) {
            toastError('Connection Failed', e instanceof Error ? e.message : 'Unknown error');
        }
    }, [connect, toastError]);
    // Watch for connection success
    useEffect(() => {
        if (isConnected && account.address) {
            const connector = connectors.find((c) => c.id === 'io.metamask') ?? connectors[0];
            addConnectionRecord({
                address: account.address,
                chainId: account.chainId ?? 1,
                chainName: account.chainName,
                connectorId: connector?.id ?? 'unknown',
                connectorName: connector?.name ?? 'Unknown',
                connectedAt: Date.now(),
            });
            setConnectionHistory(getConnectionHistory());
            success('Wallet Connected', `${shortenAddress(account.address)} on ${account.chainName}`);
            // Trigger success celebration
            setShowSuccessParticles(true);
            setTimeout(() => setShowSuccessParticles(false), 2000);
        }
    }, [isConnected, account.address]); // eslint-disable-line react-hooks/exhaustive-deps
    const handleDisconnect = useCallback(async () => {
        await disconnect();
        info('Disconnected', 'Wallet disconnected');
    }, [disconnect, info]);
    const handleQuickReconnect = useCallback(async () => {
        const last = getLastConnection();
        if (last) {
            await handleConnect(last.connectorId);
        }
    }, [handleConnect]);
    return (_jsxs("div", { className: "flex flex-col items-center min-h-screen relative", children: [_jsx("div", { className: "fixed inset-0 pointer-events-none overflow-hidden", "aria-hidden": "true", children: PARTICLES.map((p) => (_jsx("div", { className: "particle", style: {
                        width: p.size,
                        height: p.size,
                        left: `${p.left}%`,
                        top: `${p.top}%`,
                        backgroundColor: p.color,
                        opacity: 0.3,
                        animationDuration: `${p.duration}s`,
                        animationDelay: `${p.delay}s`,
                    } }, p.id))) }), _jsx(DemoDisclaimer, {}), _jsxs("section", { className: "relative w-full max-w-4xl text-center space-y-8 pt-8 sm:pt-20 pb-12 px-4 z-10", children: [_jsx("div", { className: "absolute -top-20 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-brand-500/10 via-brand-400/5 to-brand-300/10 blur-3xl animate-hero-glow pointer-events-none", "aria-hidden": "true" }), _jsxs("div", { className: "relative flex items-center justify-center gap-3", children: [_jsxs("div", { className: "inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium", children: [_jsx("span", { className: "size-2 rounded-full bg-green-400 animate-pulse" }), "v0.1.0 \u2014 Open Source"] }), _jsx("div", { className: "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-800/60 border border-gray-700/50 text-gray-400 text-xs font-medium", children: "\u2B50 200+ stars" })] }), _jsx("h1", { className: "relative text-6xl sm:text-7xl font-extrabold tracking-tight", children: _jsx("span", { className: "bg-gradient-to-r from-brand-400 via-brand-500 to-brand-300 bg-clip-text text-transparent animate-gradient-shift", children: "Cinacoin" }) }), _jsx("p", { className: "relative text-xl sm:text-2xl font-medium text-gray-300 max-w-2xl mx-auto", children: "The open-source wallet connection toolkit" }), _jsx("p", { className: "relative text-base sm:text-lg text-gray-500 max-w-xl mx-auto leading-relaxed", children: "Connect wallets, swap tokens, bridge chains across 16 networks. Fully self-hosted. Zero vendor lock-in." }), _jsxs("div", { className: "relative flex flex-wrap items-center justify-center gap-4 pt-2", children: [_jsx("button", { onClick: () => handleConnect('io.metamask'), disabled: isConnecting, className: "px-8 py-4 rounded-2xl font-semibold text-base bg-gradient-to-r from-brand-600 to-brand-500 text-white hover:from-brand-500 hover:to-brand-400 shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed", children: isConnecting ? (_jsxs("span", { className: "inline-flex items-center gap-2", children: [_jsxs("svg", { className: "animate-spin h-5 w-5", viewBox: "0 0 24 24", fill: "none", children: [_jsx("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }), _jsx("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" })] }), "Connecting..."] })) : 'Connect Wallet' }), _jsx(Link, { href: "/swap", className: "px-6 py-4 rounded-2xl font-semibold text-base bg-gray-800/60 border border-gray-700/60 text-gray-300 hover:text-white hover:border-gray-500 transition-all duration-200", children: "Try Swap Demo \u2192" }), _jsx(Link, { href: "/multi-chain", className: "px-6 py-4 rounded-2xl font-semibold text-base bg-gray-800/60 border border-gray-700/60 text-gray-300 hover:text-white hover:border-gray-500 transition-all duration-200", children: "Multi-Chain \u2192" })] })] }), _jsx("section", { className: "relative w-full max-w-2xl px-4 py-8 z-10", children: _jsxs("div", { className: "relative bg-gradient-to-b from-gray-800/80 to-gray-900/80 backdrop-blur-xl rounded-3xl border border-gray-700/50 shadow-2xl shadow-black/40 overflow-hidden", children: [_jsx("div", { className: "absolute -inset-px rounded-3xl bg-gradient-to-r from-brand-500/20 via-brand-400/20 to-brand-300/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" }), _jsxs("div", { className: "relative flex items-center justify-between px-6 py-4 border-b border-gray-700/40", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsxs("div", { className: "flex gap-1.5", children: [_jsx("span", { className: "size-3 rounded-full bg-red-500/60" }), _jsx("span", { className: "size-3 rounded-full bg-yellow-500/60" }), _jsx("span", { className: "size-3 rounded-full bg-green-500/60" })] }), _jsx("span", { className: "text-xs text-gray-500 font-mono ml-2", children: "Cinacoin Demo" })] }), _jsx("div", { className: "flex items-center gap-2", children: _jsxs("span", { className: `inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${isConnected
                                            ? 'bg-green-500/15 text-green-400 border border-green-500/20'
                                            : status === 'connecting'
                                                ? 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/20'
                                                : 'bg-gray-700/50 text-gray-500 border border-gray-600/40'}`, children: [_jsx("span", { className: `size-1.5 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : status === 'connecting' ? 'bg-yellow-400 animate-pulse' : 'bg-gray-500'}` }), isConnected ? 'Live' : isConnecting ? 'Connecting...' : 'Idle'] }) })] }), _jsxs("div", { className: "relative p-6 sm:p-8 space-y-6", children: [isConnecting && _jsx(ConnectingOverlay, {}), showSuccessParticles && _jsx(SuccessParticles, {}), !isConnected && !isConnecting && connectors.length > 0 && (_jsxs("div", { className: "space-y-3", children: [_jsx("p", { className: "text-xs text-gray-400 uppercase tracking-wider", children: "Available Wallets" }), _jsx("div", { className: "grid gap-2", children: connectors.map((c) => (_jsxs("button", { onClick: () => handleConnect(c.id), className: "flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-800/60 border border-gray-700/50 hover:border-gray-500 hover:bg-gray-700/60 transition-all text-left", children: [_jsx("span", { className: "size-8 rounded-full bg-gradient-to-br from-brand-500/20 to-brand-400/20 flex items-center justify-center text-xs font-bold text-gray-300", children: c.name[0] }), _jsx("span", { className: "text-sm font-medium text-gray-200", children: c.name }), c.id.includes('metamask') && (_jsx("span", { className: "ml-auto text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20", children: "Recommended" }))] }, c.id))) })] })), !isConnected && !isConnecting && connectors.length === 0 && (_jsxs("div", { className: "text-center py-6", children: [_jsx("p", { className: "text-gray-400 text-sm", children: "No wallet extension detected." }), _jsx("p", { className: "text-gray-500 text-xs mt-1", children: "Install MetaMask or another EIP-1193 wallet to continue." }), _jsx("button", { onClick: () => window.open('https://metamask.io/download/', '_blank'), className: "mt-4 px-6 py-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600/30 text-sm font-medium transition-colors", children: "Get MetaMask \u2192" })] })), isConnected && account.address && (_jsxs("div", { className: "relative flex items-center gap-4 p-4 rounded-xl bg-gray-900/60 border border-green-500/20 animate-status-transition overflow-hidden", children: [_jsx("div", { className: "absolute inset-0 bg-gradient-to-r from-green-500/5 to-transparent pointer-events-none" }), _jsxs("div", { className: "relative shrink-0", children: [_jsx("div", { className: "size-12 rounded-full bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-sm font-bold text-white shadow-lg shadow-blue-500/20", children: account.address.slice(2, 4).toUpperCase() }), _jsx("span", { className: "absolute -bottom-0.5 -right-0.5 size-3.5 rounded-full bg-emerald-400 border-2 border-gray-900" })] }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "text-sm font-mono text-gray-200 truncate", children: shortenAddress(account.address) }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" }), _jsxs("p", { className: "text-xs text-gray-500", children: [account.chainName, " \u00B7 ", account.chainId] })] })] }), _jsx("div", { className: "text-right shrink-0", children: _jsxs("p", { className: "text-sm font-semibold text-gray-200", children: [account.balance, " ", account.chainSymbol] }) })] })), error && (_jsx("div", { className: "p-4 rounded-xl bg-red-500/10 border border-red-500/20", children: _jsx("p", { className: "text-sm text-red-400", children: error }) })), _jsxs("div", { className: "flex flex-col sm:flex-row gap-3", children: [!isConnected ? (connectionHistory.length > 0 ? (_jsxs("div", { className: "flex-1 flex gap-3", children: [_jsx("button", { onClick: handleQuickReconnect, disabled: isConnecting, className: "flex-1 px-6 py-3.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-brand-600 to-brand-500 text-white hover:from-brand-500 hover:to-brand-400 shadow-lg shadow-brand-500/20 hover:shadow-brand-500/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed", children: isConnecting ? (_jsxs("span", { className: "inline-flex items-center gap-2", children: [_jsxs("svg", { className: "animate-spin h-4 w-4", viewBox: "0 0 24 24", fill: "none", children: [_jsx("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }), _jsx("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" })] }), "Reconnecting..."] })) : '⚡ Quick Reconnect' }), _jsx("button", { onClick: () => handleConnect('io.metamask'), disabled: isConnecting || connectors.length === 0, className: "px-6 py-3.5 rounded-xl font-semibold text-sm bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed", children: "New" })] })) : (_jsx("button", { onClick: () => handleConnect('io.metamask'), disabled: isConnecting || connectors.length === 0, className: "flex-1 px-6 py-3.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-brand-600 to-brand-500 text-white hover:from-brand-500 hover:to-brand-400 shadow-lg shadow-brand-500/20 hover:shadow-brand-500/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed", children: isConnecting ? 'Connecting...' : '⚡ Connect Wallet' }))) : (_jsx("button", { onClick: handleDisconnect, className: "flex-1 px-6 py-3.5 rounded-xl font-semibold text-sm bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600 transition-all duration-200", children: "Disconnect" })), _jsx("div", { className: "flex-1", children: _jsx(ChainSelector, { value: isConnected && account.chainName ? account.chainName : selectedChain, onChange: (v) => setSelectedChain(v), chains: CHAINS_FOR_SELECT.map((c) => ({
                                                    id: c.name,
                                                    name: c.name,
                                                    icon: c.initial,
                                                    color: c.color,
                                                })) }) })] }), _jsxs("div", { className: "grid grid-cols-3 gap-3", children: [_jsxs("div", { className: "p-3 rounded-xl bg-gray-900/50 border border-gray-800/50", children: [_jsx("p", { className: "text-[10px] uppercase tracking-wider text-gray-500 mb-1", children: "Status" }), _jsxs("div", { className: "flex items-center gap-1.5", children: [_jsx("span", { className: `size-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : isConnecting ? 'bg-yellow-400 animate-pulse' : 'bg-gray-500'}` }), _jsx("p", { className: `text-sm font-semibold ${isConnected ? 'text-green-400' : isConnecting ? 'text-yellow-400' : 'text-gray-500'}`, children: isConnected ? 'Connected' : isConnecting ? 'Connecting...' : 'Not Connected' })] })] }), _jsxs("div", { className: "p-3 rounded-xl bg-gray-900/50 border border-gray-800/50", children: [_jsx("p", { className: "text-[10px] uppercase tracking-wider text-gray-500 mb-1", children: "Network" }), _jsx("p", { className: "text-sm font-semibold text-gray-300", children: isConnected ? account.chainName : selectedChain })] }), _jsxs("div", { className: "p-3 rounded-xl bg-gray-900/50 border border-gray-800/50", children: [_jsx("p", { className: "text-[10px] uppercase tracking-wider text-gray-500 mb-1", children: "Balance" }), _jsx("p", { className: "text-sm font-semibold text-gray-300", children: isConnected ? `${account.balance} ${account.chainSymbol}` : '—' })] })] })] })] }) }), _jsx(BackendStatus, {}), _jsx("section", { ref: statsSection.ref, className: `w-full max-w-4xl px-4 py-16 z-10 ${statsSection.isInView ? 'animate-fade-in-up' : 'opacity-0'}`, children: _jsx("div", { className: "flex flex-wrap items-center justify-center gap-x-8 gap-y-4", children: STATS.map((s) => (_jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-3xl sm:text-4xl font-bold bg-gradient-to-r from-brand-400 to-brand-300 bg-clip-text text-transparent", children: s.value }), _jsx("div", { className: "text-xs text-gray-500 mt-1 font-medium", children: s.label })] }, s.label))) }) }), _jsxs("section", { className: "w-full max-w-4xl px-4 py-12 z-10", children: [_jsxs("div", { className: "text-center mb-10", children: [_jsxs("h2", { className: "text-3xl sm:text-4xl font-bold text-white mb-3", children: ["Everything you need to", ' ', _jsx("span", { className: "bg-gradient-to-r from-brand-400 to-brand-300 bg-clip-text text-transparent animate-gradient-shift", style: { backgroundSize: '200% 200%' }, children: "connect wallets" })] }), _jsx("p", { className: "text-gray-500 max-w-lg mx-auto", children: "A complete toolkit for wallet connections, cross-chain operations, and account abstraction \u2014 all open source." })] }), _jsx("div", { className: "grid sm:grid-cols-2 lg:grid-cols-3 gap-4", children: FEATURES.map((f, i) => (_jsx(FeatureCard, { feature: f, delay: i * 80 }, f.title))) })] }), _jsxs("section", { ref: chainsSection.ref, className: `w-full max-w-4xl px-4 py-16 z-10 ${chainsSection.isInView ? 'animate-fade-in-up' : 'opacity-0'}`, children: [_jsxs("div", { className: "text-center mb-8", children: [_jsx("h2", { className: "text-2xl sm:text-3xl font-bold text-white mb-2", children: "16 Chains Supported" }), _jsx("p", { className: "text-sm text-gray-500", children: "EVM \u00B7 Solana \u00B7 Bitcoin \u00B7 Layer 2s \u2014 one SDK, every network" })] }), _jsx("div", { className: "flex flex-wrap justify-center gap-2", children: CHAINS.map((c) => (_jsx(ChainBadge, { chain: c }, c.symbol))) })] }), connectionHistory.length > 0 && (_jsx("section", { className: "w-full max-w-2xl px-4 py-8 z-10", children: _jsxs("div", { className: "bg-gray-800/40 backdrop-blur rounded-2xl border border-gray-700/60 overflow-hidden", children: [_jsxs("div", { className: "px-5 py-4 border-b border-gray-700/50 flex items-center justify-between", children: [_jsx("h2", { className: "text-lg font-bold text-white", children: "Recent Connections" }), _jsxs("span", { className: "text-xs text-gray-500", children: [connectionHistory.length, " records"] })] }), _jsx("div", { className: "divide-y divide-gray-800/50", children: connectionHistory.slice(0, 5).map((record, i) => {
                                const ago = Date.now() - record.connectedAt;
                                const timeLabel = ago < 60000 ? 'Just now' : ago < 3600000 ? `${Math.floor(ago / 60000)}m ago` : ago < 86400000 ? `${Math.floor(ago / 3600000)}h ago` : `${Math.floor(ago / 86400000)}d ago`;
                                return (_jsxs("div", { className: "flex items-center gap-3 px-5 py-3 hover:bg-gray-700/20 transition-colors", children: [_jsx("div", { className: "size-8 rounded-full bg-gradient-to-br from-brand-500/20 to-brand-400/20 flex items-center justify-center text-xs font-bold text-gray-300 shrink-0", children: record.address.slice(2, 4).toUpperCase() }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "text-sm font-mono text-gray-200 truncate", children: shortenAddress(record.address) }), _jsxs("p", { className: "text-xs text-gray-500", children: [record.chainName, " \u00B7 ", record.connectorName] })] }), _jsxs("div", { className: "text-right shrink-0", children: [_jsx("p", { className: "text-xs text-gray-500", children: timeLabel }), !isConnected && (_jsx("button", { onClick: () => handleConnect(record.connectorId), className: "text-xs text-blue-400 hover:text-blue-300 transition-colors mt-0.5", children: "Reconnect" }))] })] }, i));
                            }) })] }) })), _jsx("section", { ref: ctaSection.ref, className: `w-full max-w-2xl px-4 py-20 text-center z-10 ${ctaSection.isInView ? 'animate-fade-in-up' : 'opacity-0'}`, children: _jsxs("div", { className: "relative p-10 sm:p-14 rounded-3xl bg-gradient-to-b from-gray-800/60 to-gray-900/60 border border-gray-700/40 overflow-hidden", children: [_jsx("div", { className: "absolute inset-0 animate-shimmer pointer-events-none" }), _jsxs("div", { className: "relative", children: [_jsx("h2", { className: "text-3xl sm:text-4xl font-bold text-white mb-3", children: "Ready to get started?" }), _jsx("p", { className: "text-gray-500 mb-8 max-w-md mx-auto", children: "Start building with Cinacoin. Open source, self-hosted, and free forever." }), _jsxs("div", { className: "flex flex-wrap items-center justify-center gap-4", children: [_jsx(Link, { href: "/swap", className: "px-8 py-4 rounded-2xl font-semibold text-base bg-gradient-to-r from-brand-600 to-brand-500 text-white hover:from-brand-500 hover:to-brand-400 shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 transition-all duration-200 hover:-translate-y-0.5", children: "Get Started" }), _jsx("button", { className: "px-8 py-4 rounded-2xl font-semibold text-base bg-transparent border border-gray-600 text-gray-300 hover:text-white hover:border-gray-400 transition-all duration-200", children: "View Docs" })] })] })] }) }), _jsx("footer", { className: "relative w-full max-w-4xl px-4 py-8 border-t border-gray-800/50 z-10", children: _jsxs("div", { className: "flex flex-wrap items-center justify-between gap-4", children: [_jsx("p", { className: "text-xs text-gray-600", children: "\u00A9 2026 Cinacoin. Open source under MIT License." }), _jsxs("div", { className: "flex items-center gap-4", children: [_jsx(Link, { href: "/swap", className: "text-xs text-gray-500 hover:text-gray-300 transition-colors", children: "Swap" }), _jsx(Link, { href: "/multi-chain", className: "text-xs text-gray-500 hover:text-gray-300 transition-colors", children: "Multi-Chain" }), _jsx("span", { className: "text-xs text-gray-700", children: "|" }), _jsx("a", { href: "https://github.com/cinaseek/cinacoin", target: "_blank", rel: "noopener noreferrer", className: "text-xs text-gray-500 hover:text-gray-300 transition-colors", children: "GitHub" })] })] }) }), _jsx(ScrollToTop, {})] }));
}
//# sourceMappingURL=page.js.map