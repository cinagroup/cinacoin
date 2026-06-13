"use client";

import { useState } from "react";
import { Layers, Key, Shield, Zap, Loader2, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";
import DemoLayout from "@/components/DemoLayout";
import { useWallet, shortenAddress } from "@/lib/useWallet";
import { useToast } from "@/lib/toast";

/* ── AA features ── */
const AA_FEATURES = [
  {
    icon: Key,
    title: "Social recovery",
    description: "Recover your account through trusted guardians instead of seed phrases",
    status: "available" as const,
  },
  {
    icon: Zap,
    title: "Gas sponsorship",
    description: "Pay gas fees with ERC-20 tokens or have them subsidized by dApps",
    status: "available" as const,
  },
  {
    icon: Shield,
    title: "Session keys",
    description: "Create time-limited keys for specific dApps with spending limits",
    status: "available" as const,
  },
  {
    icon: Layers,
    title: "Batched calls",
    description: "Combine multiple transactions into a single atomic operation",
    status: "coming_soon" as const,
  },
];

export default function AAPage() {
  const { account, status } = useWallet();
  const { success, error: showError } = useToast();

  const isConnected = status === "connected";

  const [deploying, setDeploying] = useState(false);
  const [deployed, setDeployed] = useState(false);
  const [smartAccountAddress, setSmartAccountAddress] = useState<string | null>(null);

  const handleDeploy = async () => {
    setDeploying(true);
    // Simulate deployment
    await new Promise((r) => setTimeout(r, 2000));
    const address = `0x${Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
    setSmartAccountAddress(address);
    setDeployed(true);
    setDeploying(false);
    success("Smart account deployed", `Address: ${shortenAddress(address)}`);
  };

  if (!isConnected) {
    return (
      <DemoLayout>
        <div className="max-w-4xl mx-auto px-4 py-12 text-center cc-page-enter">
          <p className="font-mono text-xs text-[var(--cc-muted)] mb-2">ACCOUNT ABSTRACTION</p>
          <h1 className="text-display-lg font-semibold tracking-tighter text-[var(--cc-ink)] mb-4">
            Account abstraction.
          </h1>
          <p className="text-[var(--cc-body)]">Connect your wallet to explore ERC-4337 smart accounts.</p>
        </div>
      </DemoLayout>
    );
  }

  return (
    <DemoLayout>
      <div className="max-w-4xl mx-auto px-4 py-12 cc-page-enter">
        {/* Header */}
        <div className="mb-8">
          <p className="font-mono text-xs text-[var(--cc-muted)] mb-2">ACCOUNT ABSTRACTION</p>
          <h1 className="text-display-lg font-semibold tracking-tighter text-[var(--cc-ink)] mb-2">
            Account abstraction.
          </h1>
          <p className="text-[var(--cc-body)] text-body-sm">
            ERC-4337 smart accounts with social recovery, gas sponsorship, and session keys
          </p>
        </div>

        {/* Deploy Card */}
        <div className="p-6 bg-[var(--cc-canvas)] border border-[var(--cc-hairline)] rounded-[var(--cc-radius-md)] shadow-[var(--cc-level1)] mb-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 rounded-sm bg-gradient-to-br from-[var(--cc-link)] to-[var(--cc-violet)] flex items-center justify-center shadow-[var(--cc-level2)]">
              <Layers className="w-6 h-6 text-[var(--cc-on-primary)]" />
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-display-sm text-[var(--cc-ink)] mb-1">Smart Account</h2>
              {deployed && smartAccountAddress ? (
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-[var(--cc-success)] rounded-sm" />
                  <p className="text-caption text-[var(--cc-success)] font-medium">Deployed</p>
                  <span className="text-caption text-[var(--cc-muted)] font-mono ml-1">
                    {shortenAddress(smartAccountAddress)}
                  </span>
                </div>
              ) : (
                <p className="text-caption text-[var(--cc-body)]">
                  Deploy a smart contract wallet to unlock account abstraction features
                </p>
              )}
            </div>
          </div>

          {!deployed ? (
            <button
              onClick={handleDeploy}
              disabled={deploying}
              className="w-full px-6 py-3.5 bg-[var(--cc-primary)] text-[var(--cc-on-primary)] hover:bg-[var(--cc-primary-hover)] disabled:opacity-50 rounded-[var(--cc-radius-sm)] font-semibold transition-all shadow-[var(--cc-level3)] hover:shadow-[var(--cc-level4)] active:scale-[0.99] flex items-center justify-center gap-2"
            >
              {deploying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Deploying smart account...
                </>
              ) : (
                <>
                  Deploy smart account
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          ) : (
            <div className="p-3 bg-[var(--cc-success)]/15 border border-[var(--cc-success)]/25 rounded-[var(--cc-radius-sm)] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[var(--cc-success)]" />
              <span className="text-body-sm text-[var(--cc-success)] font-medium">Smart account is active</span>
            </div>
          )}
        </div>

        {/* Features */}
        <div className="space-y-3 cc-stagger">
          {AA_FEATURES.map((feature) => {
            const Icon = feature.icon;
            const isAvailable = feature.status === "available";
            
            return (
              <div
                key={feature.title}
                className={`p-5 border rounded-[var(--cc-radius-md)] bg-[var(--cc-canvas)] cc-animate-slide-up ${
                  isAvailable
                    ? 'border-[var(--cc-hairline)] hover:shadow-[var(--cc-level1)]'
                    : 'border-[var(--cc-hairline)]/60 opacity-60'
                } transition-all`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-sm flex items-center justify-center shrink-0 ${
                    isAvailable
                      ? 'bg-[var(--cc-canvas-soft-2)] border border-[var(--cc-hairline)]'
                      : 'bg-[var(--cc-canvas-soft-2)]/60 border border-[var(--cc-hairline)]/60'
                  }`}>
                    <Icon className={`w-5 h-5 ${isAvailable ? 'text-[var(--cc-muted)]' : 'text-[var(--cc-muted)]/60'}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-[var(--cc-ink)]">{feature.title}</p>
                      {isAvailable ? (
                        <span className="px-2 py-0.5 bg-[var(--cc-success)]/15 text-[var(--cc-success)] text-caption rounded-sm font-medium border border-[var(--cc-success)]/25">
                          Available
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-[var(--cc-canvas-soft-2)] text-[var(--cc-muted)] text-caption rounded-sm font-medium border border-[var(--cc-hairline)]">
                          Coming soon
                        </span>
                      )}
                    </div>
                    <p className="text-caption text-[var(--cc-body)]">{feature.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Info note */}
        <div className="mt-6 flex items-start gap-2 p-3 bg-[var(--cc-canvas-soft-2)]/30 border border-[var(--cc-hairline)]/60 rounded-[var(--cc-radius-sm)]">
          <AlertCircle className="w-3.5 h-3.5 text-[var(--cc-muted)] mt-0.5 shrink-0" />
          <p className="text-caption text-[var(--cc-muted)]">
            Account abstraction features are simulated in this demo. Real ERC-4337 implementation requires bundler integration and smart contract deployment.
          </p>
        </div>
      </div>
    </DemoLayout>
  );
}
