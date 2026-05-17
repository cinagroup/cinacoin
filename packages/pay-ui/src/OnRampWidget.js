import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * OnRampWidget — React component for fiat-to-crypto on-ramping.
 *
 * Features:
 * - Fiat amount input
 * - Currency selection (USD, EUR, GBP, CNY, etc.)
 * - Provider comparison table
 * - Provider selection
 * - Provider redirect to complete purchase
 * - Transaction status display
 *
 * @example
 * ```tsx
 * <OnRampWidget
 *   destinationAddress={address}
 *   defaultFiatAmount={100}
 *   defaultFiatCurrency="USD"
 *   userRegion="US"
 *   theme="dark"
 *   onComplete={(result) => console.log(result.orderId)}
 * />
 * ```
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { OnRampWidgetCore } from "./OnRampWidgetCore.js";
import { getWidgetStyles, cardStyles, buttonStyles, inputStyles } from "./styles.js";
export { OnRampWidgetCore } from "./OnRampWidgetCore.js";
const FIAT_CURRENCIES = ["USD", "EUR", "GBP", "CNY", "JPY", "AUD", "CAD", "CHF", "HKD", "SGD"];
/**
 * OnRampWidget React component.
 *
 * Built with React + Web Components architecture.
 * The core logic is in OnRampWidgetCore (framework-agnostic).
 */
