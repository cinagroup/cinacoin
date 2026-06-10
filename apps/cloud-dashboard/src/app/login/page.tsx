"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { login, verifyTwoFactor, getOAuthUrl, fetchCsrfToken } from "@/lib/api";
import type { OAuthProvider } from "@/types";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [twoFactorToken, setTwoFactorToken] = useState("");
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (showTwoFactor) {
        // Handle 2FA verification
        if (!twoFactorCode || twoFactorCode.length !== 6) {
          setError("Please enter a valid 6-digit code");
          setLoading(false);
          return;
        }

        const result = await verifyTwoFactor(twoFactorCode, twoFactorToken);
        
        if (result.accessToken) {
          router.push("/");
        } else {
          setError("Verification failed");
        }
      } else {
        // Handle initial login
        const result = await login(email, password);

        if (result.requires2FA && result.twoFactorToken) {
          // Show 2FA input
          setShowTwoFactor(true);
          setTwoFactorToken(result.twoFactorToken);
        } else if (result.accessToken) {
          // Login successful, redirect to dashboard
          router.push("/");
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = (provider: OAuthProvider) => {
    const oauthUrl = getOAuthUrl(provider);
    sessionStorage.setItem("oauth_return_url", "/");
    window.location.href = oauthUrl;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas-soft px-4">
      <div className="w-full max-w-md">
        <div className="bg-canvas rounded-md shadow-level-2 p-8">
          <div className="mb-8">
            <h1 className="text-heading-2 text-ink">
              {showTwoFactor ? "Two-Factor Authentication" : "Sign in to CinaCoin Cloud"}
            </h1>
            <p className="text-body-sm text-body mt-2">
              {showTwoFactor
                ? "Enter the 6-digit code from your authenticator app."
                : "Welcome back. Enter your credentials to access your account."}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-[14px] text-red-800">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {!showTwoFactor ? (
              <>
                <div>
                  <label htmlFor="email" className="block text-body-sm font-medium text-ink mb-2">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="input"
                    required
                    autoFocus
                    disabled={loading}
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-body-sm font-medium text-ink mb-2">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input"
                    required
                    disabled={loading}
                  />
                </div>
              </>
            ) : (
              <div>
                <label htmlFor="twoFactorCode" className="block text-body-sm font-medium text-ink mb-2">
                  Authentication Code
                </label>
                <input
                  id="twoFactorCode"
                  type="text"
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  className="input text-center text-[24px] tracking-widest"
                  required
                  autoFocus
                  maxLength={6}
                  disabled={loading}
                />
                <p className="text-caption text-mute mt-2 text-center">
                  Enter the 6-digit code from your authenticator app
                </p>
              </div>
            )}

            <button type="submit" className="btn-primary w-full py-3" disabled={loading}>
              {loading
                ? showTwoFactor
                  ? "Verifying..."
                  : "Signing in..."
                : showTwoFactor
                ? "Verify Code"
                : "Sign In"}
            </button>
          </form>

          {!showTwoFactor && (
            <>
              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-hairline"></div>
                  </div>
                  <div className="relative flex justify-center text-[14px]">
                    <span className="px-2 bg-canvas text-body">Or continue with</span>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-3 gap-3">
                  <button
                    onClick={() => handleOAuthLogin("github")}
                    className="flex justify-center items-center p-2 border border-hairline rounded hover:bg-canvas-soft transition-colors"
                    disabled={loading}
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleOAuthLogin("google")}
                    className="flex justify-center items-center p-2 border border-hairline rounded hover:bg-canvas-soft transition-colors"
                    disabled={loading}
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  </button>
                  <button
                    onClick={() => handleOAuthLogin("discord")}
                    className="flex justify-center items-center p-2 border border-hairline rounded hover:bg-canvas-soft transition-colors"
                    disabled={loading}
                  >
                    <svg className="w-5 h-5" fill="#5865F2" viewBox="0 0 20 20">
                      <path d="M16.942 3.913A16.48 16.48 0 0012.87 2.5a.062.062 0 00-.066.031c-.176.313-.37.72-.507 1.04a15.222 15.222 0 00-4.574 0 10.637 10.637 0 00-.516-1.04.065.065 0 00-.065-.032A16.442 16.442 0 003.057 3.914a.053.053 0 00-.025.02C.533 7.696-.134 11.367.159 14.997a.068.068 0 00.026.045 16.58 16.58 0 005.012 2.53.066.066 0 00.07-.022c.386-.527.729-1.082 1.024-1.664a.064.064 0 00-.035-.089 10.94 10.94 0 01-1.566-.746.065.065 0 01-.006-.108c.105-.079.21-.16.31-.243a.063.063 0 01.066-.009c3.273 1.493 6.813 1.493 10.047 0a.063.063 0 01.067.008c.1.083.205.164.31.244a.065.065 0 01-.005.108 10.236 10.236 0 01-1.567.746.065.065 0 00-.034.09c.3.582.643 1.136 1.023 1.663a.065.065 0 00.07.023 16.537 16.537 0 005.02-2.531.065.065 0 00.026-.044c.35-4.352-.548-8.002-2.866-11.064a.05.05 0 00-.025-.02zM6.69 12.576c-.98 0-1.786-.9-1.786-2.002 0-1.102.79-2.002 1.786-2.002.996 0 1.798.9 1.786 2.002 0 1.102-.79 2.002-1.786 2.002zm6.615 0c-.98 0-1.786-.9-1.786-2.002 0-1.102.79-2.002 1.786-2.002.996 0 1.798.9 1.786 2.002 0 1.102-.79 2.002-1.786 2.002z"/>
                    </svg>
                  </button>
                </div>
              </div>

              <div className="mt-6 text-center">
                <p className="text-body-sm text-body">
                  Don't have an account?{" "}
                  <Link href="/register" className="text-link hover:underline">
                    Create one
                  </Link>
                </p>
              </div>
            </>
          )}

          {showTwoFactor && (
            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  setShowTwoFactor(false);
                  setTwoFactorCode("");
                  setTwoFactorToken("");
                  setError("");
                }}
                className="text-body-sm text-link hover:underline"
                disabled={loading}
              >
                ← Back to login
              </button>
            </div>
          )}
        </div>

        <div className="mt-6 text-center">
          <Link href="/" className="text-body-sm text-mute hover:text-ink transition-colors">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
