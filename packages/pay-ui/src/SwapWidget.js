import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * SwapWidget — React component for token swapping.
 *
 * Features:
 * - Token pair selection with swap button
 * - Amount input with real-time quote fetching
 * - Slippage settings modal
 * - Route display showing DEX path
 * - Execute swap with transaction status
 * - Success/error states
 *
 * @example
 * ```tsx
 * <SwapWidget
 *   chainId={1}
 *   walletAddress={address}
 *   supportedTokens={tokens}
 *   defaultFromToken={USDC}
 *   defaultToToken={ETH}
 *   theme="dark"
 *   onSwapComplete={(receipt) => console.log(receipt.txHash)}
 * />
 * ```
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { SwapWidgetCore } from "./SwapWidgetCore.js";
import { getWidgetStyles, cardStyles, buttonStyles, inputStyles } from "./styles.js";
// Re-export core for consumers
export { SwapWidgetCore } from "./SwapWidgetCore.js";
/**
 * SwapWidget React component.
 *
 * Built with React + Web Components architecture.
 * The core logic is in SwapWidgetCore (framework-agnostic).
 */
export function SwapWidget(props) {
    const { supportedTokens = [], defaultFromToken, defaultToToken, defaultAmount, chainId, walletAddress, theme = "light", primaryColor, onSwapComplete, onError, className = "", } = props;
    // ── Core Controller ────────────────────────────────────
    const coreRef = useRef(null);
    if (!coreRef.current) {
        coreRef.current = new SwapWidgetCore({
            chainId,
            walletAddress,
            fetchQuote: async (params) => {
                // Stub: integrate with SwapRouter in real usage
                throw new Error("No swap router configured");
            },
            executeTransaction: async (tx) => {
                // Stub: integrate with wallet in real usage
                throw new Error("No wallet executor configured");
            },
        });
    }
    const [fromToken, setFromToken] = useState(defaultFromToken ?? null);
    const [toToken, setToToken] = useState(defaultToToken ?? null);
    const [inputAmount, setInputAmount] = useState(defaultAmount ?? "");
    const [quotes, setQuotes] = useState([]);
    const [selectedQuote, setSelectedQuote] = useState(null);
    const [state, setState] = useState(coreRef.current.state.state);
    const [error, setError] = useState(null);
    const [slippage, setSlippage] = useState(coreRef.current.state.slippage);
    const [showSlippageModal, setShowSlippageModal] = useState(false);
    const [showTokenModal, setShowTokenModal] = useState(false);
    const [selectingFor, setSelectingFor] = useState("from");
    const [lastReceipt, setLastReceipt] = useState(null);
    // Sync core with React state
    useEffect(() => {
        coreRef.current?.setFromToken(fromToken);
    }, [fromToken]);
    useEffect(() => {
        coreRef.current?.setToToken(toToken);
    }, [toToken]);
    useEffect(() => {
        coreRef.current?.setInputAmount(inputAmount);
    }, [inputAmount]);
    // Subscribe to core state changes
    useEffect(() => {
        const core = coreRef.current;
        if (!core)
            return;
        const unsubscribe = core.onChange(() => {
            const s = core.state;
            setState(s.state);
            setError(s.error);
            setQuotes(s.quotes);
            setSelectedQuote(s.selectedQuote);
            setSlippage(s.slippage);
            setLastReceipt(s.lastReceipt);
        });
        return unsubscribe;
    }, []);
    // ── Callbacks ──────────────────────────────────────────
    const handleSwapTokens = useCallback(() => {
        coreRef.current?.swapTokens();
        setFromToken(toToken);
        setToToken(fromToken);
    }, [fromToken, toToken]);
    const handleAmountChange = useCallback((value) => {
        coreRef.current?.setInputAmount(value);
        setInputAmount(value);
    }, []);
    const handleFetchQuote = useCallback(async () => {
        await coreRef.current?.fetchQuote();
    }, []);
    const handleExecuteSwap = useCallback(async () => {
        const receipt = await coreRef.current?.executeSwap();
        if (receipt) {
            onSwapComplete?.(receipt);
        }
        else if (coreRef.current?.state.error) {
            onError?.(new Error(coreRef.current.state.error));
        }
    }, [onSwapComplete, onError]);
    const handleSlippageSelect = useCallback((bps) => {
        coreRef.current?.setSlippage({ slippageBps: bps, autoSlippage: false });
        setSlippage((prev) => ({ ...prev, slippageBps: bps, autoSlippage: false }));
    }, []);
    const handleTokenSelect = useCallback((token) => {
        if (selectingFor === "from") {
            setFromToken(token);
        }
        else {
            setToToken(token);
        }
        setShowTokenModal(false);
    }, [selectingFor]);
    const handleReset = useCallback(() => {
        coreRef.current?.reset();
        setFromToken(defaultFromToken ?? null);
        setToToken(defaultToToken ?? null);
        setInputAmount(defaultAmount ?? "");
        setQuotes([]);
        setSelectedQuote(null);
        setError(null);
        setLastReceipt(null);
    }, [defaultFromToken, defaultToToken, defaultAmount]);
    // ── Styles ─────────────────────────────────────────────
    const widgetCssVars = getWidgetStyles(theme, primaryColor);
    const cardCss = cardStyles();
    // ── Render ─────────────────────────────────────────────
    return (_jsxs("div", { className: `ocx-swap-widget ${className}`, style: { ...widgetCssVars, ...cardCss, maxWidth: "480px" }, children: [_jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }, children: [_jsx("h2", { style: { margin: 0, fontSize: "18px", fontWeight: 600, color: "var(--ocx-text-primary)" }, children: "Swap" }), _jsx("button", { style: { background: "none", border: "none", cursor: "pointer", fontSize: "20px", color: "var(--ocx-text-muted)" }, onClick: handleReset, title: "Reset", children: "\u21BB" })] }), _jsx(TokenInput, { label: "From", token: fromToken, amount: inputAmount, onAmountChange: handleAmountChange, onTokenClick: () => { setSelectingFor("from"); setShowTokenModal(true); } }), _jsx("div", { style: { display: "flex", justifyContent: "center", margin: "-8px 0" }, children: _jsx("button", { onClick: handleSwapTokens, style: {
                        ...buttonStyles("secondary", "sm"),
                        borderRadius: "50%",
                        width: "32px",
                        height: "32px",
                        padding: "0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 1,
                    }, children: "\u2193" }) }), _jsx(TokenInput, { label: "To", token: toToken, amount: selectedQuote ? formatAmount(selectedQuote.toAmount, toToken?.decimals ?? 18) : "", onAmountChange: () => { }, onTokenClick: () => { setSelectingFor("to"); setShowTokenModal(true); }, readOnly: true }), selectedQuote && (_jsxs("div", { style: { marginTop: "12px", padding: "12px", background: "var(--ocx-bg-surface)", borderRadius: "8px" }, children: [_jsxs("div", { style: { display: "flex", justifyContent: "space-between", fontSize: "14px", marginBottom: "4px" }, children: [_jsx("span", { style: { color: "var(--ocx-text-secondary)" }, children: "Rate" }), _jsx("span", { style: { color: "var(--ocx-text-primary)" }, children: formatExchangeRate(selectedQuote) })] }), _jsxs("div", { style: { display: "flex", justifyContent: "space-between", fontSize: "14px", marginBottom: "4px" }, children: [_jsx("span", { style: { color: "var(--ocx-text-secondary)" }, children: "Slippage" }), _jsxs("span", { style: { color: getSlippageColor(slippage.slippageBps), cursor: "pointer" }, onClick: () => setShowSlippageModal(true), children: [(slippage.slippageBps / 100).toFixed(2), "%"] })] }), _jsxs("div", { style: { display: "flex", justifyContent: "space-between", fontSize: "14px" }, children: [_jsx("span", { style: { color: "var(--ocx-text-secondary)" }, children: "Min. received" }), _jsxs("span", { style: { color: "var(--ocx-text-primary)" }, children: [formatAmount(selectedQuote.minimumReceived, toToken?.decimals ?? 18), " ", toToken?.symbol ?? ""] })] }), selectedQuote.route.length > 0 && (_jsx(RouteDisplay, { route: selectedQuote.route }))] })), showSlippageModal && (_jsx(SlippageModal, { slippage: slippage, onSelect: handleSlippageSelect, onClose: () => setShowSlippageModal(false) })), showTokenModal && (_jsx(TokenSelectionModal, { tokens: supportedTokens, onSelect: handleTokenSelect, onClose: () => setShowTokenModal(false), selected: selectingFor === "from" ? fromToken : toToken })), error && (_jsx("div", { style: { marginTop: "12px", padding: "12px", background: "var(--ocx-error-bg)", borderRadius: "8px", color: "var(--ocx-error)", fontSize: "14px" }, children: error })), state === "success" && lastReceipt && (_jsx(TransactionStatus, { receipt: lastReceipt })), _jsx("button", { style: {
                    ...buttonStyles("primary", "lg"),
                    width: "100%",
                    marginTop: "16px",
                    ...(state === "executing" ? { opacity: 0.7 } : {}),
                }, onClick: state === "quote-ready" ? handleExecuteSwap : handleFetchQuote, disabled: state === "executing" || state === "fetching-quote", children: state === "fetching-quote" ? "Fetching quote..." :
                    state === "executing" ? "Executing swap..." :
                        state === "quote-ready" ? "Swap" :
                            state === "success" ? "Swap Complete ✓" :
                                state === "error" ? "Try Again" :
                                    "Enter amount" })] }));
}
function TokenInput({ label, token, amount, onAmountChange, onTokenClick, readOnly }) {
    return (_jsxs("div", { style: { background: "var(--ocx-bg-surface)", borderRadius: "12px", padding: "16px", marginBottom: "4px" }, children: [_jsx("div", { style: { display: "flex", justifyContent: "space-between", marginBottom: "8px" }, children: _jsx("span", { style: { fontSize: "14px", color: "var(--ocx-text-secondary)" }, children: label }) }), _jsxs("div", { style: { display: "flex", alignItems: "center", gap: "12px" }, children: [_jsxs("button", { onClick: onTokenClick, style: {
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            background: "var(--ocx-bg-elevated)",
                            border: "none",
                            borderRadius: "20px",
                            padding: "6px 12px",
                            cursor: "pointer",
                            fontSize: "14px",
                            fontWeight: 600,
                            color: "var(--ocx-text-primary)",
                        }, children: [token ? (_jsxs(_Fragment, { children: [token.logoURI && _jsx("img", { src: token.logoURI, alt: "", style: { width: "20px", height: "20px", borderRadius: "50%" } }), token.symbol] })) : "Select token", _jsx("span", { style: { fontSize: "10px" }, children: "\u25BC" })] }), _jsx("input", { type: "text", value: amount, onChange: (e) => onAmountChange(e.target.value), placeholder: "0.0", readOnly: readOnly, style: {
                            ...inputStyles(),
                            border: "none",
                            background: "transparent",
                            fontSize: "24px",
                            fontWeight: 600,
                            padding: "4px 0",
                            textAlign: "right",
                            width: "100%",
                        } })] })] }));
}
function RouteDisplay({ route }) {
    return (_jsxs("div", { style: { marginTop: "8px", fontSize: "12px", color: "var(--ocx-text-muted)" }, children: [_jsx("span", { style: { marginRight: "4px" }, children: "Route:" }), route.map((hop, i) => (_jsxs("span", { children: [i > 0 && _jsx("span", { style: { margin: "0 4px" }, children: "\u2192" }), _jsx("span", { style: { color: "var(--ocx-primary)" }, children: hop.protocol })] }, i)))] }));
}
function SlippageModal({ slippage, onSelect, onClose }) {
    return (_jsx("div", { style: {
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
            display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200,
        }, onClick: onClose, children: _jsxs("div", { style: { background: "var(--ocx-bg-base)", borderRadius: "16px", padding: "24px", minWidth: "300px" }, onClick: (e) => e.stopPropagation(), children: [_jsx("h3", { style: { margin: "0 0 16px", fontSize: "16px" }, children: "Slippage Tolerance" }), _jsx("div", { style: { display: "flex", gap: "8px", flexWrap: "wrap" }, children: slippage.presets.map((bps) => (_jsxs("button", { onClick: () => onSelect(bps), style: {
                            ...buttonStyles(slippage.slippageBps === bps && !slippage.autoSlippage ? "primary" : "secondary", "sm"),
                            minWidth: "60px",
                        }, children: [(bps / 100).toFixed(2), "%"] }, bps))) }), _jsx("button", { onClick: onClose, style: { ...buttonStyles("secondary", "md"), width: "100%", marginTop: "16px" }, children: "Done" })] }) }));
}
function TokenSelectionModal({ tokens, onSelect, onClose, selected }) {
    const [search, setSearch] = useState("");
    const filtered = tokens.filter((t) => t.symbol.toLowerCase().includes(search.toLowerCase()) ||
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.address.toLowerCase().includes(search.toLowerCase()));
    return (_jsx("div", { style: {
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
            display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200,
        }, onClick: onClose, children: _jsxs("div", { style: { background: "var(--ocx-bg-base)", borderRadius: "16px", padding: "24px", minWidth: "340px", maxHeight: "500px", overflow: "auto" }, onClick: (e) => e.stopPropagation(), children: [_jsx("h3", { style: { margin: "0 0 12px", fontSize: "16px" }, children: "Select Token" }), _jsx("input", { type: "text", value: search, onChange: (e) => setSearch(e.target.value), placeholder: "Search by name, symbol, or address", style: inputStyles() }), _jsxs("div", { style: { marginTop: "12px" }, children: [filtered.length === 0 && (_jsx("p", { style: { color: "var(--ocx-text-muted)", fontSize: "14px", textAlign: "center" }, children: "No tokens found" })), filtered.map((token) => (_jsxs("button", { onClick: () => onSelect(token), style: {
                                display: "flex", alignItems: "center", gap: "12px", width: "100%",
                                padding: "10px 12px", background: token.address === selected?.address ? "var(--ocx-bg-elevated)" : "transparent",
                                border: "none", borderRadius: "8px", cursor: "pointer", marginBottom: "4px",
                            }, children: [token.logoURI && _jsx("img", { src: token.logoURI, alt: "", style: { width: "32px", height: "32px", borderRadius: "50%" } }), _jsxs("div", { style: { textAlign: "left" }, children: [_jsx("div", { style: { fontWeight: 600, fontSize: "14px", color: "var(--ocx-text-primary)" }, children: token.symbol }), _jsx("div", { style: { fontSize: "12px", color: "var(--ocx-text-muted)" }, children: token.name })] })] }, token.address)))] }), _jsx("button", { onClick: onClose, style: { ...buttonStyles("secondary", "md"), width: "100%", marginTop: "12px" }, children: "Cancel" })] }) }));
}
function TransactionStatus({ receipt }) {
    return (_jsxs("div", { style: { marginTop: "12px", padding: "16px", background: "var(--ocx-success-bg)", borderRadius: "12px" }, children: [_jsxs("div", { style: { display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }, children: [_jsx("span", { style: { fontSize: "20px" }, children: "\u2705" }), _jsx("span", { style: { fontWeight: 600, color: "var(--ocx-success)" }, children: "Swap Successful" })] }), _jsxs("div", { style: { fontSize: "12px", color: "var(--ocx-text-secondary)" }, children: [_jsxs("div", { children: ["TX: ", receipt.txHash.slice(0, 10), "\u2026", receipt.txHash.slice(-8)] }), _jsxs("div", { children: ["Block: ", receipt.blockNumber.toString()] })] })] }));
}
// ── Helpers ────────────────────────────────────────────────
function formatAmount(wei, decimals) {
    const str = wei.toString();
    if (str.length <= decimals)
        return "0." + str.padStart(decimals, "0");
    const whole = str.slice(0, str.length - decimals);
    const frac = str.slice(str.length - decimals);
    return `${whole}.${frac}`;
}
function formatExchangeRate(quote) {
    if (quote.fromAmount === 0n)
        return "0";
    return (Number(quote.toAmount) / Number(quote.fromAmount)).toFixed(6);
}
function getSlippageColor(bps) {
    if (bps <= 25)
        return "#10B981";
    if (bps <= 100)
        return "#F59E0B";
    return "#EF4444";
}
//# sourceMappingURL=SwapWidget.js.map