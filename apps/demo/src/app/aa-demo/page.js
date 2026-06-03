'use client';
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useCallback } from 'react';
import DemoLayout from '@/components/DemoLayout';
import { useWallet, shortenAddress } from '@/lib/useWallet';
import { useToast } from '@/lib/toast';
/* ── mock data ── */
const MOCK_SESSION_KEYS = [
    {
        id: 'sk-1',
        name: 'Trading Session',
        address: '0xaB58...f3E2',
        permissions: ['swap', 'approve'],
        expiry: '2026-06-01',
        active: true,
    },
    {
        id: 'sk-2',
        name: 'NFT Minting',
        address: '0xcD91...a7C4',
        permissions: ['mint', 'approve'],
        expiry: '2026-05-28',
        active: false,
    },
];
const MOCK_GAS_SPONSORS = [
    { name: 'App Sponsor', status: 'active', covered: '100%' },
    { name: 'Paymaster Pool', status: 'active', covered: '50%' },
    { name: 'Free Tier', status: 'limited', covered: '10 tx/day' },
];
/* ── Toggle Switch ── */
function ToggleSwitch({ checked, onChange, label }) {
    return (_jsx("button", { onClick: () => onChange(!checked), className: `relative w-12 h-6 rounded-full transition-colors duration-200 ${checked ? 'bg-blue-500' : 'bg-gray-700'}`, role: "switch", "aria-checked": checked, "aria-label": label, children: _jsx("span", { className: `absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-200 ${checked ? 'translate-x-6' : 'translate-x-0'}` }) }));
}
/* ── main page ── */
export default function AADemoPage() {
    const { account, status, connectors, connect, disconnect } = useWallet();
    const { success, error: toastError, info } = useToast();
    const isConnected = status === 'connected';
    // Smart account state
    const [smartAccount, setSmartAccount] = useState(null);
    const [creatingAccount, setCreatingAccount] = useState(false);
    const [accountCreated, setAccountCreated] = useState(false);
    // Session keys
    const [sessionKeys, setSessionKeys] = useState(MOCK_SESSION_KEYS);
    const [showCreateKey, setShowCreateKey] = useState(false);
    const [newKeyName, setNewKeyName] = useState('');
    // Gas sponsorship
    const [gasSponsored, setGasSponsored] = useState(true);
    const [txCount, setTxCount] = useState(47);
    const [batchTxs, setBatchTxs] = useState([
        { to: '0x1234...5678', action: 'Transfer', amount: '0.1 ETH', status: 'ready' },
        { to: '0xabcd...ef01', action: 'Approve', amount: '1000 USDC', status: 'ready' },
        { to: '0x9876...5432', action: 'Swap', amount: '0.05 ETH → USDC', status: 'ready' },
    ]);
    const [batchExecuting, setBatchExecuting] = useState(false);
    const handleConnect = useCallback(() => {
        connect(connectors.find((c) => c.id === 'io.metamask')?.id ?? 'io.metamask');
    }, [connect, connectors]);
    /* DEMO ONLY — mock data, not production logic */
    const handleCreateSmartAccount = useCallback(async () => {
        if (!isConnected || !account.address)
            return;
        setCreatingAccount(true);
        // Simulate account creation
        await new Promise((r) => setTimeout(r, 2000));
        const newAddr = `0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 6)}`;
        setSmartAccount(newAddr);
        setAccountCreated(true);
        setCreatingAccount(false);
        success('Smart Account Created', `0x${account.address.slice(2, 6)}...${account.address.slice(-4)} deployed`);
    }, [isConnected, account.address, success]);
    /* DEMO ONLY — mock data, not production logic */
    const handleCreateSessionKey = useCallback(() => {
        if (!newKeyName.trim()) {
            toastError('Validation Error', 'Please enter a name for the session key');
            return;
        }
        const newKey = {
            id: `sk-${Date.now()}`,
            name: newKeyName.trim(),
            address: `0x${Math.random().toString(16).slice(2, 6).toUpperCase()}...${Math.random().toString(16).slice(2, 6).toUpperCase()}`,
            permissions: ['swap'],
            expiry: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
            active: true,
        };
        setSessionKeys((prev) => [newKey, ...prev]);
        setNewKeyName('');
        setShowCreateKey(false);
        success('Session Key Created', newKey.name);
    }, [newKeyName, success, toastError]);
    const handleToggleKey = useCallback((id) => {
        setSessionKeys((prev) => prev.map((k) => (k.id === id ? { ...k, active: !k.active } : k)));
    }, []);
    const handleRemoveKey = useCallback((id) => {
        setSessionKeys((prev) => prev.filter((k) => k.id !== id));
        info('Session Key Removed', 'Key has been revoked');
    }, [info]);
    const handleExecuteBatch = useCallback(async () => {
        if (!smartAccount) {
            toastError('No Smart Account', 'Create a smart account first');
            return;
        }
        setBatchExecuting(true);
        setBatchTxs((prev) => prev.map((t) => ({ ...t, status: 'pending' })));
        // Simulate batch execution
        for (let i = 0; i < batchTxs.length; i++) {
            await new Promise((r) => setTimeout(r, 1000));
            setBatchTxs((prev) => prev.map((t, j) => (j <= i ? { ...t, status: 'completed' } : t)));
        }
        setBatchExecuting(false);
        setTxCount((c) => c + batchTxs.length);
        success('Batch Executed', `${batchTxs.length} transactions completed`);
    }, [smartAccount, batchTxs, success, toastError]);
    return (_jsx(DemoLayout, { children: _jsxs("div", { className: "max-w-4xl mx-auto px-4 py-8 space-y-8", children: [_jsxs("div", { className: "text-center space-y-2", children: [_jsx("h1", { className: "text-3xl font-bold bg-gradient-to-r from-violet-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent", children: "Account Abstraction Demo" }), _jsx("p", { className: "text-gray-400 text-sm", children: "ERC-4337 smart accounts, session keys, gas sponsorship, and batch transactions" })] }), _jsxs("div", { className: "flex items-center justify-between bg-gray-800/40 backdrop-blur rounded-2xl border border-gray-700/50 px-5 py-4", children: [isConnected ? (_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "size-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white", children: account.address?.slice(2, 4).toUpperCase() }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-mono text-gray-200", children: shortenAddress(account.address ?? '') }), _jsx("p", { className: "text-xs text-gray-500", children: account.chainName })] })] })) : (_jsx("button", { onClick: handleConnect, className: "px-5 py-2.5 rounded-xl text-sm font-semibold bg-violet-600 hover:bg-violet-500 text-white transition-all", children: "Connect Wallet" })), isConnected && (_jsx("button", { onClick: () => disconnect(), className: "px-4 py-2 rounded-xl text-xs font-semibold bg-gray-700/60 text-gray-300 border border-gray-600/40 hover:text-white transition-all", children: "Disconnect" }))] }), _jsxs("div", { className: "bg-gray-800/60 backdrop-blur-xl rounded-2xl border border-gray-700/60 overflow-hidden", children: [_jsxs("div", { className: "px-5 py-4 border-b border-gray-700/50 flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-lg font-bold text-white", children: "\uD83C\uDFE6 Smart Account" }), _jsx("p", { className: "text-xs text-gray-500 mt-0.5", children: "ERC-4337 Account Abstraction wallet" })] }), accountCreated && smartAccount && (_jsxs("span", { className: "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25", children: [_jsx("span", { className: "size-1.5 rounded-full bg-emerald-400 animate-pulse" }), "Deployed"] }))] }), _jsxs("div", { className: "p-5 space-y-4", children: [!isConnected && (_jsx("div", { className: "text-center py-6 text-sm text-gray-500", children: "Connect your wallet to create a smart account" })), isConnected && !accountCreated && (_jsxs(_Fragment, { children: [_jsx("div", { className: "grid grid-cols-3 gap-3 mb-4", children: [
                                                { step: '1', title: 'Deploy', desc: 'Create smart contract wallet' },
                                                { step: '2', title: 'Configure', desc: 'Set session keys & permissions' },
                                                { step: '3', title: 'Use', desc: 'Gasless, batched transactions' },
                                            ].map((s) => (_jsxs("div", { className: "text-center p-3 rounded-xl bg-gray-900/40 border border-gray-800/40", children: [_jsx("div", { className: "size-8 rounded-full bg-violet-500/20 text-violet-400 flex items-center justify-center text-sm font-bold mx-auto mb-2", children: s.step }), _jsx("p", { className: "text-sm font-semibold text-gray-200", children: s.title }), _jsx("p", { className: "text-[10px] text-gray-500 mt-1", children: s.desc })] }, s.step))) }), _jsx("button", { onClick: handleCreateSmartAccount, disabled: creatingAccount, className: `w-full py-3.5 rounded-xl font-semibold text-sm transition-all ${creatingAccount
                                                ? 'bg-violet-500/60 text-white cursor-wait'
                                                : 'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white shadow-lg shadow-violet-500/25'}`, children: creatingAccount ? (_jsxs("span", { className: "inline-flex items-center gap-2", children: [_jsxs("svg", { className: "animate-spin h-4 w-4", viewBox: "0 0 24 24", fill: "none", children: [_jsx("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }), _jsx("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" })] }), "Deploying Smart Account..."] })) : ('Create Smart Account') })] })), accountCreated && smartAccount && (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "p-4 rounded-xl bg-gray-900/60 border border-gray-700/40", children: [_jsx("p", { className: "text-[10px] text-gray-500 mb-1", children: "Smart Account Address" }), _jsx("p", { className: "font-mono text-sm text-violet-400", children: smartAccount })] }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { className: "p-3 rounded-xl bg-gray-900/40 border border-gray-800/40", children: [_jsx("p", { className: "text-[10px] text-gray-500", children: "Owner" }), _jsx("p", { className: "text-xs font-mono text-gray-300 mt-1", children: shortenAddress(account.address ?? '') })] }), _jsxs("div", { className: "p-3 rounded-xl bg-gray-900/40 border border-gray-800/40", children: [_jsx("p", { className: "text-[10px] text-gray-500", children: "ERC-4337" }), _jsx("p", { className: "text-xs text-emerald-400 mt-1 font-semibold", children: "Supported \u2713" })] })] })] }))] })] }), _jsxs("div", { className: "bg-gray-800/60 backdrop-blur-xl rounded-2xl border border-gray-700/60 overflow-hidden", children: [_jsxs("div", { className: "px-5 py-4 border-b border-gray-700/50 flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-lg font-bold text-white", children: "\uD83D\uDD11 Session Keys" }), _jsx("p", { className: "text-xs text-gray-500 mt-0.5", children: "Temporary keys with limited permissions" })] }), _jsx("button", { onClick: () => setShowCreateKey(!showCreateKey), className: "px-3 py-1.5 rounded-lg text-xs font-semibold bg-violet-500/15 text-violet-400 border border-violet-500/30 hover:bg-violet-500/25 transition-all", children: "+ New Key" })] }), _jsxs("div", { className: "p-5 space-y-3", children: [showCreateKey && (_jsxs("div", { className: "p-4 rounded-xl bg-gray-900/50 border border-gray-700/40 space-y-3", children: [_jsxs("div", { className: "flex gap-2", children: [_jsx("input", { type: "text", placeholder: "Key name (e.g., Trading Bot)", value: newKeyName, onChange: (e) => setNewKeyName(e.target.value), className: "flex-1 px-3 py-2 bg-gray-800/80 border border-gray-700/50 rounded-lg text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-500/40" }), _jsx("button", { onClick: handleCreateSessionKey, disabled: !newKeyName.trim(), className: "px-4 py-2 rounded-lg text-sm font-semibold bg-violet-600 hover:bg-violet-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all", children: "Create" })] }), _jsx("div", { className: "flex gap-2", children: ['swap', 'approve', 'mint', 'transfer'].map((p) => (_jsx("span", { className: "px-2 py-1 rounded text-[10px] font-medium bg-gray-700/50 text-gray-400 border border-gray-600/40", children: p }, p))) })] })), sessionKeys.map((key) => (_jsxs("div", { className: `p-4 rounded-xl border transition-all ${key.active
                                        ? 'bg-violet-500/5 border-violet-500/30'
                                        : 'bg-gray-900/30 border-gray-800/40'}`, children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: `size-8 rounded-lg flex items-center justify-center text-sm font-bold ${key.active
                                                                ? 'bg-violet-500/20 text-violet-400'
                                                                : 'bg-gray-700/50 text-gray-500'}`, children: "\uD83D\uDD11" }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-semibold text-gray-200", children: key.name }), _jsx("p", { className: "text-[10px] text-gray-500 font-mono", children: key.address })] })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx(ToggleSwitch, { checked: key.active, onChange: () => handleToggleKey(key.id), label: `Toggle ${key.name}` }), _jsx("button", { onClick: () => handleRemoveKey(key.id), className: "text-xs text-red-400 hover:text-red-300 transition-colors px-2 py-1 rounded hover:bg-red-500/10", children: "Revoke" })] })] }), _jsxs("div", { className: "flex flex-wrap gap-2 mt-3", children: [key.permissions.map((p) => (_jsx("span", { className: "px-2 py-0.5 rounded text-[10px] font-medium bg-violet-500/10 text-violet-400 border border-violet-500/20", children: p }, p))), _jsxs("span", { className: "px-2 py-0.5 rounded text-[10px] font-medium bg-gray-700/50 text-gray-400", children: ["Expires: ", key.expiry] })] })] }, key.id))), sessionKeys.length === 0 && (_jsx("div", { className: "text-center py-8 text-sm text-gray-500", children: "No session keys. Create one to enable delegated transactions." }))] })] }), _jsxs("div", { className: "bg-gray-800/60 backdrop-blur-xl rounded-2xl border border-gray-700/60 overflow-hidden", children: [_jsxs("div", { className: "px-5 py-4 border-b border-gray-700/50 flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-lg font-bold text-white", children: "\u26FD Gas Sponsorship" }), _jsx("p", { className: "text-xs text-gray-500 mt-0.5", children: "Paymaster coverage \u2014 users don't pay gas" })] }), _jsx(ToggleSwitch, { checked: gasSponsored, onChange: setGasSponsored, label: "Toggle gas sponsorship" })] }), _jsxs("div", { className: "p-5 space-y-4", children: [gasSponsored && (_jsx("div", { className: "p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("span", { className: "text-2xl", children: "\u2713" }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-semibold text-emerald-400", children: "Gas Sponsorship Active" }), _jsx("p", { className: "text-xs text-gray-400 mt-0.5", children: "All transactions will be sponsored by the paymaster" })] })] }) })), _jsx("div", { className: "grid grid-cols-3 gap-3", children: MOCK_GAS_SPONSORS.map((s) => (_jsxs("div", { className: "p-3 rounded-xl bg-gray-900/40 border border-gray-800/40 text-center", children: [_jsx("p", { className: "text-xs font-semibold text-gray-200", children: s.name }), _jsx("p", { className: `text-[10px] font-semibold mt-1 ${s.status === 'active' ? 'text-emerald-400' : 'text-amber-400'}`, children: s.status === 'active' ? '✓ Active' : '⚠ Limited' }), _jsxs("p", { className: "text-[10px] text-gray-500 mt-0.5", children: ["Covers: ", s.covered] })] }, s.name))) }), _jsxs("div", { className: "grid grid-cols-3 gap-3", children: [_jsxs("div", { className: "p-3 rounded-xl bg-gray-900/50 border border-gray-800/50 text-center", children: [_jsx("p", { className: "text-2xl font-bold bg-gradient-to-r from-brand-400 to-brand-500 bg-clip-text text-transparent", children: txCount }), _jsx("p", { className: "text-[10px] text-gray-500 mt-1", children: "Gasless TXs" })] }), _jsxs("div", { className: "p-3 rounded-xl bg-gray-900/50 border border-gray-800/50 text-center", children: [_jsx("p", { className: "text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent", children: "~$2.40" }), _jsx("p", { className: "text-[10px] text-gray-500 mt-1", children: "Gas Saved" })] }), _jsxs("div", { className: "p-3 rounded-xl bg-gray-900/50 border border-gray-800/50 text-center", children: [_jsx("p", { className: "text-2xl font-bold bg-gradient-to-r from-purple-400 to-violet-400 bg-clip-text text-transparent", children: "0" }), _jsx("p", { className: "text-[10px] text-gray-500 mt-1", children: "User Gas Paid" })] })] })] })] }), _jsxs("div", { className: "bg-gray-800/60 backdrop-blur-xl rounded-2xl border border-gray-700/60 overflow-hidden", children: [_jsxs("div", { className: "px-5 py-4 border-b border-gray-700/50", children: [_jsx("h2", { className: "text-lg font-bold text-white", children: "\uD83D\uDCE6 Batch Transaction Demo" }), _jsx("p", { className: "text-xs text-gray-500 mt-0.5", children: "Execute multiple transactions in a single user operation" })] }), _jsxs("div", { className: "p-5 space-y-3", children: [batchTxs.map((tx, i) => (_jsx("div", { className: `p-3 rounded-xl border transition-all ${tx.status === 'completed'
                                        ? 'bg-emerald-500/5 border-emerald-500/25'
                                        : tx.status === 'pending'
                                            ? 'bg-amber-500/5 border-amber-500/25'
                                            : 'bg-gray-900/40 border-gray-800/40'}`, children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("span", { className: `size-6 rounded-full flex items-center justify-center text-xs font-bold ${tx.status === 'completed'
                                                            ? 'bg-emerald-500/20 text-emerald-400'
                                                            : tx.status === 'pending'
                                                                ? 'bg-amber-500/20 text-amber-400'
                                                                : 'bg-gray-700/50 text-gray-500'}`, children: tx.status === 'completed' ? '✓' : tx.status === 'pending' ? '⏳' : (i + 1) }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-200", children: tx.action }), _jsx("p", { className: "text-[10px] text-gray-500 font-mono", children: tx.to })] })] }), _jsxs("div", { className: "text-right", children: [_jsx("p", { className: "text-sm font-semibold text-gray-300", children: tx.amount }), _jsx("p", { className: `text-[10px] font-semibold ${tx.status === 'completed' ? 'text-emerald-400' : tx.status === 'pending' ? 'text-amber-400' : 'text-gray-500'}`, children: tx.status })] })] }) }, i))), _jsx("button", { onClick: handleExecuteBatch, disabled: batchExecuting || !smartAccount, className: `w-full py-3.5 rounded-xl font-semibold text-sm transition-all ${batchExecuting
                                        ? 'bg-violet-500/60 text-white cursor-wait'
                                        : smartAccount
                                            ? 'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white shadow-lg shadow-violet-500/25'
                                            : 'bg-gray-700/60 text-gray-500 cursor-not-allowed'}`, children: batchExecuting ? (_jsxs("span", { className: "inline-flex items-center gap-2", children: [_jsxs("svg", { className: "animate-spin h-4 w-4", viewBox: "0 0 24 24", fill: "none", children: [_jsx("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }), _jsx("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" })] }), "Executing Batch..."] })) : (`Execute ${batchTxs.length} Transactions (Single UserOp)`) }), !smartAccount && (_jsx("p", { className: "text-xs text-gray-500 text-center", children: "Create a smart account first to execute batch transactions" })), gasSponsored && (_jsxs("div", { className: "flex items-center gap-2 text-xs text-emerald-400", children: [_jsx("span", { children: "\u26FD" }), _jsx("span", { children: "Gas will be sponsored \u2014 you won't pay any gas fees" })] }))] })] }), _jsxs("div", { className: "bg-violet-500/5 border border-violet-500/20 rounded-2xl p-6 space-y-4", children: [_jsx("h3", { className: "text-base font-bold text-violet-400", children: "What is Account Abstraction?" }), _jsx("p", { className: "text-sm text-gray-400 leading-relaxed", children: "ERC-4337 enables smart contract wallets that replace EOAs. Users get features like social recovery, session keys, batched transactions, and gas sponsorship \u2014 all without changing the Ethereum consensus layer." }), _jsx("div", { className: "grid grid-cols-2 gap-3", children: [
                                { icon: '🔑', title: 'Session Keys', desc: 'Delegate specific permissions temporarily' },
                                { icon: '⛽', title: 'Gas Sponsorship', desc: 'Apps pay gas on behalf of users' },
                                { icon: '📦', title: 'Batch Transactions', desc: 'Multiple actions in one UserOperation' },
                                { icon: '🔄', title: 'Social Recovery', desc: 'Recover accounts via guardians' },
                            ].map((f) => (_jsxs("div", { className: "p-3 rounded-xl bg-gray-900/40 border border-gray-800/40", children: [_jsx("div", { className: "text-lg mb-1", children: f.icon }), _jsx("p", { className: "text-xs font-semibold text-gray-200", children: f.title }), _jsx("p", { className: "text-[10px] text-gray-500 mt-0.5", children: f.desc })] }, f.title))) })] }), _jsxs("div", { className: "bg-gray-800/60 backdrop-blur-xl rounded-2xl border border-gray-700/60 overflow-hidden", children: [_jsxs("div", { className: "flex items-center justify-between px-5 py-3 border-b border-gray-700/40", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsxs("div", { className: "flex gap-1.5", children: [_jsx("div", { className: "w-3 h-3 rounded-full bg-red-500/70" }), _jsx("div", { className: "w-3 h-3 rounded-full bg-yellow-500/70" }), _jsx("div", { className: "w-3 h-3 rounded-full bg-green-500/70" })] }), _jsx("span", { className: "text-[10px] text-gray-500 font-mono", children: "userop-example.ts" })] }), _jsx("span", { className: "text-[10px] px-2 py-0.5 rounded bg-gray-700/50 text-gray-400", children: "TypeScript" })] }), _jsx("pre", { className: "p-5 text-xs text-gray-300 font-mono overflow-x-auto leading-relaxed", children: `import { createBundlerClient } from '@cinacoin/aa';

// Create smart account
const bundler = createBundlerClient({
  chain: mainnet,
  entryPoint: '0x0000...0001',
});

// Send gasless batch transaction
const userOp = await bundler.sendUserOperation({
  calls: [
    { to: '0x1234', value: parseEther('0.1') },
    { to: '0x5678', data: encodeFunctionData(...) },
  ],
  paymaster: true,  // ⛽ Gas sponsored
  sessionKey: '0xabcd',  // 🔑 Session key
});

console.log('UserOp hash:', userOp.hash);` })] })] }) }));
}
//# sourceMappingURL=page.js.map