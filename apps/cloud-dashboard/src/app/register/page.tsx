"use client";

import Link from "next/link";
import { useState } from "react";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    // TODO: Implement actual registration logic
    console.log("Register:", { name, email, password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas-soft px-4">
      <div className="w-full max-w-md">
        <div className="bg-canvas rounded-md shadow-level-2 p-8">
          <div className="mb-8">
            <h1 className="text-heading-2 text-ink">Create your account</h1>
            <p className="text-body-sm text-body mt-2">
              Get started with CinaCoin Cloud in minutes.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="name" className="block text-body-sm font-medium text-ink mb-2">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="input"
                required
                autoFocus
              />
            </div>

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
                minLength={8}
              />
              <p className="text-caption text-mute mt-1">Minimum 8 characters</p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-body-sm font-medium text-ink mb-2">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="input"
                required
              />
            </div>

            <button type="submit" className="btn-primary w-full py-2.5">
              Create Account
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-body-sm text-body">
              Already have an account?{" "}
              <Link href="/login" className="text-link hover:underline">
                Sign in
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
