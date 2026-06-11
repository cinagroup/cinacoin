"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // TODO: Implement actual authentication
      await new Promise(resolve => setTimeout(resolve, 1000));
      router.push("/");
    } catch (err) {
      setError("Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--cc-canvas-soft)] py-12 px-4">
      <div className="w-full max-w-[340px]">
        {/* Login Card */}
        <div className="bg-[var(--cc-canvas)] border border-[var(--cc-hairline)] rounded-[var(--cc-radius-md)] p-6 shadow-[var(--cc-level2)]">
          {/* Mono eyebrow */}
          <p className="cc-caption-mono text-[var(--cc-muted)] mb-2 tracking-wide">
            AUTHENTICATION
          </p>
          
          {/* Title — sentence case + period */}
          <h1 className="cc-display-sm text-[var(--cc-ink)] mb-1">
            Log in to your account.
          </h1>
          <p className="cc-body-sm text-[var(--cc-body)] mb-6">
            Welcome back to CinaCoin.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-[var(--cc-error-soft)] border border-[var(--cc-error)] rounded-[var(--cc-radius-sm)] text-[var(--cc-error-deep)] text-[13px]">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block cc-body-sm-strong text-[var(--cc-ink)] mb-1.5">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="cc-form-input"
                placeholder="name@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block cc-body-sm-strong text-[var(--cc-ink)] mb-1.5">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="cc-form-input"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="cc-btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Logging in..." : "Log in"}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="mt-4 text-center cc-caption text-[var(--cc-muted)]">
          Don&apos;t have an account?{" "}
          <a href="/register" className="text-[var(--cc-link)] hover:underline">
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
}
