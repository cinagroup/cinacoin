"use client";

import { useState } from "react";

/** Escape HTML for safe interpolation in code blocks */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/'/g, "&#39;")
    .replace(/"/g, '&quot;');
}

export default function ProjectPage() {
  const [projectName, setProjectName] = useState("CinaCoin");
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
    navigator.clipboard.writeText(projectId).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="cc-display-sm text-[var(--cc-ink)]">Project Settings</h1>
        <p className="cc-body-sm text-[var(--cc-muted)] mt-1">
          Configure your AppKit project, authentication, and feature flags
        </p>
      </div>

      {saved && (
        <div className="bg-[var(--cc-success)]/10 border border-[var(--cc-success)]/30 rounded-[var(--cc-radius-md)] px-4 py-3 cc-body-sm text-[var(--cc-success)]">
          ✓ Project settings saved successfully
        </div>
      )}

      {/* Project Identity */}
      <div className="cc-card space-y-4">
        <h2 className="cc-body-md-strong text-[var(--cc-ink)]">Project Identity</h2>

        {/* Project ID */}
        <div>
          <label className="cc-body-sm text-[var(--cc-muted)] block mb-1">Project ID</label>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-[var(--cc-canvas-soft-2)] border border-[var(--cc-hairline)] rounded-[var(--cc-radius-sm)] px-3 py-2 cc-body-sm text-[var(--cc-ink)] text-code">
              {showProjectId ? projectId : "•".repeat(projectId.length)}
            </code>
            <button onClick={() => setShowProjectId(!showProjectId)} aria-label={showProjectId ? "Hide Project ID" : "Show Project ID"} className="cc-btn-secondary-sm">
              {showProjectId ? "Hide" : "Show"}
            </button>
            <button onClick={handleCopyProjectId} aria-label={copied ? "Copied" : "Copy Project ID"} className="cc-btn-secondary-sm">
              {copied ? "✓ Copied" : "Copy"}
            </button>
          </div>
          <p className="cc-caption text-[var(--cc-muted)] mt-1">
            Used to identify your project in AppKit.
          </p>
        </div>

        <div>
          <label htmlFor="projectName" className="cc-body-sm text-[var(--cc-muted)] block mb-1">Project Name</label>
          <input id="projectName" type="text" value={projectName} onChange={(e) => setProjectName(e.target.value)} className="cc-form-input" />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="projectDescription" className="cc-body-sm text-[var(--cc-muted)] block mb-1">Description</label>
          <textarea id="projectDescription" value={projectDescription} onChange={(e) => setProjectDescription(e.target.value)} rows={2} className="cc-form-input resize-none" />
        </div>

        <div>
          <label htmlFor="projectUrl" className="cc-body-sm text-[var(--cc-muted)] block mb-1">Project URL</label>
          <input id="projectUrl" type="url" value={projectUrl} onChange={(e) => setProjectUrl(e.target.value)} className="cc-form-input" />
        </div>

        {/* Icon URL */}
        <div>
          <label htmlFor="iconUrl" className="cc-body-sm text-[var(--cc-muted)] block mb-1">Icon URL</label>
          <input id="iconUrl" type="url" value={iconUrl} onChange={(e) => setIconUrl(e.target.value)} className="cc-form-input" />
        </div>
      </div>

      {/* Authentication */}
      <div className="cc-card space-y-4">
        <h2 className="cc-body-md-strong text-[var(--cc-ink)]">Authentication</h2>
        <p className="cc-body-sm text-[var(--cc-muted)]">Configure authentication methods for your AppKit integration.</p>

        <div className="space-y-3">
          {[
            { label: "Sign-In With Ethereum (SIWE)", desc: "One-click wallet authentication", state: siweEnabled, setter: setSiweEnabled },
            { label: "Social Login", desc: "Google, X, GitHub, Discord OAuth", state: socialLoginEnabled, setter: setSocialLoginEnabled },
            { label: "Email Login", desc: "Magic link / email wallet creation", state: emailLoginEnabled, setter: setEmailLoginEnabled },
            { label: "Smart Accounts", desc: "ERC-4337 account abstraction with session keys", state: smartAccountsEnabled, setter: setSmartAccountsEnabled },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between py-2">
              <div>
                <p className="cc-body-sm-strong text-[var(--cc-ink)]">{item.label}</p>
                <p className="cc-body-sm text-[var(--cc-muted)]">{item.desc}</p>
              </div>
              <button onClick={() => item.setter(!item.state)} role="switch" aria-checked={item.state} aria-label={`${item.label}: ${item.state ? 'on' : 'off'}`}
                className={`relative w-10 h-5 rounded-full transition-colors ${item.state ? "bg-[var(--cc-success)]" : "bg-[var(--cc-hairline)]"}`}>
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-[var(--cc-canvas)] shadow transition-transform ${item.state ? "left-5" : "left-0.5"}`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Feature Flags */}
      <div className="cc-card space-y-4">
        <h2 className="cc-body-md-strong text-[var(--cc-ink)]">Features</h2>
        <p className="cc-body-sm text-[var(--cc-muted)]">Enable or disable AppKit features for your project.</p>

        <div className="space-y-3">
          {[
            { label: "Swaps", desc: "Multi-DEX swap aggregator (EVM only)", state: swapsEnabled, setter: setSwapsEnabled },
            { label: "On-Ramp", desc: "Fiat-to-crypto via multiple providers", state: onrampEnabled, setter: setOnrampEnabled },
            { label: "Multi-Chain", desc: "Support multiple networks in one modal", state: multiChainEnabled, setter: setMultiChainEnabled },
            { label: "Analytics", desc: "Track MAU, connections, and usage metrics", state: analyticsEnabled, setter: setAnalyticsEnabled },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between py-2">
              <div>
                <p className="cc-body-sm-strong text-[var(--cc-ink)]">{item.label}</p>
                <p className="cc-body-sm text-[var(--cc-muted)]">{item.desc}</p>
              </div>
              <button onClick={() => item.setter(!item.state)} role="switch" aria-checked={item.state} aria-label={`${item.label}: ${item.state ? 'on' : 'off'}`}
                className={`relative w-10 h-5 rounded-full transition-colors ${item.state ? "bg-[var(--cc-success)]" : "bg-[var(--cc-hairline)]"}`}>
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-[var(--cc-canvas)] shadow transition-transform ${item.state ? "left-5" : "left-0.5"}`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* AppKit Integration Code */}
      <div className="cc-card space-y-4">
        <h2 className="cc-body-md-strong text-[var(--cc-ink)]">Integration Code</h2>
        <p className="cc-body-sm text-[var(--cc-muted)]">Copy this snippet to get started with AppKit in your project.</p>

        <div className="cc-code-block">
          <pre className="cc-code whitespace-pre text-[var(--cc-on-primary)]">
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
  projectId: '${escapeHtml(projectId)}',
  features: {
    swaps: ${swapsEnabled},
    onramp: ${onrampEnabled},
    email: ${emailLoginEnabled},
    socials: ${socialLoginEnabled},
  },
  metadata: {
    name: '${escapeHtml(projectName)}',
    description: '${escapeHtml(projectDescription)}',
    url: '${escapeHtml(projectUrl)}',
    icons: ['${escapeHtml(iconUrl)}'],
  },
})`}
          </pre>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="cc-card border border-[var(--cc-error)]/20">
        <h2 className="cc-body-md-strong text-[var(--cc-error)] mb-4">Danger Zone</h2>
        <div className="flex items-center justify-between py-3 border-b border-[var(--cc-hairline)]">
          <div>
            <p className="cc-body-sm-strong text-[var(--cc-ink)]">Regenerate Project ID</p>
            <p className="cc-body-sm text-[var(--cc-muted)]">This will invalidate the current project ID and require updating all apps.</p>
          </div>
          <button onClick={() => setShowRegenConfirm(true)} aria-label="Regenerate project ID" className="px-4 py-2 border border-[var(--cc-error)]/30 text-[var(--cc-error)] rounded-[var(--cc-radius-pill)] cc-body-sm hover:bg-[var(--cc-error)]/10 transition-colors min-h-[40px]">
            Regenerate
          </button>
        </div>
        {showRegenConfirm && (
          <div className="bg-[var(--cc-canvas-soft-2)] rounded-[var(--cc-radius-md)] p-4 border border-[var(--cc-hairline)] mt-3">
            <p className="cc-body-sm text-[var(--cc-ink)] mb-3">Are you sure you want to regenerate the Project ID?</p>
            <div className="flex gap-2">
              <button onClick={() => setShowRegenConfirm(false)} aria-label="Confirm project ID regeneration" className="px-4 py-2 bg-[var(--cc-error)] text-[var(--cc-on-primary)] rounded-[var(--cc-radius-pill)] cc-body-sm hover:opacity-85 transition-colors min-h-[40px]">
                Confirm Regenerate
              </button>
              <button onClick={() => setShowRegenConfirm(false)} aria-label="Cancel project ID regeneration" className="cc-btn-secondary-sm">Cancel</button>
            </div>
          </div>
        )}
        <div className="flex items-center justify-between py-3">
          <div>
            <p className="cc-body-sm-strong text-[var(--cc-ink)]">Delete Project</p>
            <p className="cc-body-sm text-[var(--cc-muted)]">Permanently delete this project and all associated data.</p>
          </div>
          <button onClick={() => setShowDeleteConfirm(true)} aria-label="Delete project" className="px-4 py-2 bg-[var(--cc-error)] text-[var(--cc-on-primary)] rounded-[var(--cc-radius-pill)] cc-body-sm hover:opacity-85 transition-colors min-h-[40px]">
            Delete Project
          </button>
        </div>
        {showDeleteConfirm && (
          <div className="bg-[var(--cc-canvas-soft-2)] rounded-[var(--cc-radius-md)] p-4 border border-[var(--cc-hairline)] mt-3">
            <p className="cc-body-sm text-[var(--cc-ink)] mb-3">Are you sure you want to delete this project? This action is permanent and cannot be undone.</p>
            <div className="flex gap-2">
              <button onClick={() => setShowDeleteConfirm(false)} aria-label="Confirm project deletion" className="px-4 py-2 bg-[var(--cc-error)] text-[var(--cc-on-primary)] rounded-[var(--cc-radius-pill)] cc-body-sm hover:opacity-85 transition-colors min-h-[40px]">
                Confirm Delete
              </button>
              <button onClick={() => setShowDeleteConfirm(false)} aria-label="Cancel project deletion" className="cc-btn-secondary-sm">Cancel</button>
            </div>
          </div>
        )}
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <button onClick={handleSave} aria-label={saved ? "Settings saved" : "Save all project settings"} className="cc-btn-primary">
          {saved ? "✓ Saved" : "Save All Settings"}
        </button>
      </div>
    </div>
  );
}
