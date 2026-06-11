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
      <div className="w-full max-w-[400px]">
        {/* Logo/Brand area */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-[var(--cc-radius-md)] bg-[var(--cc-primary)] mb-4">
            <span className="text-[var(--cc-on-primary)] font-semibold text-lg">C</span>
          </div>
          <p className="font-mono text-xs text-[var(--cc-muted)] tracking-wide">CINACOIN</p>
        </div>

        {/* Login Card */}
        <div className="bg-[var(--cc-canvas)] border border-[var(--cc-hairline)] rounded-[var(--cc-radius-lg)] p-8 shadow-[var(--cc-level3)]">
          {/* Mono eyebrow */}
          <p className="font-mono text-xs text-[var(--cc-muted)] mb-3 tracking-wide">AUTHENTICATION</p>
          
          {/* Title — sentence case + period */}
          <h1 className="text-[20px] font-semibold text-[var(--cc-ink)] mb-2 tracking-[-0.6px]">
            Sign in to your account.
          </h1>
          <p className="text-[14px] text-[var(--cc-body)] mb-8">
            Access your CinaCoin dashboard.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 bg-[var(--cc-error-soft)] border border-[var(--cc-error)] rounded-[var(--cc-radius-sm)] text-[var(--cc-error-deep)] text-[13px]">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-[14px] font-medium text-[var(--cc-ink)] mb-2">
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
                placeholder="admin@cinacoin.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-[14px] font-medium text-[var(--cc-ink)] mb-2">
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
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>

        {/* Footer hint */}
        <p className="mt-6 text-center text-[12px] font-mono text-[var(--cc-muted)]">
          demo: admin@cinacoin.com / admin123
        </p>
      </div>
    </div>
  );
}
