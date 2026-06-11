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
      {/* Mesh gradient — subtle brand atmosphere */}
      <div
        className="fixed inset-0 pointer-events-none opacity-30"
        style={{
          background: `
            radial-gradient(ellipse at 30% 20%, #007cf022 0%, transparent 50%),
            radial-gradient(ellipse at 70% 80%, #7928ca22 0%, transparent 50%)
          `,
        }}
      />

      <div className="relative max-w-[400px] w-full mx-4">
        {/* Card */}
        <div className="bg-[var(--cc-canvas)] border border-[var(--cc-hairline)] rounded-[var(--cc-radius-md)] p-8 shadow-[var(--cc-level1)]">
          {/* Mono eyebrow */}
          <p className="font-mono text-xs text-[var(--cc-muted)] mb-2">AUTHENTICATION</p>
          
          {/* Title — sentence case + period */}
          <h1 className="text-[var(--cc-display-sm)] font-semibold text-[var(--cc-ink)] mb-1">
            Sign in to your account.
          </h1>
          <p className="text-[var(--cc-body)] text-sm mb-8">
            Access your CinaCoin dashboard.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 bg-[var(--cc-error-bg, #fef2f2)] border border-[var(--cc-error-border, #fecaca)] rounded-[var(--cc-radius-sm)] text-[var(--cc-error, #dc2626)] text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[var(--cc-ink)] mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 h-10 border border-[var(--cc-hairline)] rounded-[var(--cc-radius-sm)] bg-[var(--cc-canvas)] text-[var(--cc-ink)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--cc-primary)] focus:border-transparent transition-colors"
                placeholder="admin@cinacoin.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[var(--cc-ink)] mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3 h-10 border border-[var(--cc-hairline)] rounded-[var(--cc-radius-sm)] bg-[var(--cc-canvas)] text-[var(--cc-ink)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--cc-primary)] focus:border-transparent transition-colors"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--cc-primary)] text-[var(--cc-on-primary)] rounded-[var(--cc-radius-sm)] h-10 font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>

        {/* Footer hint */}
        <p className="mt-4 text-center text-xs font-mono text-[var(--cc-muted)]">
          demo: admin@cinacoin.com / admin123
        </p>
      </div>
    </div>
  );
}
