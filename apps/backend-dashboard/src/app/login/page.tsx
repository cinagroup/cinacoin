"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/AuthProvider";
import { getOAuthUrl, type OAuthProvider } from "@/lib/api";

export default function LoginPage() {
  const { doLogin, status, isLoading, error, clearError } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [oauthProviders, setOAuthProviders] = useState<OAuthProvider[]>([]);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/");
    }
  }, [status, router]);

  // Load OAuth providers
  useEffect(() => {
    const loadProviders = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_AUTH_URL || "https://auth.cinacoin.com"}/auth/oauth/providers`
        );
        if (response.ok) {
          const providers = await response.json();
          setOAuthProviders(providers);
        }
      } catch {
        // OAuth providers not available
      }
    };
    loadProviders();
  }, []);

  // Show nothing while redirecting
  if (status === "authenticated") {
    return null;
  }

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsSubmitting(true);
    clearError();
    try {
      await doLogin(email, password);
      // Redirect handled by status change
    } catch {
      // Error handled by AuthProvider
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOAuthLogin = (provider: string) => {
    window.location.href = getOAuthUrl(provider);
  };

  return (
    <div className="min-h-screen bg-[var(--cc-canvas-soft)] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-[var(--cc-radius-sm)] bg-[var(--cc-link)]/10 border border-[var(--cc-link)]/20 mb-4">
            <img src="/logo.png" alt="Cinacoin logo" className="w-10 h-10 rounded-md" />
          </div>
          <h1 className="cc-display-md text-[var(--cc-ink)]">Cinacoin</h1>
          <p className="text-[var(--cc-muted)] mt-2">Backend Dashboard</p>
        </div>

        {/* Login Card */}
        <div className="bg-[var(--cc-canvas)] border border-[var(--cc-hairline)] rounded-[var(--cc-radius-sm)] p-8 shadow-[var(--cc-level3)]">
          <h2 className="cc-display-sm text-[var(--cc-ink)] mb-2">Sign In</h2>
          <p className="text-[14px] text-[var(--cc-muted)] mb-6">
            Enter your credentials to access the Cinacoin Backend Dashboard.
          </p>

          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 rounded-[var(--cc-radius-sm)] bg-[var(--cc-error)]/10 border border-[var(--cc-error)]/30 text-[var(--cc-error)] text-[14px]">
              {error}
            </div>
          )}

          {/* OAuth Providers */}
          {oauthProviders.length > 0 && (
            <>
              <div className="space-y-3 mb-6">
                {oauthProviders.map((provider) => (
                  <button
                    key={provider.name}
                    onClick={() => handleOAuthLogin(provider.name)}
                    className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-[var(--cc-hairline)] rounded-[var(--cc-radius-sm)] hover:bg-[var(--cc-canvas-soft)] transition-colors"
                  >
                    <span className="text-[18px]">{provider.icon}</span>
                    <span className="text-[14px] font-medium text-[var(--cc-ink)]">
                      Continue with {provider.displayName}
                    </span>
                  </button>
                ))}
              </div>

              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[var(--cc-hairline)]"></div>
                </div>
                <div className="relative flex justify-center text-[12px]">
                  <span className="px-2 bg-[var(--cc-canvas)] text-[var(--cc-muted)]">or</span>
                </div>
              </div>
            </>
          )}

          {/* Email/Password Form */}
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-[14px] font-medium text-[var(--cc-ink)] mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@cinacoin.com"
                required
                autoComplete="email"
                className="w-full px-3 py-2 border border-[var(--cc-hairline)] rounded-[var(--cc-radius-sm)] bg-[var(--cc-canvas)] text-[var(--cc-ink)] placeholder:text-[var(--cc-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--cc-link)] focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-[14px] font-medium text-[var(--cc-ink)] mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="w-full px-3 py-2 border border-[var(--cc-hairline)] rounded-[var(--cc-radius-sm)] bg-[var(--cc-canvas)] text-[var(--cc-ink)] placeholder:text-[var(--cc-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--cc-link)] focus:border-transparent"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || isLoading || !email || !password}
              className="cc-btn-primary w-full transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed hover:opacity-85 active:scale-[0.98]"
            >
              {isSubmitting || isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Info */}
          <div className="mt-6 space-y-2 text-[12px] text-[var(--cc-body)]">
            <p className="flex items-start gap-2">
              <svg className="w-4 h-4 flex-shrink-0 mt-0.5 text-[var(--cc-muted)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
              <span>Secured with CSRF protection and encrypted tokens.</span>
            </p>
            <p className="flex items-start gap-2">
              <svg className="w-4 h-4 flex-shrink-0 mt-0.5 text-[var(--cc-muted)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span>2FA verification may be required for your account.</span>
            </p>
          </div>
        </div>

        {/* Help link */}
        <div className="text-center mt-6">
          <Link
            href="/forgot-password"
            className="text-[14px] text-[var(--cc-body)] hover:text-[var(--cc-ink)] transition-colors"
          >
            Forgot your password? →
          </Link>
        </div>
      </div>
    </div>
  );
}
