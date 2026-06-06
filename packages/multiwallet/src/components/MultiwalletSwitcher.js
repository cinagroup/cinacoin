import { jsxs as _jsxs, jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useState, useCallback } from "react";
import { useMultiwallet } from "../hooks/useMultiwallet.js";
/**
 * React component that displays connected wallets grouped by namespace
 * and allows switching between them or adding/removing connections.
 *
 * @example
 * ```tsx
 * <MultiwalletSwitcher
 *   namespaces={["eip155", "solana"]}
 *   className="my-switcher"
 * />
 * ```
 */
export function MultiwalletSwitcher({ className, namespaces, renderWallet, }) {
    const { connections, activeConnection, setActiveConnection, removeConnection, } = useMultiwallet();
    const [expandedNs, setExpandedNs] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const filteredNamespaces = namespaces ?? ["eip155", "solana", "bip122"];
    const handleToggle = useCallback((ns) => {
        setExpandedNs((prev) => (prev === ns ? null : ns));
    }, []);
    const handleActivate = useCallback((walletId, namespace) => {
        setActiveConnection(walletId, namespace);
    }, [setActiveConnection]);
    const handleRemove = useCallback((walletId, namespace) => {
        removeConnection(walletId, namespace);
    }, [removeConnection]);
    const totalActive = Object.values(connections).flat().filter((c) => c.isActive).length;
    return (_jsxs("div", { className: `multiwallet-switcher ${className ?? ""}`.trim(), children: [_jsxs("div", { style: styles.header, children: [_jsxs("h3", { style: styles.headerTitle, children: ["Wallets", totalActive > 0 && (_jsxs("span", { style: styles.badge, children: [totalActive, " active"] }))] }), _jsx("button", { style: styles.addButton, onClick: () => setShowAddModal(true), "aria-label": "Add wallet connection", children: "+ Add" })] }), filteredNamespaces.map((ns) => {
                const conns = connections[ns] ?? [];
                if (conns.length === 0)
                    return null;
                const isExpanded = expandedNs === ns;
                return (_jsxs("div", { style: styles.namespaceGroup, children: [_jsxs("button", { style: styles.namespaceHeader, onClick: () => handleToggle(ns), "aria-expanded": isExpanded, children: [_jsx("span", { style: styles.namespaceLabel, children: getNamespaceLabel(ns) }), _jsxs("span", { style: styles.namespaceCount, children: [conns.length, " ", conns.length === 1 ? "wallet" : "wallets"] }), _jsx("span", { style: styles.chevron, children: isExpanded ? "▾" : "▸" })] }), isExpanded && (_jsx("div", { style: styles.walletList, children: conns.map((wallet) => (_jsx("div", { style: {
                                    ...styles.walletItem,
                                    ...(wallet.isActive ? styles.walletItemActive : {}),
                                }, children: renderWallet ? (renderWallet({
                                    walletId: wallet.walletId,
                                    walletName: wallet.walletName,
                                    address: wallet.address,
                                    namespace: wallet.namespace,
                                    isActive: wallet.isActive,
                                    icon: wallet.icon,
                                })) : (_jsx(DefaultWalletRow, { wallet: wallet, onActivate: () => handleActivate(wallet.walletId, wallet.namespace), onRemove: () => handleRemove(wallet.walletId, wallet.namespace) })) }, wallet.walletId))) }))] }, ns));
            }), filteredNamespaces.every((ns) => (connections[ns] ?? []).length === 0) && (_jsxs("div", { style: styles.emptyState, children: [_jsx("p", { children: "No wallets connected" }), _jsx("button", { style: styles.addButton, onClick: () => setShowAddModal(true), children: "Connect a wallet" })] })), showAddModal && (_jsx(AddConnectionModal, { onClose: () => setShowAddModal(false) }))] }));
}
function DefaultWalletRow({ wallet, onActivate, onRemove, }) {
    const shortAddress = wallet.address
        ? `${wallet.address.slice(0, 6)}…${wallet.address.slice(-4)}`
        : "";
    return (_jsxs(_Fragment, { children: [_jsxs("div", { style: styles.walletInfo, children: [wallet.icon && _jsx("img", { src: wallet.icon, alt: "", style: styles.walletIcon }), _jsxs("div", { children: [_jsx("div", { style: styles.walletName, children: wallet.walletName }), shortAddress && (_jsx("div", { style: styles.walletAddress, children: shortAddress }))] })] }), _jsxs("div", { style: styles.walletActions, children: [wallet.isActive ? (_jsx("span", { style: styles.activeIndicator, children: "\u25CF Active" })) : (_jsx("button", { style: styles.switchButton, onClick: onActivate, children: "Switch" })), _jsx("button", { style: styles.removeButton, onClick: onRemove, "aria-label": `Remove ${wallet.walletName}`, children: "\u2715" })] })] }));
}
/** Simple modal for adding a new connection (placeholder for integration). */
function AddConnectionModal({ onClose }) {
    const { addConnection } = useMultiwallet();
    const [walletId, setWalletId] = useState("");
    const [namespace, setNamespace] = useState("eip155");
    const [address, setAddress] = useState("");
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!walletId)
            return;
        addConnection(walletId, walletId, namespace, address);
        onClose();
    };
    return (_jsx("div", { style: styles.modalOverlay, onClick: onClose, children: _jsxs("div", { style: styles.modal, onClick: (e) => e.stopPropagation(), children: [_jsx("h3", { style: { margin: "0 0 16px" }, children: "Add Wallet Connection" }), _jsxs("form", { onSubmit: handleSubmit, style: styles.form, children: [_jsxs("label", { style: styles.label, children: ["Wallet ID", _jsx("input", { style: styles.input, value: walletId, onChange: (e) => setWalletId(e.target.value), placeholder: "e.g. metamask", required: true })] }), _jsxs("label", { style: styles.label, children: ["Namespace", _jsxs("select", { style: styles.input, value: namespace, onChange: (e) => setNamespace(e.target.value), children: [_jsx("option", { value: "eip155", children: "EVM (eip155)" }), _jsx("option", { value: "solana", children: "Solana" }), _jsx("option", { value: "bip122", children: "Bitcoin (bip122)" })] })] }), _jsxs("label", { style: styles.label, children: ["Address (optional)", _jsx("input", { style: styles.input, value: address, onChange: (e) => setAddress(e.target.value), placeholder: "0x..." })] }), _jsxs("div", { style: styles.formActions, children: [_jsx("button", { type: "button", style: styles.cancelButton, onClick: onClose, children: "Cancel" }), _jsx("button", { type: "submit", style: styles.submitButton, children: "Connect" })] })] })] }) }));
}
// ─── Helpers ─────────────────────────────────────────────────────
function getNamespaceLabel(ns) {
    const labels = {
        eip155: "EVM",
        solana: "Solana",
        bip122: "Bitcoin",
    };
    return labels[ns] ?? ns;
}
// ─── Inline Styles ───────────────────────────────────────────────
const styles = {
    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "12px 16px",
        borderBottom: "1px solid #e5e7eb",
    },
    headerTitle: {
        margin: 0,
        fontSize: "16px",
        fontWeight: 600,
        display: "flex",
        alignItems: "center",
        gap: "8px",
    },
    badge: {
        fontSize: "11px",
        fontWeight: 500,
        background: "#dcfce7",
        color: "#166534",
        padding: "2px 8px",
        borderRadius: "9999px",
    },
    addButton: {
        padding: "6px 12px",
        fontSize: "13px",
        fontWeight: 500,
        background: "#3b82f6",
        color: "#fff",
        border: "none",
        borderRadius: "6px",
        cursor: "pointer",
    },
    namespaceGroup: {
        borderBottom: "1px solid #f3f4f6",
    },
    namespaceHeader: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        padding: "10px 16px",
        background: "transparent",
        border: "none",
        cursor: "pointer",
        fontSize: "14px",
    },
    namespaceLabel: {
        fontWeight: 600,
        color: "#374151",
    },
    namespaceCount: {
        fontSize: "12px",
        color: "#6b7280",
    },
    chevron: {
        fontSize: "12px",
        color: "#9ca3af",
        marginLeft: "8px",
    },
    walletList: {
        padding: "0 16px 8px",
    },
    walletItem: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "8px 12px",
        borderRadius: "8px",
        marginBottom: "4px",
        background: "#f9fafb",
    },
    walletItemActive: {
        background: "#eff6ff",
        border: "1px solid #bfdbfe",
    },
    walletInfo: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
    },
    walletIcon: {
        width: "24px",
        height: "24px",
        borderRadius: "6px",
    },
    walletName: {
        fontSize: "14px",
        fontWeight: 500,
        color: "#111827",
    },
    walletAddress: {
        fontSize: "12px",
        color: "#6b7280",
        fontFamily: "monospace",
    },
    walletActions: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
    },
    activeIndicator: {
        fontSize: "12px",
        fontWeight: 500,
        color: "#16a34a",
    },
    switchButton: {
        padding: "4px 10px",
        fontSize: "12px",
        background: "#e0e7ff",
        color: "#3730a3",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer",
    },
    removeButton: {
        padding: "4px 8px",
        fontSize: "12px",
        background: "transparent",
        color: "#9ca3af",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer",
    },
    emptyState: {
        padding: "32px 16px",
        textAlign: "center",
        color: "#6b7280",
        fontSize: "14px",
    },
    modalOverlay: {
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
    },
    modal: {
        background: "#fff",
        borderRadius: "12px",
        padding: "24px",
        width: "100%",
        maxWidth: "400px",
        boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
    },
    form: {
        display: "flex",
        flexDirection: "column",
        gap: "12px",
    },
    label: {
        display: "flex",
        flexDirection: "column",
        gap: "4px",
        fontSize: "13px",
        fontWeight: 500,
        color: "#374151",
    },
    input: {
        padding: "8px 10px",
        fontSize: "14px",
        border: "1px solid #d1d5db",
        borderRadius: "6px",
        outline: "none",
    },
    formActions: {
        display: "flex",
        justifyContent: "flex-end",
        gap: "8px",
        marginTop: "8px",
    },
    cancelButton: {
        padding: "8px 16px",
        fontSize: "14px",
        background: "#f3f4f6",
        border: "none",
        borderRadius: "6px",
        cursor: "pointer",
    },
    submitButton: {
        padding: "8px 16px",
        fontSize: "14px",
        fontWeight: 500,
        background: "#3b82f6",
        color: "#fff",
        border: "none",
        borderRadius: "6px",
        cursor: "pointer",
    },
};
//# sourceMappingURL=MultiwalletSwitcher.js.map