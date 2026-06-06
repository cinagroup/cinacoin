import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useMemo, useCallback } from "react";
import { DepositStatus, } from "../types";
import { useDeposit } from "../hooks/useDeposit";
import { useAvailableExchanges } from "../hooks/useAvailableExchanges";
// ── Styles (inline for portability; replace with your design system) ────
const styles = {
    overlay: {
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
    },
    modal: {
        background: "#1a1a2e",
        borderRadius: 16,
        padding: 24,
        width: "100%",
        maxWidth: 480,
        maxHeight: "90vh",
        overflowY: "auto",
        color: "#e0e0e0",
        fontFamily: "system-ui, -apple-system, sans-serif",
    },
    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
    },
    title: { margin: 0, fontSize: 20, fontWeight: 700 },
    closeBtn: {
        background: "none",
        border: "none",
        color: "#888",
        fontSize: 24,
        cursor: "pointer",
        padding: "4px 8px",
    },
    label: {
        display: "block",
        fontSize: 13,
        color: "#aaa",
        marginBottom: 6,
        marginTop: 16,
    },
    select: {
        width: "100%",
        padding: "10px 12px",
        borderRadius: 8,
        border: "1px solid #333",
        background: "#16213e",
        color: "#e0e0e0",
        fontSize: 14,
    },
    input: {
        width: "100%",
        padding: "10px 12px",
        borderRadius: 8,
        border: "1px solid #333",
        background: "#16213e",
        color: "#e0e0e0",
        fontSize: 14,
        boxSizing: "border-box",
    },
    exchangeOption: {
        display: "flex",
        alignItems: "center",
        gap: 10,
    },
    logo: {
        width: 24,
        height: 24,
        borderRadius: 4,
        objectFit: "contain",
    },
    primaryBtn: {
        width: "100%",
        padding: "12px 16px",
        borderRadius: 8,
        border: "none",
        background: "#0f3460",
        color: "#fff",
        fontSize: 15,
        fontWeight: 600,
        cursor: "pointer",
        marginTop: 24,
    },
    primaryBtnDisabled: {
        opacity: 0.5,
        cursor: "not-allowed",
    },
    statusBadge: {
        display: "inline-block",
        padding: "4px 12px",
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 600,
        textTransform: "uppercase",
    },
    errorText: { color: "#ff6b6b", fontSize: 13, marginTop: 8 },
    redirectNote: {
        background: "#16213e",
        borderRadius: 8,
        padding: 12,
        marginTop: 16,
        fontSize: 13,
        color: "#aaa",
        textAlign: "center",
    },
};
const statusColors = {
    pending: "#f0ad4e",
    processing: "#5bc0de",
    completed: "#5cb85c",
    failed: "#d9534f",
};
/**
 * DepositModal — full deposit flow UI.
 *
 * Steps:
 * 1. Select exchange
 * 2. Select asset & network
 * 3. Enter amount
 * 4. Redirect to exchange
 * 5. Track status
 */