export function OnRampWidget(props) {
    const { defaultFiatAmount, defaultFiatCurrency = "USD", defaultCryptoToken = "ETH", destinationAddress, userRegion = "US", enabledProviders, theme = "light", primaryColor, onComplete, onError, className = "", } = props;
    // ── Core Controller ────────────────────────────────────
    const coreRef = useRef(null);
    if (!coreRef.current) {
        coreRef.current = new OnRampWidgetCore({
            params: {
                destinationAddress,
                defaultFiatAmount,
                defaultFiatCurrency,
                defaultCryptoToken,
                userRegion,
                enabledProviders,
                theme,
            },
            fetchQuotes: async (params) => {
                // Stub: integrate with OnRampAggregator in real usage
                throw new Error("No on-ramp aggregator configured");
            },
            redirectToProvider: async (quote) => {
                // Stub: open provider widget URL in real usage
                throw new Error("No provider redirect handler configured");
            },
        });
    }
    const [fiatAmount, setFiatAmount] = useState(defaultFiatAmount ?? 100);
    const [fiatCurrency, setFiatCurrency] = useState(defaultFiatCurrency);
    const [cryptoToken, setCryptoToken] = useState(defaultCryptoToken);
    const [quotes, setQuotes] = useState([]);
    const [selectedProvider, setSelectedProvider] = useState(null);
    const [state, setState] = useState(coreRef.current.state.state);
    const [error, setError] = useState(null);
    const [showCurrencyModal, setShowCurrencyModal] = useState(false);
    const [lastResult, setLastResult] = useState(null);
    const [showProviders, setShowProviders] = useState(false);
    // Sync core with React state
    useEffect(() => {
        coreRef.current?.setFiatAmount(fiatAmount);
    }, [fiatAmount]);
    useEffect(() => {
        coreRef.current?.setFiatCurrency(fiatCurrency);
    }, [fiatCurrency]);
    useEffect(() => {
        coreRef.current?.setCryptoToken(cryptoToken);
    }, [cryptoToken]);
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
            setSelectedProvider(s.selectedProvider);
            setLastResult(s.lastResult);
        });
        return unsubscribe;
    }, []);
    // ── Callbacks ──────────────────────────────────────────
    const handleFetchQuotes = useCallback(async () => {
        await coreRef.current?.fetchQuotes();
        setShowProviders(true);
    }, []);
    const handleSelectProvider = useCallback((provider) => {
        coreRef.current?.selectProvider(provider);
        setSelectedProvider(provider);
    }, []);
    const handleRedirect = useCallback(async () => {
        const result = await coreRef.current?.redirectToProvider();
        if (result) {
            onComplete?.(result);
        }
        else if (coreRef.current?.state.error) {
            onError?.(new Error(coreRef.current.state.error));
        }
    }, [onComplete, onError]);
    const handleReset = useCallback(() => {
        coreRef.current?.reset();
        setFiatAmount(defaultFiatAmount ?? 100);
        setFiatCurrency(defaultFiatCurrency);
        setCryptoToken(defaultCryptoToken);
        setQuotes([]);
        setSelectedProvider(null);
        setError(null);
        setLastResult(null);
        setShowProviders(false);
    }, [defaultFiatAmount, defaultFiatCurrency, defaultCryptoToken]);
    const handleCurrencySelect = useCallback((currency) => {
        setFiatCurrency(currency);
        setShowCurrencyModal(false);
    }, []);
    // ── Styles ─────────────────────────────────────────────
    const widgetCssVars = getWidgetStyles(theme, primaryColor);
    const cardCss = cardStyles();
    const selectedQuote = quotes.find((q) => q.provider === selectedProvider);
    // ── Render ─────────────────────────────────────────────
    return (_jsxs("div", { className: `ocx-onramp-widget ${className}`, style: { ...widgetCssVars, ...cardCss, maxWidth: "480px" }, children: [_jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }, children: [_jsx("h2", { style: { margin: 0, fontSize: "18px", fontWeight: 600, color: "var(--ocx-text-primary)" }, children: "Buy Crypto" }), _jsx("button", { style: { background: "none", border: "none", cursor: "pointer", fontSize: "20px", color: "var(--ocx-text-muted)" }, onClick: handleReset, title: "Reset", children: "\u21BB" })] }), _jsxs("div", { style: { background: "var(--ocx-bg-surface)", borderRadius: "12px", padding: "16px", marginBottom: "12px" }, children: [_jsx("div", { style: { display: "flex", justifyContent: "space-between", marginBottom: "8px" }, children: _jsx("span", { style: { fontSize: "14px", color: "var(--ocx-text-secondary)" }, children: "You pay" }) }), _jsxs("div", { style: { display: "flex", alignItems: "center", gap: "12px" }, children: [_jsxs("button", { onClick: () => setShowCurrencyModal(true), style: {
                                    display: "flex", alignItems: "center", gap: "6px",
                                    background: "var(--ocx-bg-elevated)", border: "none", borderRadius: "20px",
                                    padding: "6px 12px", cursor: "pointer", fontSize: "14px", fontWeight: 600,
                                    color: "var(--ocx-text-primary)",
                                }, children: [getCurrencySymbol(fiatCurrency), " ", fiatCurrency, _jsx("span", { style: { fontSize: "10px" }, children: "\u25BC" })] }), _jsx("input", { type: "number", value: fiatAmount, onChange: (e) => setFiatAmount(Number(e.target.value)), min: "0", step: "0.01", style: {
                                    ...inputStyles(), border: "none", background: "transparent",
                                    fontSize: "24px", fontWeight: 600, padding: "4px 0", textAlign: "right", width: "100%",
                                } })] })] }), _jsxs("div", { style: { background: "var(--ocx-bg-surface)", borderRadius: "12px", padding: "16px", marginBottom: "12px" }, children: [_jsx("div", { style: { display: "flex", justifyContent: "space-between", marginBottom: "8px" }, children: _jsx("span", { style: { fontSize: "14px", color: "var(--ocx-text-secondary)" }, children: "You receive" }) }), _jsxs("select", { value: cryptoToken, onChange: (e) => setCryptoToken(e.target.value), style: {
                            width: "100%", padding: "10px 12px", fontSize: "16px",
                            border: `1px solid var(--ocx-border)`, borderRadius: "8px",
                            background: "var(--ocx-bg-base)", color: "var(--ocx-text-primary)",
                            cursor: "pointer",
                        }, children: [_jsx("option", { value: "ETH", children: "ETH" }), _jsx("option", { value: "USDC", children: "USDC" }), _jsx("option", { value: "USDT", children: "USDT" }), _jsx("option", { value: "BTC", children: "BTC" }), _jsx("option", { value: "MATIC", children: "MATIC" })] })] }), showCurrencyModal && (_jsx("div", { style: {
                    position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
                    display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200,
                }, onClick: () => setShowCurrencyModal(false), children: _jsxs("div", { style: { background: "var(--ocx-bg-base)", borderRadius: "16px", padding: "24px", minWidth: "280px" }, onClick: (e) => e.stopPropagation(), children: [_jsx("h3", { style: { margin: "0 0 12px", fontSize: "16px" }, children: "Select Currency" }), FIAT_CURRENCIES.map((c) => (_jsxs("button", { onClick: () => handleCurrencySelect(c), style: {
                                display: "block", width: "100%", padding: "10px 12px", textAlign: "left",
                                background: c === fiatCurrency ? "var(--ocx-bg-elevated)" : "transparent",
                                border: "none", borderRadius: "8px", cursor: "pointer", marginBottom: "4px",
                                fontSize: "14px", color: "var(--ocx-text-primary)",
                            }, children: [getCurrencySymbol(c), " ", c] }, c))), _jsx("button", { onClick: () => setShowCurrencyModal(false), style: { ...buttonStyles("secondary", "md"), width: "100%", marginTop: "12px" }, children: "Cancel" })] }) })), !showProviders && (_jsx("button", { style: { ...buttonStyles("primary", "lg"), width: "100%" }, onClick: handleFetchQuotes, disabled: state === "fetching-quotes", children: state === "fetching-quotes" ? "Fetching quotes..." : "Get Quotes" })), showProviders && quotes.length > 0 && (_jsxs("div", { style: { marginTop: "12px" }, children: [_jsx("h3", { style: { fontSize: "14px", fontWeight: 600, color: "var(--ocx-text-primary)", marginBottom: "8px" }, children: "Compare Providers" }), quotes.map((quote) => (_jsx("div", { onClick: () => handleSelectProvider(quote.provider), style: {
                            padding: "12px",
                            borderRadius: "8px",
                            marginBottom: "8px",
                            border: `2px solid ${selectedProvider === quote.provider ? "var(--ocx-primary)" : "var(--ocx-border)"}`,
                            background: selectedProvider === quote.provider ? "var(--ocx-bg-elevated)" : "var(--ocx-bg-surface)",
                            cursor: "pointer",
                            transition: "border-color 150ms ease",
                        }, children: _jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [_jsxs("div", { children: [_jsx("span", { style: { fontWeight: 600, fontSize: "14px", color: "var(--ocx-text-primary)" }, children: quote.providerName }), quote.requiresKyc && (_jsx("span", { style: { marginLeft: "8px", fontSize: "11px", color: "var(--ocx-warning)", background: "var(--ocx-warning-bg)", padding: "2px 6px", borderRadius: "4px" }, children: "KYC" }))] }), _jsxs("div", { style: { textAlign: "right" }, children: [_jsxs("div", { style: { fontWeight: 600, fontSize: "14px", color: "var(--ocx-text-primary)" }, children: [quote.cryptoAmount.toFixed(6), " ", quote.cryptoToken] }), _jsxs("div", { style: { fontSize: "12px", color: "var(--ocx-text-muted)" }, children: ["Fee: ", quote.fees.totalFeePercent, "% \u00B7 ", quote.estimatedTime, "min"] })] })] }) }, quote.provider))), selectedQuote && (_jsxs("div", { style: { padding: "12px", background: "var(--ocx-bg-surface)", borderRadius: "8px", marginBottom: "12px" }, children: [_jsxs("div", { style: { display: "flex", justifyContent: "space-between", fontSize: "14px", marginBottom: "4px" }, children: [_jsx("span", { style: { color: "var(--ocx-text-secondary)" }, children: "Rate" }), _jsxs("span", { style: { color: "var(--ocx-text-primary)" }, children: ["1 ", fiatCurrency, " = ", (selectedQuote.cryptoAmount / selectedQuote.fiatAmount).toFixed(8), " ", cryptoToken] })] }), _jsxs("div", { style: { display: "flex", justifyContent: "space-between", fontSize: "14px" }, children: [_jsx("span", { style: { color: "var(--ocx-text-secondary)" }, children: "Total cost" }), _jsxs("span", { style: { color: "var(--ocx-text-primary)" }, children: [selectedQuote.totalCost.toFixed(2), " ", fiatCurrency] })] })] })), _jsx("button", { style: {
                            ...buttonStyles("primary", "lg"),
                            width: "100%",
                            ...(state === "redirecting" ? { opacity: 0.7 } : {}),
                        }, onClick: handleRedirect, disabled: state === "redirecting" || !selectedProvider, children: state === "redirecting" ? "Redirecting..." :
                            state === "completed" ? "Purchase Complete ✓" :
                                "Continue to Buy" })] })), error && (_jsx("div", { style: { marginTop: "12px", padding: "12px", background: "var(--ocx-error-bg)", borderRadius: "8px", color: "var(--ocx-error)", fontSize: "14px" }, children: error })), state === "completed" && lastResult && (_jsxs("div", { style: { marginTop: "12px", padding: "16px", background: "var(--ocx-success-bg)", borderRadius: "12px" }, children: [_jsxs("div", { style: { display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }, children: [_jsx("span", { style: { fontSize: "20px" }, children: "\u2705" }), _jsx("span", { style: { fontWeight: 600, color: "var(--ocx-success)" }, children: "Purchase Successful" })] }), lastResult.orderId && (_jsxs("div", { style: { fontSize: "12px", color: "var(--ocx-text-secondary)" }, children: ["Order: ", lastResult.orderId] })), lastResult.cryptoAmount && (_jsxs("div", { style: { fontSize: "12px", color: "var(--ocx-text-secondary)" }, children: ["Received: ", lastResult.cryptoAmount, " ", cryptoToken] }))] }))] }));
}
// ── Helpers ────────────────────────────────────────────────
function getCurrencySymbol(currency) {
    const symbols = {
        USD: "$", EUR: "€", GBP: "£", CNY: "¥", JPY: "¥",
        AUD: "A$", CAD: "C$", CHF: "Fr", HKD: "HK$", SGD: "S$",
    };
    return symbols[currency] || currency;
}
//# sourceMappingURL=OnRampWidget.js.map