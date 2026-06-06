import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useCallback } from 'react';
/* ── helper ────────────────────────────────────────────────────── */
const STATUS_LABELS = {
    upload: 'Upload Documents',
    submitted: 'Submitted',
    under_review: 'Under Review',
    verified: 'Verified ✅',
    rejected: 'Rejected ❌',
};
const STATUS_COLORS = {
    upload: '#6b7280',
    submitted: '#3b82f6',
    under_review: '#f59e0b',
    verified: '#22c55e',
    rejected: '#ef4444',
};
/* ── component ─────────────────────────────────────────────────── */
/**
 * KYC verification modal.
 *
 * Guides the user through document upload for identity verification.
 * Integrates with external KYC providers (SumSub, Onfido, Veriff).
 *
 * @example
 * ```tsx
 * <KycModal
 *   open={showKyc}
 *   onClose={() => setShowKyc(false)}
 *   userId={walletAddress}
 *   onSubmit={(payload) => sendToSumSub(payload)}
 * />
 * ```
 */
export function KycModal({ open, onClose, userId, onSubmit, currentStatus, }) {
    const [stage, setStage] = useState(currentStatus === 'verified'
        ? 'verified'
        : currentStatus === 'rejected'
            ? 'rejected'
            : currentStatus === 'flagged'
                ? 'under_review'
                : currentStatus === 'pending'
                    ? 'submitted'
                    : 'upload');
    // Uploaded files
    const [idFront, setIdFront] = useState(null);
    const [idBack, setIdBack] = useState(null);
    const [proof, setProof] = useState(null);
    const [selfie, setSelfie] = useState(null);
    const handleFile = useCallback((setter) => (e) => {
        const file = e.target.files?.[0] ?? null;
        setter(file);
    }, []);
    const handleSubmit = useCallback(() => {
        const payload = {
            userId,
            idDocumentFront: idFront ?? undefined,
            idDocumentBack: idBack ?? undefined,
            proofOfAddress: proof ?? undefined,
            selfie: selfie ?? undefined,
        };
        onSubmit(payload);
        setStage('submitted');
    }, [userId, idFront, idBack, proof, selfie, onSubmit]);
    const allRequired = idFront && proof; // Minimum: ID front + proof of address
    if (!open)
        return null;
    /* ── render stages ─────────────────────────────────────────── */
    if (stage === 'verified' || stage === 'rejected') {
        return (_jsx(ModalShell, { title: "KYC Status", onClose: onClose, children: _jsxs("div", { style: { textAlign: 'center', padding: '24px 0' }, children: [_jsx("div", { style: {
                            fontSize: '48px',
                            marginBottom: '12px',
                            color: STATUS_COLORS[stage],
                        }, children: stage === 'verified' ? '✅' : '❌' }), _jsx("p", { style: { fontSize: '16px', fontWeight: 600, marginBottom: '8px' }, children: STATUS_LABELS[stage] }), _jsx("p", { style: { fontSize: '13px', color: '#6b7280' }, children: stage === 'verified'
                            ? 'Your identity has been verified. You can transact freely.'
                            : 'Verification was not successful. Please contact support for next steps.' })] }) }));
    }
    if (stage === 'submitted' || stage === 'under_review') {
        return (_jsx(ModalShell, { title: "KYC Status", onClose: onClose, children: _jsxs("div", { style: { textAlign: 'center', padding: '24px 0' }, children: [_jsx("div", { style: {
                            fontSize: '48px',
                            marginBottom: '12px',
                            color: STATUS_COLORS[stage],
                        }, children: stage === 'submitted' ? '📤' : '🔍' }), _jsx("p", { style: { fontSize: '16px', fontWeight: 600, marginBottom: '8px' }, children: STATUS_LABELS[stage] }), _jsx("p", { style: { fontSize: '13px', color: '#6b7280' }, children: stage === 'submitted'
                            ? 'Documents submitted successfully. We will review them shortly.'
                            : 'Your documents are under review. This typically takes 1–3 business days.' })] }) }));
    }
    /* ── Upload stage ──────────────────────────────────────────── */
    return (_jsx(ModalShell, { title: "KYC Verification", onClose: onClose, children: _jsxs("div", { style: { padding: '16px 0' }, children: [_jsx("p", { style: { fontSize: '13px', color: '#6b7280', marginBottom: '16px' }, children: "Please upload the documents below to verify your identity. We partner with SumSub / Onfido to process your verification securely." }), _jsx("div", { style: { display: 'flex', gap: '4px', marginBottom: '20px' }, children: ['upload', 'submitted', 'under_review', 'verified'].map((s, i) => (_jsx("div", { style: {
                            flex: 1,
                            height: '4px',
                            borderRadius: '2px',
                            background: i === 0 ? STATUS_COLORS.upload : '#e5e7eb',
                        } }, s))) }), _jsx(FileField, { label: "ID Document (Front) *", file: idFront, onChange: handleFile(setIdFront), accept: "image/*,.pdf" }), _jsx(FileField, { label: "ID Document (Back)", file: idBack, onChange: handleFile(setIdBack), accept: "image/*,.pdf" }), _jsx(FileField, { label: "Proof of Address *", file: proof, onChange: handleFile(setProof), accept: "image/*,.pdf" }), _jsx(FileField, { label: "Selfie / Liveness Photo", file: selfie, onChange: handleFile(setSelfie), accept: "image/*" }), _jsx("button", { type: "button", onClick: handleSubmit, disabled: !allRequired, style: {
                        marginTop: '20px',
                        width: '100%',
                        padding: '10px',
                        background: allRequired ? '#3b82f6' : '#9ca3af',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: 600,
                        cursor: allRequired ? 'pointer' : 'not-allowed',
                    }, children: "Submit for Verification" }), _jsx("p", { style: { fontSize: '11px', color: '#9ca3af', marginTop: '12px', textAlign: 'center' }, children: "Powered by SumSub / Onfido. Your data is encrypted and processed in compliance with GDPR." })] }) }));
}
function ModalShell({ title, onClose, children }) {
    return (_jsx("div", { style: {
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.4)',
        }, onClick: onClose, children: _jsxs("div", { role: "dialog", "aria-modal": "true", "aria-label": title, onClick: (e) => e.stopPropagation(), style: {
                background: '#fff',
                borderRadius: '12px',
                width: 'min(480px, 90vw)',
                maxHeight: '85vh',
                overflowY: 'auto',
                boxShadow: '0 8px 32px rgba(0,0,0,0.16)',
            }, children: [_jsxs("div", { style: {
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '16px 20px',
                        borderBottom: '1px solid #e5e7eb',
                    }, children: [_jsx("h2", { style: { margin: 0, fontSize: '18px', fontWeight: 700 }, children: title }), _jsx("button", { onClick: onClose, style: {
                                background: 'none',
                                border: 'none',
                                fontSize: '20px',
                                cursor: 'pointer',
                                color: '#6b7280',
                            }, children: "\u2715" })] }), _jsx("div", { style: { padding: '0 20px 20px' }, children: children })] }) }));
}
function FileField({ label, file, onChange, accept }) {
    return (_jsxs("div", { style: { marginBottom: '14px' }, children: [_jsx("label", { style: { display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }, children: label }), _jsxs("label", { style: {
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 12px',
                    border: '1px dashed #d1d5db',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    color: file ? '#111827' : '#6b7280',
                    background: file ? '#f0fdf4' : '#f9fafb',
                }, children: [_jsx("span", { children: file ? `📎 ${file.name}` : '📁 Choose file…' }), _jsx("input", { type: "file", accept: accept, onChange: onChange, style: { display: 'none' } })] })] }));
}
//# sourceMappingURL=KycModal.js.map