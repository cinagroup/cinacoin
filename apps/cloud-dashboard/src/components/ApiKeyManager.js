'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
const mockKeys = [
    { id: 'key_1', label: 'Production Key', permissions: 'read,write', isActive: true, createdAt: '2025-01-01', lastUsedAt: '2025-01-15' },
    { id: 'key_2', label: 'Testing Key', permissions: 'read', isActive: true, createdAt: '2025-01-05', lastUsedAt: '2025-01-14' },
    { id: 'key_3', label: 'Deprecated', permissions: 'read,write', isActive: false, createdAt: '2024-12-01', lastUsedAt: '2025-01-01' },
];
export function ApiKeyManager({ projectId }) {
    const [keys, setKeys] = useState(mockKeys);
    const [newKey, setNewKey] = useState('');
    const [showNewKey, setShowNewKey] = useState('');
    const generateKey = () => {
        const key = 'ck_' + Array.from(crypto.getRandomValues(new Uint8Array(32)))
            .map((b) => b.toString(16).padStart(2, '0')).join('');
        setNewKey(key);
        setShowNewKey(key);
    };
    const revokeKey = (id) => {
        setKeys(keys.map((k) => k.id === id ? { ...k, isActive: false } : k));
        setShowNewKey('');
    };
    return (_jsxs("div", { className: "space-y-4", children: [_jsx("div", { className: "flex items-center gap-3", children: _jsx("button", { onClick: generateKey, className: "rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-500", children: "Generate API Key" }) }), showNewKey && (_jsxs("div", { className: "rounded-lg border border-emerald-800 bg-emerald-950/30 p-4", children: [_jsx("p", { className: "mb-2 text-sm font-medium text-emerald-400", children: "New API Key Generated" }), _jsx("code", { className: "block rounded bg-dark-900 px-3 py-2 text-sm font-mono text-white break-all", children: showNewKey }), _jsx("p", { className: "mt-2 text-xs text-slate-400", children: "Save this key now. It won't be shown again." })] })), _jsx("div", { className: "space-y-2", children: keys.map((key) => (_jsxs("div", { className: `flex items-center justify-between rounded-lg border p-4 transition ${key.isActive ? 'border-dark-800 bg-dark-900' : 'border-dark-800/50 bg-dark-950/50 opacity-60'}`, children: [_jsxs("div", { children: [_jsx("div", { className: "text-sm font-medium text-white", children: key.label }), _jsxs("div", { className: "mt-0.5 text-xs text-slate-400", children: [key.permissions, " \u2022 Created ", key.createdAt, key.lastUsedAt && ` • Last used ${key.lastUsedAt}`] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: `rounded-full px-2 py-0.5 text-xs font-medium ${key.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`, children: key.isActive ? 'Active' : 'Revoked' }), key.isActive && (_jsx("button", { onClick: () => revokeKey(key.id), className: "rounded-md px-3 py-1 text-xs font-medium text-red-400 transition hover:bg-red-500/20 hover:text-red-300", children: "Revoke" }))] })] }, key.id))) })] }));
}
//# sourceMappingURL=ApiKeyManager.js.map