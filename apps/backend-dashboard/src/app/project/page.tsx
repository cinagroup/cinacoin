"use client";

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

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tighter text-[var(--cc-ink)]">⚙️ Project Settings</h1>
        <p className="text-dashboard-muted mt-1">
          Configure your AppKit project, authentication, and feature flags
        </p>
      </div>

      {saved && (
        <div className="bg-dashboard-success/10 border border-dashboard-success/30 rounded-md px-4 py-3 text-sm text-dashboard-success">
          ✓ Project settings saved successfully
        </div>
      )}

      {/* Project Identity */}
      <div className="bg-dashboard-surface rounded-md border border-dashboard-border p-6 space-y-4">
        <h2 className="text-lg font-semibold text-[var(--cc-ink)]">Project Identity</h2>

        {/* Project ID */}
        <div>
          <label className="text-sm text-dashboard-muted block mb-1">Project ID</label>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-dashboard-bg border border-dashboard-border rounded-[var(--cc-radius-md)] px-3 py-2 text-sm text-[var(--cc-ink)] font-mono">
              {showProjectId ? projectId : "•".repeat(projectId.length)}
            </code>
            <button
              onClick={() => setShowProjectId(!showProjectId)}
              aria-label={showProjectId ? "Hide Project ID" : "Show Project ID"}
              className="px-3 py-2 bg-dashboard-border rounded-[100px] text-sm text-dashboard-muted hover:text-[var(--cc-ink)] transition-colors"
            >
              {showProjectId ? "🙈 Hide" : "👁️ Show"}
            </button>
            <button
              onClick={handleCopyProjectId}
              aria-label={copied ? "Copied" : "Copy Project ID"}
              className="px-3 py-2 bg-dashboard-border rounded-[100px] text-sm text-dashboard-muted hover:text-[var(--cc-ink)] transition-colors"
            >
              {copied ? "✓ Copied" : "📋 Copy"}
            </button>
          </div>
          <p className="text-xs text-dashboard-muted mt-1">
            Used to identify your project in AppKit. Copy this into your app's configuration.
          </p>
        </div>

        {/* Project Name */}
        <div>
          <label className="text-sm text-dashboard-muted block mb-1">Project Name</label>
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            aria-label="Project name"
            aria-describedby="project-name-desc"
            className="w-full bg-dashboard-bg border border-dashboard-border rounded-[var(--cc-radius-md)] px-3 py-2 text-sm text-[var(--cc-ink)] focus:outline-none focus:border-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-dashboard-surface"
          />
          <p id="project-name-desc" className="sr-only">Enter your project display name</p>
        </div>

        {/* Description */}
        <div>
          <label className="text-sm text-dashboard-muted block mb-1">Description</label>
          <textarea
            value={projectDescription}
            onChange={(e) => setProjectDescription(e.target.value)}
            rows={2}
            aria-label="Project description"
            className="w-full bg-dashboard-bg border border-dashboard-border rounded-[var(--cc-radius-md)] px-3 py-2 text-sm text-[var(--cc-ink)] focus:outline-none focus:border-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-dashboard-surface resize-none"
          />
        </div>

        {/* Project URL */}
        <div>
          <label className="text-sm text-dashboard-muted block mb-1">Project URL</label>
          <input
            type="url"
            value={projectUrl}
            onChange={(e) => setProjectUrl(e.target.value)}
            aria-label="Project URL"
            className="w-full bg-dashboard-bg border border-dashboard-border rounded-[var(--cc-radius-md)] px-3 py-2 text-sm text-[var(--cc-ink)] focus:outline-none focus:border-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-dashboard-surface"
          />
        </div>

        {/* Icon URL */}
        <div>
          <label className="text-sm text-dashboard-muted block mb-1">Icon URL</label>
          <input
            type="url"
            value={iconUrl}
            onChange={(e) => setIconUrl(e.target.value)}
            aria-label="Project icon URL"
            className="w-full bg-dashboard-bg border border-dashboard-border rounded-[var(--cc-radius-md)] px-3 py-2 text-sm text-[var(--cc-ink)] focus:outline-none focus:border-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-dashboard-surface"
          />
        </div>
      </div>

      {/* Authentication */}
      <div className="bg-dashboard-surface rounded-md border border-dashboard-border p-6 space-y-4">
        <h2 className="text-lg font-semibold text-[var(--cc-ink)]">🔐 Authentication</h2>
        <p className="text-sm text-dashboard-muted">
          Configure authentication methods for your AppKit integration.
        </p>

        <div className="space-y-3">
          {[
            { label: "Sign-In With Ethereum (SIWE)", desc: "One-click wallet authentication", state: siweEnabled, setter: setSiweEnabled },
            { label: "Social Login", desc: "Google, X, GitHub, Discord OAuth", state: socialLoginEnabled, setter: setSocialLoginEnabled },
            { label: "Email Login", desc: "Magic link / email wallet creation", state: emailLoginEnabled, setter: setEmailLoginEnabled },
            { label: "Smart Accounts", desc: "ERC-4337 account abstraction with session keys", state: smartAccountsEnabled, setter: setSmartAccountsEnabled },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between py-2">
              <div>
                <p className="text-[var(--cc-ink)] font-medium">{item.label}</p>
                <p className="text-sm text-dashboard-muted">{item.desc}</p>
              </div>
              <button
                onClick={() => item.setter(!item.state)}
                role="switch"
                aria-checked={item.state}
                aria-label={`${item.label}: ${item.state ? 'on' : 'off'}`}
                className={`relative w-10 h-5 rounded-full transition-colors ${
                  item.state ? "bg-dashboard-success" : "bg-dashboard-border"
                }`}
              >
                <span
                  className={`absolute top-0.5 w-4 h-4 rounded-full bg-[var(--cc-canvas)] shadow transition-transform ${
                    item.state ? "left-5" : "left-0.5"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Feature Flags */}
      <div className="bg-dashboard-surface rounded-md border border-dashboard-border p-6 space-y-4">
        <h2 className="text-lg font-semibold text-[var(--cc-ink)]">🚀 Features</h2>
        <p className="text-sm text-dashboard-muted">
          Enable or disable AppKit features for your project.
        </p>

        <div className="space-y-3">
          {[
            { label: "Swaps", desc: "Multi-DEX swap aggregator (EVM only)", state: swapsEnabled, setter: setSwapsEnabled },
            { label: "On-Ramp", desc: "Fiat-to-crypto via multiple providers", state: onrampEnabled, setter: setOnrampEnabled },
            { label: "Multi-Chain", desc: "Support multiple networks in one modal", state: multiChainEnabled, setter: setMultiChainEnabled },
            { label: "Analytics", desc: "Track MAU, connections, and usage metrics", state: analyticsEnabled, setter: setAnalyticsEnabled },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between py-2">
              <div>
                <p className="text-[var(--cc-ink)] font-medium">{item.label}</p>
                <p className="text-sm text-dashboard-muted">{item.desc}</p>
              </div>
              <button
                onClick={() => item.setter(!item.state)}
                role="switch"
                aria-checked={item.state}
                aria-label={`${item.label}: ${item.state ? 'on' : 'off'}`}
                className={`relative w-10 h-5 rounded-full transition-colors ${
                  item.state ? "bg-dashboard-success" : "bg-dashboard-border"
                }`}
              >
                <span
                  className={`absolute top-0.5 w-4 h-4 rounded-full bg-[var(--cc-canvas)] shadow transition-transform ${
                    item.state ? "left-5" : "left-0.5"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* AppKit Integration Code */}
      <div className="bg-dashboard-surface rounded-md border border-dashboard-border p-6 space-y-4">
        <h2 className="text-lg font-semibold text-[var(--cc-ink)]">📦 Integration Code</h2>
        <p className="text-sm text-dashboard-muted">
          Copy this snippet to get started with AppKit in your project.
        </p>

        <div className="bg-dashboard-bg rounded-[var(--cc-radius-md)] p-4 overflow-x-auto">
          <pre className="text-sm text-dashboard-muted font-mono whitespace-pre">
{`// Install
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
})`}
          </pre>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-dashboard-danger/5 rounded-md border border-dashboard-danger/20 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-dashboard-danger">⚠️ Danger Zone</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[var(--cc-ink)] font-medium">Regenerate Project ID</p>
            <p className="text-sm text-dashboard-muted">This will invalidate the current project ID and require updating all apps.</p>
          </div>
          <button
            onClick={() => setShowRegenConfirm(true)}
            aria-label="Regenerate project ID"
            className="px-4 py-2 border border-dashboard-danger/30 text-dashboard-danger rounded-[100px] text-sm hover:bg-dashboard-danger/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dashboard-danger focus-visible:ring-offset-2 focus-visible:ring-offset-dashboard-surface"
          >
            Regenerate
          </button>
        </div>
        {showRegenConfirm && (
          <div className="bg-dashboard-bg rounded-[var(--cc-radius-md)] p-4 border border-dashboard-border">
            <p className="text-sm text-[var(--cc-ink)] mb-3">Are you sure you want to regenerate the Project ID? This cannot be undone.</p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowRegenConfirm(false);
                  // In production: call API to regenerate
                }}
                aria-label="Confirm project ID regeneration"
                className="px-4 py-2 bg-dashboard-danger text-[var(--cc-ink)] rounded-[100px] text-sm hover:bg-red-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dashboard-danger focus-visible:ring-offset-2 focus-visible:ring-offset-dashboard-surface"
              >
                Confirm Regenerate
              </button>
              <button
                onClick={() => setShowRegenConfirm(false)}
                aria-label="Cancel project ID regeneration"
                className="px-4 py-2 border border-dashboard-border rounded-[100px] text-dashboard-muted text-sm hover:text-[var(--cc-ink)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-dashboard-surface"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        <div className="flex items-center justify-between pt-2 border-t border-dashboard-danger/10">
          <div>
            <p className="text-[var(--cc-ink)] font-medium">Delete Project</p>
            <p className="text-sm text-dashboard-muted">Permanently delete this project and all associated data.</p>
          </div>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            aria-label="Delete project"
            className="px-4 py-2 bg-dashboard-danger text-[var(--cc-ink)] rounded-[100px] text-sm hover:bg-red-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dashboard-danger focus-visible:ring-offset-2 focus-visible:ring-offset-dashboard-surface"
          >
            Delete Project
          </button>
        </div>
        {showDeleteConfirm && (
          <div className="bg-dashboard-bg rounded-[var(--cc-radius-md)] p-4 border border-dashboard-border">
            <p className="text-sm text-[var(--cc-ink)] mb-3">Are you sure you want to delete this project? This action is permanent and cannot be undone.</p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  // In production: call API to delete
                }}
                aria-label="Confirm project deletion"
                className="px-4 py-2 bg-dashboard-danger text-[var(--cc-ink)] rounded-[100px] text-sm hover:bg-red-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dashboard-danger focus-visible:ring-offset-2 focus-visible:ring-offset-dashboard-surface"
              >
                Confirm Delete
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                aria-label="Cancel project deletion"
                className="px-4 py-2 border border-dashboard-border rounded-[100px] text-sm text-dashboard-muted hover:text-[var(--cc-ink)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-dashboard-surface"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          aria-label={saved ? "Settings saved" : "Save all project settings"}
          className="px-6 py-2.5 bg-brand-500 hover:bg-brand-400 text-[var(--cc-ink)] rounded-[100px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-dashboard-surface"
        >
          {saved ? "✓ Saved" : "Save All Settings"}
        </button>
      </div>
    </div>
  );
}
