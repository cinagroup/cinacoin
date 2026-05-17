import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useCallback } from 'react';
import { screenAddress } from '../screening.js';
/* ── colour helpers ────────────────────────────────────────────── */
const RISK_COLORS = {
    low: '#22c55e',
    medium: '#f59e0b',
    high: '#ef4444',
    sanctioned: '#991b1b',
};
const STATUS_COLORS = {
    verified: '#22c55e',
    pending: '#f59e0b',
    unverified: '#6b7280',
    flagged: '#ef4444',
    rejected: '#991b1b',
};
/* ── component ─────────────────────────────────────────────────── */
/**
 * Compliance status badge.
 *
 * Displays a colour-coded dot with the risk level.  Clicking opens a
 * detail popover showing the full screening result.
 */
export function KycBadge({ address, status: statusOverride, showScore = false, className, }) {
    const [result, setResult] = useState(null);
    const [open, setOpen] = useState(false);
    const label = statusOverride ?? result?.riskLevel ?? '…';
    const color = STATUS_COLORS[label] ?? RISK_COLORS[label] ?? '#6b7280';
    const handleClick = useCallback(() => {
        if (!result) {
            const r = screenAddress(address);
            setResult(r);
        }
        setOpen((prev) => !prev);
    }, [address, result]);
    // Dismiss on outside click (simple version)
    const handleDismiss = useCallback(() => setOpen(false), []);
    return (_jsxs("span", { className: className, style: { position: 'relative', display: 'inline-block' }, children: [_jsxs("button", { type: "button", onClick: handleClick, style: {
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 10px',
                    border: `1px solid ${color}`,
                    borderRadius: '9999px',
                    background: 'transparent',
                    color,
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    lineHeight: 1,
                    textTransform: 'capitalize',
                }, title: `Click for compliance details — ${address}`, children: [_jsx("span", { style: {
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: color,
                            display: 'inline-block',
                        } }), label, showScore && result != null && (_jsxs("span", { style: { opacity: 0.7, fontWeight: 400 }, children: ["/ ", result.riskScore] }))] }), open && result && (_jsxs("div", { role: "dialog", style: {
                    position: 'absolute',
                    top: '110%',
                    left: 0,
                    zIndex: 1000,
                    minWidth: '280px',
                    padding: '16px',
                    background: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                    fontSize: '13px',
                    color: '#111827',
                }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }, children: [_jsx("strong", { children: "Compliance Details" }), _jsx("button", { onClick: handleDismiss, style: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }, children: "\u2715" })] }), _jsx("div", { style: { fontFamily: 'monospace', fontSize: '11px', wordBreak: 'break-all', marginBottom: '8px' }, children: address }), _jsx("table", { style: { width: '100%', borderCollapse: 'collapse' }, children: _jsxs("tbody", { children: [_jsxs("tr", { children: [_jsx("td", { style: { padding: '2px 0', color: '#6b7280' }, children: "Risk Level" }), _jsx("td", { style: { padding: '2px 0', textTransform: 'capitalize', fontWeight: 600, color }, children: label })] }), _jsxs("tr", { children: [_jsx("td", { style: { padding: '2px 0', color: '#6b7280' }, children: "Risk Score" }), _jsxs("td", { style: { padding: '2px 0' }, children: [result.riskScore, " / 100"] })] }), _jsxs("tr", { children: [_jsx("td", { style: { padding: '2px 0', color: '#6b7280' }, children: "Sanctioned" }), _jsx("td", { style: { padding: '2px 0' }, children: result.isSanctioned ? '⚠️ Yes' : 'No' })] }), _jsxs("tr", { children: [_jsx("td", { style: { padding: '2px 0', color: '#6b7280' }, children: "Matched Lists" }), _jsx("td", { style: { padding: '2px 0' }, children: result.matchedLists.length > 0 ? result.matchedLists.join(', ') : '—' })] })] }) }), _jsxs("div", { style: { marginTop: '8px', fontSize: '11px', color: '#9ca3af' }, children: ["Screened at: ", new Date(result.screenedAt).toLocaleString()] })] }))] }));
}
//# sourceMappingURL=KycBadge.js.map