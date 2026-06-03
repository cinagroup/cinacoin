'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
export function ProjectForm() {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        ownerAddress: '',
        websiteUrl: '',
        redirectUris: '',
    });
    const [loading, setLoading] = useState(false);
    const [created, setCreated] = useState(null);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        // Simulate API call
        await new Promise((r) => setTimeout(r, 500));
        const id = crypto.randomUUID();
        setCreated(id);
        setLoading(false);
    };
    if (created) {
        return (_jsxs("div", { className: "space-y-4 text-center", children: [_jsx("div", { className: "mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20", children: _jsx("svg", { className: "h-6 w-6 text-emerald-400", fill: "none", stroke: "currentColor", strokeWidth: "2", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M5 13l4 4L19 7" }) }) }), _jsx("h3", { className: "text-lg font-semibold text-white", children: "Project Created!" }), _jsx("p", { className: "text-sm text-slate-400", children: "Your project has been created successfully." }), _jsxs("div", { className: "flex items-center justify-center gap-3", children: [_jsx("a", { href: "/projects", className: "rounded-lg border border-dark-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-dark-800", children: "Back to Projects" }), _jsx("a", { href: `/projects/${created}`, className: "rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-500", children: "View Project" })] })] }));
    }
    return (_jsxs("form", { onSubmit: handleSubmit, className: "space-y-5", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "name", className: "block text-sm font-medium text-slate-300", children: "Project Name" }), _jsx("input", { id: "name", type: "text", required: true, value: formData.name, onChange: (e) => setFormData({ ...formData, name: e.target.value }), className: "mt-1 w-full rounded-lg border border-dark-700 bg-dark-900 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500", placeholder: "My Awesome Project" })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "description", className: "block text-sm font-medium text-slate-300", children: "Description" }), _jsx("textarea", { id: "description", rows: 3, value: formData.description, onChange: (e) => setFormData({ ...formData, description: e.target.value }), className: "mt-1 w-full rounded-lg border border-dark-700 bg-dark-900 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500", placeholder: "What does your project do?" })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "ownerAddress", className: "block text-sm font-medium text-slate-300", children: "Owner Wallet Address" }), _jsx("input", { id: "ownerAddress", type: "text", required: true, value: formData.ownerAddress, onChange: (e) => setFormData({ ...formData, ownerAddress: e.target.value }), className: "mt-1 w-full rounded-lg border border-dark-700 bg-dark-900 px-3 py-2 text-sm font-mono text-white placeholder-slate-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500", placeholder: "0x..." })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "websiteUrl", className: "block text-sm font-medium text-slate-300", children: "Website URL (optional)" }), _jsx("input", { id: "websiteUrl", type: "url", value: formData.websiteUrl, onChange: (e) => setFormData({ ...formData, websiteUrl: e.target.value }), className: "mt-1 w-full rounded-lg border border-dark-700 bg-dark-900 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500", placeholder: "https://myproject.com" })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "redirectUris", className: "block text-sm font-medium text-slate-300", children: "Redirect URIs (comma-separated)" }), _jsx("input", { id: "redirectUris", type: "text", value: formData.redirectUris, onChange: (e) => setFormData({ ...formData, redirectUris: e.target.value }), className: "mt-1 w-full rounded-lg border border-dark-700 bg-dark-900 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500", placeholder: "https://myproject.com/callback" })] }), _jsxs("div", { className: "flex items-center justify-end gap-3", children: [_jsx("a", { href: "/projects", className: "rounded-lg border border-dark-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-dark-800", children: "Cancel" }), _jsx("button", { type: "submit", disabled: loading, className: "rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-500 disabled:opacity-50", children: loading ? 'Creating...' : 'Create Project' })] })] }));
}
//# sourceMappingURL=ProjectForm.js.map