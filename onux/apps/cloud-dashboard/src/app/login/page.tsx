"use client";

import Link from "next/link";
import { useState, type FormEvent } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // TODO: Replace with actual auth service call
    setTimeout(() => {
      setLoading(false);
      setError("Authentication service not yet configured");
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--cc-canvas-soft)] px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-[var(--cc-ink)] mb-2">
            Sign in to Cinacoin Cloud
          </h1>
          <p className="text-sm text-[var(--cc-muted)]">
            Access your developer dashboard
          </p>
        </div>

        <div className="bg-[var(--cc-canvas)] border border-[var(--cc-border)] rounded-lg shadow-sm p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-800">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[var(--cc-ink)] mb-2">
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-[var(--cc-border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--cc-link)] focus:border-transparent"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[var(--cc-ink)] mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-[var(--cc-border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--cc-link)] focus:border-transparent"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--cc-ink)] text-[var(--cc-canvas)] py-2 px-4 rounded-md text-sm font-medium hover:bg-[var(--cc-ink-soft)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-[var(--cc-muted)]">
            Don't have an account?{" "}
            <Link href="/register" className="text-[var(--cc-link)] hover:underline font-medium">
              Sign up
            </Link>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-[var(--cc-muted)] hover:text-[var(--cc-ink)] transition-colors">
            ← Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
