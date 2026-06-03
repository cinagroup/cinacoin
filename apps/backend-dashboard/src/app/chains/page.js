"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
const INITIAL_CHAINS = [
    { id: "ethereum", name: "Ethereum", chainId: 1, rpcUrl: "https://eth.llamarpc.com", nativeCurrency: "ETH", explorerUrl: "https://etherscan.io", enabled: true, network: "evm", mainnet: true },
    { id: "polygon", name: "Polygon", chainId: 137, rpcUrl: "https://polygon-rpc.com", nativeCurrency: "MATIC", explorerUrl: "https://polygonscan.com", enabled: true, network: "evm", mainnet: true },
    { id: "bsc", name: "BNB Smart Chain", chainId: 56, rpcUrl: "https://bsc-dataseed.binance.org", nativeCurrency: "BNB", explorerUrl: "https://bscscan.com", enabled: true, network: "evm", mainnet: true },
    { id: "arbitrum", name: "Arbitrum One", chainId: 42161, rpcUrl: "https://arb1.arbitrum.io/rpc", nativeCurrency: "ETH", explorerUrl: "https://arbiscan.io", enabled: true, network: "evm", mainnet: true },
    { id: "optimism", name: "Optimism", chainId: 10, rpcUrl: "https://mainnet.optimism.io", nativeCurrency: "ETH", explorerUrl: "https://optimistic.etherscan.io", enabled: true, network: "evm", mainnet: true },
    { id: "base", name: "Base", chainId: 8453, rpcUrl: "https://mainnet.base.org", nativeCurrency: "ETH", explorerUrl: "https://basescan.org", enabled: false, network: "evm", mainnet: true },
    { id: "avalanche", name: "Avalanche C-Chain", chainId: 43114, rpcUrl: "https://api.avax.network/ext/bc/C/rpc", nativeCurrency: "AVAX", explorerUrl: "https://snowtrace.io", enabled: false, network: "evm", mainnet: true },
    { id: "solana", name: "Solana", chainId: "5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp", rpcUrl: "https://api.mainnet-beta.solana.com", nativeCurrency: "SOL", explorerUrl: "https://explorer.solana.com", enabled: true, network: "solana", mainnet: true },
    { id: "bitcoin", name: "Bitcoin", chainId: "btc-mainnet", rpcUrl: "", nativeCurrency: "BTC", explorerUrl: "https://blockstream.info", enabled: true, network: "bitcoin", mainnet: true },
    { id: "ton", name: "TON", chainId: "-239", rpcUrl: "https://toncenter.com/api/v2", nativeCurrency: "TON", explorerUrl: "https://tonscan.org", enabled: false, network: "ton", mainnet: true },
    { id: "tron", name: "TRON", chainId: "0x2b6653dc", rpcUrl: "https://api.trongrid.io", nativeCurrency: "TRX", explorerUrl: "https://tronscan.org", enabled: false, network: "tron", mainnet: true },
    { id: "cosmos", name: "Cosmos Hub", chainId: "cosmoshub-4", rpcUrl: "https://rpc-cosmoshub.blockapsis.com", nativeCurrency: "ATOM", explorerUrl: "https://www.mintscan.io/cosmos", enabled: false, network: "cosmos", mainnet: true },
];
const NETWORK_COLORS = {
    evm: "#3b82f6",
    solana: "#9945FF",
    bitcoin: "#F7931A",
    ton: "#0098EA",
    tron: "#FF0013",
    cosmos: "#6F7390",
};
const NETWORK_ICONS = {
    evm: "🔷",
    solana: "◎",
    bitcoin: "₿",
    ton: "💎",
    tron: "🔴",
    cosmos: "⚛️",
};
export default function ChainsPage() {
    const [chains, setChains] = useState(INITIAL_CHAINS);
    const [filter, setFilter] = useState("all");
    const [saved, setSaved] = useState(false);
    const filteredChains = filter === "all" ? chains : chains.filter((c) => c.network === filter);
    const enabledCount = chains.filter((c) => c.enabled).length;
    const toggleChain = (id) => {
        setChains((prev) => prev.map((c) => (c.id === id ? { ...c, enabled: !c.enabled } : c)));
    };
    const handleSave = () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-white", children: "\uD83C\uDF10 Networks & Chains" }), _jsxs("p", { className: "text-dashboard-muted mt-1", children: ["Configure supported blockchain networks \u2014 ", enabledCount, " of ", chains.length, " enabled"] })] }), _jsx("button", { onClick: handleSave, "aria-label": saved ? "Changes saved" : "Save chain configuration changes", className: "px-4 py-2 bg-brand-500 hover:bg-brand-400 text-white rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-dashboard-surface", children: saved ? "✓ Saved" : "Save Changes" })] }), saved && (_jsx("div", { className: "bg-dashboard-success/10 border border-dashboard-success/30 rounded-xl px-4 py-3 text-sm text-dashboard-success", children: "\u2713 Chain configuration saved successfully" })), _jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4", children: [_jsxs("div", { className: "bg-dashboard-surface rounded-xl border border-dashboard-border p-4", children: [_jsx("p", { className: "text-sm text-dashboard-muted", children: "Total Networks" }), _jsx("p", { className: "text-2xl font-bold text-white", children: chains.length })] }), _jsxs("div", { className: "bg-dashboard-surface rounded-xl border border-dashboard-border p-4", children: [_jsx("p", { className: "text-sm text-dashboard-muted", children: "Enabled" }), _jsx("p", { className: "text-2xl font-bold text-dashboard-success", children: enabledCount })] }), _jsxs("div", { className: "bg-dashboard-surface rounded-xl border border-dashboard-border p-4", children: [_jsx("p", { className: "text-sm text-dashboard-muted", children: "EVM Chains" }), _jsx("p", { className: "text-2xl font-bold text-brand-400", children: chains.filter((c) => c.network === "evm").length })] }), _jsxs("div", { className: "bg-dashboard-surface rounded-xl border border-dashboard-border p-4", children: [_jsx("p", { className: "text-sm text-dashboard-muted", children: "Non-EVM" }), _jsx("p", { className: "text-2xl font-bold text-dashboard-warning", children: chains.filter((c) => c.network !== "evm").length })] })] }), _jsx("div", { className: "flex gap-2 flex-wrap", role: "group", "aria-label": "Network filter", children: [
                    { key: "all", label: "All" },
                    { key: "evm", label: "EVM" },
                    { key: "solana", label: "Solana" },
                    { key: "bitcoin", label: "Bitcoin" },
                    { key: "ton", label: "TON" },
                    { key: "tron", label: "TRON" },
                    { key: "cosmos", label: "Cosmos" },
                ].map((f) => (_jsxs("button", { onClick: () => setFilter(f.key), "aria-pressed": filter === f.key, className: `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === f.key
                        ? "bg-brand-500 text-white"
                        : "bg-dashboard-surface text-dashboard-muted hover:text-white border border-dashboard-border"}`, children: [_jsx("span", { "aria-hidden": "true", children: NETWORK_ICONS[f.key] || "📋" }), " ", f.label] }, f.key))) }), _jsx("div", { className: "bg-dashboard-surface rounded-xl border border-dashboard-border overflow-hidden", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b border-dashboard-border", children: [_jsx("th", { className: "text-left px-4 py-3 text-dashboard-muted font-medium", children: "Network" }), _jsx("th", { className: "text-left px-4 py-3 text-dashboard-muted font-medium", children: "Chain ID" }), _jsx("th", { className: "text-left px-4 py-3 text-dashboard-muted font-medium", children: "RPC URL" }), _jsx("th", { className: "text-left px-4 py-3 text-dashboard-muted font-medium", children: "Explorer" }), _jsx("th", { className: "text-center px-4 py-3 text-dashboard-muted font-medium", children: "Status" })] }) }), _jsx("tbody", { children: filteredChains.map((chain) => (_jsxs("tr", { className: "border-b border-dashboard-border/50 hover:bg-dashboard-border/10 transition-colors", children: [_jsx("td", { className: "px-4 py-3", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { "aria-hidden": "true", children: NETWORK_ICONS[chain.network] }), _jsx("span", { className: "text-white font-medium", children: chain.name }), _jsx("span", { className: "text-xs px-1.5 py-0.5 rounded", style: { backgroundColor: `${NETWORK_COLORS[chain.network]}20`, color: NETWORK_COLORS[chain.network] }, children: chain.network })] }) }), _jsx("td", { className: "px-4 py-3", children: _jsx("code", { className: "text-xs bg-dashboard-bg px-2 py-1 rounded text-dashboard-muted", children: typeof chain.chainId === "number" ? chain.chainId.toString() : chain.chainId }) }), _jsx("td", { className: "px-4 py-3", children: _jsx("span", { className: "text-dashboard-muted font-mono text-xs truncate max-w-[200px] block", children: chain.rpcUrl || "—" }) }), _jsx("td", { className: "px-4 py-3", children: _jsx("a", { href: chain.explorerUrl, target: "_blank", rel: "noopener noreferrer", className: "text-brand-400 hover:underline text-xs", children: chain.explorerUrl.replace("https://", "") }) }), _jsx("td", { className: "px-4 py-3 text-center", children: _jsx("button", { onClick: () => toggleChain(chain.id), role: "switch", "aria-checked": chain.enabled, "aria-label": `Toggle ${chain.name} ${chain.enabled ? 'off' : 'on'}`, className: `relative w-10 h-5 rounded-full transition-colors ${chain.enabled ? "bg-dashboard-success" : "bg-dashboard-border"}`, children: _jsx("span", { className: `absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${chain.enabled ? "left-5" : "left-0.5"}` }) }) })] }, chain.id))) })] }) }), _jsxs("div", { className: "bg-dashboard-surface rounded-xl border border-dashboard-border p-6", children: [_jsx("h3", { className: "text-lg font-semibold text-white mb-2", children: "Add Custom Network" }), _jsx("p", { className: "text-sm text-dashboard-muted mb-4", children: "Add a custom EVM-compatible chain or non-EVM network for your AppKit configuration." }), _jsxs("div", { className: "grid md:grid-cols-2 gap-4", children: [_jsx("input", { type: "text", placeholder: "Network name (e.g. zkSync Era)", "aria-label": "Network name", className: "bg-dashboard-bg border border-dashboard-border rounded-lg px-3 py-2 text-sm text-white placeholder-dashboard-muted/50 focus:outline-none focus:border-brand-500" }), _jsx("input", { type: "text", placeholder: "Chain ID (e.g. 324)", "aria-label": "Chain ID", className: "bg-dashboard-bg border border-dashboard-border rounded-lg px-3 py-2 text-sm text-white placeholder-dashboard-muted/50 focus:outline-none focus:border-brand-500" }), _jsx("input", { type: "text", placeholder: "RPC URL", "aria-label": "RPC URL", className: "bg-dashboard-bg border border-dashboard-border rounded-lg px-3 py-2 text-sm text-white placeholder-dashboard-muted/50 focus:outline-none focus:border-brand-500" }), _jsx("input", { type: "text", placeholder: "Native currency symbol (e.g. ETH)", "aria-label": "Native currency symbol", className: "bg-dashboard-bg border border-dashboard-border rounded-lg px-3 py-2 text-sm text-white placeholder-dashboard-muted/50 focus:outline-none focus:border-brand-500" })] }), _jsx("div", { className: "mt-4 flex justify-end", children: _jsx("button", { className: "px-4 py-2 bg-brand-500 hover:bg-brand-400 text-white rounded-lg text-sm font-medium transition-colors", children: "+ Add Network" }) })] })] }));
}
//# sourceMappingURL=page.js.map