'use client';
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useCallback, useEffect, useRef } from 'react';
import DemoLayout from '@/components/DemoLayout';
import { useWallet, shortenAddress } from '@/lib/useWallet';
import { useToast } from '@/lib/toast';
import { buildBatchTx, estimateBatchGas, executeBatchTx, checkEIP5792Support, getBatchStatus, } from '@/lib/batch';
function useEIP5792Context() {
    const [ctx, setCtx] = useState(null);
    useEffect(() => {
        const win = window;
        const getter = win.__ocx_eip5792_context;
        if (getter) {
            setCtx(getter());
        }
    }, []);
    if (!ctx) {
        return { provider: null, address: null, chainIdHex: null, isConnected: false };
    }
    return ctx;
}
function useWalletCapabilities() {
    const ctx = useEIP5792Context();
    const [capabilities, setCapabilities] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const fetchCapabilities = useCallback(async () => {
        if (!ctx.provider || !ctx.isConnected) {
            setCapabilities(null);
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const caps = (await ctx.provider.request({
                method: 'wallet_getCapabilities',
                params: [ctx.address],
            }));
            setCapabilities(caps);
        }
        catch (err) {
            const e = err instanceof Error ? err : new Error(String(err));
            setError(e);
            if (e.message.includes('-32601')) {
                setCapabilities({});
            }
        }
        finally {
            setIsLoading(false);
        }
    }, [ctx.provider, ctx.address, ctx.isConnected]);
    useEffect(() => {
        if (ctx.isConnected && ctx.provider) {
            fetchCapabilities();
        }
    }, [ctx.isConnected, ctx.provider, fetchCapabilities]);
    const has = useCallback((chainId, capability) => {
        if (!capabilities)
            return false;
        return !!capabilities[chainId]?.[capability];
    }, [capabilities]);
    const getChainCaps = useCallback((chainId) => {
        if (!capabilities)
            return {};
        return capabilities[chainId] ?? {};
    }, [capabilities]);
    const supportedChains = capabilities ? Object.keys(capabilities) : [];
    const filterBy = useCallback((capability) => {
        if (!capabilities)
            return {};
        const result = {};
        for (const [chainId, caps] of Object.entries(capabilities)) {
            if (caps?.[capability]) {
                result[chainId] = caps;
            }
        }
        return result;
    }, [capabilities]);
    return { capabilities, isLoading, error, refetch: fetchCapabilities, has, getChainCaps, supportedChains, filterBy };
}
function useCallsStatus(options = {}) {
    const ctx = useEIP5792Context();
    const [status, setStatus] = useState(null);
    const [result, setResult] = useState(null);
    const [isPolling, setIsPolling] = useState(false);
    const [error, setError] = useState(null);
    const intervalRef = useRef(null);
    const callIdRef = useRef(options.callId ?? null);
    const intervalMs = options.intervalMs ?? 2000;
    const clearTimer = useCallback(() => {
        if (intervalRef.current) {
            clearTimeout(intervalRef.current);
            intervalRef.current = null;
        }
    }, []);
    const pollOnce = useCallback(async () => {
        if (!callIdRef.current || !ctx.provider)
            return;
        try {
            const res = await getBatchStatus(ctx.provider, callIdRef.current);
            setResult(res);
            setStatus(res.status);
            setError(null);
            if (res.status === 'CONFIRMED') {
                clearTimer();
                setIsPolling(false);
            }
        }
        catch (err) {
            const e = err instanceof Error ? err : new Error(String(err));
            setError(e);
        }
    }, [ctx.provider, clearTimer]);
    const startPolling = useCallback((batchId) => {
        callIdRef.current = batchId;
        clearTimer();
        setIsPolling(true);
        setError(null);
        setResult(null);
        setStatus(null);
        const tick = async () => {
            await pollOnce();
            if (callIdRef.current) {
                intervalRef.current = setTimeout(tick, intervalMs);
            }
        };
        tick();
    }, [clearTimer, pollOnce, intervalMs]);
    const stopPolling = useCallback(() => {
        callIdRef.current = null;
        clearTimer();
        setIsPolling(false);
    }, [clearTimer]);
    useEffect(() => {
        if (options.callId)
            startPolling(options.callId);
        return () => clearTimer();
    }, [options.callId, startPolling, clearTimer]);
    useEffect(() => {
        return () => clearTimer();
    }, [clearTimer]);
    const allSucceeded = result
        ? result.status === 'CONFIRMED' && !!result.receipts && result.receipts.length > 0 && result.receipts.every((r) => r.receipt.status === '0x1')
        : false;
    const failedReceipts = result && result.status === 'CONFIRMED' && result.receipts
        ? result.receipts.filter((r) => r.receipt.status === '0x0')
        : [];
    return { status, result, isPolling, error, startPolling, stopPolling, allSucceeded, failedReceipts };
}
/* ────────────────────────────────────────────────────────
   Chain names lookup
   ──────────────────────────────────────────────────────── */
