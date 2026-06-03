'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useCallback, useMemo } from 'react';
import DemoLayout from '@/components/DemoLayout';
import { useWallet, shortenAddress } from '@/lib/useWallet';
import { getConnectionHistory } from '@/lib/connectionHistory';
import { getSwapHistory } from '@/lib/swap';
const CHAINS = [
    'All', 'Ethereum', 'Polygon', 'Arbitrum', 'Base', 'Optimism',
    'BNB Chain', 'Solana', 'Avalanche', 'TON', 'Cosmos',
];
const TYPE_FILTERS = [
    { value: 'all', label: 'All', icon: '📋' },
    { value: 'connection', label: 'Connections', icon: '🔗' },
    { value: 'swap', label: 'Swaps', icon: '🔄' },
    { value: 'chain_switch', label: 'Chain Switches', icon: '🌐' },
    { value: 'auth', label: 'Auth', icon: '🔐' },
];
const PAGE_SIZE = 10;
/* ── helpers ── */
function timeAgo(ts) {
    const diff = Date.now() - ts;
    const s = Math.floor(diff / 1000);
    if (s < 60)
        return 'Just now';
    const m = Math.floor(s / 60);
    if (m < 60)
        return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24)
        return `${h}h ago`;
    const d = Math.floor(h / 24);
    return `${d}d ago`;
}
function formatDate(ts) {
    return new Date(ts).toLocaleString();
}
function typeIcon(type) {
    switch (type) {
        case 'connection': return '🔗';
        case 'swap': return '🔄';
        case 'chain_switch': return '🌐';
        case 'auth': return '🔐';
    }
}
function statusColor(status) {
    switch (status) {
        case 'completed': return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25';
        case 'pending': return 'bg-amber-500/15 text-amber-400 border-amber-500/25';
        case 'failed': return 'bg-red-500/15 text-red-400 border-red-500/25';
    }
}
/* ── mock data generator ── */
function generateMockActivities(connections, swaps, walletAddress) {
    const items = [];
    // Connection history
    connections.forEach((c, i) => {
        items.push({
            id: `conn-${i}`,
            type: 'connection',
            title: 'Wallet Connected',
            description: `${shortenAddress(c.address)} via ${c.connectorName}`,
            chain: c.chainName,
            status: 'completed',
            timestamp: c.connectedAt,
            metadata: { connector: c.connectorName, chainId: String(c.chainId) },
        });
    });
    // Swap history
    swaps.forEach((s, i) => {
        items.push({
            id: `swap-${i}`,
            type: 'swap',
            title: `Swap ${s.from} → ${s.to}`,
            description: `${s.fromAmount} ${s.from} → ${s.toAmount} ${s.to}`,
            chain: s.chainId ? `Chain ${s.chainId}` : undefined,
            status: s.status === 'completed' ? 'completed' : s.status === 'pending' ? 'pending' : 'failed',
            timestamp: new Date(s.timestamp).getTime(),
            hash: s.txHash,
            metadata: { rate: s.rate, route: s.route },
        });
    });
    // Mock auth activities
    if (walletAddress) {
        items.push({
            id: 'auth-1',
            type: 'auth',
            title: 'SIWE Authentication',
            description: `Wallet ownership verified for ${shortenAddress(walletAddress)}`,
            status: 'completed',
            timestamp: Date.now() - 86400000 * 2,
            metadata: { method: 'SIWE', standard: 'EIP-4361' },
        });
        items.push({
            id: 'auth-2',
            type: 'auth',
            title: 'Passkey Registered',
            description: 'New biometric credential added',
            status: 'completed',
            timestamp: Date.now() - 86400000 * 5,
            metadata: { method: 'WebAuthn' },
        });
    }
    // Mock chain switch activities
    const chainSwitches = [
        { chain: 'Ethereum', ts: Date.now() - 3600000 },
        { chain: 'Polygon', ts: Date.now() - 7200000 },
        { chain: 'Arbitrum', ts: Date.now() - 14400000 },
    ];
    chainSwitches.forEach((cs, i) => {
        items.push({
            id: `switch-${i}`,
            type: 'chain_switch',
            title: `Switched to ${cs.chain}`,
            description: `Network changed to ${cs.chain}`,
            chain: cs.chain,
            status: 'completed',
            timestamp: cs.ts,
        });
    });
    // Sort by timestamp descending
    items.sort((a, b) => b.timestamp - a.timestamp);
    return items;
}
/* ── main page ── */
export default function ActivityPage() {
    const { account, status, connectors, connect } = useWallet();
    const isConnected = status === 'connected';
    const [activities, setActivities] = useState([]);
    const [chainFilter, setChainFilter] = useState('All');
    const [typeFilter, setTypeFilter] = useState('all');
    const [page, setPage] = useState(0);
    const [expandedId, setExpandedId] = useState(null);
    // Load activities
    useEffect(() => {
        const conns = getConnectionHistory();
        const swps = getSwapHistory();
        const all = generateMockActivities(conns, swps, account.address);
        setActivities(all);
    }, [account.address]);
    // Filtered + paginated
    const filtered = useMemo(() => {
        let result = activities;
        if (typeFilter !== 'all') {
            result = result.filter((a) => a.type === typeFilter);
        }
        if (chainFilter !== 'All') {
            result = result.filter((a) => a.chain === chainFilter);
        }
        return result;
    }, [activities, typeFilter, chainFilter]);
    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
    const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
    // Stats
    const stats = useMemo(() => ({
        total: activities.length,
        completed: activities.filter((a) => a.status === 'completed').length,
        pending: activities.filter((a) => a.status === 'pending').length,
        failed: activities.filter((a) => a.status === 'failed').length,
    }), [activities]);
    const handleConnect = useCallback(() => {
        connect(connectors.find((c) => c.id === 'io.metamask')?.id ?? 'io.metamask');
    }, [connect, connectors]);
    return (_jsx(DemoLayout, { children: _jsxs("div", { className: "max-w-4xl mx-auto px-4 py-8 space-y-8", children: [_jsxs("div", { className: "text-center space-y-2", children: [_jsx("h1", { className: "text-3xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent", children: "Activity History" }), _jsx("p", { className: "text-gray-400 text-sm", children: "Track all your wallet interactions and transactions" })] }), _jsxs("div", { className: "flex items-center justify-between bg-gray-800/40 backdrop-blur rounded-2xl border border-gray-700/50 px-5 py-4", children: [isConnected ? (_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "size-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white", children: account.address?.slice(2, 4).toUpperCase() }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-mono text-gray-200", children: shortenAddress(account.address ?? '') }), _jsxs("p", { className: "text-xs text-gray-500", children: [account.chainName, " \u00B7 Balance: ", account.balance, " ", account.chainSymbol] })] })] })) : (_jsx("button", { onClick: handleConnect, className: "px-5 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-all", children: "Connect Wallet" })), _jsxs("span", { className: "text-xs text-gray-500", children: [activities.length, " activities"] })] }), _jsx("div", { className: "grid grid-cols-4 gap-3", children: [
                        { label: 'Total', value: stats.total, color: 'text-white' },
                        { label: 'Completed', value: stats.completed, color: 'text-emerald-400' },
                        { label: 'Pending', value: stats.pending, color: 'text-amber-400' },
                        { label: 'Failed', value: stats.failed, color: 'text-red-400' },
                    ].map((s) => (_jsxs("div", { className: "text-center p-4 rounded-xl bg-gray-800/40 border border-gray-700/40", children: [_jsx("div", { className: `text-2xl font-bold ${s.color}`, children: s.value }), _jsx("div", { className: "text-xs text-gray-500 mt-1", children: s.label })] }, s.label))) }), _jsxs("div", { className: "space-y-3", children: [_jsx("div", { className: "flex flex-wrap gap-2", children: TYPE_FILTERS.map((f) => (_jsxs("button", { onClick: () => { setTypeFilter(f.value); setPage(0); }, className: `flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${typeFilter === f.value
                                    ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                                    : 'bg-gray-800/40 text-gray-400 border border-gray-700/40 hover:text-white hover:border-gray-600'}`, children: [_jsx("span", { children: f.icon }), f.label] }, f.value))) }), _jsxs("div", { className: "relative", children: [_jsx("select", { value: chainFilter, onChange: (e) => { setChainFilter(e.target.value); setPage(0); }, className: "w-full px-4 py-2.5 bg-gray-800/60 border border-gray-700/50 rounded-xl text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/40 appearance-none cursor-pointer", children: CHAINS.map((c) => (_jsx("option", { value: c, children: c === 'All' ? 'All Chains' : c }, c))) }), _jsx("span", { className: "pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs", children: "\u25BE" })] })] }), paginated.length === 0 ? (_jsxs("div", { className: "text-center py-16 bg-gray-800/30 rounded-2xl border border-gray-700/40", children: [_jsx("p", { className: "text-3xl mb-3", children: "\uD83D\uDD0D" }), _jsx("p", { className: "text-gray-400 text-sm", children: "No activities found" }), _jsx("p", { className: "text-gray-500 text-xs mt-1", children: "Connect your wallet and start interacting to see activity here." })] })) : (_jsx("div", { className: "space-y-2", children: paginated.map((item) => (_jsxs("div", { children: [_jsx("button", { onClick: () => setExpandedId(expandedId === item.id ? null : item.id), className: "w-full text-left p-4 rounded-xl bg-gray-800/40 border border-gray-700/40 hover:border-gray-600/60 hover:bg-gray-800/60 transition-all", "aria-expanded": expandedId === item.id, "aria-label": `${item.title} - ${item.status}`, children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("span", { className: "text-lg", children: typeIcon(item.type) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "text-sm font-medium text-gray-200 truncate", children: item.title }), _jsx("p", { className: "text-xs text-gray-500 truncate", children: item.description })] }), _jsxs("div", { className: "flex items-center gap-2 shrink-0", children: [item.chain && (_jsx("span", { className: "text-[10px] px-2 py-0.5 rounded-full bg-gray-700/60 text-gray-400", children: item.chain })), _jsx("span", { className: `text-[10px] px-2 py-0.5 rounded-full font-semibold border ${statusColor(item.status)}`, children: item.status }), _jsx("span", { className: "text-[10px] text-gray-600", children: timeAgo(item.timestamp) }), _jsx("svg", { className: `w-4 h-4 text-gray-600 transition-transform ${expandedId === item.id ? 'rotate-180' : ''}`, fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M19 9l-7 7-7-7" }) })] })] }) }), expandedId === item.id && (_jsxs("div", { className: "mt-1 p-4 rounded-xl bg-gray-900/60 border border-gray-700/30 space-y-2 ml-8", children: [_jsxs("div", { className: "grid grid-cols-2 gap-2 text-xs", children: [_jsxs("div", { children: [_jsx("span", { className: "text-gray-500", children: "Type:" }), _jsx("span", { className: "text-gray-300 ml-2 capitalize", children: item.type.replace('_', ' ') })] }), _jsxs("div", { children: [_jsx("span", { className: "text-gray-500", children: "Status:" }), _jsx("span", { className: `ml-2 font-semibold ${item.status === 'completed' ? 'text-emerald-400' : item.status === 'pending' ? 'text-amber-400' : 'text-red-400'}`, children: item.status })] }), _jsxs("div", { children: [_jsx("span", { className: "text-gray-500", children: "Time:" }), _jsx("span", { className: "text-gray-300 ml-2", children: formatDate(item.timestamp) })] }), item.chain && (_jsxs("div", { children: [_jsx("span", { className: "text-gray-500", children: "Chain:" }), _jsx("span", { className: "text-gray-300 ml-2", children: item.chain })] }))] }), item.hash && (_jsxs("div", { className: "pt-2 border-t border-gray-800/50", children: [_jsx("span", { className: "text-[10px] text-gray-500", children: "Transaction Hash:" }), _jsx("p", { className: "font-mono text-xs text-blue-400 break-all mt-1", children: item.hash })] })), item.metadata && Object.keys(item.metadata).length > 0 && (_jsxs("div", { className: "pt-2 border-t border-gray-800/50", children: [_jsx("span", { className: "text-[10px] text-gray-500", children: "Details:" }), _jsx("div", { className: "mt-1 space-y-1", children: Object.entries(item.metadata).map(([k, v]) => (_jsxs("div", { className: "flex text-xs", children: [_jsxs("span", { className: "text-gray-500 w-24 shrink-0", children: [k, ":"] }), _jsx("span", { className: "text-gray-300 font-mono", children: v })] }, k))) })] }))] }))] }, item.id))) })), totalPages > 1 && (_jsxs("div", { className: "flex items-center justify-between bg-gray-800/30 rounded-xl border border-gray-700/40 px-5 py-3", children: [_jsxs("span", { className: "text-xs text-gray-500", children: ["Page ", page + 1, " of ", totalPages, " \u00B7 ", filtered.length, " items"] }), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { onClick: () => setPage((p) => Math.max(0, p - 1)), disabled: page === 0, className: "px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-700/50 text-gray-400 border border-gray-600/40 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all", "aria-label": "Previous page", children: "\u2190 Prev" }), _jsx("button", { onClick: () => setPage((p) => Math.min(totalPages - 1, p + 1)), disabled: page >= totalPages - 1, className: "px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-700/50 text-gray-400 border border-gray-600/40 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all", "aria-label": "Next page", children: "Next \u2192" })] })] }))] }) }));
}
//# sourceMappingURL=page.js.map