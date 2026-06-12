"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { FileText } from "lucide-react";

export default function BillingPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const mockInvoices = [
    { id: "INV-2026-001", date: "2026-06-01", amount: "$125.50", status: "paid" },
    { id: "INV-2026-002", date: "2026-05-01", amount: "$98.75", status: "paid" },
    { id: "INV-2026-003", date: "2026-04-01", amount: "$142.30", status: "paid" },
  ];

  return (
    <div className="min-h-screen flex">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-[var(--cc-canvas)] border-b border-[var(--cc-hairline)] h-14 flex items-center px-6 sticky top-0 z-40">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-sm hover:bg-[var(--cc-canvas-soft-2)] mr-4 transition-colors duration-fast"
          >
            <Menu className="w-5 h-5 text-body" />
          </button>
        </header>
        <Breadcrumbs />

        <main className="flex-1 p-6 overflow-auto">
          <div className="mb-6">
            <p className="font-mono text-xs text-[var(--cc-muted)] mb-2">FINANCE</p>
            <h1 className="text-heading-2 text-[var(--cc-ink)]">Billing.</h1>
            <p className="text-body-sm text-body mt-1">Manage your subscription and billing.</p>
          </div>

          {/* Current Plan */}
          <div className="bg-[var(--cc-canvas)] border border-[var(--cc-hairline)] rounded-md p-6 mb-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="font-mono text-xs text-[var(--cc-muted)] mb-2">PLAN</p>
                <h2 className="text-heading-3 text-[var(--cc-ink)] mb-1">Current plan.</h2>
                <p className="text-body-sm text-body">Professional plan.</p>
              </div>
              <button className="cc-btn-secondary px-4 py-2">
                Upgrade Plan
              </button>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-[var(--cc-hairline)]">
              <div>
                <p className="text-caption text-[var(--cc-muted)] mb-1">Monthly cost.</p>
                <p className="text-heading-3 text-[var(--cc-ink)]">$99/mo</p>
              </div>
              <div>
                <p className="text-caption text-[var(--cc-muted)] mb-1">Next billing date.</p>
                <p className="text-body-sm text-[var(--cc-ink)]">July 1, 2026</p>
              </div>
              <div>
                <p className="text-caption text-[var(--cc-muted)] mb-1">Payment method.</p>
                <p className="text-body-sm text-[var(--cc-ink)]">Visa •••• 4242</p>
              </div>
            </div>
          </div>

          {/* Usage */}
          <div className="bg-[var(--cc-canvas)] border border-[var(--cc-hairline)] rounded-md p-6 mb-6">
            <p className="font-mono text-xs text-[var(--cc-muted)] mb-2">USAGE</p>
            <h2 className="text-heading-3 text-[var(--cc-ink)] mb-4">Current usage.</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-body-sm mb-2">
                  <span className="text-body">Compute resources.</span>
                  <span className="text-[var(--cc-ink)] font-medium">8 / 10 vCPUs</span>
                </div>
                <div className="w-full bg-[var(--cc-canvas-soft-2)] rounded-full h-2">
                  <div className="bg-link h-2 rounded-full" style={{ width: '80%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-body-sm mb-2">
                  <span className="text-body">Storage</span>
                  <span className="text-[var(--cc-ink)] font-medium">450 GB / 1 TB</span>
                </div>
                <div className="w-full bg-[var(--cc-canvas-soft-2)] rounded-full h-2">
                  <div className="bg-link h-2 rounded-full" style={{ width: '45%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-body-sm mb-2">
                  <span className="text-body">Bandwidth</span>
                  <span className="text-[var(--cc-ink)] font-medium">2.1 TB / 5 TB</span>
                </div>
                <div className="w-full bg-[var(--cc-canvas-soft-2)] rounded-full h-2">
                  <div className="bg-link h-2 rounded-full" style={{ width: '42%' }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Invoices */}
          <div className="bg-[var(--cc-canvas)] border border-[var(--cc-hairline)] rounded-md overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--cc-hairline)]">
              <p className="font-mono text-xs text-[var(--cc-muted)] mb-2">HISTORY</p>
              <h2 className="text-heading-3 text-[var(--cc-ink)]">Invoice history.</h2>
            </div>
            <table className="w-full">
              <thead className="bg-[var(--cc-canvas-soft-2)] border-b border-[var(--cc-hairline)]">
                <tr>
                  <th className="text-left px-6 py-3 text-caption font-medium text-[var(--cc-muted)] uppercase">Invoice</th>
                  <th className="text-left px-6 py-3 text-caption font-medium text-[var(--cc-muted)] uppercase">Date</th>
                  <th className="text-left px-6 py-3 text-caption font-medium text-[var(--cc-muted)] uppercase">Amount</th>
                  <th className="text-left px-6 py-3 text-caption font-medium text-[var(--cc-muted)] uppercase">Status</th>
                  <th className="text-right px-6 py-3 text-caption font-medium text-[var(--cc-muted)] uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {mockInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <FileText className="w-8 h-8 text-[var(--cc-muted)] mb-4" />
                        <h3 className="text-heading-3 text-[var(--cc-ink)] mb-1">No invoices yet.</h3>
                        <p className="text-body-sm text-body max-w-sm">Your invoice history will appear here once you have billing activity.</p>
                      </div>
                    </td>
                  </tr>
                ) : mockInvoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b border-[var(--cc-hairline)] last:border-b-0 hover:bg-[var(--cc-canvas-soft)] transition-colors">
                    <td className="px-6 py-4 text-body-sm text-[var(--cc-ink)] font-medium">{invoice.id}</td>
                    <td className="px-6 py-4 text-body-sm text-body">{invoice.date}</td>
                    <td className="px-6 py-4 text-body-sm text-[var(--cc-ink)] font-medium">{invoice.amount}</td>
                    <td className="px-6 py-4">
                      <span className="badge badge-success">{invoice.status}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-body-sm text-link hover:underline">Download</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
}