const CHAIN_NAMES = {
    '0x1': 'Ethereum Mainnet',
    '0x89': 'Polygon',
    '0xa4b1': 'Arbitrum One',
    '0xa': 'Optimism',
    '0x2105': 'Base',
    '0x38': 'BNB Chain',
    '0xa86a': 'Avalanche',
    '0xaa36a7': 'Sepolia',
    '0x5': 'Goerli',
    '0x13881': 'Mumbai',
    '0x144': 'zkSync Mainnet',
};
function chainLabel(chainIdHex) {
    return CHAIN_NAMES[chainIdHex] ?? `Chain ${parseInt(chainIdHex, 16)}`;
}
/* ────────────────────────────────────────────────────────
   UI Components
   ──────────────────────────────────────────────────────── */
function CapBadge({ label, supported }) {
    return (_jsxs("span", { className: `inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${supported
            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
            : 'bg-gray-700/50 text-gray-500 border border-gray-600/30'}`, children: [_jsx("span", { className: `size-1.5 rounded-full ${supported ? 'bg-emerald-400 animate-pulse' : 'bg-gray-600'}` }), label] }));
}
function StatusBadge({ status }) {
    const colors = {
        PENDING: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
        CONFIRMED: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
        REVERTED: 'bg-red-500/15 text-red-400 border-red-500/25',
        COMPLETE: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
    };
    return (_jsxs("span", { className: `inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${colors[status] ?? 'bg-gray-700/50 text-gray-400 border-gray-600/30'}`, children: [status === 'PENDING' && _jsx("span", { className: "size-1.5 rounded-full bg-amber-400 animate-pulse" }), status === 'CONFIRMED' && _jsx("span", { className: "size-1.5 rounded-full bg-emerald-400" }), status === 'REVERTED' && _jsx("span", { className: "size-1.5 rounded-full bg-red-400" }), status] }));
}
function Spinner() {
    return (_jsxs("svg", { className: "animate-spin h-4 w-4", viewBox: "0 0 24 24", fill: "none", children: [_jsx("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }), _jsx("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" })] }));
}
/* ────────────────────────────────────────────────────────
   EIP-5792 Context Bridge
   ──────────────────────────────────────────────────────── */
function EIP5792Bridge({ address, chainId, isConnected, }) {
    const addressRef = useRef(address);
    addressRef.current = address;
    const chainIdRef = useRef(chainId);
    chainIdRef.current = chainId;
    const connectedRef = useRef(isConnected);
    connectedRef.current = isConnected;
    useEffect(() => {
        if (typeof window === 'undefined')
            return;
        const eth = window.ethereum;
        const provider = eth && typeof eth.request === 'function'
            ? eth
            : null;
        const getter = () => ({
            provider,
            address: addressRef.current,
            chainIdHex: chainIdRef.current ? `0x${chainIdRef.current.toString(16)}` : null,
            isConnected: connectedRef.current,
        });
        window.__ocx_eip5792_context = getter;
        return () => {
            delete window.__ocx_eip5792_context;
        };
    }, []);
    return null;
}
/* ────────────────────────────────────────────────────────
   Main Page
   ──────────────────────────────────────────────────────── */
export default function BatchPage() {
    const { account, status, error, connectors, connect, disconnect } = useWallet();
    const { success, error: toastError, info } = useToast();
    const isConnected = status === 'connected';
    const isConnecting = status === 'connecting';
    const address = account.address;
    const chainId = account.chainId;
    const currentChainHex = chainId ? `0x${chainId.toString(16)}` : null;
    const capabilities = useWalletCapabilities();
    const callsStatus = useCallsStatus();
    const [batchCalls, setBatchCalls] = useState([
        { to: address ?? '0x0000000000000000000000000000000000000000', value: '0x0', data: '0x' },
    ]);
    const [showPreview, setShowPreview] = useState(false);
    const [lastAction, setLastAction] = useState(null);
    // Real batch service state
    const [gasEstimate, setGasEstimate] = useState(null);
    const [estimatingGas, setEstimatingGas] = useState(false);
    const [batchResult, setBatchResult] = useState(null);
    const [executing, setExecuting] = useState(false);
    const [eip5792Supported, setEip5792Supported] = useState(null);
    useEffect(() => {
        if (address && batchCalls.length === 1 && batchCalls[0].to === '0x0000000000000000000000000000000000000000') {
            setBatchCalls((prev) => prev.map((c) => ({ ...c, to: address })));
        }
    }, [address]); // eslint-disable-line react-hooks/exhaustive-deps
    useEffect(() => () => callsStatus.stopPolling(), [callsStatus.stopPolling]);
    // Check EIP-5792 support on connect
    useEffect(() => {
        if (!isConnected || !address) {
            setEip5792Supported(null);
            return;
        }
        const eth = window.ethereum;
        if (!eth)
            return;
        checkEIP5792Support(eth, address)
            .then(setEip5792Supported)
            .catch(() => setEip5792Supported(false));
    }, [isConnected, address]);
    const handleAddCall = useCallback(() => {
        setBatchCalls((prev) => [...prev, { to: '', value: '0x0', data: '0x' }]);
        setGasEstimate(null);
        setBatchResult(null);
    }, []);
    const handleRemoveCall = useCallback((index) => {
        setBatchCalls((prev) => prev.filter((_, i) => i !== index));
        setGasEstimate(null);
        setBatchResult(null);
    }, []);
    const handleUpdateCall = useCallback((index, field, value) => {
        setBatchCalls((prev) => prev.map((c, i) => (i === index ? { ...c, [field]: value } : c)));
        setGasEstimate(null);
        setBatchResult(null);
    }, []);
    /** Estimate gas for the current batch via real RPC calls. */
    const handleEstimateGas = useCallback(async () => {
        const eth = window.ethereum;
        if (!eth || !address)
            return;
        const calls = batchCalls.map((c) => ({
            to: c.to,
            value: c.value,
            data: c.data,
        }));
        const validated = buildBatchTx(calls);
        if (!validated.valid) {
            toastError(`Invalid batch: ${validated.error}`);
            return;
        }
        setEstimatingGas(true);
        try {
            const estimate = await estimateBatchGas(eth, address, validated.calls);
            setGasEstimate(estimate);
        }
        catch (err) {
            const message = err instanceof Error ? err.message : 'Gas estimation failed';
            toastError(message);
        }
        finally {
            setEstimatingGas(false);
        }
    }, [batchCalls, address, toastError]);
    /** Execute batch using the real batch service. */
    const handleExecuteBatch = useCallback(async (atomic) => {
        const eth = window.ethereum;
        if (!eth || !address)
            return;
        setLastAction(atomic ? 'batch' : 'send');
        setBatchResult(null);
        setExecuting(true);
        const calls = batchCalls.map((c) => ({
            to: c.to,
            value: c.value,
            data: c.data,
        }));
        const validated = buildBatchTx(calls);
        if (!validated.valid) {
            toastError(`Invalid batch: ${validated.error}`);
            setExecuting(false);
            return;
        }
        try {
            const result = await executeBatchTx(eth, address, validated.calls);
            setBatchResult(result);
            if (result.success) {
                if (result.callId) {
                    // EIP-5792 atomic batch — start polling
                    callsStatus.startPolling(result.callId);
                    toastSuccess(`Batch submitted! Call ID: ${result.callId.slice(0, 10)}…`);
                }
                else if (result.txHashes && result.txHashes.length > 0) {
                    toastSuccess(`Batch executed! ${result.txHashes.length} transaction(s) sent.`);
                }
            }
            else {
                toastError(result.error ?? 'Batch execution failed');
            }
        }
        catch (err) {
            const message = err instanceof Error ? err.message : 'Batch execution failed';
            setBatchResult({ success: false, error: message });
            toastError(message);
        }
        finally {
            setExecuting(false);
        }
    }, [batchCalls, address, toastError, callsStatus]);
    const handleSendBatch = useCallback(() => handleExecuteBatch(false), [handleExecuteBatch]);
    const handleAtomicBatch = useCallback(() => handleExecuteBatch(true), [handleExecuteBatch]);
    const handlePreview = useCallback(() => {
        const calls = batchCalls.map((c) => ({
            to: c.to,
            value: c.value,
            data: c.data,
        }));
        const validated = buildBatchTx(calls);
        if (!validated.valid) {
            toastError(`Invalid batch: ${validated.error}`);
            return;
        }
        setShowPreview(true);
    }, [batchCalls, toastError]);
    function toastSuccess(msg) {
        try {
            success(msg);
        }
        catch { /* noop */ }
    }
    return (_jsxs(DemoLayout, { children: [_jsx(EIP5792Bridge, { address: address, chainId: chainId, isConnected: isConnected }), _jsxs("div", { className: "max-w-2xl mx-auto px-4 py-8 space-y-8", children: [_jsxs("div", { className: "text-center space-y-2", children: [_jsx("h1", { className: "text-3xl font-bold bg-gradient-to-r from-brand-400 via-brand-500 to-brand-600 bg-clip-text text-transparent", children: "EIP-5792 Atomic Batch" }), _jsx("p", { className: "text-gray-400 text-sm", children: "Send multiple transactions atomically via wallet_sendCalls \u2014 with real gas estimation" })] }), _jsx("div", { className: "flex items-center justify-end gap-3", children: isConnected ? (_jsxs("div", { className: "flex items-center gap-3", children: [_jsxs("span", { className: "text-xs text-gray-400", children: [_jsx("span", { className: "text-white font-semibold", children: shortenAddress(account.address ?? '') }), currentChainHex && (_jsxs("span", { className: "text-gray-500 ml-1", children: ["\u00B7 ", chainLabel(currentChainHex)] }))] }), _jsx("button", { onClick: () => disconnect(), className: "px-3 py-1.5 rounded-xl text-xs font-semibold bg-gray-700/60 text-gray-300 border border-gray-600/40 hover:text-white hover:border-gray-500 transition-all", children: "Disconnect" })] })) : (_jsx("button", { onClick: () => connect(connectors.find((c) => c.id === 'io.metamask')?.id ?? connectors[0]?.id ?? 'io.metamask'), disabled: isConnecting, className: "px-4 py-2 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-all disabled:opacity-50", children: isConnecting ? 'Connecting...' : 'Connect Wallet' })) }), error && (_jsx("div", { className: "text-center text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2", children: error })), _jsxs("div", { className: "bg-gray-800/60 backdrop-blur-xl rounded-2xl border border-gray-700/60 shadow-2xl shadow-black/30 overflow-hidden", children: [_jsxs("div", { className: "px-5 py-4 border-b border-gray-700/50 flex items-center justify-between", children: [_jsx("h2", { className: "text-lg font-bold text-white", children: "Wallet Capabilities" }), _jsx("button", { onClick: () => capabilities.refetch(), disabled: !isConnected, className: "text-xs text-gray-400 hover:text-white transition-colors disabled:opacity-40", children: "\u21BB Refresh" })] }), !isConnected && (_jsx("div", { className: "p-6 text-center text-sm text-gray-500", children: "Connect a wallet to discover capabilities" })), isConnected && capabilities.isLoading && (_jsx("div", { className: "p-6 text-center text-sm text-gray-400", children: _jsxs("span", { className: "inline-flex items-center gap-2", children: [_jsx(Spinner, {}), " Fetching capabilities\u2026"] }) })), isConnected && !capabilities.isLoading && (_jsxs("div", { className: "p-5 space-y-4", children: [capabilities.supportedChains.length > 0 ? (_jsxs("div", { children: [_jsx("p", { className: "text-xs text-gray-400 uppercase tracking-wider mb-2", children: "Supported Chains" }), _jsx("div", { className: "flex flex-wrap gap-2", children: capabilities.supportedChains.map((cid) => (_jsxs("span", { className: "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-700/60 border border-gray-600/40 text-xs text-gray-300 font-mono", children: [_jsx("span", { className: "size-1.5 rounded-full bg-emerald-400" }), chainLabel(cid)] }, cid))) })] })) : (_jsxs("div", { className: "flex flex-wrap gap-2", children: [_jsx(CapBadge, { label: "wallet_getCapabilities", supported: false }), _jsx("span", { className: "text-xs text-gray-500 self-center", children: capabilities.error
                                                    ? `Not supported (${capabilities.error.message.slice(0, 60)}…)`
                                                    : 'Method not available on this wallet' })] })), _jsxs("div", { className: "flex flex-wrap gap-2", children: [_jsx(CapBadge, { label: "atomicBatch", supported: eip5792Supported === true }), _jsx(CapBadge, { label: "paymasterService", supported: capabilities.has(currentChainHex ?? '0x1', 'paymasterService') }), _jsx(CapBadge, { label: "sessionKeys", supported: capabilities.has(currentChainHex ?? '0x1', 'sessionKeys') }), _jsx(CapBadge, { label: "permissions", supported: capabilities.has(currentChainHex ?? '0x1', 'permissions') })] }), currentChainHex && (_jsxs("div", { className: "flex items-center gap-2 p-3 rounded-xl bg-gray-900/50 border border-gray-700/40", children: [_jsx("span", { className: "text-xs text-gray-400", children: "Current chain:" }), _jsxs("span", { className: "text-xs font-mono text-gray-300", children: [chainLabel(currentChainHex), " (", currentChainHex, ")"] }), _jsx("span", { className: "ml-auto", children: eip5792Supported === true ? (_jsx(CapBadge, { label: "EIP-5792 \u2713", supported: true })) : (_jsx(CapBadge, { label: "Sequential fallback", supported: false })) })] }))] }))] }), isConnected && (_jsxs("div", { className: "bg-gray-800/60 backdrop-blur-xl rounded-2xl border border-gray-700/60 shadow-2xl shadow-black/30 overflow-hidden", children: [_jsxs("div", { className: "px-5 py-4 border-b border-gray-700/50 flex items-center justify-between", children: [_jsx("h2", { className: "text-lg font-bold text-white", children: "Gas Estimation" }), _jsx("button", { onClick: handleEstimateGas, disabled: estimatingGas || batchCalls.length === 0, className: "px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600/30 transition-all disabled:opacity-50", children: estimatingGas ? (_jsxs("span", { className: "inline-flex items-center gap-1.5", children: [_jsx(Spinner, {}), " Estimating\u2026"] })) : ('↻ Estimate Gas') })] }), _jsx("div", { className: "p-5 space-y-3", children: gasEstimate ? (_jsxs(_Fragment, { children: [_jsxs("div", { className: "flex items-center justify-between p-3 rounded-xl bg-gray-900/50 border border-gray-700/40", children: [_jsx("span", { className: "text-xs text-gray-400", children: "Total Gas" }), _jsxs("span", { className: "text-sm font-mono text-emerald-400 font-bold", children: [gasEstimate.totalDecimal.toLocaleString(), " gas"] })] }), gasEstimate.individual.map((g, i) => (_jsxs("div", { className: "flex items-center justify-between px-4 py-2 rounded-lg bg-gray-900/30", children: [_jsxs("span", { className: "text-xs text-gray-500", children: ["Call #", i + 1] }), _jsx("span", { className: "text-xs font-mono text-gray-400", children: g === '0x0' ? 'N/A (default 21k)' : `${parseInt(g, 16).toLocaleString()} gas` })] }, i)))] })) : (_jsx("p", { className: "text-sm text-gray-500 text-center py-2", children: "Click \"Estimate Gas\" to calculate real gas costs for this batch" })) })] })), _jsxs("div", { className: "bg-gray-800/60 backdrop-blur-xl rounded-2xl border border-gray-700/60 shadow-2xl shadow-black/30 overflow-hidden", children: [_jsxs("div", { className: "px-5 py-4 border-b border-gray-700/50", children: [_jsx("h2", { className: "text-lg font-bold text-white", children: "Batch Transaction Builder" }), _jsx("p", { className: "text-xs text-gray-500 mt-1", children: "Add multiple calls to send atomically" })] }), _jsxs("div", { className: "p-5 space-y-3", children: [batchCalls.map((call, index) => (_jsxs("div", { className: "p-4 rounded-xl bg-gray-900/50 border border-gray-700/40 space-y-3", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("span", { className: "text-xs font-semibold text-gray-400 uppercase tracking-wider", children: ["Call #", index + 1] }), batchCalls.length > 1 && (_jsx("button", { onClick: () => handleRemoveCall(index), className: "text-xs text-red-400 hover:text-red-300 transition-colors px-2 py-0.5 rounded bg-red-500/10 hover:bg-red-500/20", children: "Remove" }))] }), _jsxs("div", { children: [_jsx("label", { htmlFor: `batch-to-${index}`, className: "text-xs text-gray-500 mb-1 block", children: "To (address)" }), _jsx("input", { id: `batch-to-${index}`, type: "text", value: call.to, onChange: (e) => handleUpdateCall(index, 'to', e.target.value), placeholder: "0x\u2026", className: "w-full px-3 py-2 bg-gray-800/80 border border-gray-700/50 rounded-lg text-sm font-mono text-gray-300 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/50", "aria-label": `Call ${index + 1} destination address` })] }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: `batch-value-${index}`, className: "text-xs text-gray-500 mb-1 block", children: "Value (hex wei)" }), _jsx("input", { id: `batch-value-${index}`, type: "text", value: call.value, onChange: (e) => handleUpdateCall(index, 'value', e.target.value), placeholder: "0x0", className: "w-full px-3 py-2 bg-gray-800/80 border border-gray-700/50 rounded-lg text-sm font-mono text-gray-300 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/50", "aria-label": `Call ${index + 1} value in hex wei` })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: `batch-data-${index}`, className: "text-xs text-gray-500 mb-1 block", children: "Data (hex)" }), _jsx("input", { id: `batch-data-${index}`, type: "text", value: call.data, onChange: (e) => handleUpdateCall(index, 'data', e.target.value), placeholder: "0x", className: "w-full px-3 py-2 bg-gray-800/80 border border-gray-700/50 rounded-lg text-sm font-mono text-gray-300 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/50", "aria-label": `Call ${index + 1} transaction data` })] })] })] }, index))), _jsx("button", { onClick: handleAddCall, className: "w-full py-2.5 rounded-xl text-sm font-semibold border border-dashed border-gray-600 text-gray-400 hover:text-white hover:border-gray-400 transition-all", children: "+ Add Call" }), _jsxs("div", { className: "flex flex-col sm:flex-row gap-3 pt-2", children: [_jsx("button", { onClick: handlePreview, disabled: !isConnected, className: "flex-1 px-4 py-3 rounded-xl text-sm font-semibold bg-gray-700/60 text-gray-300 border border-gray-600/40 hover:text-white hover:border-gray-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed", children: "Preview Batch" }), _jsx("button", { onClick: handleSendBatch, disabled: !isConnected || executing || callsStatus.isPolling, className: "flex-1 px-4 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-brand-600 to-brand-500 text-white hover:from-brand-500 hover:to-brand-400 shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed", children: executing && lastAction === 'send' ? (_jsxs("span", { className: "inline-flex items-center gap-2", children: [_jsx(Spinner, {}), " Sending\u2026"] })) : ('wallet_sendCalls') }), _jsx("button", { onClick: handleAtomicBatch, disabled: !isConnected || executing || callsStatus.isPolling, className: "flex-1 px-4 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-brand-600 to-brand-500 text-white hover:from-brand-500 hover:to-brand-400 shadow-lg shadow-brand-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed", children: executing && lastAction === 'batch' ? (_jsxs("span", { className: "inline-flex items-center gap-2", children: [_jsx(Spinner, {}), " Executing\u2026"] })) : ('Execute Atomic Batch') })] }), batchResult && !batchResult.success && (_jsx("div", { className: "p-3 rounded-xl bg-red-500/10 border border-red-500/20", children: _jsx("p", { className: "text-sm text-red-400", children: batchResult.error ?? 'Unknown error' }) }))] })] }), showPreview && (_jsxs("div", { className: "bg-gray-800/60 backdrop-blur-xl rounded-2xl border border-gray-700/60 shadow-2xl shadow-black/30 overflow-hidden", children: [_jsxs("div", { className: "px-5 py-4 border-b border-gray-700/50 flex items-center justify-between", children: [_jsx("h2", { className: "text-lg font-bold text-white", children: "Batch Preview" }), _jsx("button", { onClick: () => setShowPreview(false), className: "text-xs text-gray-400 hover:text-white transition-colors", children: "\u2715" })] }), _jsxs("div", { className: "p-5 space-y-3", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-xs text-gray-400", children: "Total calls:" }), _jsx("span", { className: "text-xs font-bold text-emerald-400", children: batchCalls.length })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-xs text-gray-400", children: "Atomic:" }), eip5792Supported ? (_jsx("span", { className: "text-xs font-bold text-emerald-400", children: "Yes \u2713" })) : (_jsx("span", { className: "text-xs font-bold text-amber-400", children: "Sequential fallback" }))] }), gasEstimate && (_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-xs text-gray-400", children: "Est. gas:" }), _jsx("span", { className: "text-xs font-mono text-blue-400", children: gasEstimate.totalDecimal.toLocaleString() })] }))] }), batchCalls.map((call, index) => (_jsxs("div", { className: "p-3 rounded-lg bg-gray-900/50 border border-gray-700/40 font-mono text-xs text-gray-400 space-y-1", children: [_jsxs("div", { children: [_jsx("span", { className: "text-gray-500", children: "to:" }), " ", call.to || '(empty)'] }), _jsxs("div", { children: [_jsx("span", { className: "text-gray-500", children: "value:" }), " ", call.value] }), _jsxs("div", { children: [_jsx("span", { className: "text-gray-500", children: "data:" }), " ", call.data || '0x (empty)'] }), gasEstimate && (_jsxs("div", { children: [_jsx("span", { className: "text-gray-500", children: "gas:" }), " ", gasEstimate.individual[index] === '0x0' ? 'N/A' : `${parseInt(gasEstimate.individual[index], 16).toLocaleString()}`] }))] }, index)))] })] })), (callsStatus.isPolling || callsStatus.result || batchResult) && (_jsxs("div", { className: "bg-gray-800/60 backdrop-blur-xl rounded-2xl border border-gray-700/60 shadow-2xl shadow-black/30 overflow-hidden", children: [_jsx("div", { className: "px-5 py-4 border-b border-gray-700/50", children: _jsx("h2", { className: "text-lg font-bold text-white", children: "Transaction Status" }) }), _jsxs("div", { className: "p-5 space-y-4", children: [batchResult?.callId && (_jsxs("div", { className: "p-3 rounded-xl bg-gray-900/50 border border-gray-700/40", children: [_jsx("p", { className: "text-xs text-gray-500 mb-1", children: "Batch ID (EIP-5792)" }), _jsx("p", { className: "text-sm font-mono text-gray-300 break-all", children: batchResult.callId })] })), batchResult?.txHashes && batchResult.txHashes.length > 0 && (_jsxs("div", { className: "space-y-2", children: [_jsx("p", { className: "text-xs text-gray-400 uppercase tracking-wider", children: "Transaction Hashes" }), batchResult.txHashes.map((hash, i) => (_jsxs("div", { className: "p-3 rounded-lg bg-gray-900/50 border border-gray-700/40 font-mono text-xs text-gray-400", children: [_jsxs("span", { className: "text-gray-500", children: ["#", i + 1, ":"] }), " ", hash] }, i)))] })), callsStatus.isPolling && (_jsxs("div", { className: "flex items-center gap-2 text-sm text-amber-400", children: [_jsx(Spinner, {}), " Polling status\u2026"] })), callsStatus.status && (_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("span", { className: "text-xs text-gray-400", children: "Status:" }), _jsx(StatusBadge, { status: callsStatus.status })] })), callsStatus.allSucceeded && (_jsx("div", { className: "p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20", children: _jsx("p", { className: "text-sm text-emerald-400 font-semibold", children: "\u2713 All calls succeeded!" }) })), callsStatus.failedReceipts.length > 0 && (_jsxs("div", { className: "p-3 rounded-xl bg-red-500/10 border border-red-500/20", children: [_jsxs("p", { className: "text-sm text-red-400 font-semibold mb-1", children: ["\u2717 ", callsStatus.failedReceipts.length, " call(s) failed"] }), callsStatus.failedReceipts.map((r, i) => (_jsxs("p", { className: "text-xs font-mono text-red-400/80", children: ["tx: ", r.transactionHash ?? 'pending'] }, i)))] })), callsStatus.error && (_jsx("div", { className: "p-3 rounded-xl bg-red-500/10 border border-red-500/20", children: _jsx("p", { className: "text-sm text-red-400", children: callsStatus.error.message }) })), callsStatus.result?.receipts && callsStatus.result.receipts.length > 0 && (_jsxs("div", { className: "space-y-2", children: [_jsx("p", { className: "text-xs text-gray-400 uppercase tracking-wider", children: "Receipts" }), callsStatus.result.receipts.map((r, i) => (_jsxs("div", { className: "p-3 rounded-lg bg-gray-900/50 border border-gray-700/40 space-y-1", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("span", { className: "text-xs text-gray-500", children: ["Call #", i + 1] }), _jsx("span", { className: `text-[10px] px-1.5 py-0.5 rounded font-bold ${r.receipt.status === '0x1' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`, children: r.receipt.status === '0x1' ? 'SUCCESS' : 'FAILED' })] }), r.transactionHash && (_jsxs("p", { className: "text-xs font-mono text-gray-500 break-all", children: ["tx: ", r.transactionHash] }))] }, i)))] })), callsStatus.isPolling && (_jsx("button", { onClick: () => callsStatus.stopPolling(), className: "w-full py-2.5 rounded-xl text-sm font-semibold bg-gray-700/60 text-gray-300 border border-gray-600/40 hover:text-white hover:border-gray-500 transition-all", children: "Stop Polling" }))] })] })), _jsxs("div", { className: "text-center space-y-2 bg-blue-500/5 border border-blue-500/20 rounded-xl px-6 py-4", children: [_jsx("p", { className: "text-sm text-blue-400 font-semibold", children: "EIP-5792 Wallet Call API" }), _jsxs("p", { className: "text-xs text-gray-500", children: ["This page demonstrates atomic batch transactions using EIP-5792", ' ', _jsx("code", { className: "text-gray-400 font-mono", children: "wallet_sendCalls" }), ". Requires a wallet that supports the Wallet Call API (e.g. Coinbase Smart Wallet, Biconomy, Zerodev). Standard EOA wallets fall back to sequential ", _jsx("code", { className: "text-gray-400 font-mono", children: "eth_sendTransaction" }), " calls."] })] })] })] }));
}
//# sourceMappingURL=page.js.map