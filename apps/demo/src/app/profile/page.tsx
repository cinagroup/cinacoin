"use client";

import { useState } from "react";
import { User, Copy, Check, ExternalLink, Settings, Bell, Shield, Palette } from "lucide-react";
import DemoLayout from "@/components/DemoLayout";
import { useWallet, shortenAddress } from "@/lib/useWallet";
import { useToast } from "@/lib/toast";

export default function ProfilePage() {
  const { account, status } = useWallet();
  const { success } = useToast();

  const isConnected = status === "connected";

  const [copied, setCopied] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [twoFactor, setTwoFactor] = useState(false);

  const handleCopyAddress = async () => {
    if (!account.address) return;
    await navigator.clipboard.writeText(account.address);
    setCopied(true);
    success("Copied", "Address copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isConnected) {
    return (
      <DemoLayout>
        <div className="max-w-4xl mx-auto px-4 py-12 text-center cc-page-enter">
          <p className="font-mono text-xs text-[var(--cc-muted)] mb-2">PROFILE</p>
          <h1 className="text-display-lg font-semibold tracking-tighter text-[var(--cc-ink)] mb-4">
            Your profile.
          </h1>
          <p className="text-[var(--cc-body)]">Connect your wallet to view your profile.</p>
        </div>
      </DemoLayout>
    );
  }

  return (
    <DemoLayout>
      <div className="max-w-4xl mx-auto px-4 py-12 cc-page-enter">
        {/* Header */}
        <div className="mb-8">
          <p className="font-mono text-xs text-[var(--cc-muted)] mb-2">PROFILE</p>
          <h1 className="text-display-lg font-semibold tracking-tighter text-[var(--cc-ink)] mb-2">
            Your profile.
          </h1>
          <p className="text-[var(--cc-body)] text-body-sm">Manage your wallet settings and preferences</p>
        </div>

        {/* Profile Card */}
        <div className="p-6 bg-[var(--cc-canvas)] border border-[var(--cc-hairline)] rounded-[var(--cc-radius-md)] shadow-[var(--cc-level1)] mb-6">
          <div className="flex items-start gap-4 mb-6">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[var(--cc-link)] to-[var(--cc-violet)] flex items-center justify-center text-[var(--cc-on-primary)] shadow-[var(--cc-level2)]">
              <User className="w-8 h-8" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-display-sm text-[var(--cc-ink)] mb-1">Wallet Owner</h2>
              <div className="flex items-center gap-2">
                <p className="text-caption text-[var(--cc-body)] font-mono">{shortenAddress(account.address ?? "")}</p>
                <button
                  onClick={handleCopyAddress}
                  className="p-1 hover:bg-[var(--cc-canvas-soft-2)] rounded transition-colors"
                  title="Copy address"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-[var(--cc-success)]" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-[var(--cc-muted)]" />
                  )}
                </button>
                <a
                  href={`https://etherscan.io/address/${account.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1 hover:bg-[var(--cc-canvas-soft-2)] rounded transition-colors"
                  title="View on Etherscan"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-[var(--cc-muted)]" />
                </a>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="w-2 h-2 bg-[var(--cc-success)] rounded-full animate-pulse" />
                <span className="text-caption text-[var(--cc-success)] font-medium">Connected</span>
                <span className="text-caption text-[var(--cc-muted)]">· {account.chainName}</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-[var(--cc-hairline)]">
            <div>
              <p className="text-caption text-[var(--cc-muted)] mb-1">Balance</p>
              <p className="font-semibold text-body-lg text-[var(--cc-ink)] cc-tabular-nums">
                {parseFloat(account.balance).toFixed(4)} {account.chainSymbol}
              </p>
            </div>
            <div>
              <p className="text-caption text-[var(--cc-muted)] mb-1">Network</p>
              <p className="font-semibold text-body-lg text-[var(--cc-ink)]">{account.chainName}</p>
            </div>
            <div>
              <p className="text-caption text-[var(--cc-muted)] mb-1">Chain ID</p>
              <p className="font-semibold text-body-lg text-[var(--cc-ink)] cc-tabular-nums">{account.chainId}</p>
            </div>
          </div>
        </div>

        {/* Settings Sections */}
        <div className="space-y-4 cc-stagger">
          {/* Preferences */}
          <div className="p-5 bg-[var(--cc-canvas)] border border-[var(--cc-hairline)] rounded-[var(--cc-radius-md)] cc-animate-slide-up">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-full bg-[var(--cc-canvas-soft-2)] border border-[var(--cc-hairline)] flex items-center justify-center">
                <Settings className="w-4 h-4 text-[var(--cc-muted)]" />
              </div>
              <h3 className="font-semibold text-[var(--cc-ink)]">Preferences</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-[var(--cc-canvas-soft-2)]/40 border border-[var(--cc-hairline)]/60 rounded-[var(--cc-radius-sm)]">
                <div>
                  <p className="text-body-sm font-medium text-[var(--cc-ink)]">Dark mode</p>
                  <p className="text-caption text-[var(--cc-muted)]">Use dark theme across the app</p>
                </div>
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    darkMode ? 'bg-[var(--cc-primary)]' : 'bg-[var(--cc-canvas-soft-2)]'
                  }`}
                  role="switch"
                  aria-checked={darkMode}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-[var(--cc-canvas)] shadow-[var(--cc-level1)] transition-transform ${
                      darkMode ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="p-5 bg-[var(--cc-canvas)] border border-[var(--cc-hairline)] rounded-[var(--cc-radius-md)] cc-animate-slide-up">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-full bg-[var(--cc-canvas-soft-2)] border border-[var(--cc-hairline)] flex items-center justify-center">
                <Bell className="w-4 h-4 text-[var(--cc-muted)]" />
              </div>
              <h3 className="font-semibold text-[var(--cc-ink)]">Notifications</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-[var(--cc-canvas-soft-2)]/40 border border-[var(--cc-hairline)]/60 rounded-[var(--cc-radius-sm)]">
                <div>
                  <p className="text-body-sm font-medium text-[var(--cc-ink)]">Push notifications</p>
                  <p className="text-caption text-[var(--cc-muted)]">Receive alerts for transactions and updates</p>
                </div>
                <button
                  onClick={() => setNotifications(!notifications)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    notifications ? 'bg-[var(--cc-primary)]' : 'bg-[var(--cc-canvas-soft-2)]'
                  }`}
                  role="switch"
                  aria-checked={notifications}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-[var(--cc-canvas)] shadow-[var(--cc-level1)] transition-transform ${
                      notifications ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Security */}
          <div className="p-5 bg-[var(--cc-canvas)] border border-[var(--cc-hairline)] rounded-[var(--cc-radius-md)] cc-animate-slide-up">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-full bg-[var(--cc-canvas-soft-2)] border border-[var(--cc-hairline)] flex items-center justify-center">
                <Shield className="w-4 h-4 text-[var(--cc-muted)]" />
              </div>
              <h3 className="font-semibold text-[var(--cc-ink)]">Security</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-[var(--cc-canvas-soft-2)]/40 border border-[var(--cc-hairline)]/60 rounded-[var(--cc-radius-sm)]">
                <div>
                  <p className="text-body-sm font-medium text-[var(--cc-ink)]">Two-factor authentication</p>
                  <p className="text-caption text-[var(--cc-muted)]">Add an extra layer of security</p>
                </div>
                <button
                  onClick={() => setTwoFactor(!twoFactor)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    twoFactor ? 'bg-[var(--cc-primary)]' : 'bg-[var(--cc-canvas-soft-2)]'
                  }`}
                  role="switch"
                  aria-checked={twoFactor}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-[var(--cc-canvas)] shadow-[var(--cc-level1)] transition-transform ${
                      twoFactor ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DemoLayout>
  );
}
