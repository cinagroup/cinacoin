"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
export default function ProjectPage() {
    const [projectName, setProjectName] = useState("Cinacoin");
    const [projectId, setProjectId] = useState("a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6");
    const [projectDescription, setProjectDescription] = useState("Full-stack Web3 SDK — Connect Everything On-Chain");
    const [projectUrl, setProjectUrl] = useState("https://cinacoin.com");
    const [iconUrl, setIconUrl] = useState("/favicon.ico");
    const [saved, setSaved] = useState(false);
    const [showProjectId, setShowProjectId] = useState(false);
    const [copied, setCopied] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showRegenConfirm, setShowRegenConfirm] = useState(false);
    // Authentication settings
    const [siweEnabled, setSiweEnabled] = useState(true);
    const [socialLoginEnabled, setSocialLoginEnabled] = useState(true);
    const [emailLoginEnabled, setEmailLoginEnabled] = useState(true);
    const [smartAccountsEnabled, setSmartAccountsEnabled] = useState(false);
    // Feature toggles
    const [swapsEnabled, setSwapsEnabled] = useState(true);
    const [onrampEnabled, setOnrampEnabled] = useState(true);
    const [multiChainEnabled, setMultiChainEnabled] = useState(true);
    const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
    const handleSave = () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };
    const handleCopyProjectId = () => {
        navigator.clipboard.writeText(projectId).catch(() => {
            // clipboard API may be unavailable in some contexts
        });
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (_jsxs("div", { className: "space-y-6 max-w-4xl", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-white", children: "\u2699\uFE0F Project Settings" }), _jsx("p", { className: "text-dashboard-muted mt-1", children: "Configure your AppKit project, authentication, and feature flags" })] }), saved && (_jsx("div", { className: "bg-dashboard-success/10 border border-dashboard-success/30 rounded-xl px-4 py-3 text-sm text-dashboard-success", children: "\u2713 Project settings saved successfully" })), _jsxs("div", { className: "bg-dashboard-surface rounded-xl border border-dashboard-border p-6 space-y-4", children: [_jsx("h2", { className: "text-lg font-semibold text-white", children: "Project Identity" }), _jsxs("div", { children: [_jsx("label", { className: "text-sm text-dashboard-muted block mb-1", children: "Project ID" }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("code", { className: "flex-1 bg-dashboard-bg border border-dashboard-border rounded-lg px-3 py-2 text-sm text-white font-mono", children: showProjectId ? projectId : "•".repeat(projectId.length) }), _jsx("button", { onClick: () => setShowProjectId(!showProjectId), "aria-label": showProjectId ? "Hide Project ID" : "Show Project ID", className: "px-3 py-2 bg-dashboard-border rounded-lg text-sm text-dashboard-muted hover:text-white transition-colors", children: showProjectId ? "🙈 Hide" : "👁️ Show" }), _jsx("button", { onClick: handleCopyProjectId, "aria-label": copied ? "Copied" : "Copy Project ID", className: "px-3 py-2 bg-dashboard-border rounded-lg text-sm text-dashboard-muted hover:text-white transition-colors", children: copied ? "✓ Copied" : "📋 Copy" })] }), _jsx("p", { className: "text-xs text-dashboard-muted mt-1", children: "Used to identify your project in AppKit. Copy this into your app's configuration." })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm text-dashboard-muted block mb-1", children: "Project Name" }), _jsx("input", { type: "text", value: projectName, onChange: (e) => setProjectName(e.target.value), "aria-label": "Project name", "aria-describedby": "project-name-desc", className: "w-full bg-dashboard-bg border border-dashboard-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-dashboard-surface" }), _jsx("p", { id: "project-name-desc", className: "sr-only", children: "Enter your project display name" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm text-dashboard-muted block mb-1", children: "Description" }), _jsx("textarea", { value: projectDescription, onChange: (e) => setProjectDescription(e.target.value), rows: 2, "aria-label": "Project description", className: "w-full bg-dashboard-bg border border-dashboard-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-dashboard-surface resize-none" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm text-dashboard-muted block mb-1", children: "Project URL" }), _jsx("input", { type: "url", value: projectUrl, onChange: (e) => setProjectUrl(e.target.value), "aria-label": "Project URL", className: "w-full bg-dashboard-bg border border-dashboard-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-dashboard-surface" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm text-dashboard-muted block mb-1", children: "Icon URL" }), _jsx("input", { type: "url", value: iconUrl, onChange: (e) => setIconUrl(e.target.value), "aria-label": "Project icon URL", className: "w-full bg-dashboard-bg border border-dashboard-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-dashboard-surface" })] })] }), _jsxs("div", { className: "bg-dashboard-surface rounded-xl border border-dashboard-border p-6 space-y-4", children: [_jsx("h2", { className: "text-lg font-semibold text-white", children: "\uD83D\uDD10 Authentication" }), _jsx("p", { className: "text-sm text-dashboard-muted", children: "Configure authentication methods for your AppKit integration." }), _jsx("div", { className: "space-y-3", children: [
                            { label: "Sign-In With Ethereum (SIWE)", desc: "One-click wallet authentication", state: siweEnabled, setter: setSiweEnabled },
                            { label: "Social Login", desc: "Google, X, GitHub, Discord OAuth", state: socialLoginEnabled, setter: setSocialLoginEnabled },
                            { label: "Email Login", desc: "Magic link / email wallet creation", state: emailLoginEnabled, setter: setEmailLoginEnabled },
                            { label: "Smart Accounts", desc: "ERC-4337 account abstraction with session keys", state: smartAccountsEnabled, setter: setSmartAccountsEnabled },
                        ].map((item) => (_jsxs("div", { className: "flex items-center justify-between py-2", children: [_jsxs("div", { children: [_jsx("p", { className: "text-white font-medium", children: item.label }), _jsx("p", { className: "text-sm text-dashboard-muted", children: item.desc })] }), _jsx("button", { onClick: () => item.setter(!item.state), role: "switch", "aria-checked": item.state, "aria-label": `${item.label}: ${item.state ? 'on' : 'off'}`, className: `relative w-10 h-5 rounded-full transition-colors ${item.state ? "bg-dashboard-success" : "bg-dashboard-border"}`, children: _jsx("span", { className: `absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${item.state ? "left-5" : "left-0.5"}` }) })] }, item.label))) })] }), _jsxs("div", { className: "bg-dashboard-surface rounded-xl border border-dashboard-border p-6 space-y-4", children: [_jsx("h2", { className: "text-lg font-semibold text-white", children: "\uD83D\uDE80 Features" }), _jsx("p", { className: "text-sm text-dashboard-muted", children: "Enable or disable AppKit features for your project." }), _jsx("div", { className: "space-y-3", children: [
                            { label: "Swaps", desc: "Multi-DEX swap aggregator (EVM only)", state: swapsEnabled, setter: setSwapsEnabled },
                            { label: "On-Ramp", desc: "Fiat-to-crypto via multiple providers", state: onrampEnabled, setter: setOnrampEnabled },
                            { label: "Multi-Chain", desc: "Support multiple networks in one modal", state: multiChainEnabled, setter: setMultiChainEnabled },
                            { label: "Analytics", desc: "Track MAU, connections, and usage metrics", state: analyticsEnabled, setter: setAnalyticsEnabled },
                        ].map((item) => (_jsxs("div", { className: "flex items-center justify-between py-2", children: [_jsxs("div", { children: [_jsx("p", { className: "text-white font-medium", children: item.label }), _jsx("p", { className: "text-sm text-dashboard-muted", children: item.desc })] }), _jsx("button", { onClick: () => item.setter(!item.state), role: "switch", "aria-checked": item.state, "aria-label": `${item.label}: ${item.state ? 'on' : 'off'}`, className: `relative w-10 h-5 rounded-full transition-colors ${item.state ? "bg-dashboard-success" : "bg-dashboard-border"}`, children: _jsx("span", { className: `absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${item.state ? "left-5" : "left-0.5"}` }) })] }, item.label))) })] }), _jsxs("div", { className: "bg-dashboard-surface rounded-xl border border-dashboard-border p-6 space-y-4", children: [_jsx("h2", { className: "text-lg font-semibold text-white", children: "\uD83D\uDCE6 Integration Code" }), _jsx("p", { className: "text-sm text-dashboard-muted", children: "Copy this snippet to get started with AppKit in your project." }), _jsx("div", { className: "bg-dashboard-bg rounded-lg p-4 overflow-x-auto", children: _jsx("pre", { className: "text-sm text-dashboard-muted font-mono whitespace-pre", children: `// Install
npm install @reown/appkit @reown/appkit-adapter-wagmi wagmi viem

// Initialize
import { createAppKit } from '@reown/appkit/react'
import { WagmiProvider } from 'wagmi'
import { mainnet, polygon } from '@reown/appkit/networks'

createAppKit({
  adapters: [
    // Add chain adapters as needed
  ],
  networks: [mainnet, polygon],
  projectId: '${projectId}',
  features: {
    swaps: ${swapsEnabled},
    onramp: ${onrampEnabled},
    email: ${emailLoginEnabled},
    socials: ${socialLoginEnabled},
  },
  metadata: {
    name: '${projectName}',
    description: '${projectDescription}',
    url: '${projectUrl}',
    icons: ['${iconUrl}'],
  },
})` }) })] }), _jsxs("div", { className: "bg-dashboard-danger/5 rounded-xl border border-dashboard-danger/20 p-6 space-y-4", children: [_jsx("h2", { className: "text-lg font-semibold text-dashboard-danger", children: "\u26A0\uFE0F Danger Zone" }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-white font-medium", children: "Regenerate Project ID" }), _jsx("p", { className: "text-sm text-dashboard-muted", children: "This will invalidate the current project ID and require updating all apps." })] }), _jsx("button", { onClick: () => setShowRegenConfirm(true), "aria-label": "Regenerate project ID", className: "px-4 py-2 border border-dashboard-danger/30 text-dashboard-danger rounded-lg text-sm hover:bg-dashboard-danger/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dashboard-danger focus-visible:ring-offset-2 focus-visible:ring-offset-dashboard-surface", children: "Regenerate" })] }), showRegenConfirm && (_jsxs("div", { className: "bg-dashboard-bg rounded-lg p-4 border border-dashboard-border", children: [_jsx("p", { className: "text-sm text-white mb-3", children: "Are you sure you want to regenerate the Project ID? This cannot be undone." }), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { onClick: () => {
                                            setShowRegenConfirm(false);
                                            // In production: call API to regenerate
                                        }, "aria-label": "Confirm project ID regeneration", className: "px-4 py-2 bg-dashboard-danger text-white rounded-lg text-sm hover:bg-red-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dashboard-danger focus-visible:ring-offset-2 focus-visible:ring-offset-dashboard-surface", children: "Confirm Regenerate" }), _jsx("button", { onClick: () => setShowRegenConfirm(false), "aria-label": "Cancel project ID regeneration", className: "px-4 py-2 border border-dashboard-border text-dashboard-muted rounded-lg text-sm hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-dashboard-surface", children: "Cancel" })] })] })), _jsxs("div", { className: "flex items-center justify-between pt-2 border-t border-dashboard-danger/10", children: [_jsxs("div", { children: [_jsx("p", { className: "text-white font-medium", children: "Delete Project" }), _jsx("p", { className: "text-sm text-dashboard-muted", children: "Permanently delete this project and all associated data." })] }), _jsx("button", { onClick: () => setShowDeleteConfirm(true), "aria-label": "Delete project", className: "px-4 py-2 bg-dashboard-danger text-white rounded-lg text-sm hover:bg-red-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dashboard-danger focus-visible:ring-offset-2 focus-visible:ring-offset-dashboard-surface", children: "Delete Project" })] }), showDeleteConfirm && (_jsxs("div", { className: "bg-dashboard-bg rounded-lg p-4 border border-dashboard-border", children: [_jsx("p", { className: "text-sm text-white mb-3", children: "Are you sure you want to delete this project? This action is permanent and cannot be undone." }), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { onClick: () => {
                                            setShowDeleteConfirm(false);
                                            // In production: call API to delete
                                        }, "aria-label": "Confirm project deletion", className: "px-4 py-2 bg-dashboard-danger text-white rounded-lg text-sm hover:bg-red-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dashboard-danger focus-visible:ring-offset-2 focus-visible:ring-offset-dashboard-surface", children: "Confirm Delete" }), _jsx("button", { onClick: () => setShowDeleteConfirm(false), "aria-label": "Cancel project deletion", className: "px-4 py-2 border border-dashboard-border text-dashboard-muted rounded-lg text-sm hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-dashboard-surface", children: "Cancel" })] })] }))] }), _jsx("div", { className: "flex justify-end", children: _jsx("button", { onClick: handleSave, "aria-label": saved ? "Settings saved" : "Save all project settings", className: "px-6 py-2.5 bg-brand-500 hover:bg-brand-400 text-white rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-dashboard-surface", children: saved ? "✓ Saved" : "Save All Settings" }) })] }));
}
//# sourceMappingURL=page.js.map