'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useCallback } from 'react';
import DemoLayout from '@/components/DemoLayout';
import { useWallet, shortenAddress } from '@/lib/useWallet';
import { useToast } from '@/lib/toast';
/* ── theme presets ── */
const THEMES = {
    dark: {
        name: 'Dark',
        bg: 'bg-gray-950',
        card: 'bg-gray-800/60',
        border: 'border-gray-700/50',
        primary: 'from-brand-500 to-brand-600',
        text: 'text-white',
        accent: 'text-blue-400',
    },
    light: {
        name: 'Light',
        bg: 'bg-gray-100',
        card: 'bg-white/80',
        border: 'border-gray-300/50',
        primary: 'from-brand-500 to-brand-600',
        text: 'text-gray-900',
        accent: 'text-blue-600',
    },
    midnight: {
        name: 'Midnight',
        bg: 'bg-slate-950',
        card: 'bg-slate-900/60',
        border: 'border-slate-700/50',
        primary: 'from-brand-500 to-brand-600',
        text: 'text-slate-100',
        accent: 'text-indigo-400',
    },
    neon: {
        name: 'Neon',
        bg: 'bg-gray-950',
        card: 'bg-gray-900/70',
        border: 'border-green-500/30',
        primary: 'from-green-400 to-emerald-600',
        text: 'text-green-100',
        accent: 'text-green-400',
    },
    sunset: {
        name: 'Sunset',
        bg: 'bg-gray-950',
        card: 'bg-gray-900/60',
        border: 'border-orange-500/30',
        primary: 'from-brand-500 to-brand-600',
        text: 'text-orange-100',
        accent: 'text-orange-400',
    },
    ocean: {
        name: 'Ocean',
        bg: 'bg-slate-950',
        card: 'bg-slate-900/50',
        border: 'border-cyan-500/30',
        primary: 'from-cyan-500 to-teal-600',
        text: 'text-cyan-100',
        accent: 'text-cyan-400',
    },
    rose: {
        name: 'Rose',
        bg: 'bg-gray-950',
        card: 'bg-gray-900/60',
        border: 'border-pink-500/30',
        primary: 'from-pink-500 to-rose-600',
        text: 'text-pink-100',
        accent: 'text-pink-400',
    },
    minimal: {
        name: 'Minimal',
        bg: 'bg-gray-950',
        card: 'bg-gray-900/30',
        border: 'border-gray-800/40',
        primary: 'from-gray-400 to-gray-600',
        text: 'text-gray-200',
        accent: 'text-gray-400',
    },
};
/* ── code block ── */
function CodeBlock({ code, lang = 'tsx' }) {
    const [copied, setCopied] = useState(false);
    const handleCopy = useCallback(async () => {
        await navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, [code]);
    return (_jsxs("div", { className: "relative rounded-xl overflow-hidden border border-gray-700/40", children: [_jsxs("div", { className: "flex items-center justify-between px-4 py-2 bg-gray-900/60 border-b border-gray-700/40", children: [_jsx("span", { className: "text-[10px] text-gray-500 font-mono", children: lang }), _jsx("button", { onClick: handleCopy, className: `text-[10px] px-2 py-0.5 rounded transition-all ${copied ? 'text-emerald-400 bg-emerald-500/15' : 'text-gray-500 hover:text-gray-300'}`, children: copied ? '✓ Copied' : 'Copy' })] }), _jsx("pre", { className: "p-4 text-xs text-gray-300 font-mono overflow-x-auto bg-gray-950/50 leading-relaxed", children: code })] }));
}
/* ── component showcase card ── */
function ComponentShowcase({ title, description, preview, code, theme, }) {
    const [showCode, setShowCode] = useState(false);
    return (_jsxs("div", { className: `${theme.card} backdrop-blur-xl rounded-2xl border ${theme.border} overflow-hidden`, children: [_jsxs("div", { className: "px-5 py-4 border-b border-gray-700/30 flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h3", { className: `text-lg font-bold ${theme.text}`, children: title }), _jsx("p", { className: "text-xs text-gray-500 mt-0.5", children: description })] }), _jsx("button", { onClick: () => setShowCode(!showCode), className: `text-xs px-3 py-1.5 rounded-lg transition-all ${showCode
                            ? 'bg-brand-500/15 text-brand-400 border border-brand-500/30'
                            : 'bg-gray-700/40 text-gray-400 border border-gray-600/40 hover:text-white'}`, children: showCode ? 'Hide Code' : 'Show Code' })] }), _jsx("div", { className: "p-5", children: preview }), showCode && (_jsx("div", { className: "border-t border-gray-700/30", children: _jsx("div", { className: "p-5", children: _jsx(CodeBlock, { code: code }) }) }))] }));
}
/* ── main page ── */
export default function ComponentsPage() {
    const { account, status, connectors, connect } = useWallet();
    const { success } = useToast();
    const isConnected = status === 'connected';
    const [themeKey, setThemeKey] = useState('dark');
    const theme = THEMES[themeKey];
    return (_jsx(DemoLayout, { children: _jsxs("div", { className: "max-w-5xl mx-auto px-4 py-8 space-y-8", children: [_jsxs("div", { className: "text-center space-y-2", children: [_jsx("h1", { className: "text-3xl font-bold bg-gradient-to-r from-brand-500 via-brand-400 to-brand-300 bg-clip-text text-transparent", children: "Component Gallery" }), _jsx("p", { className: "text-gray-400 text-sm", children: "Browse all Cinacoin components with live theme previews" })] }), _jsxs("div", { className: "bg-gray-800/60 backdrop-blur-xl rounded-2xl border border-gray-700/60 overflow-hidden", children: [_jsxs("div", { className: "px-5 py-4 border-b border-gray-700/50", children: [_jsx("h2", { className: "text-lg font-bold text-white", children: "\uD83C\uDFA8 Theme Preview" }), _jsx("p", { className: "text-xs text-gray-500 mt-1", children: "Switch themes to see all components update in real-time" })] }), _jsx("div", { className: "p-5", children: _jsx("div", { className: "flex flex-wrap gap-2", children: Object.entries(THEMES).map(([key, t]) => (_jsx("button", { onClick: () => setThemeKey(key), className: `px-4 py-2 rounded-xl text-sm font-medium transition-all ${themeKey === key
                                        ? `bg-gradient-to-r ${t.primary} text-white shadow-lg`
                                        : 'bg-gray-800/40 text-gray-400 border border-gray-700/40 hover:text-white hover:border-gray-600'}`, children: t.name }, key))) }) })] }), _jsx(ComponentShowcase, { title: "Buttons", description: "Primary, secondary, ghost, and icon button variants", theme: theme, preview: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex flex-wrap gap-3 items-center", children: [_jsx("button", { className: "px-5 py-2.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-lg shadow-brand-500/20 hover:shadow-brand-500/40 transition-all hover:-translate-y-0.5", children: "Primary" }), _jsx("button", { className: "px-5 py-2.5 rounded-xl font-semibold text-sm bg-gray-700/60 text-gray-300 border border-gray-600/40 hover:text-white hover:border-gray-500 transition-all", children: "Secondary" }), _jsx("button", { className: "px-5 py-2.5 rounded-xl font-semibold text-sm text-brand-400 hover:text-brand-300 transition-colors", children: "Ghost" }), _jsx("button", { className: "px-5 py-2.5 rounded-xl font-semibold text-sm bg-red-500/15 text-red-400 border border-red-500/25 hover:bg-red-500/25 transition-all", children: "Danger" }), _jsx("button", { className: "px-5 py-2.5 rounded-xl font-semibold text-sm bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/25 transition-all", children: "Success" }), _jsx("button", { disabled: true, className: "px-5 py-2.5 rounded-xl font-semibold text-sm bg-gray-700/40 text-gray-600 cursor-not-allowed", children: "Disabled" })] }), _jsxs("div", { className: "flex flex-wrap gap-3 items-center", children: [_jsx("button", { className: "px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-brand-600 to-brand-500 text-white", children: "Small" }), _jsx("button", { className: "px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-brand-600 to-brand-500 text-white", children: "Medium" }), _jsx("button", { className: "px-8 py-4 rounded-2xl text-base font-semibold bg-gradient-to-r from-brand-600 to-brand-500 text-white", children: "Large" })] }), _jsxs("div", { className: "flex flex-wrap gap-3 items-center", children: [_jsx("button", { className: "size-10 rounded-xl bg-gray-700/60 text-gray-400 hover:text-white hover:bg-gray-600 transition-all flex items-center justify-center text-lg", children: "\uD83D\uDD17" }), _jsx("button", { className: "size-10 rounded-xl bg-brand-500/15 text-blue-400 hover:bg-brand-500/25 border border-blue-500/25 transition-all flex items-center justify-center text-lg", children: "\uD83D\uDD04" }), _jsx("button", { className: "size-10 rounded-xl bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/25 transition-all flex items-center justify-center text-lg", children: "\u2713" })] })] }), code: `// Primary Button
<button className="px-5 py-2.5 rounded-xl font-semibold text-sm
  bg-gradient-to-r from-brand-600 to-brand-500 text-white
  shadow-lg shadow-blue-500/20">
  Connect Wallet
</button>

// Secondary Button
<button className="px-5 py-2.5 rounded-xl font-semibold text-sm
  bg-gray-700/60 text-gray-300 border border-gray-600/40">
  Cancel
</button>

// Ghost Button
<button className="px-5 py-2.5 rounded-xl font-semibold text-sm
  text-brand-400 hover:text-brand-300">
  Learn More
</button>

// Danger Button
<button className="px-5 py-2.5 rounded-xl font-semibold text-sm
  bg-red-500/15 text-red-400 border border-red-500/25">
  Delete
</button>

// Sizes: text-xs/rounded-lg (sm), text-sm/rounded-xl (md), text-base/rounded-2xl (lg)` }), _jsx(ComponentShowcase, { title: "Wallet Card", description: "Connected wallet display with address, balance, and chain info", theme: theme, preview: _jsx("div", { className: "space-y-3", children: isConnected ? (_jsxs("div", { className: "flex items-center gap-4 p-4 rounded-xl bg-gray-900/60 border border-gray-700/40", children: [_jsx("div", { className: "size-12 rounded-full bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-sm font-bold text-white shadow-lg shadow-blue-500/20", children: account.address?.slice(2, 4).toUpperCase() }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "text-sm font-mono text-gray-200 truncate", children: shortenAddress(account.address ?? '') }), _jsxs("p", { className: "text-xs text-gray-500", children: [account.chainName, " \u00B7 Chain ID: ", account.chainId] })] }), _jsx("div", { className: "text-right", children: _jsxs("p", { className: "text-sm font-semibold text-gray-200", children: [account.balance, " ", account.chainSymbol] }) })] })) : (_jsxs("div", { className: "flex items-center gap-4 p-4 rounded-xl bg-gray-900/60 border border-gray-700/40", children: [_jsx("div", { className: "size-12 rounded-full bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-sm font-bold text-white", children: "00" }), _jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "text-sm font-mono text-gray-200", children: "0x1a2b...3c4d" }), _jsx("p", { className: "text-xs text-gray-500", children: "Ethereum \u00B7 Chain ID: 1" })] }), _jsx("div", { className: "text-right", children: _jsx("p", { className: "text-sm font-semibold text-gray-200", children: "1.2345 ETH" }) })] })) }), code: `// Wallet Card Component
<div className="flex items-center gap-4 p-4 rounded-xl
  bg-gray-900/60 border border-gray-700/40">
  {/* Avatar */}
  <div className="size-12 rounded-full bg-gradient-to-br
    from-brand-500 to-brand-600 flex items-center justify-center
    text-sm font-bold text-white">
    {address.slice(2, 4).toUpperCase()}
  </div>

  {/* Info */}
  <div className="flex-1 min-w-0">
    <p className="text-sm font-mono truncate">
      {shortenAddress(address)}
    </p>
    <p className="text-xs text-gray-500">
      {chainName} · Chain ID: {chainId}
    </p>
  </div>

  {/* Balance */}
  <div className="text-right">
    <p className="text-sm font-semibold">{balance} {symbol}</p>
  </div>
</div>` }), _jsx(ComponentShowcase, { title: "Status Badges", description: "Connection status, transaction state, and health indicators", theme: theme, preview: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex flex-wrap gap-3", children: [_jsxs("span", { className: "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-green-500/15 text-green-400 border border-green-500/25", children: [_jsx("span", { className: "size-1.5 rounded-full bg-green-400 animate-pulse" }), "Connected"] }), _jsxs("span", { className: "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-yellow-500/15 text-yellow-400 border border-yellow-500/25", children: [_jsx("span", { className: "size-1.5 rounded-full bg-yellow-400 animate-pulse" }), "Connecting..."] }), _jsxs("span", { className: "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-gray-700/50 text-gray-500 border border-gray-600/40", children: [_jsx("span", { className: "size-1.5 rounded-full bg-gray-500" }), "Disconnected"] })] }), _jsxs("div", { className: "flex flex-wrap gap-3", children: [_jsx("span", { className: "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25", children: "\u2713 Completed" }), _jsxs("span", { className: "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/25", children: [_jsx("span", { className: "size-1.5 rounded-full bg-amber-400 animate-pulse" }), "Pending"] }), _jsx("span", { className: "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-red-500/15 text-red-400 border border-red-500/25", children: "\u2717 Failed" })] }), _jsxs("div", { className: "flex flex-wrap gap-3", children: [_jsx("span", { className: "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25", children: "\u2713 Operational" }), _jsx("span", { className: "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-red-500/15 text-red-400 border border-red-500/25", children: "\u2717 Down" }), _jsx("span", { className: "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono bg-brand-500/15 text-brand-400 border border-brand-500/25", children: "142ms" })] })] }), code: `// Connected Status
<span className="inline-flex items-center gap-1.5 px-3 py-1.5
  rounded-full text-xs font-semibold
  bg-green-500/15 text-green-400 border border-green-500/25">
  <span className="size-1.5 rounded-full bg-green-400 animate-pulse" />
  Connected
</span>

// Pending Transaction
<span className="inline-flex items-center gap-1.5 px-3 py-1.5
  rounded-full text-xs font-semibold
  bg-amber-500/15 text-amber-400 border border-amber-500/25">
  <span className="size-1.5 rounded-full bg-amber-400 animate-pulse" />
  Pending
</span>

// Latency Badge
<span className="inline-flex items-center gap-1.5 px-3 py-1.5
  rounded-full text-xs font-mono
  bg-brand-500/15 text-brand-400 border border-brand-500/25">
  142ms
</span>` }), _jsx(ComponentShowcase, { title: "Chain Badges", description: "Visual network selectors for all supported chains", theme: theme, preview: _jsx("div", { className: "flex flex-wrap gap-2", children: [
                            { name: 'Ethereum', symbol: 'ETH', color: '#627EEA', initial: 'Ξ' },
                            { name: 'Polygon', symbol: 'POL', color: '#8247E5', initial: '⬡' },
                            { name: 'Arbitrum', symbol: 'ARB', color: '#28A0F0', initial: 'A' },
                            { name: 'Base', symbol: 'BASE', color: '#0052FF', initial: 'B' },
                            { name: 'Optimism', symbol: 'OP', color: '#FF0420', initial: 'O' },
                            { name: 'BNB Chain', symbol: 'BNB', color: '#F0B90B', initial: 'B' },
                            { name: 'Avalanche', symbol: 'AVAX', color: '#E84142', initial: 'A' },
                            { name: 'Solana', symbol: 'SOL', color: '#9945FF', initial: 'S' },
                        ].map((c) => (_jsxs("div", { className: "group flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-900/80 border border-gray-800 hover:border-gray-600 transition-colors cursor-default shrink-0", children: [_jsx("span", { className: "inline-flex size-5 items-center justify-center rounded-full text-[10px] font-bold text-white", style: { backgroundColor: c.color }, children: c.initial }), _jsx("span", { className: "text-xs font-medium text-gray-400 group-hover:text-gray-200 transition-colors", children: c.name })] }, c.symbol))) }), code: `// Chain Badge Component
<div className="flex items-center gap-2 px-3 py-2 rounded-xl
  bg-gray-900/80 border border-gray-800 hover:border-gray-600
  transition-colors cursor-default shrink-0">
  <span className="inline-flex size-5 items-center justify-center
    rounded-full text-[10px] font-bold text-white"
    style={{ backgroundColor: chainColor }}>
    {chain.initial}
  </span>
  <span className="text-xs font-medium text-gray-400
    group-hover:text-gray-200 transition-colors">
    {chain.name}
  </span>
</div>` }), _jsx(ComponentShowcase, { title: "Toggle Switch", description: "On/off toggle for settings and preferences", theme: theme, preview: _jsx("div", { className: "space-y-4", children: [
                            { label: 'Dark Mode', desc: 'Use dark theme throughout', checked: true },
                            { label: 'Auto-Connect', desc: 'Reconnect last wallet on page load', checked: true },
                            { label: 'Debug Mode', desc: 'Enable verbose logging in console', checked: false },
                            { label: 'Compact Mode', desc: 'Reduce spacing and padding', checked: false },
                        ].map((t) => (_jsx(ToggleDemo, { label: t.label, desc: t.desc, defaultChecked: t.checked }, t.label))) }), code: `// Toggle Switch Component
function ToggleSwitch({ checked, onChange }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={\`relative w-12 h-6 rounded-full transition-colors
        \${checked ? 'bg-blue-500' : 'bg-gray-700'}\`}
      role="switch" aria-checked={checked}
    >
      <span className={\`absolute top-0.5 left-0.5 w-5 h-5
        rounded-full bg-white shadow-md transition-transform
        \${checked ? 'translate-x-6' : 'translate-x-0'}\`} />
    </button>
  );
}

// Usage
<ToggleSwitch checked={darkMode} onChange={setDarkMode} />` }), _jsx(ComponentShowcase, { title: "Input Fields", description: "Text inputs, search bars, and select dropdowns", theme: theme, preview: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "text-sm text-gray-400 mb-1 block", children: "Wallet Address" }), _jsx("input", { type: "text", placeholder: "0x...", className: "w-full px-4 py-2.5 bg-gray-900/60 border border-gray-700/50 rounded-xl text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-blue-500/50 font-mono", readOnly: true, defaultValue: "0x1a2b3c4d5e6f7890abcdef1234567890abcdef12" })] }), _jsxs("div", { className: "relative", children: [_jsx("label", { className: "text-sm text-gray-400 mb-1 block", children: "Search Tokens" }), _jsx("input", { type: "text", placeholder: "Search by name, symbol, or address...", className: "w-full px-4 py-2.5 pl-10 bg-gray-900/60 border border-gray-700/50 rounded-xl text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-500/40" }), _jsx("span", { className: "absolute left-3 top-9 text-gray-500", children: "\uD83D\uDD0D" })] }), _jsxs("div", { className: "relative", children: [_jsx("label", { className: "text-sm text-gray-400 mb-1 block", children: "Network" }), _jsxs("select", { className: "w-full px-4 py-2.5 bg-gray-900/60 border border-gray-700/50 rounded-xl text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500/40 appearance-none cursor-pointer", children: [_jsx("option", { children: "Ethereum" }), _jsx("option", { children: "Polygon" }), _jsx("option", { children: "Arbitrum" }), _jsx("option", { children: "Base" })] }), _jsx("span", { className: "pointer-events-none absolute right-3 top-9 text-gray-500 text-xs", children: "\u25BE" })] })] }), code: `// Text Input
<input
  type="text"
  placeholder="0x..."
  className="w-full px-4 py-2.5 bg-gray-900/60 border
    border-gray-700/50 rounded-xl text-sm text-gray-200
    placeholder:text-gray-600 focus:outline-none
    focus:ring-2 focus:ring-brand-500/40 font-mono"
/>

// Search Input with icon
<div className="relative">
  <input placeholder="Search..." className="w-full px-4 py-2.5
    pl-10 bg-gray-900/60 border border-gray-700/50 rounded-xl
    text-sm placeholder:text-gray-600 focus:outline-none
    focus:ring-2 focus:ring-brand-500/40" />
  <span className="absolute left-3 top-1/2 -translate-y-1/2
    text-gray-500">🔍</span>
</div>

// Select Dropdown
<select className="w-full px-4 py-2.5 bg-gray-900/60 border
  border-gray-700/50 rounded-xl text-sm appearance-none
  focus:outline-none focus:ring-2 focus:ring-brand-500/40">
  <option>Ethereum</option>
  <option>Polygon</option>
</select>` }), _jsx(ComponentShowcase, { title: "Card Layouts", description: "Feature cards, stat cards, and info panels", theme: theme, preview: _jsxs("div", { className: "space-y-4", children: [_jsx("div", { className: "grid grid-cols-2 gap-3", children: [
                                    { icon: '🔗', title: 'Multi-Chain', desc: '16 chains, one SDK' },
                                    { icon: '🔐', title: 'SIWE Auth', desc: 'Sign-In With Ethereum' },
                                    { icon: '🔄', title: 'Token Swap', desc: 'DEX aggregation' },
                                    { icon: '🌉', title: 'Cross-Chain', desc: 'Unified bridge routing' },
                                ].map((f) => (_jsxs("div", { className: "group p-4 rounded-xl bg-gray-900/50 border border-gray-800 hover:border-gray-600 hover:bg-gray-800/60 transition-all cursor-default", children: [_jsx("div", { className: "text-2xl mb-2", children: f.icon }), _jsx("h4", { className: "text-sm font-semibold text-gray-200", children: f.title }), _jsx("p", { className: "text-xs text-gray-500 mt-1", children: f.desc })] }, f.title))) }), _jsx("div", { className: "grid grid-cols-4 gap-3", children: [
                                    { value: '64', label: 'Packages' },
                                    { value: '16', label: 'Chains' },
                                    { value: '30+', label: 'Wallets' },
                                    { value: '$0', label: 'Cost' },
                                ].map((s) => (_jsxs("div", { className: "text-center p-3 rounded-xl bg-gray-900/50 border border-gray-800/50", children: [_jsx("div", { className: "text-xl font-bold bg-gradient-to-r from-brand-400 to-brand-300 bg-clip-text text-transparent", children: s.value }), _jsx("div", { className: "text-[10px] text-gray-500 mt-1", children: s.label })] }, s.label))) })] }), code: `// Feature Card
<div className="group p-4 rounded-xl bg-gray-900/50 border
  border-gray-800 hover:border-gray-600 hover:bg-gray-800/60
  transition-all cursor-default">
  <div className="text-2xl mb-2">{icon}</div>
  <h4 className="text-sm font-semibold text-gray-200">{title}</h4>
  <p className="text-xs text-gray-500 mt-1">{description}</p>
</div>

// Stat Card
<div className="text-center p-3 rounded-xl bg-gray-900/50
  border border-gray-800/50">
  <div className="text-xl font-bold bg-gradient-to-r
    from-brand-400 to-brand-300 bg-clip-text text-transparent">
    {value}
  </div>
  <div className="text-[10px] text-gray-500 mt-1">{label}</div>
</div>` }), _jsx(ComponentShowcase, { title: "Loading States", description: "Spinners, skeleton loaders, and progress indicators", theme: theme, preview: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex flex-wrap gap-6 items-center", children: [_jsxs("svg", { className: "animate-spin h-6 w-6 text-brand-400", viewBox: "0 0 24 24", fill: "none", children: [_jsx("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }), _jsx("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" })] }), _jsxs("span", { className: "inline-flex items-center gap-2 text-sm text-gray-400", children: [_jsxs("svg", { className: "animate-spin h-4 w-4 text-brand-400", viewBox: "0 0 24 24", fill: "none", children: [_jsx("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }), _jsx("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" })] }), "Connecting..."] }), _jsxs("div", { className: "flex gap-1", children: [_jsx("div", { className: "size-2 rounded-full bg-blue-400 animate-bounce", style: { animationDelay: '0ms' } }), _jsx("div", { className: "size-2 rounded-full bg-blue-400 animate-bounce", style: { animationDelay: '150ms' } }), _jsx("div", { className: "size-2 rounded-full bg-blue-400 animate-bounce", style: { animationDelay: '300ms' } })] })] }), _jsxs("div", { className: "p-4 rounded-xl bg-gray-900/50 border border-gray-800 space-y-3 animate-pulse", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "size-10 rounded-full bg-gray-700" }), _jsxs("div", { className: "flex-1", children: [_jsx("div", { className: "h-3 bg-gray-700 rounded w-32 mb-2" }), _jsx("div", { className: "h-2 bg-gray-800 rounded w-48" })] })] }), _jsx("div", { className: "h-8 bg-gray-700/50 rounded" }), _jsxs("div", { className: "grid grid-cols-3 gap-2", children: [_jsx("div", { className: "h-6 bg-gray-700/50 rounded" }), _jsx("div", { className: "h-6 bg-gray-700/50 rounded" }), _jsx("div", { className: "h-6 bg-gray-700/50 rounded" })] })] })] }), code: `// Spinner
<svg className="animate-spin h-6 w-6 text-blue-400"
  viewBox="0 0 24 24" fill="none">
  <circle className="opacity-25" cx="12" cy="12" r="10"
    stroke="currentColor" strokeWidth="4" />
  <path className="opacity-75" fill="currentColor"
    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
</svg>

// Skeleton Loader
<div className="animate-pulse space-y-3">
  <div className="h-3 bg-gray-700 rounded w-32" />
  <div className="h-2 bg-gray-800 rounded w-48" />
  <div className="h-8 bg-gray-700/50 rounded" />
</div>

// Dot loading
<div className="flex gap-1">
  <div className="size-2 rounded-full bg-blue-400 animate-bounce"
    style={{ animationDelay: '0ms' }} />
  <div className="size-2 rounded-full bg-blue-400 animate-bounce"
    style={{ animationDelay: '150ms' }} />
  <div className="size-2 rounded-full bg-blue-400 animate-bounce"
    style={{ animationDelay: '300ms' }} />
</div>` }), _jsx(ComponentShowcase, { title: "Toast Notifications", description: "Success, error, info, and warning toasts", theme: theme, preview: _jsx("div", { className: "space-y-3", children: [
                            { type: 'Success', icon: '✓', bg: 'bg-emerald-500/15', border: 'border-emerald-500/25', text: 'text-emerald-400', desc: 'Transaction completed successfully' },
                            { type: 'Error', icon: '✗', bg: 'bg-red-500/15', border: 'border-red-500/25', text: 'text-red-400', desc: 'Connection failed: User rejected' },
                            { type: 'Info', icon: 'ℹ', bg: 'bg-brand-500/15', border: 'border-blue-500/25', text: 'text-blue-400', desc: 'Switching to Polygon network' },
                            { type: 'Warning', icon: '⚠', bg: 'bg-amber-500/15', border: 'border-amber-500/25', text: 'text-amber-400', desc: 'High gas prices detected' },
                        ].map((t) => (_jsxs("div", { className: `p-3 rounded-xl ${t.bg} border ${t.border} flex items-start gap-3`, children: [_jsx("span", { className: `text-lg ${t.text}`, children: t.icon }), _jsxs("div", { children: [_jsx("p", { className: `text-sm font-semibold ${t.text}`, children: t.type }), _jsx("p", { className: "text-xs text-gray-400 mt-0.5", children: t.desc })] })] }, t.type))) }), code: `// Toast Notification
import { useToast } from '@/lib/toast';

const { success, error, info, warning } = useToast();

// Usage:
success('Wallet Connected', '0x1a2b...3c4d on Ethereum');
error('Connection Failed', 'User rejected the request');
info('Network Switch', 'Switching to Polygon');
warning('High Gas', 'Gas prices are above average');` }), _jsxs("div", { className: "text-center py-8 border-t border-gray-800/50", children: [_jsxs("p", { className: "text-sm text-gray-600", children: ["Cinacoin Component Gallery \u2014 ", Object.keys(THEMES).length, " themes \u00D7 ", 8, " components"] }), _jsx("p", { className: "text-xs text-gray-700 mt-1", children: "All components use Tailwind CSS with consistent design tokens" })] })] }) }));
}
/* ── Toggle demo sub-component ── */
function ToggleDemo({ label, desc, defaultChecked }) {
    const [checked, setChecked] = useState(defaultChecked);
    return (_jsxs("div", { className: "flex items-center justify-between p-3 rounded-xl bg-gray-900/40 border border-gray-800/40", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-200", children: label }), _jsx("p", { className: "text-xs text-gray-500", children: desc })] }), _jsx("button", { onClick: () => setChecked(!checked), className: `relative w-12 h-6 rounded-full transition-colors duration-200 ${checked ? 'bg-blue-500' : 'bg-gray-700'}`, role: "switch", "aria-checked": checked, children: _jsx("span", { className: `absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-200 ${checked ? 'translate-x-6' : 'translate-x-0'}` }) })] }));
}
//# sourceMappingURL=page.js.map