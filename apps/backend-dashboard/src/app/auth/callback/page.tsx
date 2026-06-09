"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/AuthProvider";

function OAuthCallbackContent() {
  const { doOAuthCallback, status, error } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(true);
  const [processed, setProcessed] = useState(false);

  useEffect(() => {
    if (processed) return;

    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const oauthError = searchParams.get("error");

    if (oauthError) {
      setIsProcessing(false);
      setProcessed(true);
      return;
    }

    if (!code || !state) {
      setIsProcessing(false);
      setProcessed(true);
      return;
    }

    const handleCallback = async () => {
      try {
        await doOAuthCallback(code, state);
        setProcessed(true);
      } catch {
        setIsProcessing(false);
        setProcessed(true);
      }
    };

    handleCallback();
  }, [searchParams, doOAuthCallback, processed]);

  // Redirect on success
  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/");
    }
    if (status === "mfaRequired") {
      router.replace("/mfa/verify");
    }
  }, [status, router]);

  const oauthError = searchParams.get("error");

  return (
    <div className="bg-[var(--cc-canvas)] border border-[var(--cc-hairline)] rounded-[var(--cc-radius-sm)] p-8 shadow-[var(--cc-level3)] text-center">
      {oauthError ? (
        <>
          <div className="w-16 h-16 rounded-full bg-[var(--cc-error)]/10 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-[var(--cc-error)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </div>
          <h2 className="cc-display-sm text-[var(--cc-ink)] mb-2">Authentication Failed</h2>
          <p className="text-sm text-[var(--cc-muted)] mb-6">
            {searchParams.get("error_description") || "OAuth authentication was cancelled or failed."}
          </p>
          <button
            onClick={() => router.replace("/login")}
            className="cc-btn-primary w-full"
          >
            Back to Login
          </button>
        </>
      ) : isProcessing || status === "idle" ? (
        <>
          <svg className="animate-spin h-8 w-8 text-[var(--cc-link)] mx-auto mb-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm text-[var(--cc-muted)]">
            Completing authentication…
          </p>
        </>
      ) : error ? (
        <>
          <div className="w-16 h-16 rounded-full bg-[var(--cc-error)]/10 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-[var(--cc-error)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </div>
          <h2 className="cc-display-sm text-[var(--cc-ink)] mb-2">Authentication Failed</h2>
          <p className="text-sm text-[var(--cc-error)] mb-6">{error}</p>
          <button
            onClick={() => router.replace("/login")}
            className="cc-btn-primary w-full"
          >
            Back to Login
          </button>
        </>
      ) : (
        <>
          <svg className="animate-spin h-8 w-8 text-[var(--cc-link)] mx-auto mb-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm text-[var(--cc-muted)]">Redirecting…</p>
        </>
      )}
    </div>
  );
}

export default function OAuthCallbackPage() {
  return (
    <div className="min-h-screen bg-[var(--cc-canvas-soft)] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-[var(--cc-radius-sm)] bg-[var(--cc-link)]/10 border border-[var(--cc-link)]/20 mb-4">
            <img src="/logo.png" alt="Cinacoin logo" className="w-10 h-10 rounded-md" />
          </div>
          <h1 className="cc-display-md text-[var(--cc-ink)]">Authenticating</h1>
        </div>

        <Suspense fallback={
          <div className="bg-[var(--cc-canvas)] border border-[var(--cc-hairline)] rounded-[var(--cc-radius-sm)] p-8 shadow-[var(--cc-level3)] text-center">
            <svg className="animate-spin h-8 w-8 text-[var(--cc-link)] mx-auto mb-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-sm text-[var(--cc-muted)]">Loading…</p>
          </div>
        }>
          <OAuthCallbackContent />
        </Suspense>
      </div>
    </div>
  );
}
