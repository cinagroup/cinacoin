"use client";

import Link from "next/link";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement actual login logic
    console.log("Login:", { email, password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas-soft px-4">
      <div className="w-full max-w-md">
        <div className="bg-canvas rounded-md shadow-level-2 p-8">
          <div className="mb-8">
            <h1 className="text-heading-2 text-ink">Sign in to CinaCoin Cloud</h1>
            <p className="text-body-sm text-body mt-2">
              Welcome back. Enter your credentials to access your account.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
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
              />
            </div>

            <button type="submit" className="btn-primary w-full py-2.5">
              Sign In
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-body-sm text-body">
              Don't have an account?{" "}
              <Link href="/register" className="text-link hover:underline">
                Create one
              </Link>
            </p>
          </div>
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
