"use client";

import { useState } from "react";
import { Key, Fingerprint, Shield, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import DemoLayout from "@/components/DemoLayout";
import { useWallet, shortenAddress } from "@/lib/useWallet";
import { useToast } from "@/lib/toast";
import { signInWithEthereum } from "@/lib/siwe";
import { createPasskey, authenticateWithPasskey } from "@/lib/passkey";
import { createSecureSession } from "@/lib/secureAuthSession";

export default function AuthPage() {
  const { account, status } = useWallet();
  const { success, error: showError } = useToast();

  const isConnected = status === "connected";

  const [loading, setLoading] = useState<string | null>(null);
  const [authState, setAuthState] = useState<{
    siwe: boolean;
    passkey: boolean;
    secureSession: boolean;
  }>({
    siwe: false,
    passkey: false,
    secureSession: false,
  });

  const handleSIWE = async () => {
    setLoading("siwe");
    try {
      const result = await signInWithEthereum();
      setAuthState((prev) => ({ ...prev, siwe: true }));
      success("Sign-In with Ethereum", `Authenticated as ${shortenAddress(result.address)}`);
    } catch (err) {
      showError("SIWE failed", err instanceof Error ? err.message : "Could not authenticate");
    } finally {
      setLoading(null);
    }
  };

  const handlePasskeyCreate = async () => {
    setLoading("passkey-create");
    try {
      const result = await createPasskey();
      setAuthState((prev) => ({ ...prev, passkey: true }));
      success("Passkey created", `Credential ID: ${shortenAddress(result.credentialId)}`);
    } catch (err) {
      showError("Passkey creation failed", err instanceof Error ? err.message : "Could not create passkey");
    } finally {
      setLoading(null);
    }
  };

  const handlePasskeyAuth = async () => {
    setLoading("passkey-auth");
    try {
      const result = await authenticateWithPasskey();
      setAuthState((prev) => ({ ...prev, passkey: true }));
      success("Passkey authentication", `Verified with credential ${shortenAddress(result.credentialId)}`);
    } catch (err) {
      showError("Passkey auth failed", err instanceof Error ? err.message : "Could not authenticate");
    } finally {
      setLoading(null);
    }
  };

  const handleSecureSession = async () => {
    setLoading("secure-session");
    try {
      const result = await createSecureSession();
      setAuthState((prev) => ({ ...prev, secureSession: true }));
      success("Secure session created", `Session expires: ${new Date(result.expiresAt).toLocaleString()}`);
    } catch (err) {
      showError("Secure session failed", err instanceof Error ? err.message : "Could not create session");
    } finally {
      setLoading(null);
    }
  };

  if (!isConnected) {
    return (
      <DemoLayout>
        <div className="max-w-4xl mx-auto px-4 py-12 text-center cc-page-enter">
          <p className="font-mono text-xs text-[var(--cc-muted)] mb-2">AUTH</p>
          <h1 className="text-display-lg font-semibold tracking-tighter text-[var(--cc-ink)] mb-4">
            Authentication.
          </h1>
          <p className="text-[var(--cc-body)]">Connect your wallet to access authentication features.</p>
        </div>
      </DemoLayout>
    );
  }

  return (
    <DemoLayout>
      <div className="max-w-4xl mx-auto px-4 py-12 cc-page-enter">
        {/* Header */}
        <div className="mb-8">
          <p className="font-mono text-xs text-[var(--cc-muted)] mb-2">AUTH</p>
          <h1 className="text-display-lg font-semibold tracking-tighter text-[var(--cc-ink)] mb-2">
            Authentication.
          </h1>
          <p className="text-[var(--cc-body)] text-body-sm">
            Sign-In with Ethereum, passkeys, and secure sessions
          </p>
        </div>

        {/* Auth Methods */}
        <div className="space-y-4 cc-stagger">
          {/* Sign-In with Ethereum */}
          <div className="p-5 border border-[var(--cc-hairline)] rounded-[var(--cc-radius-md)] bg-[var(--cc-canvas)] cc-animate-slide-up">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 rounded-full bg-[var(--cc-link)]/15 border border-[var(--cc-primary)]/25 flex items-center justify-center shrink-0">
                <Key className="w-5 h-5 text-[var(--cc-link)]" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-[var(--cc-ink)]">Sign-In with Ethereum</p>
                  {authState.siwe && (
                    <CheckCircle2 className="w-4 h-4 text-[var(--cc-success)]" />
                  )}
                </div>
                <p className="text-caption text-[var(--cc-body)]">
                  Authenticate using your wallet with a signed message. SIWE verifies wallet ownership without exposing private keys.
                </p>
              </div>
            </div>
            <button
              onClick={handleSIWE}
              disabled={loading === "siwe"}
              className="w-full px-4 py-2.5 bg-[var(--cc-primary)] text-[var(--cc-on-primary)] hover:bg-[var(--cc-primary-hover)] disabled:opacity-50 rounded-[var(--cc-radius-sm)] font-semibold text-body-sm transition-all shadow-[var(--cc-level2)] hover:shadow-[var(--cc-level3)] active:scale-[0.99] flex items-center justify-center gap-2"
            >
              {loading === "siwe" ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing message...
                </>
              ) : authState.siwe ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Authenticated
                </>
              ) : (
                "Sign in with Ethereum"
              )}
            </button>
          </div>

          {/* Passkey */}
          <div className="p-5 border border-[var(--cc-hairline)] rounded-[var(--cc-radius-md)] bg-[var(--cc-canvas)] cc-animate-slide-up">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 rounded-full bg-[var(--cc-violet)]/15 border border-[var(--cc-violet)]/25 flex items-center justify-center shrink-0">
                <Fingerprint className="w-5 h-5 text-[var(--cc-violet)]" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-[var(--cc-ink)]">Passkey Authentication</p>
                  {authState.passkey && (
                    <CheckCircle2 className="w-4 h-4 text-[var(--cc-success)]" />
                  )}
                </div>
                <p className="text-caption text-[var(--cc-body)]">
                  Create and authenticate with WebAuthn passkeys. Biometric or hardware key authentication without passwords.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handlePasskeyCreate}
                disabled={loading === "passkey-create"}
                className="px-4 py-2.5 bg-[var(--cc-canvas-soft-2)] border border-[var(--cc-hairline)] rounded-[var(--cc-radius-sm)] font-semibold text-body-sm text-[var(--cc-ink)] hover:border-[var(--cc-hairline-strong)] hover:shadow-[var(--cc-level1)] disabled:opacity-50 transition-all flex items-center justify-center gap-2 active:scale-[0.99]"
              >
                {loading === "passkey-create" ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create passkey"
                )}
              </button>
              <button
                onClick={handlePasskeyAuth}
                disabled={loading === "passkey-auth"}
                className="px-4 py-2.5 bg-[var(--cc-primary)] text-[var(--cc-on-primary)] hover:bg-[var(--cc-primary-hover)] disabled:opacity-50 rounded-[var(--cc-radius-sm)] font-semibold text-body-sm transition-all shadow-[var(--cc-level2)] hover:shadow-[var(--cc-level3)] active:scale-[0.99] flex items-center justify-center gap-2"
              >
                {loading === "passkey-auth" ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  "Authenticate"
                )}
              </button>
            </div>
          </div>

          {/* Secure Session */}
          <div className="p-5 border border-[var(--cc-hairline)] rounded-[var(--cc-radius-md)] bg-[var(--cc-canvas)] cc-animate-slide-up">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 rounded-full bg-[var(--cc-success)]/15 border border-[var(--cc-success)]/25 flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5 text-[var(--cc-success)]" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-[var(--cc-ink)]">Secure Session</p>
                  {authState.secureSession && (
                    <CheckCircle2 className="w-4 h-4 text-[var(--cc-success)]" />
                  )}
                </div>
                <p className="text-caption text-[var(--cc-body)]">
                  Create an encrypted session with automatic expiration. Sessions are tied to your wallet and can be revoked at any time.
                </p>
              </div>
            </div>
            <button
              onClick={handleSecureSession}
              disabled={loading === "secure-session"}
              className="w-full px-4 py-2.5 bg-[var(--cc-primary)] text-[var(--cc-on-primary)] hover:bg-[var(--cc-primary-hover)] disabled:opacity-50 rounded-[var(--cc-radius-sm)] font-semibold text-body-sm transition-all shadow-[var(--cc-level2)] hover:shadow-[var(--cc-level3)] active:scale-[0.99] flex items-center justify-center gap-2"
            >
              {loading === "secure-session" ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating session...
                </>
              ) : authState.secureSession ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Session active
                </>
              ) : (
                "Create secure session"
              )}
            </button>
          </div>
        </div>

        {/* Info note */}
        <div className="mt-6 flex items-start gap-2 p-3 bg-[var(--cc-canvas-soft-2)]/30 border border-[var(--cc-hairline)]/60 rounded-[var(--cc-radius-sm)]">
          <AlertCircle className="w-3.5 h-3.5 text-[var(--cc-muted)] mt-0.5 shrink-0" />
          <p className="text-caption text-[var(--cc-muted)]">
            Authentication methods are simulated in this demo. Real implementations require backend integration and proper key management.
          </p>
        </div>
      </div>
    </DemoLayout>
  );
}
