"use client";

import Link from "next/link";
import Sidebar from "@/components/Sidebar";

export default function BillingPage() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-[var(--cc-ink)] mb-2">Billing & Usage</h1>
            <p className="text-sm text-[var(--cc-muted)]">
              Manage your subscription and view usage analytics
            </p>
          </div>

          <div className="space-y-6">
            {/* Current Plan */}
            <div className="bg-[var(--cc-canvas)] border border-[var(--cc-border)] rounded-lg p-6">
              <h2 className="text-lg font-medium text-[var(--cc-ink)] mb-4">Current Plan</h2>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-[var(--cc-ink)]">Free Tier</p>
                  <p className="text-xs text-[var(--cc-muted)] mt-1">
                    Perfect for getting started
                  </p>
                </div>
                <span className="text-2xl font-semibold text-[var(--cc-ink)]">$0</span>
              </div>
              <ul className="space-y-2 text-sm text-[var(--cc-muted)]">
                <li className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  3 projects
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  1,000 API calls/month
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Community support
                </li>
              </ul>
              <button className="mt-6 w-full bg-[var(--cc-ink)] text-[var(--cc-canvas)] py-2 px-4 rounded-md text-sm font-medium hover:bg-[var(--cc-ink-soft)] transition-colors">
                Upgrade Plan
              </button>
            </div>

            {/* Usage This Month */}
            <div className="bg-[var(--cc-canvas)] border border-[var(--cc-border)] rounded-lg p-6">
              <h2 className="text-lg font-medium text-[var(--cc-ink)] mb-4">Usage This Month</h2>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-[var(--cc-muted)]">API Calls</span>
                    <span className="text-sm font-medium text-[var(--cc-ink)]">0 / 1,000</span>
                  </div>
                  <div className="w-full bg-[var(--cc-canvas-soft)] rounded-full h-2">
                    <div className="bg-[var(--cc-link)] h-2 rounded-full" style={{ width: "0%" }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-[var(--cc-muted)]">Projects</span>
                    <span className="text-sm font-medium text-[var(--cc-ink)]">0 / 3</span>
                  </div>
                  <div className="w-full bg-[var(--cc-canvas-soft)] rounded-full h-2">
                    <div className="bg-[var(--cc-link)] h-2 rounded-full" style={{ width: "0%" }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment History */}
            <div className="bg-[var(--cc-canvas)] border border-[var(--cc-border)] rounded-lg p-6">
              <h2 className="text-lg font-medium text-[var(--cc-ink)] mb-4">Payment History</h2>
              <p className="text-sm text-[var(--cc-muted)]">No payment history yet</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
