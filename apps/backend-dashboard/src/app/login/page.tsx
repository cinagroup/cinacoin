"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthProvider";
import { isWalletAvailable } from "@/lib/auth";

export default function LoginPage() {
  const { doLogin, isLoggedIn, isLoading, error } = useAuth();
  const router = useRouter();
  const [walletMissing, setWalletMissing] = useState(false);
  const [step, setStep] = useState<"idle" | "connecting" | "signing">("idle");

  // If already logged in, redirect to dashboard
  if (isLoggedIn) {
    router.push("/");
    return null;
  }

  const handleLogin = async () => {
    if (!isWalletAvailable()) {
      setWalletMissing(true);
      return;
    }
    setWalletMissing(false);
    setStep("connecting");

    try {
      await doLogin();
      // AuthProvider sets address on success; redirect handled by isLoggedIn check
    } catch (err) {
      setStep("idle");
    }
  };

  return (
    <div className="min-h-screen bg-[var(--cc-canvas-soft)] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-[var(--cc-radius-sm)] bg-[var(--cc-link)]/10 border border-[var(--cc-link)]/20 mb-4">
          <img src="/logo.png" alt="Cinacoin logo" className="w-10 h-10 rounded-md" />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-[var(--cc-ink)]">Cinacoin</h1>
          <p className="text-[var(--cc-muted)] mt-2">Backend Dashboard</p>
        </div>

        {/* Login Card */}
        <div className="bg-[var(--cc-canvas)] border border-[var(--cc-hairline)] rounded-[var(--cc-radius-sm)] p-8 shadow-[var(--cc-level3)]">
          <h2 className="text-xl font-semibold text-[var(--cc-ink)] mb-2">Sign in with Wallet</h2>
          <p className="text-sm text-[var(--cc-muted)] mb-6">
            Connect your Ethereum wallet to access the cinacoin Backend Dashboard.
            A signature will be requested — no gas fees required.
          </p>

          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 rounded-[var(--cc-radius-sm)] bg-[var(--cc-error)]/10 border border-[var(--cc-error)]/30 text-[var(--cc-error)] text-sm">
              {error}
            </div>
          )}

          {/* Wallet not installed warning */}
          {walletMissing && (
            <div className="mb-4 p-3 rounded-[var(--cc-radius-sm)] bg-[var(--cc-warning)]/10 border border-[var(--cc-warning)]/30 text-[var(--cc-warning)] text-sm">
              <svg className="inline-block w-4 h-4 mr-1 align-text-bottom flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>{" "}
              No Ethereum wallet detected. Please install{" "}
              <a
                href="https://metamask.io"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-[var(--cc-warning)]"
              >
                MetaMask
              </a>{" "}
              or another Web3 wallet.
            </div>
          )}

          {/* Sign progress */}
          {step === "connecting" && !error && (
            <div className="mb-4 p-3 rounded-[var(--cc-radius-sm)] bg-[var(--cc-link)]/10 border border-[var(--cc-link)]/20">
              <p className="text-xs text-[var(--cc-link)] font-medium">
                <svg className="inline-block w-3.5 h-3.5 mr-1 animate-spin align-text-bottom" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Connecting wallet...
              </p>
            </div>
          )}
          {isLoading && step !== "connecting" && !error && (
            <div className="mb-4 p-3 rounded-[var(--cc-radius-sm)] bg-[var(--cc-link)]/10 border border-[var(--cc-link)]/20">
              <p className="text-xs text-[var(--cc-link)] font-medium">
                <svg className="inline-block w-3.5 h-3.5 mr-1 animate-spin align-text-bottom" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Check your wallet to sign the message...
              </p>
              <p className="text-xs text-[var(--cc-body)] mt-1">Approve the signature request in your wallet popup.</p>
            </div>
          )}

          {/* Login button */}
          <button
            onClick={handleLogin}
            aria-label={isLoading || step === "connecting" ? "Wallet connection in progress" : "Connect Ethereum wallet and sign in"}
            disabled={isLoading || step === "connecting"}
            className="cc-btn-primary w-full font-semibold text-sm transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed hover:opacity-85 active:scale-[0.98]"
          >
            {isLoading || step === "connecting" ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                {step === "connecting" ? "Connecting..." : "Signing..."}
              </span>
            ) : (
              "Connect Wallet"
            )}
          </button>

          {/* What happens info */}
          <div className="mt-6 space-y-2 text-xs text-[var(--cc-body)]">
            <p className="flex items-start gap-2">
              <svg className="w-4 h-4 flex-shrink-0 mt-0.5 text-[var(--cc-muted)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
              <span>You will be asked to sign a message to prove wallet ownership.</span>
            </p>
            <p className="flex items-start gap-2">
              <svg className="w-4 h-4 flex-shrink-0 mt-0.5 text-[var(--cc-muted)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
              <span>No gas fees — this is an off-chain signature.</span>
            </p>
            <p className="flex items-start gap-2">
              <svg className="w-4 h-4 flex-shrink-0 mt-0.5 text-[var(--cc-muted)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <span>Session expires after 24 hours.</span>
            </p>
          </div>
        </div>

        {/* Back to dashboard link */}
        <div className="text-center mt-6">
          <Link
            href="/"
            className="text-sm text-[var(--cc-body)] hover:text-[var(--cc-ink)] transition-colors"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
