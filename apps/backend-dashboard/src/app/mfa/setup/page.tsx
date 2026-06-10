"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthProvider";

export default function MfaSetupPage() {
  const { status, isLoading, error } = useAuth();
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[var(--cc-canvas-soft)] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-[var(--cc-radius-sm)] bg-[var(--cc-link)]/10 border border-[var(--cc-link)]/20 mb-4">
            <img src="/logo.png" alt="Cinacoin logo" className="w-10 h-10 rounded-md" />
          </div>
          <h1 className="cc-display-md text-[var(--cc-ink)]">Setup Required</h1>
          <p className="text-[var(--cc-muted)] mt-2">Two-factor authentication setup</p>
        </div>

        {/* Card */}
        <div className="bg-[var(--cc-canvas)] border border-[var(--cc-hairline)] rounded-[var(--cc-radius-md)] p-6 shadow-[var(--cc-level3)] text-center">
          {error && (
            <div className="mb-4 p-3 rounded-[var(--cc-radius-sm)] bg-[var(--cc-error)]/10 border border-[var(--cc-error)]/30 text-[var(--cc-error)] text-[14px]">
              {error}
            </div>
          )}

          <div className="w-16 h-16 rounded-full bg-[var(--cc-warning)]/10 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-[var(--cc-warning)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>

          <h2 className="cc-display-sm text-[var(--cc-ink)] mb-2">2FA Setup Required</h2>
          <p className="text-[14px] text-[var(--cc-muted)] mb-6">
            Your account requires two-factor authentication to be set up before you can access the dashboard.
            Please contact your administrator or visit the account settings page to configure 2FA.
          </p>

          <button
            onClick={() => router.replace("/login")}
            className="cc-btn-secondary w-full"
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}