export const DepositModal = ({ isOpen, onClose, receivingAddress, networkFilter, onDepositInitiated, }) => {
    const { isLoading, deposit, error, initiateDeposit, reset, } = useDeposit();
    const { exchanges } = useAvailableExchanges({
        network: networkFilter,
        address: receivingAddress,
    });
    // Step state
    const [selectedExchangeId, setSelectedExchangeId] = useState("");
    const [selectedAsset, setSelectedAsset] = useState("");
    const [selectedNetwork, setSelectedNetwork] = useState("");
    const [amount, setAmount] = useState("");
    const [redirected, setRedirected] = useState(false);
    const selectedExchange = useMemo(() => exchanges.find((e) => e.id === selectedExchangeId), [exchanges, selectedExchangeId]);
    const availableAssets = useMemo(() => selectedExchange?.supportedAssets ?? [], [selectedExchange]);
    const selectedAssetInfo = useMemo(() => availableAssets.find((a) => a.symbol === selectedAsset), [availableAssets, selectedAsset]);
    const availableNetworks = useMemo(() => selectedAssetInfo?.networks.filter((n) => n.available) ?? [], [selectedAssetInfo]);
    // Reset sub-selections when exchange changes
    const handleExchangeChange = useCallback((id) => {
        setSelectedExchangeId(id);
        setSelectedAsset("");
        setSelectedNetwork("");
        setRedirected(false);
    }, []);
    const handleAssetChange = useCallback((symbol) => {
        setSelectedAsset(symbol);
        setSelectedNetwork("");
        setRedirected(false);
    }, []);
    const handleConfirm = useCallback(async () => {
        if (!selectedExchangeId || !selectedAsset || !selectedNetwork || !amount)
            return;
        try {
            const request = {
                exchangeId: selectedExchangeId,
                asset: selectedAsset,
                network: selectedNetwork,
                amount: parseFloat(amount),
                receivingAddress,
            };
            const result = await initiateDeposit(request);
            onDepositInitiated?.(result);
            setRedirected(true);
            // Open exchange deposit page
            if (result.depositUrl) {
                window.open(result.depositUrl, "_blank", "noopener,noreferrer");
            }
        }
        catch {
            // Error is captured in hook state
        }
    }, [
        selectedExchangeId,
        selectedAsset,
        selectedNetwork,
        amount,
        receivingAddress,
        initiateDeposit,
        onDepositInitiated,
    ]);
    const handleBack = useCallback(() => {
        reset();
        setRedirected(false);
        setSelectedExchangeId("");
        setSelectedAsset("");
        setSelectedNetwork("");
        setAmount("");
    }, [reset]);
    // ── Render ───────────────────────────────────────────────────────────
    if (!isOpen)
        return null;
    // ── Status tracking view ──
    if (redirected && deposit) {
        return (_jsx("div", { style: styles.overlay, onClick: onClose, children: _jsxs("div", { style: styles.modal, onClick: (e) => e.stopPropagation(), children: [_jsxs("div", { style: styles.header, children: [_jsx("h2", { style: styles.title, children: "Deposit Status" }), _jsx("button", { style: styles.closeBtn, onClick: onClose, "aria-label": "Close", children: "\u00D7" })] }), _jsx("div", { style: { textAlign: "center", padding: "20px 0" }, children: _jsx("span", { style: {
                                ...styles.statusBadge,
                                background: statusColors[deposit.status] + "33",
                                color: statusColors[deposit.status],
                            }, children: deposit.status }) }), _jsxs("div", { style: { fontSize: 13, color: "#aaa", lineHeight: 1.8 }, children: [_jsxs("p", { style: { margin: "4px 0" }, children: [_jsx("strong", { children: "Exchange:" }), " ", deposit.exchangeId] }), _jsxs("p", { style: { margin: "4px 0" }, children: [_jsx("strong", { children: "Asset:" }), " ", deposit.asset] }), _jsxs("p", { style: { margin: "4px 0" }, children: [_jsx("strong", { children: "Network:" }), " ", deposit.network] }), _jsxs("p", { style: { margin: "4px 0" }, children: [_jsx("strong", { children: "Amount:" }), " ", deposit.amount] }), _jsxs("p", { style: { margin: "4px 0" }, children: [_jsx("strong", { children: "Deposit ID:" }), " ", deposit.depositId] })] }), deposit.status === DepositStatus.FAILED && deposit.error && (_jsx("p", { style: styles.errorText, children: deposit.error })), deposit.status === DepositStatus.COMPLETED && (_jsx("p", { style: { color: "#5cb85c", textAlign: "center", marginTop: 16 }, children: "\u2705 Deposit confirmed!" })), deposit.status === DepositStatus.PROCESSING && (_jsxs("div", { style: styles.redirectNote, children: ["\u23F3 Waiting for exchange confirmation...", _jsx("br", {}), _jsx("span", { style: { fontSize: 11 }, children: "This may take a few minutes depending on network congestion." })] })), error && _jsx("p", { style: styles.errorText, children: error.message }), _jsx("button", { style: styles.primaryBtn, onClick: handleBack, disabled: isLoading, children: isLoading ? "Loading..." : deposit.status === DepositStatus.COMPLETED ? "Done" : "New Deposit" })] }) }));
    }
    // ── Deposit form view ──
    const isFormValid = selectedExchangeId && selectedAsset && selectedNetwork && parseFloat(amount) > 0;
    return (_jsx("div", { style: styles.overlay, onClick: onClose, children: _jsxs("div", { style: styles.modal, onClick: (e) => e.stopPropagation(), children: [_jsxs("div", { style: styles.header, children: [_jsx("h2", { style: styles.title, children: "Deposit" }), _jsx("button", { style: styles.closeBtn, onClick: onClose, "aria-label": "Close", children: "\u00D7" })] }), _jsx("label", { style: styles.label, children: "Exchange" }), _jsxs("select", { style: styles.select, value: selectedExchangeId, onChange: (e) => handleExchangeChange(e.target.value), children: [_jsx("option", { value: "", children: "Select exchange\u2026" }), exchanges.map((ex) => (_jsx("option", { value: ex.id, children: ex.name }, ex.id)))] }), selectedExchange && (_jsxs(_Fragment, { children: [_jsx("label", { style: styles.label, children: "Asset" }), _jsxs("select", { style: styles.select, value: selectedAsset, onChange: (e) => handleAssetChange(e.target.value), disabled: !selectedExchangeId, children: [_jsx("option", { value: "", children: "Select asset\u2026" }), availableAssets.map((asset) => (_jsxs("option", { value: asset.symbol, children: [asset.symbol, " \u2014 ", asset.name] }, asset.symbol)))] })] })), selectedAssetInfo && (_jsxs(_Fragment, { children: [_jsx("label", { style: styles.label, children: "Network" }), _jsxs("select", { style: styles.select, value: selectedNetwork, onChange: (e) => setSelectedNetwork(e.target.value), children: [_jsx("option", { value: "", children: "Select network\u2026" }), availableNetworks.map((net) => (_jsxs("option", { value: net.id, children: [net.name, net.chainId ? ` (Chain ID: ${net.chainId})` : ""] }, net.id)))] })] })), selectedNetwork && (_jsxs(_Fragment, { children: [_jsx("label", { style: styles.label, children: "Amount" }), _jsx("input", { type: "number", style: styles.input, placeholder: `Min ${selectedExchange?.minAmount ?? 0}`, value: amount, onChange: (e) => setAmount(e.target.value), min: selectedExchange?.minAmount ?? 0, step: "any" })] })), error && _jsx("p", { style: styles.errorText, children: error.message }), _jsx("button", { style: {
                        ...styles.primaryBtn,
                        ...(!isFormValid ? styles.primaryBtnDisabled : {}),
                    }, onClick: handleConfirm, disabled: !isFormValid || isLoading, children: isLoading ? "Processing…" : "Continue to Exchange" })] }) }));
};
//# sourceMappingURL=DepositModal.js.map