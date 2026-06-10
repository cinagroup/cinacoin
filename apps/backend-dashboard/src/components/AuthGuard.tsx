"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthProvider";

/**
 * Client-side auth guard: redirects to /login if not authenticated.
 * Handles MFA states by redirecting to appropriate pages.
 * Must be used inside AuthProvider.
 * Uses router.replace to avoid back-button loops.
 */
export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { status, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return; // wait for session restore

    const isLoginPage = pathname === "/login";
    const isMfaPage = pathname === "/mfa/verify";
    const isMfaSetupPage = pathname === "/mfa/setup";
    const isAuthPage = isLoginPage || isMfaPage || isMfaSetupPage;

    // Handle authentication states
    if (status === "unauthenticated" && !isAuthPage) {
      router.replace("/login");
      return;
    }

    if (status === "authenticated" && isAuthPage) {
      router.replace("/");
      return;
    }

    // Handle MFA states
    if (status === "mfaRequired" && !isMfaPage) {
      router.replace("/mfa/verify");
      return;
    }

    if (status === "mfaSetupRequired" && !isMfaSetupPage) {
      router.replace("/mfa/setup");
      return;
    }

    // If authenticated but on MFA pages, redirect to home
    if (status === "authenticated" && (isMfaPage || isMfaSetupPage)) {
      router.replace("/");
      return;
    }

    // If not in MFA state but on MFA pages, redirect appropriately
    if (status !== "mfaRequired" && isMfaPage) {
      router.replace(status === "authenticated" ? "/" : "/login");
      return;
    }

    if (status !== "mfaSetupRequired" && isMfaSetupPage) {
      router.replace(status === "authenticated" ? "/" : "/login");
      return;
    }
  }, [status, isLoading, pathname, router]);

  // Show nothing while checking (avoid flash of protected content)
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--cc-canvas-soft)] flex items-center justify-center">
        <div className="flex items-center gap-3 text-[var(--cc-muted)]">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-body-sm">Loading…</span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
