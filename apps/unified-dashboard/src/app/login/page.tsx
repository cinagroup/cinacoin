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
    <div className="min-h-screen flex items-center justify-center bg-[var(--cc-canvas-soft)]">
      <div className="w-full max-w-[340px] px-4">
        {/* Login Card */}
        <div className="bg-[var(--cc-canvas)] border border-[var(--cc-hairline)] rounded-[var(--cc-radius-md)] p-6 shadow-[var(--cc-level2)]">
          {/* Title */}
          <h1 className="text-[20px] font-semibold text-[var(--cc-ink)] mb-1 tracking-[-0.6px]">
            Log In
          </h1>
          <p className="text-[14px] text-[var(--cc-body)] mb-6">
            Welcome back to CinaCoin.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-[var(--cc-error-soft)] border border-[var(--cc-error)] rounded-[var(--cc-radius-sm)] text-[var(--cc-error-deep)] text-[13px]">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-[13px] font-medium text-[var(--cc-ink)] mb-1.5">
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
                className="w-full h-10 px-3 bg-[var(--cc-canvas)] border border-[var(--cc-hairline)] rounded-[var(--cc-radius-sm)] text-[14px] text-[var(--cc-ink)] placeholder:text-[var(--cc-muted)] focus:outline-none focus:border-[var(--cc-link)] focus:ring-3 focus:ring-[rgba(0,112,243,0.1)] transition-colors"
                placeholder="name@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-[13px] font-medium text-[var(--cc-ink)] mb-1.5">
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
                className="w-full h-10 px-3 bg-[var(--cc-canvas)] border border-[var(--cc-hairline)] rounded-[var(--cc-radius-sm)] text-[14px] text-[var(--cc-ink)] placeholder:text-[var(--cc-muted)] focus:outline-none focus:border-[var(--cc-link)] focus:ring-3 focus:ring-[rgba(0,112,243,0.1)] transition-colors"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 bg-[var(--cc-primary)] text-[var(--cc-on-primary)] rounded-[var(--cc-radius-sm)] text-[14px] font-medium hover:bg-[var(--cc-primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Logging in..." : "Log In"}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="mt-4 text-center text-[12px] text-[var(--cc-muted)]">
          Don&apos;t have an account?{" "}
          <a href="/register" className="text-[var(--cc-link)] hover:underline">
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
}
