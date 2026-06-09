"use client";

import Link from "next/link";
import { useState, type FormEvent } from "next/navigation";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    // TODO: Replace with actual auth service call
    setTimeout(() => {
      setLoading(false);
      setError("Registration service not yet configured");
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--cc-canvas-soft)] px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-[var(--cc-ink)] mb-2">
            Create your account
          </h1>
          <p className="text-sm text-[var(--cc-muted)]">
            Start building with Cinacoin Cloud
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

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-[var(--cc-ink)] mb-2">
                Confirm password
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border border-[var(--cc-border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--cc-link)] focus:border-transparent"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--cc-ink)] text-[var(--cc-canvas)] py-2 px-4 rounded-md text-sm font-medium hover:bg-[var(--cc-ink-soft)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-[var(--cc-muted)]">
            Already have an account?{" "}
            <Link href="/login" className="text-[var(--cc-link)] hover:underline font-medium">
              Sign in
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
